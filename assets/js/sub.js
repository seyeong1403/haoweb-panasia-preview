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

  if (window.AOS) AOS.init();
})();
