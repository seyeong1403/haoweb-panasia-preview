/* ============================================================
   서브페이지 공통 스크립트 — 헤더/메뉴/CTA(메인과 동일 동작) +
   서브 위젯(viz 탭·보기 전환·리빌 와이프). FAQ는 네이티브 details.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };

  /* ---------- 헤더: 서브는 최상단에서 white(어두운 비주얼 위) ---------- */
  var header = $('#header');
  function applyHeaderClass() {
    if (window.scrollY < 1) {
      header.classList.remove('nav-up');
      header.classList.add('white');
    } else {
      header.classList.add('nav-up');
      header.classList.remove('white');
    }
  }
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
      $$('.dep2Menu .area > ul').forEach(function (u, i) { u.classList.toggle('active', i === index); });
      dep2Menu.classList.add('on');
    });
  });
  [$('#gnb'), $('.dep2Wrap')].forEach(function (el) {
    if (!el) return;
    el.addEventListener('mouseleave', function () {
      dep2Menu.classList.remove('on');
      gnbItems.forEach(function (x) { x.classList.remove('on'); });
    });
  });
  if (dep2Menu) {
    dep2Menu.addEventListener('mouseenter', function () { dep2Menu.classList.add('on'); });
    dep2Menu.addEventListener('mouseleave', function () {
      dep2Menu.classList.remove('on');
      gnbItems.forEach(function (x) { x.classList.remove('on'); });
    });
  }

  /* ---------- 전체메뉴 ---------- */
  $$('.allMenuBtn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.allMenuBtn').forEach(function (b) { b.classList.toggle('active'); });
      $('#headerY') && $('#headerY').classList.toggle('active');
      $('.allMenuWrap').classList.toggle('active');
    });
  });
  $$('.allMenu > ul > li > span').forEach(function (sp) {
    sp.addEventListener('click', function () {
      $$('.allMenu .dep2').forEach(function (d) { d.classList.remove('active'); });
      var next = sp.nextElementSibling;
      if (next) next.classList.add('active');
    });
  });

  /* ---------- 플로팅 CTA ---------- */
  var pan = $('.chatbot_pan');
  if (pan) pan.addEventListener('click', function () { $('.chatbotbox .bubble').classList.toggle('open'); });

  /* ---------- viz 탭 ---------- */
  $$('[data-viz-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('[data-viz-tab]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      $$('[data-viz-panel]').forEach(function (p) {
        var on = p.dataset.vizPanel === btn.dataset.vizTab;
        p.setAttribute('data-on', on ? 'true' : 'false');
        p.classList.toggle('active', on);
      });
    });
  });

  /* ---------- Work 보기 전환 (grid/list) ---------- */
  $$('[data-view-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var view = btn.dataset.viewBtn;
      var wrap = btn.closest('[data-workview]');
      if (wrap) wrap.setAttribute('data-view', view);
      $$('[data-view-btn]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
    });
  });

  /* ---------- 리빌 이미지 와이프 (파나시아 con3 문법) ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    $$('.reveal__frame img').forEach(function (img) {
      gsap.fromTo(img, { clipPath: 'inset(0 100% 0 0)' }, {
        clipPath: 'inset(0 0% 0 0)', ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'center bottom', scrub: 2 }
      });
    });
  }

  /* ---------- 단계 타임라인 ----------
     2026-08-26 세영 「사이트 전체 단계별 섹션에 동일 디자인」 → 서브 15장의
     `[data-timeline]` 도 메인과 같은 방식으로 켜지게 한다(main.js 것과 같은 코드). */
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

  if (window.AOS) AOS.init();
})();
