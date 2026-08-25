/* ============================================================
   HAOWEB × worldpanasia 이식 — 모션 로직 (원본 파라미터 실측 그대로)
   - 히어로: wheel deltaY>20 → openVisual(잠금 1000ms, 1s 후 stop), 최상단 deltaY<-20 → closeVisual
   - 핀: trigger .main-con1, start top top, end +=150%, scrub 2, pin .mainCon-gsap-wrap, anticipatePin 1
     con2 408×271(top50%/right10%) → 100%×100%, 이후 inner opacity 0→1 (0.8, '>')
   - con3: clipPath inset(0 100% 0 0)→inset(0 0% 0 0), scrub 2, top bottom→center bottom
   - business: Swiper auto/30/freeMode/scrollbar/slidesOffsetAfter 50
   - event: Swiper 3장 센터, initialSlide 5, nav, ≤768 1장
   - news: 마키(복제 4배, 2px/frame, hover 정지) / 모바일: 스크롤 + 커스텀 썸
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };

  /* ---------- 헤더: 스크롤 상태 ---------- */
  var header = $('#header');
  function applyHeaderClass() {
    if (window.scrollY < 1) {
      header.classList.remove('nav-up');
    } else {
      header.classList.add('nav-up');
      header.classList.remove('white');
    }
  }
  /* html{overflow-y:auto} 구조에서는 스크롤이 window 이벤트로 오지 않는 경우가 있어
     document 캡처 단계로도 받는다 */
  window.addEventListener('scroll', applyHeaderClass);
  document.addEventListener('scroll', applyHeaderClass, true);
  applyHeaderClass();

  /* ---------- GNB dep2 메가 메뉴 ---------- */
  var gnbItems = $$('#gnb > ul > li');
  var dep2Menu = $('.dep2Menu');
  gnbItems.forEach(function (li, index) {
    li.addEventListener('mouseenter', function () {
      gnbItems.forEach(function (x) { x.classList.remove('on'); });
      li.classList.add('on');
      var uls = $$('.dep2Menu .area > ul');
      uls.forEach(function (u, i) { u.classList.toggle('active', i === index); });
      dep2Menu.classList.add('on');
      header.style.borderBottom = '1px solid rgba(204,204,204,.5)';
    });
  });
  [$('#gnb'), $('.dep2Wrap')].forEach(function (el) {
    if (!el) return;
    el.addEventListener('mouseleave', function () {
      dep2Menu.classList.remove('on');
      gnbItems.forEach(function (x) { x.classList.remove('on'); });
      header.style.borderBottom = '';
    });
  });
  if (dep2Menu) {
    dep2Menu.addEventListener('mouseenter', function () { dep2Menu.classList.add('on'); });
    dep2Menu.addEventListener('mouseleave', function () {
      dep2Menu.classList.remove('on');
      gnbItems.forEach(function (x) { x.classList.remove('on'); });
    });
  }

  /* ---------- 전체메뉴 토글 ---------- */
  $$('.allMenuBtn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.allMenuBtn').forEach(function (b) { b.classList.toggle('active'); });
      $('#headerY') && $('#headerY').classList.toggle('active');
      $('.allMenuWrap').classList.toggle('active');
    });
  });
  /* 전체메뉴(모바일) 아코디언 */
  $$('.allMenu > ul > li > span').forEach(function (sp) {
    sp.addEventListener('click', function () {
      $$('.allMenu .dep2').forEach(function (d) { d.classList.remove('active'); });
      var next = sp.nextElementSibling;
      if (next) next.classList.add('active');
    });
  });

  /* ---------- 플로팅 CTA 말풍선 ---------- */
  var pan = $('.chatbot_pan');
  if (pan) pan.addEventListener('click', function () { $('.chatbotbox .bubble').classList.toggle('open'); });

  /* ---------- 히어로: 휠 확장 (원본 로직 그대로) ---------- */
  var isLocking = false;
  var touchStartY = 0;
  var mvBox = $('.mv-ix_visual_box');
  var mvIx = $('#mv-ix');

  function lockScroll(ms) {
    if (isLocking) return;
    isLocking = true;
    var stop = function (e) { e.preventDefault(); e.stopPropagation(); return false; };
    window.addEventListener('wheel', stop, { passive: false });
    window.addEventListener('touchmove', stop, { passive: false });
    setTimeout(function () {
      window.removeEventListener('wheel', stop, { passive: false });
      window.removeEventListener('touchmove', stop, { passive: false });
      isLocking = false;
    }, ms || 900);
  }

  function openVisual() {
    if (mvBox.classList.contains('on')) return;
    lockScroll(1000);
    mvBox.classList.add('on');
    header.classList.add('white');
    document.documentElement.classList.remove('no_scroll');
    document.body.classList.remove('no_scroll');
    var wrap = $('.mv-ix_visual_wrap');
    mvBox.style.top = '-' + (wrap.getBoundingClientRect().top + window.scrollY) + 'px';
    setTimeout(function () {
      mvBox.classList.add('stop');
      if (window.ScrollTrigger) ScrollTrigger.refresh(); /* 잠금 해제 후 폭 변화 재계산 */
    }, 1000);
  }

  function closeVisual() {
    if (!mvBox.classList.contains('on')) return;
    if (window.scrollY !== 0) return;
    mvBox.classList.remove('stop');
    mvBox.classList.remove('on');
    document.documentElement.classList.add('no_scroll');
    header.classList.remove('white');
    mvBox.style.top = '0';
    setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 900);
  }

  /* 최초 진입 시 잠금 */
  document.documentElement.classList.add('no_scroll');

  mvIx.addEventListener('wheel', function (e) {
    if (isLocking) return;
    if (e.deltaY > 20) openVisual();
    else if (e.deltaY < -20) closeVisual();
  });
  mvIx.addEventListener('touchstart', function (e) { touchStartY = e.touches[0].clientY; });
  mvIx.addEventListener('touchmove', function (e) {
    if (isLocking) return;
    var diff = touchStartY - e.touches[0].clientY;
    if (diff > 15) openVisual();
    else if (diff < -15) closeVisual();
  });
  /* 페이지 아무 데서나 최상단 도달 후 휠업 → 닫힘 (원본과 동일하게 #mv-ix 위에서만 작동) */

  /* ---------- 히어로 영상 크로스페이드 + 진행바 (원본 로직) ---------- */
  var v1 = $('#v1'), v2 = $('#v2'), bar = $('.video-progress .bar');
  if (v1 && v2 && bar) {
    var FADE_SEC = 0.6, PRELOAD_SEC = 0.4;
    var current = v1, next = v2, switching = false, rafId = null;
    var startProgressLoop = function () {
      cancelAnimationFrame(rafId);
      var tick = function () {
        bar.style.width = current.duration ? ((current.currentTime / current.duration) * 100) + '%' : '0%';
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    };
    var checkAndSwitch = function () {
      if (!current.duration || switching) return;
      if (current.duration - current.currentTime < PRELOAD_SEC) {
        switching = true;
        next.currentTime = 0;
        var p = next.play();
        if (p && p.catch) p.catch(function () {}); /* 절전 등으로 중단돼도 콘솔 에러 없이 */
        next.style.opacity = 1;
        current.style.opacity = 0;
        next.style.zIndex = 2;
        current.style.zIndex = 1;
        setTimeout(function () {
          current.pause();
          bar.style.width = '0%';
          var t = current; current = next; next = t;
          switching = false;
        }, FADE_SEC * 1000);
      }
    };
    v1.addEventListener('timeupdate', checkAndSwitch);
    v2.addEventListener('timeupdate', checkAndSwitch);
    v1.addEventListener('canplay', function () {
      var p1 = v1.play();
      if (p1 && p1.catch) p1.catch(function () {});
      startProgressLoop();
    });
  }

  /* ---------- 비즈니스 탭 + 스와이퍼 (원본 파라미터) ---------- */
  var menuItems = $$('.btn-area li');
  var bgLayer = $('.business-bg');
  var bgImages = menuItems.map(function (li) { return li.getAttribute('data-bg'); });
  if (bgLayer && bgImages[0]) bgLayer.style.backgroundImage = 'url(' + bgImages[0] + ')';

  var swipers = {};
  $$('.business-swiper').forEach(function (el) {
    var sb = el.querySelector('.swiper-scrollbar');
    swipers[el.dataset.swiper] = new Swiper(el, {
      slidesPerView: 'auto',
      spaceBetween: 30,
      centeredSlides: false,
      loop: false,
      observer: true,
      observeParents: true,
      freeMode: true,
      slidesOffsetAfter: 50,
      scrollbar: sb ? { el: sb, hide: false, draggable: true, snapOnRelease: false } : undefined
    });
  });
  menuItems.forEach(function (li, idx) {
    li.addEventListener('click', function () {
      var act = $('.btn-area li.active');
      if (act) act.classList.remove('active');
      li.classList.add('active');
      $$('.business-swiper').forEach(function (wrap, i) {
        var on = i === idx;
        wrap.classList.toggle('active', on);
        wrap.style.display = on ? 'block' : 'none';
        if (on && wrap.swiper) wrap.swiper.update();
      });
      var key = 'swiper-' + idx;
      if (swipers[key]) swipers[key].slideTo(0);
      if (bgLayer && bgImages[idx]) bgLayer.style.backgroundImage = 'url(' + bgImages[idx] + ')';
    });
  });

  /* ---------- 이벤트(Work) 슬라이더 (원본: 3장 센터, initialSlide 5, nav) ---------- */
  new Swiper('.event-slide-inner', {
    slidesPerView: 3,
    centeredSlides: true,
    initialSlide: 5,
    navigation: {
      nextEl: '.event-slide .swiper-button-next',
      prevEl: '.event-slide .swiper-button-prev'
    },
    breakpoints: {
      0:   { slidesPerView: 1, centeredSlides: true },
      769: { slidesPerView: 3, centeredSlides: true }
    }
  });

  /* ---------- 뉴스(칼럼) 마키 — 원본 로직 (복제 4배, 2px/frame, hover 정지) ---------- */
  (function () {
    var container = $('.news-swiper');
    if (!container) return;
    var wrapper = container.querySelector('.swiper-wrapper');
    if (!wrapper) return;
    var barEl = $('.news-scrollbar');
    var thumb = $('.news-scrollbar__thumb');
    var mode = null, rafId2 = null, isPaused = false, pos = 0, singleSetWidth = 0;
    var hoverIn = null, hoverOut = null, onScroll = null, onThumbDown = null, onMove = null, onUp = null;

    var getOriginalSlides = function () {
      return Array.prototype.filter.call(wrapper.children, function (el) { return !el.classList.contains('is-clone'); });
    };
    var removeClones = function () {
      $$('.is-clone', wrapper).forEach(function (c) { c.remove(); });
    };
    var gapPx = function () { return parseFloat(getComputedStyle(wrapper).columnGap || getComputedStyle(wrapper).gap || 0) || 0; };

    function stopMarquee() {
      if (rafId2) cancelAnimationFrame(rafId2);
      rafId2 = null;
      if (hoverIn) container.removeEventListener('mouseenter', hoverIn);
      if (hoverOut) container.removeEventListener('mouseleave', hoverOut);
      hoverIn = hoverOut = null;
      wrapper.style.transform = '';
      pos = 0; isPaused = false;
      removeClones();
    }
    function startMarquee() {
      stopMobile();
      var originals = getOriginalSlides();
      if (!originals.length) return;
      singleSetWidth = 0;
      originals.forEach(function (s) { singleSetWidth += s.offsetWidth + gapPx(); });
      while (wrapper.scrollWidth < singleSetWidth * 4) {
        originals.forEach(function (s) {
          var c = s.cloneNode(true);
          c.classList.add('is-clone');
          wrapper.appendChild(c);
        });
      }
      pos = 0;
      var speed = 2;
      (function tick() {
        if (!isPaused) {
          pos -= speed;
          if (Math.abs(pos) >= singleSetWidth) pos = 0;
          wrapper.style.transform = 'translateX(' + pos + 'px)';
        }
        rafId2 = requestAnimationFrame(tick);
      })();
      hoverIn = function () { isPaused = true; };
      hoverOut = function () { isPaused = false; };
      container.addEventListener('mouseenter', hoverIn);
      container.addEventListener('mouseleave', hoverOut);
      container.scrollLeft = 0;
    }
    function updateThumb() {
      if (!barEl || !thumb) return;
      var maxScroll = container.scrollWidth - container.clientWidth;
      var trackW = barEl.clientWidth;
      if (maxScroll <= 0) {
        thumb.style.width = trackW + 'px';
        thumb.style.transform = 'translateX(0)';
        return;
      }
      var ratio = container.clientWidth / container.scrollWidth;
      var thumbW = Math.max(24, trackW * ratio);
      thumb.style.width = thumbW + 'px';
      thumb.style.transform = 'translateX(' + ((container.scrollLeft / maxScroll) * (trackW - thumbW)) + 'px)';
    }
    function startMobile() {
      stopMarquee();
      wrapper.style.transform = '';
      onScroll = updateThumb;
      container.addEventListener('scroll', onScroll, { passive: true });
      onThumbDown = function (e) {
        e.preventDefault();
        var trackW = barEl.clientWidth;
        var thumbW = thumb.getBoundingClientRect().width;
        var maxThumbX = trackW - thumbW;
        var maxScroll = container.scrollWidth - container.clientWidth;
        var startX = e.clientX;
        var startThumbX = thumb.getBoundingClientRect().left - barEl.getBoundingClientRect().left;
        onMove = function (ev) {
          var nx = Math.max(0, Math.min(maxThumbX, startThumbX + ev.clientX - startX));
          container.scrollLeft = (nx / maxThumbX) * maxScroll;
        };
        onUp = function () {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      };
      if (thumb) thumb.addEventListener('pointerdown', onThumbDown);
      requestAnimationFrame(updateThumb);
    }
    function stopMobile() {
      if (onScroll) container.removeEventListener('scroll', onScroll);
      if (thumb && onThumbDown) thumb.removeEventListener('pointerdown', onThumbDown);
      onScroll = onThumbDown = null;
    }
    function apply() {
      var next = window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop';
      if (mode === next) return;
      mode = next;
      if (mode === 'mobile') startMobile(); else startMarquee();
    }
    apply();
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () { apply(); if (mode === 'mobile') updateThumb(); }, 150);
    });
  })();

  /* ---------- con3 링크 호버 → 좌측 이미지 교체 (원본 로직) ---------- */
  var linkItems = $$('.main-con3 .right .link-list li');
  var imgItems = $$('.main-con3 .left .list li');
  linkItems.forEach(function (li, idx) {
    li.addEventListener('mouseenter', function () {
      linkItems.forEach(function (x) { x.classList.remove('on'); });
      li.classList.add('on');
      imgItems.forEach(function (x, i) { x.classList.toggle('on', i === idx); });
    });
  });

  /* ---------- GSAP: 핀 + 박스 확장 (원본 파라미터 그대로) ---------- */
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();
  mm.add(
    { desktop: '(min-width: 1024px)', mobile: '(max-width: 1023px)' },
    function (ctx) {
      var desktop = ctx.conditions.desktop;
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.main-con1',
          start: 'top top',
          end: '+=150%',
          scrub: 2,
          pin: '.mainCon-gsap-wrap',
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      if (desktop) {
        tl.fromTo('.mainCon .main-con2',
          { width: '408px', height: '271px', top: '50%', right: '10%' },
          { width: '100%', height: '100%', top: '0%', right: '0%', ease: 'none', duration: 1 });
      } else {
        tl.fromTo('.mainCon .main-con2',
          { width: '50px', height: '50px', top: '50%', right: '10%' },
          { width: '100%', height: '100%', top: '0%', right: '0%', ease: 'none', duration: 1 });
      }
      tl.fromTo('.mainCon .main-con2 .inner',
        { opacity: 0, pointerEvents: 'none' },
        { opacity: 1, duration: 0.8, pointerEvents: 'auto' }, '>');
      return function () {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill();
      };
    }
  );

  /* con3 이미지 와이프 */
  gsap.fromTo('.main-con3 .left .list li img',
    { clipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      ease: 'none',
      scrollTrigger: { trigger: '.main-con3', start: 'top bottom', end: 'center bottom', scrub: 2 }
    });

  /* ---------- 복원 섹션 ---------- */
  /* 차별화된 서비스 — 기존 하오웹(design-preview) 슬라이더를 그대로 옮겼다.
     Swiper 를 쓰지 않는다: 앞뒤 한 벌씩 복제한 무한 루프 + 5초 자동재생 + 진행바.
     전환 시간(800ms)은 CSS `.diff__track` 한 곳에서만 정한다 — 여기서 인라인으로
     넣으면 place() 가 transition 을 비우는 순간 사라진다(원본 주석의 실제 사고). */
  function initDiff() {
    var view = document.querySelector('[data-diff-view]');
    var track = document.querySelector('[data-diff-track]');
    if (!view || !track) return;
    var prev = document.querySelector('[data-diff="prev"]');
    var next = document.querySelector('[data-diff="next"]');
    var fill = document.querySelector('[data-diff-fill]');

    var real = [].slice.call(track.children);
    var N = real.length;
    if (!N) return;

    function clone(list, where) {
      list.forEach(function (el) {
        var c = el.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.setAttribute('inert', '');
        c.setAttribute('data-clone', '');
        c.removeAttribute('data-fade');
        c.classList.add('on');
        if (where === 'before') track.insertBefore(c, track.firstChild);
        else track.appendChild(c);
      });
    }
    clone(real.slice().reverse(), 'before');
    clone(real, 'after');

    var i = N;
    var timer = null;
    var DELAY = 5000;      /* 레퍼런스 실측 */
    /* ⚠ 전환 시간(레퍼런스 실측 800ms)은 **CSS 한 곳에서만** 정한다.
       여기서 인라인으로 넣으면 `place()` 가 transition 을 비울 때 사라져 CSS 기본값으로 돈다. */

    function step() {
      var card = track.children[0];
      if (!card) return 0;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      return card.getBoundingClientRect().width + gap;
    }
    /* 진행바 — 지금이 원본 몇 번째인지의 비율만큼 채운다. 한 칸 분량이 최소 폭이다. */
    function paint() {
      if (!fill) return;
      var pos = ((i - N) % N + N) % N;          /* 0 … N-1 */
      var one = 100 / N;
      fill.style.width = (one * (pos + 1)) + '%';
    }
    function place(animate) {
      track.style.transition = animate ? '' : 'none';
      track.style.transform = 'translateX(' + (-i * step()) + 'px)';
      if (!animate) { track.offsetHeight; track.style.transition = ''; }
      paint();
    }
    function settle() {
      if (i >= N * 2) { i -= N; place(false); }
      else if (i < N) { i += N; place(false); }
    }
    /* ⚠ `transitionend` 는 자식에서 올라온다 — 트랙 자신 것만 받는다.
       안 그러면 카드 안 등장 모션이 위치 보정을 엉뚱한 순간에 부른다. */
    track.addEventListener('transitionend', function (e) {
      if (e.target === track && e.propertyName === 'transform') settle();
    });
    function go(d) { i += d; place(true); restart(); }

    function restart() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { go(1); }, DELAY);
    }
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    window.addEventListener('resize', function () { place(false); });

    /* ⚠ 화면 밖에서는 돌리지 않는다 — 안 보이는 곳에서 타이머가 도는 건 낭비다.
       레퍼런스는 항상 돌지만 결과(보이는 동안 5초마다)는 같고 배터리를 덜 쓴다. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) restart();
          else if (timer) { clearTimeout(timer); timer = null; }
        });
      }, { threshold: .2 }).observe(view);
    } else restart();

    place(false);
  }
  /* ⚠ 즉시 부르면 CSS 적용 전 카드 폭(52px)으로 step() 이 계산돼 트랙이 -402px 에서
     굳는다(정상 -2478px = 6장 x 413). 실제로 그랬다 — 스타일이 확정된 뒤에 건다. */
  if (document.readyState === 'complete') initDiff();
  else window.addEventListener('load', initDiff);

  /* SEO·AEO·GEO 상세 pill 탭 */
  $$('.hw-viz [data-viz-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.hw-viz [data-viz-tab]').forEach(function (b) { b.classList.toggle('active', b === btn); });
      $$('.hw-viz [data-viz-panel]').forEach(function (p) {
        p.classList.toggle('active', p.dataset.vizPanel === btn.dataset.vizTab);
      });
    });
  });

  /* 업종별 — con3 와 같은 호버 교체 + 와이프 */
  var indLinks = $$('.hw-industry .link-list li');
  var indImgs = $$('.hw-industry .left .list li');
  indLinks.forEach(function (li, idx) {
    li.addEventListener('mouseenter', function () {
      indLinks.forEach(function (x) { x.classList.remove('on'); });
      li.classList.add('on');
      indImgs.forEach(function (x, i) { x.classList.toggle('on', i === idx); });
    });
  });
  gsap.fromTo('.hw-industry .left .list li img',
    { clipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      ease: 'none',
      scrollTrigger: { trigger: '.hw-industry', start: 'top bottom', end: 'center bottom', scrub: 2 }
    });

  /* 자료가 없어도 — 풀폭 이미지 와이프 */
  gsap.fromTo('.hw-reveal .photo img',
    { clipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      ease: 'none',
      scrollTrigger: { trigger: '.hw-reveal .photo', start: 'top bottom', end: 'center bottom', scrub: 2 }
    });

  /* ---------- How We Build 타임라인 ----------
     기존 하오웹 site.js 의 initTimeline() 을 그대로 옮겼다. 화면에 들어오면 단계가
     차례로 켜지고(스태거) 선이 그 점 중심까지 차오른다. 화면 밖으로 나가면 되감는다. */
  function initTimeline() {
    var tls = [].slice.call(document.querySelectorAll('[data-timeline]'));
    if (!tls.length) return;

    var reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var make = function (tl) {
      var steps = [].slice.call(tl.querySelectorAll('.tstep'));
      var fill = tl.querySelector('.timeline__line i');
      var at = -1;
      var timers = [];
      var playing = false;

      /* 원본(haoc)은 마지막 단계에서 선을 100% 까지 채우는데, 점은 각 칸의 왼쪽에 있어서
         마지막 점 오른쪽으로 빈 선이 남는다. 하오웹은 칸 간격이 더 넓어 그게 눈에 띄므로
         채움을 '그 단계 점의 중심'까지로 맞춘다. (점: left 2px + 지름 12 → 중심 +8) */
      var paint = function () {
        if (!fill || at < 0) return;
        fill.style.width = (steps[at].offsetLeft + 8) + 'px';
      };

      var tip = function (s) {
        steps.forEach(function (o) { o.classList.remove('is-tip'); });
        s.classList.add('is-tip');        /* 지금 도달한 단계 = 레드 점 */
      };

      /* 재생 중 화면 밖으로 나가면 남은 타이머가 다음 재생과 겹친다 — 반드시 끊는다 */
      var stop = function () {
        for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
        timers = [];
      };

      var reset = function () {
        if (reduce || !playing) return;    /* reduce 는 모션이 없으니 켜 둔 채로 */
        stop();
        playing = false;
        at = -1;
        steps.forEach(function (s) {
          s.classList.remove('is-on');
          s.classList.remove('is-tip');
        });
        if (fill) fill.style.width = '0px';
      };

      var play = function () {
        if (playing) return;               /* 스크롤 중 콜백이 여러 번 와도 한 번만 */
        playing = true;
        if (reduce) {
          steps.forEach(function (s) { s.classList.add('is-on'); });
          at = steps.length - 1;
          tip(steps[at]);
          paint();
          return;
        }
        stop();
        steps.forEach(function (s, i) {
          timers.push(setTimeout(function () {
            s.classList.add('is-on');
            tip(s);
            at = i;
            paint();
          }, 250 + i * 420));
        });
      };

      /* 예전엔 run() 안에서 붙여 재생할 때마다 리스너가 쌓였다 — 타임라인당 한 번만 붙인다 */
      window.addEventListener('resize', paint);
      return { el: tl, play: play, reset: reset };
    };

    var list = tls.map(make);
    var ctl = function (el) {
      for (var i = 0; i < list.length; i++) if (list[i].el === el) return list[i];
      return null;
    };

    if (!('IntersectionObserver' in window)) {
      list.forEach(function (o) { o.play(); });
      return;
    }
    /* 0 = 완전히 벗어남(초기화), .15 = 발동 — 두 지점 모두에서 콜백을 받아야 한다 */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var c = ctl(e.target);
        if (!c) return;
        if (!e.isIntersecting) c.reset();
        else if (e.intersectionRatio >= .15) c.play();
      });
    }, { threshold: [0, .15] });
    list.forEach(function (o) { io.observe(o.el); });
  }
  initTimeline();

  /* ---------- WORK ----------
     기존 하오웹 site.js 의 initWork / initWorkView / initMarquee 를 그대로 옮겼다.
     · initWork      화면에 들어오면 `data-on=true` → 카드가 아래에서 떠오른다
     · initWorkView  카드/목록 보기 전환(`data-view`)
     · initMarquee   목록 hover 시 올라오는 도메인 마퀴 텍스트를 8번 복제해 채운다 */
  function initWork() {
    var grids = [].slice.call(document.querySelectorAll('[data-work]'));
    if (!grids.length) return;
    var on = function (g) { g.setAttribute('data-on', 'true'); };
    if (!('IntersectionObserver' in window)) { grids.forEach(on); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        on(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: .15 });
    grids.forEach(function (g) { io.observe(g); });
  }

  function initWorkView() {
    [].slice.call(document.querySelectorAll('[data-workview]')).forEach(function (wrap) {
      var btns = [].slice.call(wrap.querySelectorAll('[data-view-btn]'));
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          wrap.setAttribute('data-view', btn.getAttribute('data-view-btn'));
          btns.forEach(function (o) {
            o.setAttribute('aria-pressed', o === btn ? 'true' : 'false');
          });
        });
      });
    });
  }

  function initMarquee() {
    document.querySelectorAll('[data-marquee]').forEach(function (m) {
      var label = m.dataset.marquee;
      if (!label) return;
      var html = '';
      for (var i = 0; i < 8; i++) html += '<span>' + label + '</span>';
      m.innerHTML = html;
    });
  }
  initWork();
  initWorkView();
  initMarquee();

  /* ---------- 워드마크 밴드 ----------
     기존 하오웹 site.js 의 initWordband() 를 그대로 옮겼다(2026-08-25 세영 지시).
     흐름 속도는 화면 폭 / 87.2px/s 로 매번 다시 계산한다(실측값).
     배경 사진은 4.2초마다 넘어가고, 화면 밖이면 돌리지 않는다. */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function initWordband() {
    var sec = document.querySelector('.txtsec');
    if (!sec) return;
    var lines = Array.prototype.slice.call(sec.querySelectorAll('[data-wb]'));
    if (!lines.length) return;
    var SPEED = 87.2;                    // 실측 px/s
    var apply = function () {
      var w = window.innerWidth || 1440;
      var dur = (w / SPEED).toFixed(2) + 's';
      lines.forEach(function (el) { el.style.animationDuration = dur; });
    };
    apply();
    window.addEventListener('resize', apply);

    /* 배경 캡처를 한 장씩 넘긴다 (2026-08-16 세영: "하나의 이미지를 깔자 · 모션이 들어가며
       다른 이미지로 바뀌고"). 레퍼런스는 영상 한 편이라 그 등가물로 전환을 쓴다.
       ⚠ 두 줄은 **같은 사진**을 공유한다 — 배경은 섹션에 하나뿐이다. */
    var bgs = Array.prototype.slice.call(sec.querySelectorAll('.txtsec__bg'));
    if (bgs.length > 1 && !reduced) {
      var i = 0;
      setInterval(function () {
        // 화면 밖이면 굳이 돌리지 않는다(모바일 배터리·CPU)
        var r = sec.getBoundingClientRect();
        if (r.bottom < 0 || r.top > (window.innerHeight || 900)) return;
        bgs[i].classList.remove('is-on');
        i = (i + 1) % bgs.length;
        // 확대 애니메이션을 매번 처음부터 재생시키려면 클래스를 뗐다 붙이는 것만으로는 부족하다
        var n = bgs[i];
        n.style.animation = 'none';
        void n.offsetWidth;              // 리플로를 한 번 강제해야 애니메이션이 리셋된다
        n.style.animation = '';
        n.classList.add('is-on');
      }, 4200);
    }
  }
  initWordband();

  /* ---------- 홈페이지 종류 원형 슬라이더 ----------
     바로웹 #section14 실측 그대로: slidesPerView 6 · spaceBetween 10 · loop · speed 800
     · autoplay {delay: 5000, disableOnInteraction: false}
     ⚠ 항목이 8개라 loop 복제분이 모자랄 수 있어 loopAdditionalSlides 를 넉넉히 준다. */
  if (document.querySelector('.ctg__swiper')) {
    new Swiper('.ctg__swiper', {
      slidesPerView: 6,
      spaceBetween: 10,
      loop: true,
      loopAdditionalSlides: 8,
      speed: 800,
      autoplay: { delay: 5000, disableOnInteraction: false },
      navigation: {
        nextEl: '.ctg__arrow--next',
        prevEl: '.ctg__arrow--prev'
      },
      breakpoints: {
        0:    { slidesPerView: 2, spaceBetween: 8 },
        561:  { slidesPerView: 3, spaceBetween: 10 },
        861:  { slidesPerView: 4, spaceBetween: 10 },
        1025: { slidesPerView: 6, spaceBetween: 10 }
      }
    });
  }

  /* ---------- 실적 카운트업 ----------
     바로웹 실측: $("#section5 .aniNum").counterUp({delay: 50, time: 700})
     → 700ms 동안 50ms 간격(14 스텝). 화면에 들어올 때 한 번만 센다. */
  (function () {
    var els = [].slice.call(document.querySelectorAll('.perf__no em[data-count]'));
    if (!els.length) return;
    var TIME = 700, DELAY = 50;

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var steps = Math.max(1, Math.round(TIME / DELAY));
      var n = 0;
      el.textContent = '0';   /* 세기 직전에만 0 으로 — 그 전에는 목표값이 보인다 */
      var timer = setInterval(function () {
        n++;
        var v = n >= steps ? target : Math.round(target * n / steps);
        el.textContent = v.toLocaleString('ko-KR');
        if (n >= steps) clearInterval(timer);
      }, DELAY);
    }

    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        run(e.target);
      });
    }, { threshold: .4 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- AOS (원본: 히어로 fade-up 2000) ---------- */
  if (window.AOS) AOS.init();
})();
