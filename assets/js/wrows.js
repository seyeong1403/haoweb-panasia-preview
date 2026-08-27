/* 업종별 행 마퀴 — 얹으면 검은 띠가 커서 들어온 방향에서 올라오고, 그 안에서 영문과
   원형 사진이 흐른다. 기존 하오웹 site.js 의 initBizRows() 를 옮긴 것이다.

 ⚠ 2026-08-27 세영: 「메인의 이 섹션 디자인을 서브에도」. 그런데 이 코드는 main.js 에만
   있었고 서브는 sub.js 를 읽는다 — 마크업만 옮기면 **띠가 영영 올라오지 않는다**.
   그래서 nav.js·anim.js 처럼 **한 벌만 두고 양쪽에서 부른다**. 사양을 고칠 일이 생겨도
   여기 한 곳만 고치면 된다. */
(function () {
  'use strict';

function initBizRows() {
  var rows = Array.prototype.slice.call(document.querySelectorAll('[data-wrow]'));
  if (!rows.length) return;
  var EASE = 'transform .6s cubic-bezier(.16,1,.3,1)';

  var dirOf = function (ev, el) {
    var r = el.getBoundingClientRect();
    var mx = ev.clientX - r.left, my = ev.clientY - r.top;
    var top = Math.pow(mx - r.width / 2, 2) + Math.pow(my, 2);
    var bot = Math.pow(mx - r.width / 2, 2) + Math.pow(my - r.height, 2);
    return top < bot ? 'top' : 'bottom';
  };

  rows.forEach(function (row) {
    var mq = row.querySelector('.wrow__mq');
    // ⚠ 세로 이동은 .wrow__shift 가 맡는다. .wrow__track 은 CSS 애니메이션이 가로 흐름에
    //   쓰고 있어서, 여기에 translateY 를 쓰면 흐름이 통째로 멈춘다(transform 은 한 속성).
    var shift = row.querySelector('.wrow__shift');
    var track = row.querySelector('.wrow__track');
    if (!mq || !shift || !track) return;

    // 파트를 화면 폭이 채워질 만큼 복제한다(원본과 같은 식). 최소 4개.
    var part = track.querySelector('.wrow__part');
    var fill = function () {
      if (!part) return;
      var pw = part.offsetWidth;
      if (!pw) return;
      var need = Math.max(4, Math.ceil(window.innerWidth / pw) + 2);
      while (track.children.length < need) track.appendChild(part.cloneNode(true));
      track.style.setProperty('--parts', track.children.length);
      track.classList.add('wrow__track--run');
    };
    fill();
    window.addEventListener('resize', fill);

    row.addEventListener('mouseenter', function (ev) {
      var d = dirOf(ev, row), a = d === 'top' ? '-101%' : '101%', b = d === 'top' ? '101%' : '-101%';
      mq.style.transition = shift.style.transition = 'none';
      mq.style.transform = 'translateY(' + a + ')';
      shift.style.transform = 'translateY(' + b + ')';
      // 값을 세팅한 프레임과 같은 프레임에서 0 으로 보내면 전환이 생략된다 → 다음 프레임에
      requestAnimationFrame(function () {
        mq.style.transition = shift.style.transition = EASE;
        mq.style.transform = shift.style.transform = 'translateY(0%)';
      });
    });

    row.addEventListener('mouseleave', function (ev) {
      var d = dirOf(ev, row);
      mq.style.transition = shift.style.transition = EASE;
      mq.style.transform = 'translateY(' + (d === 'top' ? '-101%' : '101%') + ')';
      shift.style.transform = 'translateY(' + (d === 'top' ? '101%' : '-101%') + ')';
    });
  });
}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBizRows);
  } else {
    initBizRows();
  }
})();
