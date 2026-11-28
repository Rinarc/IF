/* pwa.js —— 让游戏能「保存在桌面上」
 * 只做三件事：注册 Service Worker、接住浏览器安装提示、留好可调接口。
 * 不改动游戏本身逻辑；file:// 直接双击打开时静默跳过（照常离线可玩，只是不能安装）。
 */
(function () {
  const PC = window.PC = window.PC || {};
  const $ = id => document.getElementById(id);

  let deferred = null;
  let registration = null;
  let btn = null;

  const canRegister = 'serviceWorker' in navigator &&
    (location.protocol === 'https:' ||
      ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) >= 0);

  function showInstallButton(show) {
    if (!btn) return;
    btn.classList.toggle('hidden', !show);
  }

  function buildButton() {
    const foot = document.querySelector('#help .title-foot');
    if (!foot || $('btnInstall')) return;
    btn = document.createElement('button');
    btn.id = 'btnInstall';
    btn.className = 'install-btn hidden';
    btn.type = 'button';
    btn.textContent = '⬇ 安装到桌面 / 主屏幕';
    btn.title = '把无限極人生装成独立 App，离线也能玩';
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!deferred) return;
      deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice && choice.outcome === 'accepted') showInstallButton(false);
      deferred = null;
    });
    foot.appendChild(btn);
  }

  /* 浏览器判定「可安装」才会触发；iOS Safari 没有这个事件，用分享菜单添加 */
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    buildButton();
    showInstallButton(true);
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    showInstallButton(false);
  });

  async function register() {
    if (!canRegister) return null;                    // file:// 或不支持：静默跳过
    try {
      registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      registration.addEventListener('updatefound', () => {
        const nw = registration.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            PC.PWA && (PC.PWA.hasUpdate = true);
          }
        });
      });
    } catch (err) {
      registration = null;                          // 不影响游戏本体
    }
    return registration;
  }

  /* 暴露给控制台 / 以后自己调整用 */
  PC.PWA = {
    hasUpdate: false,
    get registration() { return registration; },
    get canInstall() { return !!deferred; },
    get installable() { return canRegister; },
    async install() {
      if (!deferred) return '当前浏览器没给安装提示（iOS 请用分享菜单「添加到主屏幕」）';
      deferred.prompt();
      const c = await deferred.userChoice;
      if (c && c.outcome === 'accepted') showInstallButton(false);
      deferred = null;
      return c && c.outcome;
    },
    async update() {
      if (!registration) return '没有 Service Worker（可能正用 file:// 打开）';
      await registration.update();
      const w = registration.waiting;
      if (w) w.postMessage('SKIP_WAITING');
      return '已检查更新；改过 sw.js 顶部 VERSION 的话刷新一次即可生效';
    },
    showButton: () => { buildButton(); showInstallButton(true); },
    hideButton: () => showInstallButton(false)
  };

  function boot() {
    buildButton();          // 先放一个隐藏按钮，浏览器判定可安装时再显示
    register();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
