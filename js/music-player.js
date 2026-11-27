/* music-player.js —— 「🎵 音乐」App 的手动接管层（不修改 music.js 本体一个字）
 *
 * 手机里的音乐软件可以点曲库里任意一首，接管游戏当前的自动配乐：
 *   - 接管期间进店 / 坐地铁 / 昼夜天气变化都不会打断这首歌
 *   - 点「关掉音乐」「恢复游戏配乐」或全局静音，立刻回到原本按场景自动播放的曲子
 *   - 续播增强（music-resume.js）照常生效：每首歌的进度都记得，切回来接着听
 */
(function () {
  const PC = window.PC = window.PC || {};
  const M = PC.Music;
  if (!M || M._playerPatched) return;
  M._playerPatched = true;

  let manual = null;                 // { key, src }｜null = 游戏自动配乐

  function desired() {
    try {
      const scene = (PC.Main && PC.Main.scene && PC.Main.scene.id) || 'street';
      return { sceneId: scene, night: PC.State.isNight(), weatherId: PC.State.weather().id };
    } catch (e) { return { sceneId: 'street', night: false, weatherId: 'clear' }; }
  }

  const origUpdate = M.update;
  M.update = function (sceneId, night, weatherId) {
    // 无论是否手动，都记住「此刻游戏本来该放什么」，恢复时才能一秒接上
    this._desired = { sceneId, night, weatherId };
    if (manual) return;              // 手动接管：场景自动切换全部让路
    return origUpdate.call(this, sceneId, night, weatherId);
  };

  const origSetEnabled = M.setEnabled;
  M.setEnabled = function (on) {
    if (!on && manual) {
      // 全局「关掉音乐」= 结束手动接管，下次打开回到游戏自动配乐
      manual = null;
      const d = this._desired || desired();
      const key = this.resolve(d.sceneId, d.night, d.weatherId);
      this.currentKey = key;
      this.currentSrc = this.srcFor(key);
    }
    return origSetEnabled.call(this, on);
  };

  /* 手动点播某一槽位；空槽位返回提示，不打断当前播放 */
  M.request = function (key) {
    const src = this.srcFor(key);
    if (!src) return { ok: false, msg: '这个槽位还没配乐，在下面粘个链接就能听' };
    if (!this.audio) this.init();
    if (!this.enabled) {
      // 此时还没进入手动模式，setEnabled(true) 不会把它清掉
      origSetEnabled.call(this, true);
    }
    manual = { key, src };
    this.currentKey = key;
    this.currentSrc = src;
    this._apply(src);
    const s = this.slot(key);
    return { ok: true, msg: '♪ 正在播放「' + (s ? s.name : key) + '」' };
  };

  /* 关掉音乐 / 恢复原本按场景自动播放的曲子 */
  M.release = function () {
    if (!manual) return { ok: false, msg: '现在本来就是游戏自动配乐' };
    manual = null;
    const d = this._desired || desired();
    this.currentKey = null;
    this.currentSrc = null;
    origUpdate.call(this, d.sceneId, d.night, d.weatherId);
    const s = this.slot(this.currentKey);
    return { ok: true, msg: '⏹ 已关掉，恢复游戏配乐' + (s ? '：' + s.name : '') };
  };

  M.isManual = function () { return !!manual; };
  M.manualKey = function () { return manual ? manual.key : null; };

  /* 上一首 / 下一首：只在「已经配了音源」的曲库里循环 */
  M.step = function (dir) {
    const list = this.slots.filter(s => this.srcFor(s.key));
    if (!list.length) return { ok: false, msg: '曲库还是空的，先在配乐区或下面填个链接' };
    const cur = manual ? manual.key : this.currentKey;
    let i = list.findIndex(s => s.key === cur);
    if (i < 0) i = dir > 0 ? -1 : 0;
    const next = list[(i + (dir > 0 ? 1 : -1) + list.length) % list.length];
    return this.request(next.key);
  };

  M.nowPlaying = function () {
    const key = manual ? manual.key : this.currentKey;
    const s = key ? this.slot(key) : null;
    const a = this.audio;
    return {
      key, name: s ? s.name : '—', group: s ? s.group : '',
      hint: s ? s.hint : '', manual: !!manual, src: this.currentSrc || '',
      enabled: this.enabled, volume: this.volume,
      playing: !!(this.enabled && this.currentSrc && a && !a.paused),
      time: a && isFinite(a.currentTime) ? a.currentTime : 0,
      duration: a && isFinite(a.duration) ? a.duration : 0
    };
  };
})();
