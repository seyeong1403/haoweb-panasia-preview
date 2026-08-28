/* ============================================================
   서브페이지 공통 스크립트 — 헤더/메뉴/CTA(메인과 동일 동작) +
   서브 위젯(viz 탭·보기 전환·리빌 와이프). FAQ는 네이티브 details.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };

  /* ---------- 헤더: 서브는 최상단에서 white(어두운 비주얼 위) ---------- */
  /* ⚠⚠ 2026-08-27 — 헤더가 기존 하오웹 것(`nav.nav`)으로 바뀌어 `#header` 가 없다.
     아래 `applyHeaderClass()` 는 로드 즉시 실행되므로 null 이면 여기서 예외가 나고
     **이 파일의 나머지(탭·아코디언·타임라인·AOS 초기화)가 통째로 중단된다.**
     화면은 멀쩡해 보여서 알아채기 어렵다 — 메인에서 흰 화면으로 드러났다. */
  var header = $('#header') || document.createElement('div');
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
      $('.allMenuWrap') && $('.allMenuWrap').classList.toggle('active');
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


/* ── 포트폴리오 라이트박스 — 기존 하오웹 site.js 원문 이식 (2026-08-27 세영:
   「기존 하오웹에 누르면 크게 보이는 게 있었어」).
   바꾼 것 한 줄뿐: 마퀴 복제 카드([data-clone])를 목록에서 뺀다 — 안 빼면 이전/다음이
   같은 작업을 두 번씩 돈다. */
(function () {
  'use strict';
/* 포트폴리오 라이트박스 — 카드를 누르면 크게 보이고 오른쪽에 설명이 붙는다.
   ⚠ 이동은 '지금 보이는 카드' 안에서만 한다. 필터를 걸어 놓고 다음으로 넘겼을 때
      숨긴 항목이 튀어나오면 필터가 걸린 것처럼 보이지 않는다. */
function initLightbox() {
  var grid = document.querySelector('[data-lbox]');
  if (!grid) return;

  var lb = null, imgEl, catEl, titleEl, descEl, rowsEl;
  var list = [], idx = -1, opener = null;

  /* ⚠ 처음부터 DOM 에 넣어 두지 않는다. 빈 `src` 인 <img> 가 검수에서 깨진 이미지로 잡히고,
     모바일에서 문서 폭도 밀었다(2026-08-15 실제로 QA 가 잡아냈다). 열 때 한 번만 만든다. */
  function build() {
  lb = document.createElement('div');
  lb.className = 'lbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML =
    '<div class="lbox__wrap">' +
      '<div class="lbox__figure"><img class="lbox__img" src="" alt=""></div>' +
      '<div class="lbox__info">' +
        '<span class="lbox__cat"></span>' +
        '<h3 class="lbox__title"></h3>' +
        '<p class="lbox__desc"></p>' +
        '<p class="lbox__label">PROJECT INFO</p>' +
        '<div class="lbox__rows"></div>' +
      '</div>' +
    '</div>' +
    '<button type="button" class="lbox__close" aria-label="닫기">&times;</button>' +
    '<button type="button" class="lbox__btn lbox__btn--prev" aria-label="이전 작업">&#8249;</button>' +
    '<button type="button" class="lbox__btn lbox__btn--next" aria-label="다음 작업">&#8250;</button>';
  document.body.appendChild(lb);

  imgEl = lb.querySelector('.lbox__img');
  catEl = lb.querySelector('.lbox__cat');
  titleEl = lb.querySelector('.lbox__title');
  descEl = lb.querySelector('.lbox__desc');
  rowsEl = lb.querySelector('.lbox__rows');

  lb.querySelector('.lbox__close').addEventListener('click', close);
  lb.querySelector('.lbox__btn--prev').addEventListener('click', function () { show(idx - 1); });
  lb.querySelector('.lbox__btn--next').addEventListener('click', function () { show(idx + 1); });
  // 배경(어두운 여백)을 눌러도 닫힌다. 이미지·설명 위 클릭은 통과시키지 않는다.
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lbox__wrap') ||
        e.target.classList.contains('lbox__figure')) close();
  });
  }

  /* 이동 범위 = **그 카드가 놓인 레일 하나**. 분류별로 레일이 나뉘어 있으므로
     다음/이전은 같은 분류 안에서만 돈다(2026-08-16 가로 레일로 바꾸며 정리).
     레일이 없는 구조(예전 그리드)에서는 섹션 전체가 범위가 된다. */
  function shown(card) {
    var scope = (card && card.closest) ? (card.closest('[data-rail]') || grid) : grid;
    return [].slice.call(scope.querySelectorAll('.dwork__item')).filter(function (c) {
      return !c.hidden && !c.hasAttribute('data-clone');
    });
  }

  function row(label, value) {
    return value ? '<div><b>' + label + '</b><span>' + value + '</span></div>' : '';
  }

  function show(i) {
    if (!list.length) return;
    idx = (i % list.length + list.length) % list.length;
    var c = list[idx];
    var img = c.querySelector('img');
    imgEl.src = c.getAttribute('data-large') || img.getAttribute('src');
    imgEl.alt = img.getAttribute('alt') || '';
    catEl.textContent = (c.querySelector('.dwork__c') || {}).textContent || '';
    titleEl.textContent = (c.querySelector('.dwork__t') || {}).textContent || '';
    descEl.textContent = c.getAttribute('data-desc') || '';
    rowsEl.innerHTML =
      row('제작물', c.getAttribute('data-deliver')) +
      row('작업 범위', c.getAttribute('data-scope')) +
      row('진행', '하오웹에서 직접 제작') +
      '<div><b>문의</b><span><a href="inquiry.html">제작 문의하기 &rarr;</a></span></div>';
    lb.querySelector('.lbox__info').scrollTop = 0;
  }

  function open(card) {
    if (!lb) build();
    list = shown(card);
    var i = list.indexOf(card);
    if (i < 0) return;
    opener = card;
    lb.classList.add('is-open');
    document.body.classList.add('lbox-open');
    show(i);
    lb.querySelector('.lbox__close').focus();
  }

  function close() {
    if (!lb) return;
    lb.classList.remove('is-open');
    document.body.classList.remove('lbox-open');
    if (opener) opener.focus();
    opener = null;
  }

  grid.addEventListener('click', function (e) {
    var card = e.target.closest ? e.target.closest('.dwork__item') : null;
    if (card) open(card);
  });
  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
  } else {
    initLightbox();
  }
})();

