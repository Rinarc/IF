/* orientation.js —— 横屏提示
 * 竖屏时浮一张小卡：建议旋转手机；可「切换横屏」（PWA/全屏下尝试 screen.orientation.lock）
 * 或「继续竖屏」。不阻断游戏：提示卡只盖右上角一小块，竖屏照样能玩。
 * 点「继续竖屏」后本次浏览会话不再弹；转成横屏自动收起。
 */
(function () {
  const PC = window.PC = window.PC || {};
  const $ = id => document.getElementById(id);
  const KEY = 'infinite-lives-landscape-dismissed';

  function boot() {
    const tip = $('landscapeTip');
    if (!tip) return;
    let dismissed = false;
    try { dismissed = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

    const portrait = () => window.innerHeight > window.innerWidth &&
      matchMedia('(orientation: portrait)').matches;

    function sync() {
      const show = portrait() && !dismissed && !tip.classList.contains('lt-force-hide');
      tip.classList.toggle('hidden', !show);
    }

    $('ltStay').addEventListener('click', e => {
      e.stopPropagation();
      dismissed = true;
      try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
      sync();
    });

    $('ltRotate').addEventListener('click', async e => {
      e.stopPropagation();
      let ok = false;
      try {
        const so = screen.orientation;
        if (so && so.lock) {
          // 需要用户手势；部分浏览器要求先进入全屏
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            try { await document.documentElement.requestFullscreen(); } catch (err) {}
          }
          await so.lock('landscape');
          ok = true;
        }
      } catch (err) { ok = false; }
      if (!ok) {
        const el = tip.querySelector('.lt-body span');
        if (el) el.textContent = '浏览器没允许自动旋转，请手动把手机横过来';
        setTimeout(() => { if (el) el.textContent = '旋转手机，能看到完整的街区与球场视野'; }, 2600);
      } else {
        dismissed = true; sync();
      }
    });

    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', () => setTimeout(sync, 220));
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', sync);
    sync();

    PC.Orientation = {
      sync,
      get visible() { return !tip.classList.contains('hidden'); },
      show() { dismissed = false; tip.classList.remove('lt-force-hide'); sync(); },
      hide() { tip.classList.add('hidden'); },
      dismiss() { dismissed = true; sync(); }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
