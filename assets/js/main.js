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

  /* ---------- 복원 섹션 (파나시아 문법 재사용) ---------- */
  /* 차별화된 서비스 — event 슬라이더 문법(3장 센터·nav), 01부터 보여야 해서 시작만 1 */
  new Swiper('.diff-slide-inner', {
    slidesPerView: 3,
    centeredSlides: true,
    initialSlide: 1,
    navigation: {
      nextEl: '.diff-slide .swiper-button-next',
      prevEl: '.diff-slide .swiper-button-prev'
    },
    breakpoints: {
      0:   { slidesPerView: 1, centeredSlides: true },
      769: { slidesPerView: 3, centeredSlides: true }
    }
  });

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

  /* ---------- AOS (원본: 히어로 fade-up 2000) ---------- */
  if (window.AOS) AOS.init();
})();