/* ============================================================
   폰 목업 타이핑 모션(2026-08-28 세영: 「메인 AEO·SEO·GEO 폰 목업을
   다른 서브페이지 목업에 적용 — 텍스트가 써지는 모션이 안 들어가 있어」)
   — 마크업 무수정: 기존 텍스트를 저장해 두었다가 화면에 들어오는 순간
   비우고 다시 타이핑한다(main.js initCon3Mocks 와 같은 문법·속도).
   ⚠ 숨김·비우기를 「관찰 등록 때」 하면 헤드리스/숨김 탭(IntersectionObserver
   미발동)에서 빈 폰이 찍힌다 — 반드시 발동 직전에만 한다. 미발동이면 원문 그대로.
   ============================================================ */
(function () {
  'use strict';
  var phones = [].slice.call(document.querySelectorAll('.svis__phone'));
  if (!phones.length) return;
  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  function textNodes(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var out = [], n;
    while ((n = w.nextNode())) if (n.nodeValue.trim()) out.push(n);
    return out;
  }

  function play(phone) {
    var timers = [];
    function T(fn, ms) { timers.push(setTimeout(fn, ms)); }
    var caret = document.createElement('i');
    caret.className = 'svis-caret';

    /* holder 의 텍스트 노드들을 이어서 타이핑 — 캐럿은 holder 끝(검색 필은 마이크 앞) */
    function type(holder, nodes, speed, done) {
      var mic = holder.querySelector('.svis__pill i, i.svis__pill');
      if (holder.classList.contains('svis__pill') && holder.lastElementChild &&
          holder.lastElementChild.tagName === 'I') {
        holder.insertBefore(caret, holder.lastElementChild);
      } else holder.appendChild(caret);
      holder.classList.add('typing-live');
      var si = 0;
      (function next() {
        if (si >= nodes.length) {
          holder.classList.remove('typing-live');
          if (caret.parentNode) caret.parentNode.removeChild(caret);
          done && done(); return;
        }
        var node = nodes[si], full = node.__svisFull, i = 0;
        (function tick() {
          if (i <= full.length) { node.nodeValue = full.slice(0, i); i++; T(tick, speed); }
          else { si++; next(); }
        })();
      })();
    }

    var pill = phone.querySelector('.svis__pill');
    var pbody = phone.querySelector('.svis__pbody');
    var pchat = phone.querySelector('.svis__pchat');

    if (pill && pbody) {
      /* 검색형: 검색어 타이핑 → 결과 블록 순차 등장(스니펫 안 답변은 이어서 타이핑) */
      var steps = [].slice.call(pbody.children).filter(function (e) { return e !== pill; });
      var pillNodes = textNodes(pill).filter(function (n) { return !n.parentNode.closest('i'); });
      pillNodes.forEach(function (n) { n.__svisFull = n.nodeValue; n.nodeValue = ''; });
      steps.forEach(function (e) { e.classList.add('svis-step'); });
      requestAnimationFrame(function () {
        T(function () {
          type(pill, pillNodes, 65, function () {
            var delay = 160;
            (function run(i) {
              if (i >= steps.length) return;
              var e = steps[i];
              T(function () {
                e.classList.add('in');
                var snip = e.classList.contains('svis__snip') ? e :
                           e.querySelector && e.querySelector('.svis__snip');
                if (snip) {
                  var a = snip.querySelector('.svis__snip-a');
                  var ns = a ? textNodes(a) : [];
                  ns.forEach(function (n) { n.__svisFull = n.nodeValue; n.nodeValue = ''; });
                  T(function () { type(a, ns, 22, function () { run(i + 1); }); }, 200);
                } else run(i + 1);
              }, delay);
              delay = 240;
            })(0);
          });
        }, 350);
      });
    } else if (pchat) {
      /* 채팅형: 내 말풍선 → AI 답변 타이핑 → 다음 말풍선 … 순차 */
      var items = [].slice.call(pchat.children);
      items.forEach(function (e) { e.classList.add('svis-step'); });
      var ansN = [];
      items.forEach(function (e) {
        if (e.classList.contains('svis__ai')) {
          var ans = e.querySelector('.svis__ans');
          var ns = ans ? textNodes(ans) : [];
          ns.forEach(function (n) { n.__svisFull = n.nodeValue; n.nodeValue = ''; });
          ansN.push({ ans: ans, nodes: ns });
        } else ansN.push(null);
      });
      requestAnimationFrame(function () {
        (function run(i) {
          if (i >= items.length) return;
          var e = items[i];
          T(function () {
            e.classList.add('in');
            if (ansN[i] && ansN[i].ans) {
              T(function () { type(ansN[i].ans, ansN[i].nodes, 22, function () { run(i + 1); }); }, 250);
            } else T(function () { run(i + 1); }, 420);
          }, i === 0 ? 350 : 300);
        })(0);
      });
    }
  }

  var seen = new WeakSet();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting || seen.has(en.target)) return;
      seen.add(en.target);
      io.unobserve(en.target);
      play(en.target);
    });
  }, { threshold: 0.45 });
  phones.forEach(function (p) { io.observe(p); });
})();

