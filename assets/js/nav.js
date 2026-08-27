/* 내비게이션 — 기존 하오웹(design-preview) site.js 의 initNav() 를 그대로 옮겼다.
   (2026-08-27 세영: 「내비게이션 디자인과 모션도 이전 하오웹 것을 그대로」)

   ⚠ 파나시아는 index 가 main.js, 서브가 sub.js 를 쓴다. 헤더는 48장 공통이라 어느 한쪽에
     넣으면 반쪽만 살아난다 → 별도 파일로 두고 전 페이지에서 부른다.
   ⚠ 옛 파나시아 헤더 제어 코드(#header · .allMenuWrap)는 마크업이 사라져 대상이 없다.
     지우지는 않았다 — 되돌릴 때 필요하고, 대상이 없으면 아무 일도 하지 않는다. */
(function () {
  'use strict';

  function initNav() {
    // 스크롤하면 내비에 어두운 띠 (레퍼런스 동작)
    var nav = document.querySelector('.nav');
    if (nav) {
      var onScroll = function () {
        nav.classList.toggle('is-stuck', window.scrollY > 40);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // 2뎁스 드롭다운 — 그룹 hover/focus 로 열고, 내비 밖으로 나가면 닫는다
    var groups = Array.prototype.slice.call(document.querySelectorAll('[data-navgroup]'));
    if (nav && groups.length) {
      var openT, closeT;

      var setOpen = function (g) {
        groups.forEach(function (o) {
          var on = o === g;
          o.setAttribute('data-open', on ? 'true' : 'false');
          var a = o.querySelector('.nav__link');
          if (a) a.setAttribute('aria-expanded', on ? 'true' : 'false');
        });
        nav.classList.toggle('is-open', !!g);
      };

      groups.forEach(function (g) {
        g.addEventListener('mouseenter', function () {
          clearTimeout(closeT);
          openT = setTimeout(function () { setOpen(g); }, 60);
        });
        g.addEventListener('focusin', function () {
          clearTimeout(closeT); setOpen(g);
        });
      });

      nav.addEventListener('mouseleave', function () {
        clearTimeout(openT);
        closeT = setTimeout(function () { setOpen(null); }, 180);
      });
      nav.addEventListener('focusout', function (e) {
        if (!nav.contains(e.relatedTarget)) setOpen(null);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var open = groups.filter(function (g) { return g.getAttribute('data-open') === 'true'; })[0];
        if (!open) return;
        setOpen(null);
        var a = open.querySelector('.nav__link');
        if (a) a.focus();
      });
    }

    /* ⚠⚠ `querySelector` 는 첫 번째 하나만 잡는다. 사이트맵 우상단 닫기(×)도 같은
       `data-burger` 인데 두 번째라 걸리지 않아 눌러도 아무 일이 없었다(원본에서 겪은 일).
       여는 버튼과 닫는 버튼이 따로 있으므로 전부 걸어야 한다. */
    var burgers = [].slice.call(document.querySelectorAll('[data-burger]'));
    var burger = burgers[0];
    var panel = document.querySelector('[data-navpanel]');
    if (!burger || !panel) return;

    /* ⚠⚠ 이름을 `setPanel` 로 둔다. 이 함수 안에는 드롭다운용 `setOpen` 이 이미 있다 —
       같은 이름으로 만들면 조용히 덮여서 내비가 통째로 먹통이 된다(원본 기록). */
    function setPanel(open) {
      panel.setAttribute('data-open', open ? 'true' : 'false');
      burgers.forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burgers.forEach(function (b) {
      b.addEventListener('click', function () {
        setPanel(panel.getAttribute('data-open') !== 'true');
      });
    });
    /* Esc 로도 닫힌다 — 전체 화면을 덮는 패널은 빠져나갈 길이 있어야 한다. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.getAttribute('data-open') === 'true') setPanel(false);
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setPanel(false); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
