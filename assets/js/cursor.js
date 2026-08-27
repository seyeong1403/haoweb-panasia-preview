/* 마우스 글로우 커서 — 옛 하오웹(haoweb-preview) 실측 이식 (2026-08-27 세영:
   「여기서 마우스 커서 효과를 가져오면 좋을 거 같아」).

   원문(main.css 199~ / main.js followMousePointer):
     .mouse-default — fixed · 130×130 원 · radial-gradient(브랜드 100%→74%→37%→0) ·
     opacity .35 · blur(2px) + backdrop blur(5px) · z-index:-1(콘텐츠 뒤) ·
     TweenMax 2s Expo.easeOut 로 마우스를 «느긋하게» 따라간다.
   ⚠ 원본 kr/index 에는 CSS·JS 만 있고 요소가 붙어 있지 않았다(만들다 만 상태) —
     여기서는 요소 생성까지 스크립트가 맡는다. CSS 파일 수정 없이 전 페이지에 적용된다.
   ⚠ z-index:-1 은 body 배경이 «투명»이라는 전제 위에 선다 — body 에 배경색을 주면
     글로우가 통째로 숨는다(우리 body 는 투명, 확인함 2026-08-27).
   ⚠ 터치 기기(hover 없음)와 「모션 줄이기」에서는 만들지 않는다. */
(function () {
  'use strict';
  function init() {
    if (!window.matchMedia) return;
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var el = document.createElement('div');
    el.className = 'mouse-glow';
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText =
      'position:fixed;top:0;left:0;width:130px;height:130px;border-radius:50%;' +
      'z-index:-1;pointer-events:none;opacity:.35;filter:blur(2px);' +
      'background:radial-gradient(ellipse at center, rgba(232,56,23,1) 0%,' +
      'rgba(232,56,23,.74) 27%, rgba(232,56,23,.37) 52%, rgba(232,56,23,0) 78%);' +
      'transform:translate(-200px,-200px);will-change:transform;';
    document.body.appendChild(el);

    /* 원본은 TweenMax 2s Expo.easeOut — 여기서는 rAF lerp 로 같은 «느긋한 추적»을 낸다.
       계수 .05 가 체감상 그 감속과 가장 가깝다(서브에는 gsap 이 없다). */
    var tx = -200, ty = -200, x = tx, y = ty, raf = null;
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    function step() {
      x += (tx - x) * .05;
      y += (ty - y) * .05;
      el.style.transform = 'translate(' + (x - 65) + 'px,' + (y - 65) + 'px)';
      if (Math.abs(tx - x) > .3 || Math.abs(ty - y) > .3) {
        raf = requestAnimationFrame(step);
      } else {
        raf = null;
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
