/* music.js —— 场景配乐区（默认全部留空，随时填文件 / 链接）
 *
 * 怎么用：
 *   1) 把 mp3 / ogg / wav 放进项目里的 music/ 目录，src 填 'music/school.mp3'
 *   2) 或直接把 src 填成完整 URL：'https://example.com/arcade.mp3'
 *   3) 也可以在游戏里按 N 打开「🎵 配乐」面板，粘贴链接即时生效（自动存本机）
 *   4) src 留空 = 该场景静默，不报错、不打断游戏
 *
 * 切换规则：
 *   street → street.day / street.night（雨天优先 street.rain，若已配置）
 *   campus / metro / park → 各自槽位
 *   shop:店铺ID → 先用该店专属槽位，没配则回落到 shop.default
 *   进店、出店、昼夜交替、天气变化都会自动淡出淡入切换
 */
(function () {
  const PC = window.PC = window.PC || {};
  const STORE = 'pixel-city-music-v1';

  /* ============ 配乐槽位表：只改 src 即可 ============ */
  const SLOTS = [
    { key: 'street.day',   name: '曙光路 · 白天',   group: '街区', src: 'music/street_day.mp3', hint: '晴天的中心街' },
    { key: 'street.night', name: '曙光路 · 夜晚',   group: '街区', src: 'music/street_night.mp3', hint: '19:00–06:00 自动切换' },
    { key: 'street.rain',  name: '曙光路 · 雨天',   group: '街区', src: 'music/street_rain.mp3', hint: '可选；留空则沿用白天/夜晚' },
    { key: 'campus',       name: '渊迂市汾阳中学',  group: '场景', src: 'music/fenyang_school.mp3', hint: '进校园自动播放' },
    { key: 'metro',        name: '曙光路站 · 地下街', group: '场景', src: 'music/metro.mp3', hint: '地铁与站台' },
    { key: 'park',         name: '林景园',          group: '场景', src: '', hint: '公园' },
    { key: 'shop.default', name: '店铺 · 通用',     group: '店铺', src: '', hint: '未单独配乐的店都用它' }
  ];
  // 每家店自动生成独立槽位（电玩店、咖啡店、学校文具店都可单独放歌）
  Object.keys(PC.SHOP_BY_ID || {}).forEach(id => {
    const sp = PC.SHOP_BY_ID[id];
    if (!sp || sp.type === 'school' || id === 'metro' || id === 'school') return;
    SLOTS.push({ key: 'shop:' + id, name: sp.name, group: '店铺', src: '', hint: '店内专属' });
  });

  const M = PC.Music = {
    slots: SLOTS,
    overrides: {},          // 游戏内填写的链接，存 localStorage
    enabled: true,
    volume: .55,
    audio: null,
    currentKey: null,
    currentSrc: null,
    _fade: null,

    init() {
      try {
        const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
        if (raw && typeof raw === 'object') {
          this.overrides = raw.src || {};
          if (typeof raw.enabled === 'boolean') this.enabled = raw.enabled;
          if (typeof raw.volume === 'number') this.volume = raw.volume;
        }
      } catch (e) { this.overrides = {}; }
      if (!this.audio) {
        const a = new Audio();
        a.loop = true; a.preload = 'auto'; a.volume = 0;
        a.addEventListener('error', () => { /* 文件/链接失效时静默，不影响游戏 */ });
        this.audio = a;
      }
      return this;
    },
    persist() {
      try {
        localStorage.setItem(STORE, JSON.stringify({
          src: this.overrides, enabled: this.enabled, volume: this.volume
        }));
      } catch (e) { }
    },
    /* 用户首次点击「进入游戏」后调用，满足浏览器自动播放策略 */
    unlock() {
      if (!this.audio) this.init();
      try { this.audio.load(); } catch (e) { }
    },
    slot(key) { return this.slots.find(s => s.key === key); },
    srcFor(key) {
      if (Object.prototype.hasOwnProperty.call(this.overrides, key)) return this.overrides[key] || '';
      const s = this.slot(key);
      return s ? (s.src || '') : '';
    },
    setSrc(key, src) {
      this.overrides[key] = String(src || '').trim();
      this.persist();
      // 正在播放这个槽位就立刻换歌
      if (this.currentKey === key) this._apply(this.srcFor(key));
    },
    clearSrc(key) {
      delete this.overrides[key];
      this.persist();
      if (this.currentKey === key) this._apply('');
    },
    setEnabled(on) {
      this.enabled = !!on;
      this.persist();
      if (!this.audio) this.init();
      if (!this.enabled) {
        clearInterval(this._fade);
        this.audio.volume = 0; this.audio.pause();
      } else if (this.currentSrc) this._apply(this.currentSrc);
    },
    setVolume(v) {
      this.volume = Math.max(0, Math.min(1, Number(v) || 0));
      this.persist();
      if (this.enabled && this.audio && !this.audio.paused) this.audio.volume = this.volume;
    },
    /* 根据场景 / 昼夜 / 天气决定用哪个槽位 */
    resolve(sceneId, night, weatherId) {
      if (sceneId === 'street') {
        if (weatherId === 'rain' && this.srcFor('street.rain')) return 'street.rain';
        return night ? 'street.night' : 'street.day';
      }
      if (sceneId === 'campus' || sceneId === 'metro' || sceneId === 'park') return sceneId;
      if (sceneId.indexOf('shop:') === 0 && this.srcFor(sceneId)) return sceneId;
      if (sceneId.indexOf('shop:') === 0 || sceneId.indexOf('interior:') === 0) return 'shop.default';
      return 'street.day';
    },
    /* 由 main.js 在进/出场景、昼夜与天气变化时调用 */
    update(sceneId, night, weatherId) {
      if (!this.audio) this.init();
      const key = this.resolve(sceneId, night, weatherId);
      const src = this.srcFor(key);
      if (key === this.currentKey && src === this.currentSrc) return;
      this.currentKey = key; this.currentSrc = src;
      this._apply(src);
    },
    /* 淡出 → 换源 → 淡入；所有失败都静默 */
    _apply(src) {
      const a = this.audio;
      if (!a) return;
      clearInterval(this._fade);
      let v = a.volume;
      const step = () => {
        v -= .08;
        if (v > 0 && this.enabled) { a.volume = v; return; }
        clearInterval(this._fade);
        a.volume = 0;
        if (!src || !this.enabled) { try { a.pause(); } catch (e) { } return; }
        try {
          a.src = src; a.loop = true; a.volume = 0;
          const p = a.play();
          if (p && p.catch) p.catch(() => { });
        } catch (e) { return; }
        let u = 0;
        this._fade = setInterval(() => {
          u += .05;
          if (u >= this.volume) { a.volume = this.volume; clearInterval(this._fade); }
          else a.volume = u;
        }, 60);
      };
      this._fade = setInterval(step, 40);
    },
    /* 控制台/面板试听某条链接，不写入配置 */
    preview(src) {
      if (!src) return;
      this.init();
      const a = this.audio;
      clearInterval(this._fade);
      try {
        a.src = src; a.loop = true; a.volume = this.volume;
        const p = a.play(); if (p && p.catch) p.catch(() => { });
      } catch (e) { }
    },
    status() {
      const s = this.currentKey ? this.slot(this.currentKey) : null;
      return {
        key: this.currentKey, name: s ? s.name : '—',
        playing: !!(this.enabled && this.currentSrc && this.audio && !this.audio.paused),
        configured: this.slots.filter(x => this.srcFor(x.key)).length,
        total: this.slots.length
      };
    }
  };

  M.init();
  PC.MUSIC = SLOTS;   // 便于控制台查看 / 批量替换
})();
