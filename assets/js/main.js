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
  /* ⚠⚠ 2026-08-27 — 헤더를 기존 하오웹 것(`nav.nav`)으로 바꾸면서 `#header` 가 사라졌다.
     바로 아래 `applyHeaderClass()` 가 **로드 즉시** 실행되는데 null 이면 거기서 예외가 나고
     **이 파일의 나머지가 통째로 중단된다** — 히어로 잠금(`no_scroll`)도, 등장 애니메이션도
     걸리지 않아 메인 첫 화면이 흰 화면으로 보였다.
     ⚠ 콘솔 검사(_qa/console.py)는 이 예외를 못 잡았다. 「에러 0」을 곧이곧대로 믿지 말 것.
     옛 헤더 제어 코드는 대상이 없으면 아무 일도 하지 않게 더미로 받는다(되돌릴 때를 위해 남긴다). */
  var header = $('#header') || document.createElement('div');
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
      $('.allMenuWrap') && $('.allMenuWrap').classList.toggle('active');
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


  /* ---------- 공용 마퀴 ----------
     끊김 없이 한 방향으로 흐르는 카드 줄. 앞뒤로 한 벌씩 복제해 두고 rAF 로 매 프레임
     조금씩 민다.
   ⚠⚠ Swiper 의 autoplay(delay 0 + 긴 speed)로는 이 모양이 안 나온다. 실측해 보니
     `animating` 이 true 로 굳어 `slideNext()` 를 손으로 불러도 1px 도 움직이지 않았다
     (2026-08-27). 「멈춰 있다가 탭을 누르면 그제야 움직인다」가 그 증상이었다.
     그래서 이 슬라이더는 Swiper 로 돌리지 않는다 — 배치(flex)와 카드 폭은 CSS 가 이미
     쥐고 있어서 Swiper 없이도 그대로 선다. */
  function makeMarquee(view, track, opts) {
    opts = opts || {};
    if (!view || !track) return null;
    var real = [].slice.call(track.children);
    var N = real.length;
    if (!N) return null;

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

    /* ⚠ 매 프레임 transform 을 직접 준다. CSS 에 transition 이 남아 있으면 프레임마다
       새 전환이 시작돼 끈적하게 끌리고 진행바와 어긋난다. */
    track.style.transition = 'none';

    var SPEED = opts.speed || 85;
    var x = 0, unit = 0, raf = null, last = 0, pending = 0, running = false;

    /* 한 벌 폭 — 카드 폭을 곱하지 않고 **좌표 차이**로 잰다. 반응형으로 좁아져도 정확하다. */
    function measure() {
      var a = track.children[N], b = track.children[N * 2];
      unit = (a && b) ? (b.offsetLeft - a.offsetLeft) : 0;
      if (!unit) unit = 1;
    }
    function wrap() {
      while (x <= -2 * unit) x += unit;
      while (x > -unit) x -= unit;
    }
    function paint() {
      track.style.transform = 'translateX(' + x + 'px)';
      if (opts.paint) opts.paint(((-x - unit) / unit), unit);
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (!last) { last = t; return; }
      var dt = Math.min((t - last) / 1000, .05);   /* 탭을 다시 열었을 때 튀지 않게 */
      last = t;
      if (!running) return;
      if (pending) {
        var take = pending * Math.min(1, dt * 5);
        x -= take; pending -= take;
        if (Math.abs(pending) < .5) { x -= pending; pending = 0; }
      }
      x -= SPEED * dt;
      wrap(); paint();
    }
    function start() { running = true; last = 0; if (!raf) raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }
    function remeasure() {
      var r = unit ? x / unit : -1;
      measure(); x = r * unit; wrap(); paint();
    }

    /* 읽는 동안에는 세워 둔다 — 흐르는 글을 눈으로 좇게 하지 않는다. */
    view.addEventListener('mouseenter', function () { running = false; });
    view.addEventListener('mouseleave', function () { if (raf) { last = 0; running = true; } });
    window.addEventListener('resize', remeasure);

    measure(); x = -unit; paint();

    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    var frozen = !!(mq && mq.matches);   /* 「모션 줄이기」를 켠 분에게는 흐르지 않는다 */
    return {
      start: function () { if (!frozen) start(); },
      stop: stop, remeasure: remeasure,
      nudge: function (px) { pending += px; },
      step: function () { return unit / N; }
    };
  }

  /* ---------- 비즈니스 탭 + 카드 마퀴 ---------- */
  var menuItems = $$('.btn-area li');
  var bgLayer = $('.business-bg');
  var bgImages = menuItems.map(function (li) { return li.getAttribute('data-bg'); });
  if (bgLayer && bgImages[0]) bgLayer.style.backgroundImage = 'url(' + bgImages[0] + ')';
  /* ⚠ 배경 교체는 **새 레이어를 위에 얹어 불투명도만** 올린다. background-image 를
     그대로 갈면 CSS 전환이 두 사진을 크로스페이드로 섞으며 cover 가 충돌해
     사진이 늘어나 보인다(2026-08-27 세영이 본 왜곡). 끝나면 밑판에 확정하고 걷는다. */
  function setBizBg(url) {
    if (!bgLayer) return;
    var img = new Image();
    img.onload = function () {
      var f = document.createElement('div');
      f.className = 'business-bg__fade';
      f.style.backgroundImage = 'url(' + url + ')';
      bgLayer.appendChild(f);
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        f.style.opacity = '1';
      }); });
      f.addEventListener('transitionend', function () {
        bgLayer.style.backgroundImage = 'url(' + url + ')';
        if (f.parentNode) f.parentNode.removeChild(f);
      });
    };
    img.src = url;
  }

  var marquees = {};
  $$('.business-swiper').forEach(function (el) {
    var track = el.querySelector('.swiper-wrapper');
    var sb = el.querySelector('.swiper-scrollbar');
    var drag = null;
    if (sb) {
      /* Swiper 가 만들어 주던 손잡이를 직접 둔다 — 진행바가 있어야 어디쯤인지 보인다. */
      drag = sb.querySelector('.swiper-scrollbar-drag');
      if (!drag) {
        drag = document.createElement('span');
        drag.className = 'swiper-scrollbar-drag';
        sb.appendChild(drag);
      }
    }
    marquees[el.dataset.swiper] = makeMarquee(el, track, {
      speed: 90,
      paint: function (r, unit) {
        if (!drag) return;
        var w = Math.min(1, Math.max(.08, el.clientWidth / unit));
        drag.style.width = (w * 100) + '%';
        /* translateX 는 «자기 폭» 기준이다 — 움직일 수 있는 거리를 손잡이 폭으로 나눈다. */
        drag.style.transform = 'translateX(' + (((1 - w) / w) * r * 100) + '%)';
      }
    });
  });

  /* ⚠ 첫 탭은 «들어가자마자» 흘러야 한다(2026-08-27 세영). 화면 밖에서는 세워 둔다 —
     안 보이는 곳에서 프레임을 도는 건 낭비다. */
  var bizSec = $('.main-con2');
  function bizPlay(on) {
    Object.keys(marquees).forEach(function (k) {
      var m = marquees[k];
      if (!m) return;
      var el = document.querySelector('[data-swiper="' + k + '"]');
      var live = el && el.classList.contains('active');
      if (on && live) { m.remeasure(); m.start(); } else m.stop();
    });
  }
  if (bizSec && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { bizPlay(e.isIntersecting); });
    }, { threshold: .05 }).observe(bizSec);
  } else {
    bizPlay(true);
  }

  menuItems.forEach(function (li, idx) {
    li.addEventListener('click', function () {
      var act = $('.btn-area li.active');
      if (act) act.classList.remove('active');
      li.classList.add('active');
      $$('.business-swiper').forEach(function (wrap, i) {
        wrap.classList.toggle('active', i === idx);
        wrap.style.display = i === idx ? 'block' : 'none';
      });
      /* ⚠ `display:none` 인 동안에는 폭이 0 이라 한 벌 폭을 잴 수 없다. 보이게 «한 뒤에»
         다시 재고 시작해야 흐름이 이어진다 — 안 그러면 그 탭만 서 있는다. */
      bizPlay(true);
      if (bgImages[idx]) setBizBg(bgImages[idx]);
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

  /* ---------- 차별화된 서비스 — 아코디언 ----------
     soijeong.com 「Award Winner」 실측: **얹으면 그 카드가 펼쳐진다**(자동 전환 없음).
     폭 전환은 CSS(`flex-basis .4s`)가 맡고 여기서는 `is-open` 만 옮긴다.
   ⚠ 첫 카드는 HTML 에 `is-open` 이 박혀 있다 — JS 가 죽어도 한 장은 펼쳐진 채로 보인다. */
  function initAcc() {
    var list = document.querySelector('[data-acc]');
    if (!list) return;
    var items = [].slice.call(list.querySelectorAll('[data-acc-item]'));
    if (!items.length) return;

    function open(el) {
      items.forEach(function (o) { o.classList.toggle('is-open', o === el); });
    }
    items.forEach(function (el) {
      el.addEventListener('mouseenter', function () { open(el); });
      el.addEventListener('focusin', function () { open(el); });
      /* 터치 기기에는 hover 가 없다 — 두드리면 펼쳐지게 한다. */
      el.addEventListener('click', function () { open(el); });
    });
    /* 목록 밖으로 나가면 처음 카드로 돌아간다(레퍼런스와 같다). */
    list.addEventListener('mouseleave', function () { open(items[0]); });
  }
  initAcc();

  /* ---------- 흐르는 문구 ----------
     레퍼런스 실측 초당 23px. 2026-08-27 세영 「조금 빠르게」 → 35. */
  (function () {
    var track = document.querySelector('[data-flowtxt]');
    if (!track) return;
    var sec = track.parentElement;
    var m = makeMarquee(sec, track, { speed: 35 });
    if (!m) return;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) m.start(); else m.stop(); });
      }, { threshold: 0 }).observe(sec);
    } else m.start();
  })();

  /* SEO·AEO·GEO 상세 pill 탭 */
  $$('.hw-viz [data-viz-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.hw-viz [data-viz-tab]').forEach(function (b) { b.classList.toggle('active', b === btn); });
      $$('.hw-viz [data-viz-panel]').forEach(function (p) {
        p.classList.toggle('active', p.dataset.vizPanel === btn.dataset.vizTab);
      });
    });
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
        /* ⚠ 선이 24px 지점에서 시작하고 점 중심은 offsetLeft+30 이다 → 채움 폭은 그 차이. */
        fill.style.width = (steps[at].offsetLeft + 6) + 'px';
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


  /* ---------- 레일 경계선 감추기 ----------
     사진이 화면 끝까지 깔리는 구간(`.work.fullbleed`)이 화면에 걸쳐 있는 동안만
     좌측 레일의 세로 선을 지운다. 목록 보기로 바꾸면 `.work` 가 display:none 이라
     관찰이 자동으로 끊기고 선이 다시 돌아온다. */
  (function () {
    var rail = $('#headerY');
    var zones = $$('.work.fullbleed');
    if (!rail || !zones.length || !('IntersectionObserver' in window)) return;
    var shown = [];
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = shown.indexOf(e.target);
        if (e.isIntersecting) { if (i < 0) shown.push(e.target); }
        else if (i >= 0) { shown.splice(i, 1); }
      });
      rail.classList.toggle('rail--noline', shown.length > 0);
    }, { threshold: 0 });
    zones.forEach(function (z) { io.observe(z); });
  })();

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
