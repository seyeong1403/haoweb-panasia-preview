/* 등장 모션 — 기존 하오웹 site.js 의 splitChars / splitLines / initReveal 을 그대로 옮겼다.
   (2026-08-27 세영: 「서브페이지에 모션 좀 넣어줘, 다양하게」)

   ⚠ 서브 마크업에는 `data-anim`·`data-anim="lines"`·`data-fade`·`data-anim-hero` 가
     **처음부터 붙어 있었다.** 파나시아에 이 코드와 CSS 가 없어 아무 일도 안 일어났을 뿐이다.
   ⚠ 히어로는 IntersectionObserver 에만 맡기면 안 된다 — rootMargin 이 화면 아래 12% 를
     관찰에서 빼기 때문에, 첫 화면 맨 아래 CTA 는 스크롤 전까지 나타나지 않는다.
     그래서 `data-anim-hero` 는 load 후 0.9s 로 따로 재생한다(원본 실측).
   ⚠ index 는 GSAP·AOS 로 이미 모션이 있다 — 이 파일은 **서브에서만** 부른다. */
(function () {
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- 텍스트 분해 ---------- */
  // 글자 단위 — 공백은 텍스트 노드로 보존해 "하오웹은" → "하오웹 은" 버그 방지
  function splitChars(el) {
    if (el.dataset.split === 'done') return;
    // <br> 는 줄바꿈으로 보존한다 (통째로 textContent 를 쓰면 사라짐)
    var chunks = el.innerHTML.split(/<br\s*\/?>/i);
    var frag = document.createDocumentFragment();
    chunks.forEach(function (chunk, ci) {
      var tmp = document.createElement('div');
      tmp.innerHTML = chunk;
      var text = tmp.textContent.replace(/\s+/g, ' ').trim();
      text.split(' ').forEach(function (word, wi, arr) {
        var w = document.createElement('span');
        w.style.display = 'inline-block';
        w.style.whiteSpace = 'nowrap';
        Array.prototype.forEach.call(word, function (ch) {
          var s = document.createElement('span');
          s.className = 'ta-char';
          s.textContent = ch;
          w.appendChild(s);
        });
        frag.appendChild(w);
        if (wi < arr.length - 1) frag.appendChild(document.createTextNode(' '));
      });
      if (ci < chunks.length - 1) frag.appendChild(document.createElement('br'));
    });
    el.textContent = '';
    el.appendChild(frag);
    el.dataset.split = 'done';

    var chars = el.querySelectorAll('.ta-char');
    chars.forEach(function (c, i) {
      // 랜덤 스태거(레퍼런스와 동일한 인상) — 순서 기반 + 소량 랜덤
      c.style.transitionDelay = (i * 0.016 + Math.random() * 0.09).toFixed(3) + 's';
    });
  }

  // 줄 단위 — 단어를 감싼 뒤 offsetTop으로 줄을 묶고 마스크 처리
  function splitLines(el) {
    if (el.dataset.splitBase === undefined) el.dataset.splitBase = el.textContent;
    var text = el.dataset.splitBase.replace(/\s+/g, ' ').trim();
    el.textContent = '';

    var probes = [];
    text.split(' ').forEach(function (word, wi, arr) {
      var w = document.createElement('span');
      w.style.display = 'inline-block';
      w.textContent = word;
      el.appendChild(w);
      probes.push(w);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });

    var lines = [];
    var top = null;
    probes.forEach(function (w) {
      var t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 3) { lines.push([]); top = t; }
      lines[lines.length - 1].push(w.textContent);
    });

    el.textContent = '';
    lines.forEach(function (words) {
      var mask = document.createElement('span');
      mask.className = 'ta-mask';
      var line = document.createElement('span');
      line.className = 'ta-line';
      line.textContent = words.join(' ');
      mask.appendChild(line);
      el.appendChild(mask);
    });
    el.querySelectorAll('.ta-line').forEach(function (l, i) {
      l.style.transitionDelay = (i * 0.055).toFixed(3) + 's';
    });
  }

  /* ---------- 등장 관찰 ---------- */
  function initReveal() {
    var animEls = Array.prototype.slice.call(document.querySelectorAll('[data-anim]'));
    var fadeEls = Array.prototype.slice.call(document.querySelectorAll('[data-fade]'));

    if (reduced) {
      animEls.concat(fadeEls).forEach(function (el) { el.dataset.played = 'true'; });
      return;
    }

    animEls.forEach(function (el) {
      if (el.dataset.anim === 'lines') splitLines(el); else splitChars(el);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var delay = parseFloat(el.dataset.delay || '0');
        setTimeout(function () { el.dataset.played = 'true'; }, delay * 1000);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

    animEls.concat(fadeEls).forEach(function (el) { io.observe(el); });

    // 히어로는 로드 직후 0.9s 뒤 (레퍼런스 실측). data-delay 가 있으면 그만큼 더 늦춘다.
    // ※ 히어로 요소를 IntersectionObserver 에만 맡기면 안 된다 —
    //   rootMargin 이 화면 하단 12% 를 관찰에서 빼기 때문에, 첫 화면 맨 아래에 있는
    //   CTA 는 threshold(0.15) 를 못 넘겨 스크롤하기 전까지 나타나지 않는다.
    window.addEventListener('load', function () {
      document.querySelectorAll('[data-anim-hero]').forEach(function (el) {
        var d = parseFloat(el.dataset.delay || '0');
        setTimeout(function () { el.dataset.played = 'true'; }, 900 + d * 1000);
      });
    });

    // 줄 분해는 폭이 바뀌면 다시 계산
    var t;
    var lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(function () {
        document.querySelectorAll('[data-anim="lines"]').forEach(function (el) {
          var was = el.dataset.played;
          splitLines(el);
          el.dataset.played = was || 'true';
        });
      }, 220);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();


/* ── 스크롤 하이라이트(.hl) — webpreme 실측 이식 (2026-08-27) ─────────────────
   레퍼런스는 GSAP ScrollTrigger(항목마다 start 'top 50%' / end 'bottom 45%')로
   active 를 옮긴다. 서브는 GSAP 를 싣지 않으므로 같은 규칙을 스크롤 좌표로 재현한다:
   화면 세로 50% 선을 «지나간 마지막 항목» 이 켜진다. 결과는 동일하다(배타 active).
 ⚠ .hl--armed 를 목록에 붙이고 나서야 흐림(.22)이 걸린다 — JS 가 죽으면 전부 또렷하게
   남아야 하기 때문(CSS 쪽 안전장치와 한 쌍). */
(function () {
  'use strict';
  function initHl() {
    var lists = [].slice.call(document.querySelectorAll('.hl'));
    if (!lists.length) return;
    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq && mq.matches) return;          /* 모션 줄이기 — 전부 켜진 채로 둔다 */
    lists.forEach(function (l) { l.classList.add('hl--armed'); });

    var ticking = false;
    function paint() {
      ticking = false;
      var line = window.innerHeight * .5;
      lists.forEach(function (list) {
        var items = [].slice.call(list.querySelectorAll('.step'));
        if (!items.length) return;
        var on = 0;
        for (var i = 0; i < items.length; i++) {
          if (items[i].getBoundingClientRect().top <= line) on = i;
        }
        items.forEach(function (el, i) { el.classList.toggle('is-hl', i === on); });
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHl);
  } else {
    initHl();
  }
})();


/* ── 포트폴리오 레일(.drail) 마퀴 — 2026-08-27 세영: 「이미지 크게 + 끊임없이 흐르게」.
   손 스크롤 레일을 마퀴로 바꾼다. 엔진은 marquee.js(공용) — hover 시 멈추고,
   카드 클릭(라이트박스)은 그대로 산다. */
(function () {
  'use strict';
  function initRails() {
    var make = window.HAO_makeMarquee;
    if (!make) return;
    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq && mq.matches) return;
    [].slice.call(document.querySelectorAll('.drail[data-rail]')).forEach(function (rail) {
      rail.style.overflow = 'hidden';
      /* ⚠⚠ view(멈춤 판정·IO 관찰)와 track(transform 이동)은 **다른 요소**여야 한다.
         rail 자신을 track 으로 쓰면 rail 이 통째로 -1만px 밀려 화면 밖 취급되고,
         IntersectionObserver 가 즉시 stop 을 불러 영영 안 흐른다(실측 [0,0]). */
      var track = document.createElement('div');
      track.className = 'drail__track';
      while (rail.firstChild) track.appendChild(rail.firstChild);
      rail.appendChild(track);
      var m = make(rail, track, { speed: 40 });
      if (!m) return;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) m.start(); else m.stop(); });
        }, { threshold: 0 }).observe(rail);
      } else m.start();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRails);
  } else {
    initRails();
  }
})();