/* ============================================================
   FAQ(2026-08-28 세영 지시 2건, 16개 페이지 일괄)
   ① 「호버하면 물음에 대한 대답이 보이게」 — hover 매체에서 details 를
     마우스 진입 시 열고 떠나면 닫는다(터치는 기존 클릭 그대로).
   ② 「버튼이 활성화 안 되어 있음」 — faq.html 분류 칩이 마크업만 있고
     필터 JS 가 없었다. data-cat 매칭으로 표시/숨김.
   ============================================================ */
(function () {
  'use strict';
  var items = [].slice.call(document.querySelectorAll('details.faq__item'));
  if (!items.length) return;

  /* ① 호버 오픈 — 답을 읽는 동안(항목 전체 위) 열림 유지, 벗어나면 닫힘 */
  if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    items.forEach(function (d) {
      d.addEventListener('mouseenter', function () { d.open = true; });
      d.addEventListener('mouseleave', function () { d.open = false; });
    });
  }

  /* ② 분류 칩 필터 */
  var chips = [].slice.call(document.querySelectorAll('button.chip[data-cat]'));
  if (!chips.length) return;
  chips.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.getAttribute('data-cat');
      chips.forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      items.forEach(function (d) {
        d.style.display =
          (cat === 'all' || d.getAttribute('data-cat') === cat) ? '' : 'none';
        d.open = false;
      });
    });
  });
})();
