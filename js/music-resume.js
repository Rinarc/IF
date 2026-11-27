/* music-resume.js —— 场景配乐「续播」增强（不修改 music.js 本体）
 *
 * 用户提供的 js/music.js 一个字都不用改：这里只对 PC.Music._apply 做一层包装。
 * 原实现每次换场景都 a.src = src + a.play()，所以从店里 / 校园 / 地铁回到
 * 曙光路时，白天（或夜晚、雨天）那首歌会从头开始。
 *
 * 增强后：
 *   - 每首歌按 src 记录播放进度（currentTime），换场景前自动存档
 *   - 回到同一首歌时不重新赋值 src、不重新 play，只把音量淡回来 → 接着播
 *   - 切到别的歌再切回来，在 loadedmetadata 后把 currentTime 恢复到离开时的位置
 *   - 白天↔夜晚↔雨天、店铺通用、试听、静音开关都走同一套逻辑
 *   - 静音 / 空槽位 / 文件不存在时依旧静默，不报错
 */
(function () {
  const PC = window.PC = window.PC || {};
  const M = PC.Music;
  if (!M || M._resumePatched) return;
  M._resumePatched = true;

  const positions = Object.create(null);   // 绝对 URL → 上次播放秒数
  const abs = src => {
    try { return new URL(src, location.href).href; } catch (e) { return src; }
  };

  function remember(a) {
    const cur = a.currentSrc || a.src;
    if (cur && isFinite(a.currentTime) && a.currentTime > 0.08) {
      positions[cur] = a.currentTime;
    }
  }

  const origApply = M._apply;

  M._apply = function (src) {
    const a = this.audio || (this.init(), this.audio);
    if (!a) return origApply.call(this, src);

    remember(a);                              // 先记住上一首听到哪了
    const cur = a.currentSrc || a.src;
    const target = src ? abs(src) : '';

    /* 同一首歌：绝不重新赋值 src / 重新 play，只恢复音量，进度自然接着走 */
    if (target && cur === target) {
      clearInterval(this._fade);
      if (a.paused) {
        try { const p = a.play(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
      }
      let u = 0;
      const self = this;
      this._fade = setInterval(() => {
        u += .07;
        if (u >= self.volume || !self.enabled) {
          a.volume = self.enabled ? self.volume : 0;
          clearInterval(self._fade);
        } else a.volume = u;
      }, 45);
      return;
    }

    /* 换歌：交给原实现淡入淡出，再把新歌恢复到它上次离开时的位置 */
    origApply.call(this, src);
    const saved = target ? positions[target] : 0;
    if (saved > 0) {
      let done = false;
      const restore = () => {
        if (done) return;
        // 原实现是「淡出完才换 src」，期间可能触发别的事件，确认真的换到目标曲再恢复
        const nowSrc = a.currentSrc || a.src;
        if (nowSrc && nowSrc !== target) return;
        done = true;
        try {
          if (isFinite(a.duration) && saved < a.duration - .3) a.currentTime = saved;
          else if (!isFinite(a.duration)) a.currentTime = saved;
        } catch (e) { }
        try { a.removeEventListener('loadedmetadata', restore); } catch (e) { }
      };
      a.addEventListener('loadedmetadata', restore);
      if (a.readyState >= 1) setTimeout(restore, 0);   // 已缓存的曲目
    }
  };

  /* 试听会直接换源，也先记一下进度；静音时同样保留 currentTime */
  if (M.preview) {
    const origPreview = M.preview;
    M.preview = function (src) {
      if (this.audio) remember(this.audio);
      return origPreview.call(this, src);
    };
  }
  if (M.setEnabled) {
    const origEnabled = M.setEnabled;
    M.setEnabled = function (on) {
      if (this.audio) remember(this.audio);
      return origEnabled.call(this, on);
    };
  }

  /* 调试 / 以后想做「重新从头听」时用：PC.Music.forgetProgress() */
  M.forgetProgress = function (src) {
    if (src) delete positions[abs(src)];
    else for (const k in positions) delete positions[k];
  };
  M.progressOf = function (src) { return positions[abs(src)] || 0; };
})();
