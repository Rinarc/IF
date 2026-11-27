/* utils.js —— 通用工具 / 音效 / 低分辨率绘制原语 */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U = {};

  U.clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a, b) => b === undefined ? Math.random() * (a === undefined ? 1 : a) : a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.chance = p => Math.random() < p;
  U.dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
  U.aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  U.pad2 = n => String(n).padStart(2, '0');
  U.money = n => '¥' + Math.round(n).toLocaleString('zh-CN');
  U.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  U.noise2 = (x, y, seed) => { const n = Math.sin(x * 127.1 + y * 311.7 + (seed || 0) * 74.7) * 43758.5453; return n - Math.floor(n); };
  U.escape = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---- WebAudio 合成音效（无外部资源） ---- */
  const A = PC.Audio = {
    ctx: null, enabled: true, lastStep: 0,
    init() {
      if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.enabled = false; } }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    beep(freq, dur, type, vol) {
      if (!this.enabled) return; this.init(); if (!this.ctx) return;
      const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol === undefined ? .035 : vol, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + (dur || .08));
      o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + (dur || .08) + .01);
    },
    /* 一串音，delay 为相对毫秒 */
    seq(notes) {
      notes.forEach(n => setTimeout(() => this.beep(n[0], n[1], n[2] || 'square', n[3] === undefined ? .03 : n[3]), n[4] || 0));
    },
    sfx(name) {
      const now = performance.now();
      switch (name) {
        case 'step': if (now - this.lastStep < 130) return; this.lastStep = now; this.beep(150, .035, 'triangle', .018); break;
        case 'click': this.beep(520, .04, 'square', .03); break;
        case 'ok': this.beep(660, .07); setTimeout(() => this.beep(880, .09), 70); break;
        /* 收银机：叮 → 咔哒 → 零钱落袋，买东西专用 */
        case 'cash':
          this.seq([[1046, .05, 'square', .035, 0], [1568, .07, 'square', .030, 55],
                    [180, .05, 'sawtooth', .020, 105], [2093, .10, 'sine', .025, 150]]);
          break;
        case 'buy': this.sfx('cash'); break;   // 兼容旧调用
        case 'coin': this.seq([[1320, .05, 'square', .035, 0], [1760, .09, 'square', .03, 50]]); break;
        case 'error': this.beep(180, .16, 'sawtooth', .035); break;
        case 'event': this.beep(440, .1); setTimeout(() => this.beep(554, .1), 100); setTimeout(() => this.beep(659, .16), 200); break;
        /* 进店：叮咚门铃 + 推门 */
        case 'doorBell':
          this.seq([[1318, .10, 'sine', .045, 0], [1046, .16, 'sine', .040, 110],
                    [220, .12, 'triangle', .018, 40]]);
          break;
        /* 出店：门轴 + 一声轻铃 */
        case 'exit':
          this.seq([[240, .10, 'triangle', .03, 0], [330, .13, 'triangle', .025, 80],
                    [880, .06, 'sine', .018, 150]]);
          break;
        /* 切到地铁站 / 校园 / 公园 */
        case 'scene':
          this.seq([[330, .08, 'triangle', .025, 0], [494, .12, 'triangle', .022, 80],
                    [659, .10, 'sine', .018, 160]]);
          break;
        case 'door': this.sfx('doorBell'); break;   // 兼容旧调用
        /* 打开 / 使用背包道具 */
        case 'bag': this.seq([[392, .05, 'triangle', .025, 0], [587, .08, 'triangle', .025, 60]]); break;
        case 'use': this.seq([[520, .05, 'triangle', .03, 0], [780, .09, 'triangle', .025, 50]]); break;
        /* 捡起可回收物 */
        case 'pickup': this.seq([[880, .04, 'square', .025, 0], [1174, .06, 'square', .02, 45]]); break;
        /* 打开货架 / 地面屏 / 面板 */
        case 'screen': this.beep(1200, .04, 'square', .02); break;
        /* 打工完成：盖章 + 点钞 */
        case 'job': this.seq([[196, .07, 'sawtooth', .030, 0], [392, .10, 'square', .025, 70],
                              [1046, .08, 'square', .022, 150]]); break;
        /* 成就达成：四音上行 */
        case 'ach': this.seq([[523, .12, 'square', .03, 0], [659, .12, 'square', .03, 90],
                              [784, .12, 'square', .03, 180], [1046, .20, 'square', .03, 270]]); break;
        case 'rain': this.beep(90, .05, 'triangle', .012); break;
      }
    }
  };

  /* ---- Canvas 绘制原语 ---- */
  const D = PC.Draw = {
    rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
    frame(ctx, x, y, w, h, c, t) {
      t = t || 1; x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, t); ctx.fillRect(x, y + h - t, w, t);
      ctx.fillRect(x, y, t, h); ctx.fillRect(x + w - t, y, t, h);
    },
    line(ctx, x1, y1, x2, y2, c, t) {
      ctx.strokeStyle = c; ctx.lineWidth = t || 1; ctx.beginPath();
      ctx.moveTo(Math.round(x1) + .5, Math.round(y1) + .5); ctx.lineTo(Math.round(x2) + .5, Math.round(y2) + .5); ctx.stroke();
    },
    text(ctx, str, x, y, size, color, align, bold) {
      /* 世界内的招牌 / 价签 / 屏幕文字保持原逻辑字号：画布分辨率提高后
         它们在屏幕上更细腻也不会撑破框；屏幕级 UI 由调用方自行乘 TEXT_SCALE。*/
      ctx.font = (bold ? 'bold ' : '') + (size || 8) + 'px "Courier New","WenQuanYi Micro Hei","Microsoft YaHei",monospace';
      ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = color || '#fff'; ctx.fillText(str, Math.round(x), Math.round(y));
    },
    shadowText(ctx, str, x, y, size, color, align) {
      this.text(ctx, str, x + 1, y + 1, size, '#1b1c3a', align, true);
      this.text(ctx, str, x, y, size, color || '#fff', align, true);
    },
    circle(ctx, cx, cy, r, c) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(Math.round(cx), Math.round(cy), r, 0, Math.PI * 2); ctx.fill();
    },
    /* 硬边像素面板 */
    box(ctx, x, y, w, h, fill, border) {
      this.rect(ctx, x + 2, y + 2, w, h, '#0d0f28');
      this.rect(ctx, x, y, w, h, border || '#3b3b8f');
      this.rect(ctx, x + 2, y + 2, w - 4, h - 4, fill || '#f4f1e4');
    },
    /* 噪点纹理 */
    dither(ctx, x, y, w, h, c, density, seed) {
      ctx.fillStyle = c;
      for (let j = 0; j < h; j += 2) for (let i = 0; i < w; i += 2)
        if (U.noise2(i + x, j + y, seed || 1) < (density === undefined ? .25 : density))
          ctx.fillRect(Math.round(x + i), Math.round(y + j), 1, 1);
    }
  };
})();
