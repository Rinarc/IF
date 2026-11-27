/* opening.js —— 开场视频（游戏工作室片头）
   规则：
   · 打开游戏先播 media/opening.mp4，这一层里只有视频，没有任何按钮 / 文字 / 提示
   · 点按屏幕任意位置、或按任意键，都能跳过
   · 视频播完 / 跳过 / 加载失败 → 视频淡出，同时游戏 title 渐显
   · 全程不显示静音开关，视频按原声播放
*/
(function () {
  const PC = window.PC = window.PC || {};
  const $ = id => document.getElementById(id);

  function boot() {
    const wrap = $('opening'), v = $('openingVideo'), app = $('app'), help = $('help');
    if (!wrap || !v || !app || !help) return;
    let done = false;

    function cleanup() {
      wrap.removeEventListener('pointerdown', onTap);
      document.removeEventListener('keydown', onKey, true);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('error', onError);
      try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {}
    }

    /* instant：视频文件缺失 / 无法播放时直接显示标题，不让游戏停在黑屏 */
    function finish(instant) {
      if (done) return;
      done = true;
      try { v.pause(); } catch (e) {}
      if (instant) {
        app.classList.add('instant');
        wrap.style.display = 'none';
        app.classList.remove('opening-active');
        requestAnimationFrame(() => app.classList.remove('instant'));
        cleanup();
      } else {
        wrap.classList.add('out');                 // 视频淡出
        app.classList.remove('opening-active');   // 同时标题渐显
        app.classList.add('opening-fade');        // 渐显期间不响应「开始游戏」
        setTimeout(() => {
          wrap.style.display = 'none';
          app.classList.remove('opening-fade');
          cleanup();
        }, 950);
      }
    }

    function onTap(e) { e.preventDefault(); finish(false); }
    function onKey(e) {
      if (done) return;
      // 捕获阶段拦掉，避免开场里按回车被 title.js 当成「开始游戏」
      e.preventDefault(); e.stopImmediatePropagation();
      finish(false);
    }
    function onEnded() { finish(false); }
    function onError() { finish(true); }

    wrap.addEventListener('pointerdown', onTap);
    document.addEventListener('keydown', onKey, true);
    v.addEventListener('ended', onEnded);
    v.addEventListener('error', onError);

    /* 自动播放；被浏览器策略拦下时静音重试一次，仍失败则直接进标题 */
    const tryPlay = () => {
      let p;
      try { p = v.play(); } catch (e) { p = Promise.reject(e); }
      if (p && typeof p.catch === 'function') p.catch(() => {
        v.muted = true;
        let p2;
        try { p2 = v.play(); } catch (e2) { finish(true); return; }
        if (p2 && typeof p2.catch === 'function') p2.catch(() => finish(true));
      });
    };
    tryPlay();
    setTimeout(() => { if (!done) finish(false); }, 30000);   // 异常卡住也不挡住游戏

    PC.Opening = { finish, wrap, video: v, get done() { return done; } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
