/* 공용 마퀴 엔진 — 앞뒤 한 벌 복제 + rAF. (2026-08-27 main.js 에서 분리)
   ⚠ 메인(main.js)과 서브(anim.js)가 «같은 엔진»을 쓰게 하려고 뺐다 — 한쪽에 복사해 두면
     속도 조정이 반쪽만 적용되는 사고가 이미 있었다. 이 파일이 유일한 원본이다. */
(function () {
  'use strict';

/* ---------- 공용 마퀴 ----------
   끊김 없이 한 방향으로 흐르는 카드 줄. 앞뒤로 한 벌씩 복제해 두고 rAF 로 매 프레임
   조금씩 민다.
 ⚠⚠ Swiper 의 autoplay(delay 0 + 긴 speed)로는 이 모양이 안 나온다. 실측해 보니
   `animating` 이 true 로 굳어 `slideNext()` 를 손으로 불러도 1px 도 움직이지 않았다
   (2026-08-27). 「멈춰 있다가 탭을 누르면 그제야 움직인다」가 그 증상이었다.
   그래서 이 슬라이더는 Swiper 로 돌리지 않는다 — 배치(flex)와 카드 폭은 CSS 가 이미
   쥐고 있어서 Swiper 없이도 그대로 선다. */
window.HAO_makeMarquee = function(view, track, opts) {
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

})();
