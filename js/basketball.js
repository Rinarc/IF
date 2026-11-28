/* basketball.js —— 汾阳中学 · 与秦磷打半场街头篮球  v3.0
 *
 * 这一版重点：秦磷拿球不再是「一瞬间就得分」，而是一整套看得见、能防守的进攻回合：
 *   接发球 → 运球推进（左右变向）→ 突破一步 → 收球屈膝 → 起跳 → 出手 → 落地看球
 *   玩家全程可以贴防、抢断、举手干扰、起跳盖帽、抢篮板。
 *
 * 投篮支持两种手感：按住蓄力松手出手（2K 式），或点一次起条、再点一次出手。
 * 球是实体：抛物线 / 重力 / 打框 / 篮板 / 空心入网 / 穿网下落 / 地面连续弹跳 / 出界。
 * 轮发制：每球后换另一方 CHECK BALL，20 秒时限，先进 11 分。
 * 配乐：music-extra.js 里两个槽位 basketball.1 / basketball.2，进场随机一首，
 *      播完随机切另一首，退出恢复原场景曲；文件没放就静默，不报错。
 */
(function () {
  const PC = window.PC = window.PC || {};
  const $ = id => document.getElementById(id);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const lerp = (a, b, t) => a + (b - a) * t;

  const VW = 480, VH = 270;
  const COURT = { x0: 22, x1: 398, y0: 6, y1: 250 };
  const HOOP = { x: 210, y: 34, r: 9.5, z: 32 };
  const R3 = 118;
  const G = 260;
  const SERVE = { x: 210, y: 186 };
  const WIN = 11;
  const BB_KEYS = ['basketball.1', 'basketball.2'];

  /* 右摇杆 8 向动作：位移、突破方向、身体倾斜、球路 */
  const ACTIONS = {
    up:    { name: '变向过人', en: 'CROSSOVER',    dx: -1, dy: -1, lean: -1, ball: 'cross' },
    ul:    { name: '转身过人', en: 'SPIN MOVE',    dx: -1, dy: -1, lean: -1, ball: 'spin' },
    ur:    { name: '转身过人', en: 'SPIN MOVE',    dx: 1,  dy: -1, lean: 1,  ball: 'spin' },
    left:  { name: '胯下运球', en: 'BETWEEN LEGS', dx: -1, dy: 0,  lean: -1, ball: 'legs' },
    right: { name: '后撤步',   en: 'STEP BACK',    dx: 1,  dy: 1,  lean: 1,  ball: 'back' },
    down:  { name: '背后运球', en: 'BEHIND BACK',  dx: 0,  dy: 1,  lean: 0,  ball: 'behind' },
    dl:    { name: '欧洲步',   en: 'EURO STEP',    dx: -1, dy: -1, lean: -1, ball: 'euro' },
    dr:    { name: '欧洲步',   en: 'EURO STEP',    dx: 1,  dy: -1, lean: 1,  ball: 'euro' },
    none:  { name: '伸手干扰', en: 'CONTEST',      dx: 0,  dy: 0,  lean: 0,  ball: '' }
  };

  /* ---------------- 局数成长 / 球场皮肤（本地持久化） ----------------
     · 每完成一局与秦磷的比赛记 1 局（中途秒退不计）
     · 每 2 局命中 +0.1 / 每 3 局篮板 +0.1 / 每 5 局抢断 +0.1，各封顶 +0.5
     · 12 / 24 / 36 局解锁科技 / 古风 / 电子球场，换肤同时改校园四宫格
  ------------------------------------------------------------------- */
  const PROG_KEY = 'pixel-city-bball-progress-v1';
  let prog = null;

  function loadProg() {
    if (prog) return prog;
    const base = { games: 0, skin: 'default', seen: ['default'], sms: [] };
    try {
      const raw = JSON.parse(localStorage.getItem(PROG_KEY) || 'null');
      if (raw && typeof raw === 'object') {
        base.games = Math.max(0, parseInt(raw.games, 10) || 0);
        if (Array.isArray(raw.seen)) base.seen = raw.seen.slice();
        if (typeof raw.skin === 'string') base.skin = raw.skin;
        if (Array.isArray(raw.sms)) base.sms = raw.sms.slice(0, 20);
      }
    } catch (e) {}
    const skins = PC.BBALL_SKINS || [];
    // 按局数补齐应有的解锁（老存档 / 手动改局数都能对上）
    skins.forEach(k => { if (base.games >= k.need && base.seen.indexOf(k.id) < 0) base.seen.push(k.id); });
    if (!skins.some(k => k.id === base.skin && base.seen.indexOf(k.id) >= 0)) base.skin = 'default';
    prog = base;
    return prog;
  }
  function saveProg() { try { localStorage.setItem(PROG_KEY, JSON.stringify(prog)); } catch (e) {} }
  function skins() { return PC.BBALL_SKINS || [{ id: 'default', name: '塑胶绿地', need: 0 }]; }
  function skinById(id) { return skins().find(k => k.id === id) || skins()[0]; }
  function currentSkin() { return skinById(loadProg().skin); }
  function theme() { return currentSkin().theme || skins()[0].theme; }

  function bonuses() {
    const g = loadProg().games;
    return {
      shoot:   Math.min(.5, Math.floor(g / 2) * .1),
      rebound: Math.min(.5, Math.floor(g / 3) * .1),
      steal:   Math.min(.5, Math.floor(g / 5) * .1),
      games: g
    };
  }

  /* 解锁皮肤 → 洪果校长短信 + 全局提示 */
  function sendThanks(id) {
    const k = skinById(id);
    const text = (PC.BBALL_THANKS && PC.BBALL_THANKS[id]) ||
      ('同学，四片篮球场焕然一新，这份投资我代表全校师生致谢。—— 校长 洪果');
    const item = { from: '洪果 · 校长', avatar: '🏫', tag: '学校通知',
      text: text, skin: id, title: k.name };
    try {
      const P = PC.Phone;
      if (P && P.receiveSMS) P.receiveSMS(item);
      else {  // 兜底：手机脚本还没加载时直接写存档，进手机也能看到
        const St = PC.State;
        if (St && St.d) {
          const d = St.d(); if (!d.phone) d.phone = {};
          if (!Array.isArray(d.phone.sms)) d.phone.sms = [];
          d.phone.sms.unshift(Object.assign({ t: Date.now(), unread: true }, item));
          St.save && St.save();
        }
      }
    } catch (e) {}
    // 短信安静地进收件箱就够了，不再弹任何游戏提示
  }

  /* 一局只记一次；返回本局新解锁的皮肤列表 */
  function recordGame() {
    if (!S || S.counted) return [];
    const played = (S.score[0] + S.score[1] > 0) || S.t > 25;
    if (!played) return [];
    S.counted = true;
    const pr = loadProg();
    const before = pr.seen.slice();
    pr.games += 1;
    const freshUnlocks = [];
    skins().forEach(k => {
      if (k.need > 0 && pr.games >= k.need && before.indexOf(k.id) < 0 && pr.seen.indexOf(k.id) < 0) {
        pr.seen.push(k.id); freshUnlocks.push(k);
      }
    });
    saveProg();
    freshUnlocks.forEach(k => sendThanks(k.id));
    return freshUnlocks;
  }

  function setSkin(id) {
    const pr = loadProg();
    const k = skinById(id);
    if (k.id !== 'default' && pr.seen.indexOf(k.id) < 0) return { ok: false, msg: '还没解锁，继续和秦磷打几局' };
    pr.skin = k.id; saveProg();
    // 小游戏里换肤立刻重画；校园四宫格由 world.js 每帧读 currentSkin()
    return { ok: true, msg: '🎨 球场已换成「' + k.name + '」，汾阳中学四片场子一起变了' };
  }

  let cv, ctx, wrap, scale = 1, offX = 0, offY = 0;
  let raf = 0, last = 0, active = false, diff, S, onExit = null;
  let uiBound = false, bound = false;
  let helpHiddenByUs = false;
  /* 篮球配乐 */
  let bbMusicOn = false, bbMusicKey = null, bbEnded = null, bbLoopGuard = 0;

  /* ---------------- 音效 ---------------- */
  function beep(f, d, type, vol) { try { PC.Audio && PC.Audio.beep(f, d, type || 'square', vol || .035); } catch (e) {} }
  function sfx(kind) {
    if (kind === 'dribble') beep(140 + rnd(-14, 14), .05, 'triangle', .024);
    else if (kind === 'cross') { beep(240, .05, 'square', .026); setTimeout(() => beep(330, .05, 'square', .022), 55); }
    else if (kind === 'shoot') { beep(520, .08, 'square', .034); setTimeout(() => beep(700, .06, 'sine', .026), 70); }
    else if (kind === 'swish') { beep(880, .1, 'sine', .045); setTimeout(() => beep(1320, .12, 'sine', .036), 85); }
    else if (kind === 'rim') { beep(205, .13, 'square', .042); setTimeout(() => beep(170, .09, 'triangle', .026), 60); }
    else if (kind === 'board') beep(160, .12, 'triangle', .038);
    else if (kind === 'score') { [660, 880, 1170].forEach((f, i) => setTimeout(() => beep(f, .12, 'square', .045), i * 95)); }
    else if (kind === 'cheer') { for (let i = 0; i < 5; i++) setTimeout(() => beep(700 + rnd(-160, 220), .07, 'sine', .018), i * 65); }
    else if (kind === 'whistle') { beep(1250, .09, 'sine', .04); setTimeout(() => beep(1250, .09, 'sine', .04), 130); }
    else if (kind === 'steal') { beep(340, .07, 'sawtooth', .036); setTimeout(() => beep(520, .06, 'square', .03), 70); }
    else if (kind === 'block') { beep(180, .15, 'sawtooth', .048); setTimeout(() => beep(120, .1, 'square', .03), 90); }
    else if (kind === 'bad') beep(115, .11, 'square', .03);
    else if (kind === 'jump') beep(300, .06, 'sine', .024);
  }

  /* ---------------- 绘制原语 ---------------- */
  function txt(str, x, y, size, color, align, bold) {
    ctx.font = (bold ? 'bold ' : '') + size + 'px "Courier New","WenQuanYi Micro Hei",monospace';
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = color; ctx.fillText(str, Math.round(x), Math.round(y));
  }
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function L(x1, y1, x2, y2, c, k) { ctx.strokeStyle = c; ctx.lineWidth = k || 1; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function C(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function O(x, y, rx, ry, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
  function strokeO(x, y, rx, ry, c, k, a0, a1) {
    ctx.strokeStyle = c; ctx.lineWidth = k || 1; ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, a0 === undefined ? 0 : a0, a1 === undefined ? Math.PI * 2 : a1); ctx.stroke();
  }

  function resize() {
    if (!cv || !wrap) return;
    const r = wrap.getBoundingClientRect();
    cv.width = Math.max(320, Math.round(r.width));
    cv.height = Math.max(180, Math.round(r.height));
    scale = Math.min(cv.width / VW, cv.height / VH);
    offX = (cv.width - VW * scale) / 2;
    offY = (cv.height - VH * scale) / 2;
  }

  /* ---------------- 状态 ---------------- */
  function freshAiRt() {
    return { step: 'idle', t: 0, dur: 0, side: Math.random() < .5 ? -1 : 1, shotQ: null, jumped: false, landed: false };
  }
  function fresh() {
    return {
      t: 0, zoom: 1.10, cam: { x: SERVE.x, y: 102 },
      score: [0, 0], lastServer: 1, possession: 0,
      over: false, paused: true, ready: .9, shotClock: 20,
      roundPhase: 'check',          // check | live | flight | dead
      msg: '', msgT: 0, msgColor: '#fff3c4',
      netWave: 0, particles: [], confetti: 0,
      ball: { x: SERVE.x, y: SERVE.y, z: 10, vx: 0, vy: 0, vz: 0,
              state: 'held', owner: 0, flight: false, scored: false,
              shooter: 0, from: { x: SERVE.x, y: SERVE.y }, rattle: 0, spin: 0,
              blocked: false, made: false, dribbleSide: 1 },
      player: { x: SERVE.x, y: SERVE.y, dir: 0, vx: 0, vy: 0, frame: 0, pose: 'idle',
                act: null, actCool: 0, stun: 0, moving: false, shootCool: 0,
                handsUp: 0, jumpH: 0, lean: 0, contestCool: 0 },
      ai: { x: 210, y: 118, dir: 1, vx: 0, vy: 0, frame: 0, pose: 'idle',
            stun: 0, shootTimer: 2, stealCool: 1.2, actCool: 0,
            jumpH: 0, lean: 0, rt: freshAiRt(), handsUp: 0 },
      shot: { state: 'idle', t: 0, dur: 1.0, result: null, resultT: 0, hold: false, minT: .11 },
      input: { mx: 0, my: 0, ax: 0, ay: 0, lastDir: 'none' },
      keys: {}, dribbleT: 0, counted: false, playerNeedClear: false
    };
  }

  function flash(msg, color, dur, big) {
    S.msg = msg; S.msgColor = color || '#fff3c4'; S.msgT = dur || 1.25;
    const el = $('bbCenterMsg');
    if (el) {
      el.textContent = msg; el.style.color = S.msgColor;
      el.classList.toggle('big', !!big);      // 只有得分 / 开场 / 胜负用大字
      el.classList.add('on');
    }
  }

  function hint() {
    const el = $('bbHint'); if (!el) return;
    if (S.over) { el.textContent = '↻ 重开 / ⏹ 退出（Esc）'; return; }
    if (S.ball.state === 'held' && S.ball.owner === 1) {
      el.textContent = S.ai.rt && S.ai.rt.step === 'clear'
        ? '🔴 秦磷正运球出三分线 · 追上去 F 抢断最划算'
        : '🔴 秦磷进攻中 · 贴上去 F 抢断 / G 盖帽 / 点投篮键举手干扰';
    } else if (S.ball.state === 'held' && S.ball.owner === 0) {
      el.textContent = S.playerNeedClear
        ? '🟢 防守篮板 · 先运球出三分线再进攻（不然勉强出手会打铁）'
        : '左摇杆移动 · 右摇杆过人/背运/胯下 · 按住投篮键蓄力，绿区松手';
    } else {
      el.textContent = '活球！冲抢篮板 G · 捡到球立刻转进攻';
    }
  }

  function updateHUD() {
    if (!S) return;
    const me = $('bbMe'), ai = $('bbAi'), df = $('bbDiff'), ps = $('bbPoss'), ck = $('bbClock');
    if (me) me.textContent = S.score[0];
    if (ai) ai.textContent = S.score[1];
    if (df) {
      df.textContent = diff.name + ' / ' + diff.en + '　·　' + currentSkin().icon + currentSkin().name;
      df.style.color = diff.color;
    }
    if (ps) {
      const aiBall = S.ball.state === 'held' && S.ball.owner === 1;
      const step = S.ai.rt ? S.ai.rt.step : '';
      ps.textContent = aiBall
        ? (step === 'clear' ? '🔴 秦磷正带球出三分线 · 现在断他！'
          : step === 'secondary' ? '🔴 秦磷自投自抢 · 篮下补篮'
          : '🔴 秦磷进攻 · 上去防！')
        : S.ball.state === 'held' ? (S.playerNeedClear ? '🟢 先带球出三分线' : '🟢 你持球 · 进攻')
        : S.ball.flight ? '🏀 球在空中' : '⚪ 活球 · 抢篮板';
      ps.style.color = aiBall ? '#ff8a7a' : '';
    }
    if (ck) ck.textContent = Math.max(0, Math.ceil(S.shotClock));
    const shoot = $('bbShoot');
    if (shoot) {
      const defending = S.ball.state === 'held' && S.ball.owner === 1;
      shoot.querySelector('b').textContent = defending ? '举手干扰' : '投篮';
      shoot.querySelector('small').textContent = defending ? 'CONTEST' : 'SHOOT';
      shoot.classList.toggle('defend', defending);
    }
    ['bbSteal', 'bbBlock'].forEach(id => {
      const el = $(id);
      if (el) el.classList.toggle('hot', S.ball.state === 'held' && S.ball.owner === 1);
    });
    hint();
  }

  /* ---------------- 发球 / 球权 ---------------- */
  function serve(who, why) {
    const b = S.ball, p = S.player, a = S.ai;
    S.lastServer = who; S.possession = who; S.roundPhase = 'check';
    // 进攻方站弧顶，防守方站在他与篮筐之间
    if (who === 0) { p.x = SERVE.x; p.y = SERVE.y; a.x = SERVE.x + 16; a.y = SERVE.y - 58; }
    else { a.x = SERVE.x; a.y = SERVE.y; p.x = SERVE.x - 18; p.y = SERVE.y - 52; }
    p.vx = p.vy = a.vx = a.vy = 0;
    p.act = null; p.pose = 'idle'; p.stun = 0; p.handsUp = 0; p.jumpH = 0; p.lean = 0;
    a.stun = 0; a.pose = 'idle'; a.jumpH = 0; a.lean = 0; a.handsUp = 0;
    a.rt = freshAiRt(); a.shootTimer = diff.shoot + rnd(.3, .8); a.stealCool = 1.1;
    b.state = 'held'; b.owner = who; b.flight = false; b.scored = false; b.blocked = false;
    b.shooter = who; b.made = false;                 // 新回合重置：避免把上一投的人当成篮板归属依据
    b.x = who === 0 ? p.x : a.x; b.y = who === 0 ? p.y : a.y; b.z = 10;
    b.vx = b.vy = b.vz = 0; b.rattle = 0; b.made = false;
    S.shot.state = 'idle'; S.shot.t = 0; S.shot.result = null; S.shot.hold = false;
    S.shotClock = 20; S.ready = .9; S.over = false; S.netWave = 0; S.playerNeedClear = false;
    S.particles.length = 0; S.confetti = 0;
    const btn = $('bbShoot'); if (btn) btn.classList.remove('aiming');
    flash((why ? why + '\n' : '') + 'CHECK BALL · ' + (who === 0 ? '你发球' : '秦磷发球 · 准备防守'),
      who === 0 ? '#7fe0c8' : '#ffd25a', 1.5);
    sfx('whistle'); updateHUD();
  }

  function giveBall(who, quiet, opts) {
    opts = opts || {};
    const b = S.ball, p = S.player, a = S.ai;
    b.state = 'held'; b.owner = who; b.flight = false; b.scored = false; b.blocked = false;
    b.vx = b.vy = b.vz = 0; b.made = false; b.rattle = 0;
    const h = who === 0 ? p : a;
    b.x = h.x; b.y = h.y; b.z = 9;
    S.possession = who; S.roundPhase = 'live';
    S.shotClock = Math.max(S.shotClock, 9); S.ready = 0;
    S.shot.state = 'idle'; S.shot.result = null; S.shot.hold = false;
    const btn = $('bbShoot'); if (btn) btn.classList.remove('aiming');

    if (who === 1) {
      S.playerNeedClear = false;
      a.shootTimer = diff.shoot + rnd(.3, .8);
      if (opts.secondary) {
        // 秦磷抢到「自己投丢」的前场板：不换球权、不出三分线，篮下直接补篮
        a.rt = { step: 'secondary', t: 0, dur: .26, side: 1, putback: true,
                 shotQ: null, jumped: false, landed: false, from: { x: a.x, y: a.y } };
        if (!quiet) flash('🔁 秦磷 自投自抢 · 篮下直接补篮', '#ffd25a', 1.05);
      } else if (opts.needClear) {
        // 球权转换（防守篮板 / 抢断）：秦磷必须「运球跑出三分线」，不是瞬移
        a.rt = { step: 'clear', t: 0, dur: 0, side: Math.random() < .5 ? -1 : 1,
                 target: { x: clamp(SERVE.x + rnd(-26, 26), 80, 340), y: SERVE.y + 8 },
                 shotQ: null, jumped: false, landed: false, from: { x: a.x, y: a.y } };
        if (!quiet) flash('🔴 秦磷 摘下防守篮板\n🏀 正在运球带出三分线…（现在能断他）', '#ffd25a', 1.35);
      } else {
        a.rt = { step: 'setup', t: 0, dur: .45, side: Math.random() < .5 ? -1 : 1,
                 shotQ: null, jumped: false, landed: false, from: { x: a.x, y: a.y } };
        if (!quiet) flash('🔴 球权：秦磷 · 快回防', '#ffd25a', 1.0);
      }
    } else {
      a.rt = freshAiRt();
      S.playerNeedClear = !!opts.needClear;   // 防守篮板 → 也要带球出三分线
      if (!quiet) flash(opts.needClear
        ? '🟢 防守篮板！带球出三分线再组织进攻'
        : '🟢 球权：你 · 转进攻', '#7fe0c8', 1.05);
    }
    updateHUD();
  }

  function deadBall(reason) {
    if (S.over || S.roundPhase === 'dead') return;
    S.roundPhase = 'dead'; S.ball.state = 'dead';
    flash(reason, '#e9d9b8', 1.0);
    setTimeout(() => { if (active && S && !S.over) serve(1 - S.lastServer, ''); }, 1000);
  }

  /* ---------------- 秦磷的进攻回合（这一版的核心） ----------------
     每个阶段都有最短可见时长，球在「release」之前一直在秦磷手里，
     玩家能在 dribble / drive / gather / jump 阶段抢断、举手、盖帽。
  ------------------------------------------------------------------ */
  const PACE = [1.95, 1.65, 1.40, 1.18, 1.00];   // 五档：名人堂也至少 ~2.2 秒完整回合

  function aiPace() { return diff.pace || PACE[Math.max(0, (PC.BBALL_DIFFS || []).indexOf(diff))] || 1.5; }

  function startAiTurn() {
    const a = S.ai;
    if (a.rt.step !== 'idle') return;
    a.rt = { step: 'setup', t: 0, dur: .45, side: Math.random() < .5 ? -1 : 1, shotQ: null, jumped: false, landed: false };
    flash('🔴 秦磷 控球 · 上去防！\nF 抢断 / G 盖帽 / 投篮键举手干扰', '#ffd25a', 1.25);
  }

  function updateAiTurn(dt) {
    const a = S.ai, p = S.player, b = S.ball, rt = a.rt;
    if (rt.step === 'idle') { startAiTurn(); return; }
    rt.t += dt;
    const targetY = 104;

    if (rt.step === 'clear') {
      /* 球权转换后：从篮板位置一路运球跑出三分线，全程可见、可抢断。
         只有 serve()（换回合 CHECK BALL）才会把人摆回发球位。 */
      a.pose = 'dribble'; a.vx = 0; a.vy = 0;
      const tx = rt.target.x, ty = rt.target.y;
      const vx = tx - a.x, vy = ty - a.y, dl = Math.hypot(vx, vy) || 1;
      const sp = 122 + diff.speed * .30;
      a.vx = vx / dl * Math.min(sp, dl * 3);
      a.vy = vy / dl * Math.min(sp, dl * 3);
      a.x = clamp(a.x + a.vx * dt, COURT.x0 + 4, COURT.x1 - 4);
      a.y = clamp(a.y + a.vy * dt, COURT.y0 + 16, COURT.y1 - 4);
      a.dir = a.vx > 0 ? 1 : 2; a.frame = Math.floor(S.t * 9) % 2;
      sfxDribble(dt, .28);
      const cleared = dist(a.x, a.y, HOOP.x, HOOP.y) > R3 + 10;
      if ((cleared && rt.t > .40) || rt.t > 3.4) {
        rt.step = 'setup'; rt.t = 0; rt.dur = .38; rt.from = { x: a.x, y: a.y };
        flash('✅ 球已带出三分线 · 秦磷开始进攻', '#ffd25a', .9);
      }

    } else if (rt.step === 'setup') {
      // 原地屈膝运球，绝不把人拉回发球点
      a.pose = 'dribble'; a.vx = a.vy = 0; a.dir = 0; a.lean = 0;
      sfxDribble(dt, .34);
      if (rt.t >= rt.dur) {
        rt.step = 'dribble'; rt.t = 0; rt.dur = aiPace();
        rt.from = { x: a.x, y: a.y };
      }

    } else if (rt.step === 'secondary') {
      // 自投自抢：篮下原地收球起跳补篮，不跑出三分线、不瞬移
      a.pose = 'gather'; a.vx = a.vy = 0;
      a.jumpH = Math.sin(Math.PI * clamp(rt.t / .26, 0, 1)) * 4;
      if (rt.t >= .26) { rt.step = 'jump'; rt.t = 0; rt.dur = .24; sfx('jump'); }

    } else if (rt.step === 'dribble') {
      // 从「当前所在位置」往篮下推进，不再硬编码弧顶坐标
      a.pose = 'dribble';
      const k = clamp(rt.t / rt.dur, 0, 1);
      const fx = rt.from ? rt.from.x : a.x, fy = rt.from ? rt.from.y : a.y;
      a.y = lerp(fy, targetY, k);
      a.x = clamp(fx + Math.sin(rt.t * (2.2 + (5 - aiPace()) * .5)) * (18 + rt.side * 8),
                  COURT.x0 + 4, COURT.x1 - 4);
      a.vx = Math.cos(rt.t * 3) * 18; a.vy = -40;
      a.dir = a.vx > 0 ? 1 : 2; a.frame = Math.floor(S.t * 9) % 2;
      sfxDribble(dt, .30);
      if (rt.t >= rt.dur) { rt.step = 'drive'; rt.t = 0; rt.dur = .48; }

    } else if (rt.step === 'drive') {
      a.pose = 'drive'; a.lean = rt.side;
      const k = clamp(rt.t / rt.dur, 0, 1);
      if (!rt.driveTo) rt.driveTo = { x: clamp(a.x + rt.side * 30, 70, 350), y: clamp(a.y - 12, 48, 180) };
      a.x = lerp(a.x, rt.driveTo.x, Math.min(1, dt * 6));
      a.y = lerp(a.y, rt.driveTo.y, Math.min(1, dt * 5));
      if (!rt.shotQ) {
        rt.shotQ = { committed: false };
        const d = dist(p.x, p.y, a.x, a.y);
        if (d < 34 && Math.random() > diff.steal * .7) {
          p.stun = rnd(.30, .55);
          flash('秦磷 一个变向把你晃开了', '#e2564d', .8);
        }
      }
      if (k >= 1) { rt.step = 'gather'; rt.t = 0; rt.dur = .30; }

    } else if (rt.step === 'gather') {
      a.pose = 'gather'; a.vx = a.vy = 0; a.lean = 0;
      a.jumpH = -2 * Math.sin(Math.PI * clamp(rt.t / rt.dur, 0, 1));
      if (rt.t >= rt.dur) { rt.step = 'jump'; rt.t = 0; rt.dur = .30; sfx('jump'); }

    } else if (rt.step === 'jump') {
      a.pose = 'shoot'; a.jumpH = Math.sin(Math.PI * clamp(rt.t / rt.dur, 0, 1)) * 13;
      if (rt.t >= rt.dur) {
        rt.step = 'release'; rt.t = 0; rt.dur = .12;
        aiRelease();
      }

    } else if (rt.step === 'release') {
      a.pose = 'shoot'; a.jumpH = Math.max(0, 10 - rt.t * 70);
      if (rt.t >= rt.dur) { rt.step = 'land'; rt.t = 0; rt.dur = .55; }

    } else if (rt.step === 'land') {
      a.pose = 'land'; a.jumpH = lerp(a.jumpH, 0, Math.min(1, dt * 8));
      if (rt.t >= rt.dur) { a.jumpH = 0; a.pose = 'idle'; rt.step = 'watch'; rt.dur = 3; }
    } else if (rt.step === 'watch') {
      a.pose = 'defend';
    }
  }

  function aiRelease() {
    const a = S.ai, p = S.player;
    const d = dist(a.x, a.y, HOOP.x, HOOP.y);
    const tight = clamp(1 - dist(a.x, a.y, p.x, p.y) / 54, 0, 1);
    const contest = p.handsUp > 0 ? .20 : 0;
    const putback = a.rt && a.rt.putback ? .12 : 0;   // 自投自抢的篮下补篮
    const acc = clamp(diff.acc + putback - tight * diff.contest * .45 - contest, .06, .98);
    const made = Math.random() < acc;
    const q = { key: 'AI', label: '秦磷 跳投出手', acc, err: made ? .05 : 1.0, col: '#ffd25a', made };
    flash((putback ? '秦磷 篮下补篮！' : '秦磷 起跳 · 出手！') + '\n' +
      (p.handsUp > 0 ? '✋ 你举手干扰到了' : '快抢篮板 G'), '#ffd25a', 1.1);
    shootBall(1, q, { x: a.x, y: a.y }, made);
  }

  function sfxDribble(dt, period) {
    S.dribbleT -= dt;
    if (S.dribbleT <= 0) { S.dribbleT = period; sfx('dribble'); }
  }

  /* ---------------- 投篮 ---------------- */
  function qualityOf(t) {
    const q = t / S.shot.dur;
    const idx = Math.max(0, (PC.BBALL_DIFFS || []).indexOf(diff));
    const perfect = .62, width = .085 - idx * .007;
    if (Math.abs(q - perfect) <= .028) return { key: 'PERFECT', label: 'PERFECT RELEASE!', acc: .985, err: .04, col: '#7fe0c8' };
    if (Math.abs(q - perfect) <= width) return { key: 'GOOD', label: 'GOOD RELEASE', acc: .82, err: .30, col: '#ffd25a' };
    if (q < perfect - width) return { key: 'EARLY', label: '太早了 · 力量没到', acc: .40, err: .90, col: '#e2564d' };
    if (q > .97) return { key: 'LATE', label: '太晚了 · 勉强甩出', acc: .32, err: 1.10, col: '#e2564d' };
    return { key: 'LATE', label: '偏晚 · 打铁风险', acc: .55, err: .68, col: '#d99b1f' };
  }

  function shootBall(who, q, from, aiMade) {
    const b = S.ball, h = who === 0 ? S.player : S.ai;
    const sx = from ? from.x : h.x, sy = from ? from.y : h.y;
    const d = dist(sx, sy, HOOP.x, HOOP.y);
    const T = clamp(.78 + d / 320, .80, 1.22);
    const defender = who === 0 ? S.ai : S.player;
    const pressure = who === 0 ? diff.contest * clamp(1 - dist(h.x, h.y, defender.x, defender.y) / 62, 0, 1) : 0;
    const moving = who === 0 && (Math.abs(h.vx) + Math.abs(h.vy) > 30) ? .09 : 0;
    const bonus = who === 0 ? bonuses().shoot : 0;   // 每 2 局 +0.1，封顶 +0.5
    const noClear = who === 0 && S.playerNeedClear ? .12 : 0;   // 没清球就勉强出手
    const acc = clamp(q.acc + bonus - noClear - pressure - moving - clamp(d / 950, 0, .11), .05, .995);
    const made = aiMade === undefined ? (Math.random() < acc) : !!aiMade;

    // 命中：瞄筐心 + 极小误差；不中：明显偏出，可能打框
    let err = q.err * 16 + pressure * 28 + clamp(d / 180, .3, 1.4) * 4 + moving * 55;
    if (made) err *= .12; else err = Math.max(20, err * 1.6);
    if (q.key === 'PERFECT') err = made ? .5 : 11;
    const jitter = () => rnd(-err, err);

    b.state = 'loose'; b.flight = true; b.scored = false; b.blocked = false; b.made = made;
    b.owner = -1; b.shooter = who; b.from = { x: sx, y: sy };
    b.x = sx; b.y = sy; b.z = (who === 1 ? 26 : 22) + (h.jumpH || 0) * .5;
    b.rattle = 0; b.spin = 0;
    b.vx = (HOOP.x - sx) / T + jitter() * .34;
    b.vy = (HOOP.y - sy) / T + jitter() * .34;
    b.vz = (HOOP.z - b.z + .5 * G * T * T) / T + jitter() * .10;
    S.roundPhase = 'flight';
    if (who === 0) { S.player.shootCool = .55; S.player.pose = 'shoot'; S.player.act = null; }
    else { S.ai.shootTimer = diff.shoot + rnd(.25, .7); }
    sfx('shoot'); updateHUD();
  }

  function startAim() {
    if (!active || S.over || S.paused) return;
    const b = S.ball;
    if (b.state === 'held' && b.owner === 1) {          // 防守态：举手干扰
      S.player.handsUp = 1.05; S.player.contestCool = .55;
      flash('✋ 举手干扰！秦磷这一投会受影响', '#7fe0c8', .85);
      beep(420, .06, 'sine', .03);
      return;
    }
    if (S.ready > 0) { flash('等发球哨…', '#e9d9b8', .5); return; }
    if (b.state !== 'held' || b.owner !== 0) { flash('先拿到球再投', '#e9d9b8', .8); sfx('bad'); return; }
    if (S.player.stun > 0 || S.player.shootCool > 0 || S.shot.state === 'aiming') return;
    const idx = Math.max(0, (PC.BBALL_DIFFS || []).indexOf(diff));
    S.shot.state = 'aiming'; S.shot.t = 0;
    S.shot.dur = 1.12 - idx * .055;
    S.shot.result = null; S.shot.minT = .11;
    S.player.pose = 'gather';
    const btn = $('bbShoot'); if (btn) btn.classList.add('aiming');
    beep(440, .06, 'square', .03);
    updateHUD();
  }

  function releaseShot() {
    if (S.shot.state !== 'aiming') return;
    const q = qualityOf(S.shot.t);
    S.shot.state = 'idle'; S.shot.result = q; S.shot.resultT = 1.45; S.shot.hold = false;
    const btn = $('bbShoot'); if (btn) btn.classList.remove('aiming');
    flash(q.label + (S.playerNeedClear ? '\n⚠ 还没带球出三分线 · 勉强出手' : ''), q.col, 1.15);
    shootBall(0, q, { x: S.player.x, y: S.player.y });
  }

  /* 按住蓄力 → 松手出手；短按（<minT）保留投篮条，等第二次点击 */
  function shootDown() {
    if (!active || S.over) return;
    if (S.shot.state === 'aiming') { releaseShot(); return; }   // 点两次的第二次
    startAim();
    S.shot.hold = S.shot.state === 'aiming';
  }
  function shootUp() {
    if (!S || !S.shot.hold) return;
    S.shot.hold = false;
    if (S.shot.state !== 'aiming') return;
    if (S.shot.t < S.shot.minT) return;    // 太短的点击：保持条，等再点一次
    releaseShot();
  }
  /* 回归脚本 / 键盘「按两次」语义 */
  function shootClick() {
    if (!active || S.over) return;
    if (S.shot.state === 'aiming') releaseShot();
    else { startAim(); S.shot.hold = false; }
  }

  /* 活球捡球：只有真正碰到球的人才能拿到，秦磷不会凭空「被判给」球权 */
  function pickupCheck(dt, b, p, a) {
    if (b.state !== 'loose' || b.scored || b.z > 6) return false;
    const dp = dist(p.x, p.y, b.x, b.y), da = dist(a.x, a.y, b.x, b.y);
    if (dp < 13 && p.stun <= 0) { giveBall(0, false, { needClear: b.shooter === 1 }); return true; }
    if (da < 12 + diff.reb * 6 && a.stun <= 0) {
      // 秦磷自己投丢 → 前场板直接补篮；玩家投丢 / 盖帽 → 球权转换，须运球出三分线
      giveBall(1, false, b.shooter === 1 ? { secondary: true } : { needClear: true });
      return true;
    }
    return false;
  }

  /* ---------------- 球物理 ---------------- */
  function updateBall(dt) {
    const b = S.ball, p = S.player, a = S.ai;
    if (b.state === 'held') {
      const h = b.owner === 0 ? p : a;
      const side = h === a ? (a.rt && a.rt.step === 'drive' ? a.rt.side : 1) : 1;
      const bounce = Math.abs(Math.sin(S.t * (h.pose === 'dribble' ? 11 : 8)));
      const act = h === p ? p.act : null;
      b.dribbleSide = side;
      b.x = h.x + (act && act.ball === 'behind' ? 0 : (h.dir === 2 ? -7 : 7) * side);
      b.y = h.y + (act && act.ball === 'legs' ? 3 : -2);
      b.z = (h.pose === 'shoot' || h.pose === 'gather') ? 23 + (h.jumpH || 0)
          : 5 + bounce * (act ? 18 : 11);
      if (h.pose === 'dribble' || h.pose === 'drive') sfxDribble(dt, .30);
      return;
    }
    if (b.state === 'dead') return;
    if (!b.flight) {
      // 落地静止的活球：继续缓慢滚动，并每帧判断谁真的碰到了球。
      // 之前这里直接 return，导致打铁后的活球永远没人捡，只能等 24 秒违例。
      if (b.state === 'loose') {
        b.x += b.vx * dt; b.y += b.vy * dt;
        b.vx *= Math.pow(.12, dt); b.vy *= Math.pow(.12, dt);
        b.x = clamp(b.x, COURT.x0 - 4, COURT.x1 + 4);
        b.y = clamp(b.y, COURT.y0 - 20, COURT.y1 + 4);
        pickupCheck(dt, b, p, a);
      }
      return;
    }

    const pz = b.z, px = b.x, py = b.y;
    b.vz -= G * dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    b.spin += dt * 10;

    // 篮板（篮筐后方）
    if (b.y < 17 && b.z > 12 && b.vy < 0) {
      b.y = 17; b.vy = -b.vy * .58; b.vx *= .82; b.rattle++;
      sfx('board');
    }
    // 下落穿过篮圈平面：判空心 / 擦框 / 打铁
    if (!b.scored && b.vz < 0 && pz >= HOOP.z && b.z < HOOP.z) {
      const k = (pz - HOOP.z) / Math.max(.0001, pz - b.z);
      const hx = px + (b.x - px) * k, hy = py + (b.y - py) * k;
      const dd = dist(hx, hy, HOOP.x, HOOP.y);
      if (dd <= HOOP.r - 1.2) {
        b.scored = true; b.vz = Math.min(-46, b.vz * .55); b.vx *= .20; b.vy *= .20;
        S.netWave = 1; spawnNetSparks();
        sfx('swish'); onScore(b.shooter, b.from);
      } else if (dd <= HOOP.r + 8 && b.rattle < 2) {
        b.rattle++; b.vz = Math.max(62, -b.vz * .44);
        const ang = Math.atan2(hy - HOOP.y, hx - HOOP.x);
        b.vx = Math.cos(ang) * rnd(26, 58) + b.vx * .12;
        b.vy = Math.sin(ang) * rnd(26, 58) + b.vy * .12;
        b.z = HOOP.z + 1; b.made = false;
        sfx('rim'); flash('打框了！抢篮板', '#d99b1f', .8);
      } else if (b.rattle >= 2) {
        b.made = false;
      }
    }
    // 落地弹跳
    if (b.z <= 0) {
      b.z = 0;
      if (!b.scored && Math.abs(b.vz) > 26) {
        b.vz = -b.vz * .60; b.vx *= .78; b.vy *= .78; sfx('dribble');
      } else {
        b.vz = 0; b.flight = false; b.state = 'loose';
        b.vx *= .70; b.vy *= .70;
        if (Math.abs(b.vx) < 4 && Math.abs(b.vy) < 4) { b.vx = 0; b.vy = 0; }
        if (!b.scored) flash('没进 · 活球抢篮板', '#e9d9b8', .8);
      }
    }
    // 出界
    if (b.x < COURT.x0 - 8 || b.x > COURT.x1 + 8 || b.y > COURT.y1 + 8 || b.y < COURT.y0 - 26) {
      deadBall('球出界 · 换发球'); return;
    }
    // 球还在低空飞行时，碰到的人也能把球收下
    pickupCheck(dt, b, p, a);
  }

  function spawnNetSparks() {
    for (let i = 0; i < 12; i++) S.particles.push({
      x: HOOP.x + rnd(-8, 8), y: HOOP.y + rnd(-2, 8),
      vx: rnd(-24, 24), vy: rnd(12, 46), life: rnd(.35, .8), t: 0,
      c: pick(['#fff3c4', '#7fe0c8', '#ffd25a'])
    });
    S.confetti = 1;
    sfx('cheer');
  }

  function onScore(who, from) {
    const three = dist(from.x, from.y, HOOP.x, HOOP.y) > R3;
    const pts = three ? 3 : 2;
    S.score[who] += pts;
    flash((who === 0 ? '🟢 你' : '🔴 秦磷') + ' +' + pts + (three ? ' · 三分！' : ' · 命中') +
      '\n' + S.score[0] + ' : ' + S.score[1], who === 0 ? '#7fe0c8' : '#ffd25a', 1.6, true);
    sfx('score'); updateHUD();
    if (S.score[who] >= WIN) { finish(who); return; }
    setTimeout(() => { if (active && S && !S.over) serve(1 - S.lastServer, ''); }, 1350);
  }

  /* ---------------- 玩家动作 / 防守 ---------------- */
  function doAction(dir) {
    const p = S.player, a = S.ai;
    if (S.ball.state === 'held' && S.ball.owner === 1) {
      // 无球防守：卡位 + 伸手，降低秦磷命中
      if (p.contestCool <= 0 && dir !== 'none') {
        p.contestCool = .5; p.handsUp = Math.max(p.handsUp, .55);
        flash('✋ 贴防 · 伸手干扰', '#a9b6ff', .7);
        const d = dist(p.x, p.y, a.x, a.y);
        if (d < 34) { a.x += (a.x - p.x) * .10; a.y += (a.y - p.y) * .10; }
      }
      return;
    }
    if (S.ball.state !== 'held' || S.ball.owner !== 0) return;
    if (p.actCool > 0 || p.stun > 0 || S.ready > 0) return;
    const A = ACTIONS[dir] || ACTIONS.none;
    p.act = { ...A, t: .42, total: .42 }; p.actCool = .62;
    p.pose = 'drive'; p.lean = A.lean;
    const push = 17;
    p.x = clamp(p.x + A.dx * push, COURT.x0 + 4, COURT.x1 - 4);
    p.y = clamp(p.y + A.dy * push, COURT.y0 + 16, COURT.y1 - 4);
    const d = dist(p.x, p.y, a.x, a.y);
    if (d < 40 && Math.random() < (.76 - diff.steal * .48)) {
      a.stun = rnd(.34, .70);
      flash(A.name + ' · 把秦磷过掉了！', '#7fe0c8', .95);
      beep(680, .07, 'square', .03);
    } else flash(A.en + ' / ' + A.name, '#ffd25a', .75);
    sfx('cross');
  }

  function trySteal() {
    if (!active || S.over || S.ready > 0) return;
    const p = S.player, a = S.ai, b = S.ball;
    if (b.state === 'held' && b.owner === 1) {
      const d = dist(p.x, p.y, a.x, a.y);
      if (d > 34) { flash('贴上去再断', '#e9d9b8', .7); return; }
      // 秦磷正在运球推进时最好断；起跳后几乎断不到
      const phaseBonus = a.rt.step === 'dribble' ? .16 : a.rt.step === 'drive' ? .06
        : a.rt.step === 'clear' ? .12 : -.12;
      const bonus = bonuses().steal;
      const rate = clamp(.72 - diff.steal * .78 + phaseBonus + bonus, .10, .98);
      if (Math.random() < rate) {
        giveBall(0); a.stun = .5; a.rt = freshAiRt();
        flash('STEAL! 断下来了 · 转进攻' + (bonus > 0 ? '　（抢断 +' + bonus.toFixed(1) + '）' : ''), '#7fe0c8', 1.15); sfx('steal');
      } else {
        p.stun = .48; flash('没断到 · 被晃开', '#e2564d', .9); sfx('bad');
      }
    } else if (b.state === 'loose' && dist(p.x, p.y, b.x, b.y) < 36) {
      tryRebound();
    } else flash('现在没有持球人可断', '#e9d9b8', .65);
  }

  function tryRebound() {
    if (!active || S.over) return;
    const p = S.player, a = S.ai, b = S.ball;
    if (b.state === 'held' && b.owner === 0) { flash('球已经在手上', '#e9d9b8', .6); return; }
    const d = dist(p.x, p.y, b.x, b.y);
    // 盖帽：秦磷刚出手、球还在上升、距离够近
    if (b.flight && b.shooter === 1 && b.vz > 0 && b.z < 42 && d < 40 && !b.blocked) {
      b.blocked = true; b.made = false; b.scored = false;
      b.vx = -b.vx * .75 + rnd(-45, 45); b.vy = Math.abs(b.vy) * .6 + rnd(45, 80);
      b.vz = Math.max(75, -b.vz * .5); b.rattle = 3; b.shooter = -1;
      flash('BLOCK! 一巴掌扇出去了', '#7fe0c8', 1.25); sfx('block');
      a.rt = freshAiRt(); a.jumpH = 0; return;
    }
    // 球还在空中（上升或离地很高）→ 不能凭空把球判给任何人
    if (b.flight && (b.vz > 0 || b.z > 16)) {
      flash('🏀 球还在空中 · 等它落下来再抢', '#e9d9b8', .8); return;
    }
    if (b.state === 'dead') { flash('死球了 · 等换发球', '#e9d9b8', .7); return; }
    if (d > 48) { flash('够不到球', '#e9d9b8', .65); return; }
    // 只判定「玩家有没有抢到」；抢不到就保持活球，让秦磷自己跑过去捡
    const bonus = bonuses().rebound;
    const rate = clamp(.80 - diff.reb * .44 - (d / 48) * .16 + bonus, .12, .96);
    if (Math.random() < rate) {
      giveBall(0, false, { needClear: b.shooter === 1 });
      flash('REBOUND! 摘下篮板' + (bonus > 0 ? '　（篮板 +' + bonus.toFixed(1) + '）' : ''), '#7fe0c8', 1.05);
      sfx('steal');
    } else {
      flash('没抓稳 · 双方拼抢活球', '#e9d9b8', .85);
    }
  }

  function updatePlayer(dt) {
    const p = S.player, k = S.keys, inp = S.input;
    let dx = inp.mx, dy = inp.my;
    if (k.l) dx -= 1; if (k.r) dx += 1; if (k.u) dy -= 1; if (k.d) dy += 1;
    const len = Math.hypot(dx, dy); if (len > 1) { dx /= len; dy /= len; }
    const defending = S.ball.state === 'held' && S.ball.owner === 1;
    const speed = (defending ? 96 : 88) * (p.act ? 1.45 : 1);
    p.vx = dx * speed; p.vy = dy * speed;
    if (p.stun > 0) { p.stun -= dt; p.vx *= .18; p.vy *= .18; }
    p.x = clamp(p.x + p.vx * dt, COURT.x0 + 4, COURT.x1 - 4);
    p.y = clamp(p.y + p.vy * dt, COURT.y0 + 16, COURT.y1 - 4);
    p.moving = Math.abs(p.vx) + Math.abs(p.vy) > 8;
    if (p.moving) { p.frame = Math.floor(S.t * 9) % 2; p.dir = dx > .3 ? 1 : dx < -.3 ? 2 : dy < 0 ? 0 : 3; }
    if (S.shot.state === 'aiming') { p.pose = 'gather'; p.vx *= .3; p.vy *= .3; }
    else if (p.act) p.pose = 'drive';
    else if (!p.moving && !defending) p.pose = S.ball.state === 'held' && S.ball.owner === 0 ? 'dribble' : 'idle';
    else if (defending) p.pose = 'defend';
    else p.pose = 'run';
    if (p.act) { p.act.t -= dt; if (p.act.t <= 0) { p.act = null; p.lean = 0; } }
    if (p.actCool > 0) p.actCool -= dt;
    if (p.shootCool > 0) p.shootCool -= dt;
    if (p.contestCool > 0) p.contestCool -= dt;
    if (p.handsUp > 0) p.handsUp -= dt;
    if (S.playerNeedClear && dist(p.x, p.y, HOOP.x, HOOP.y) > R3 + 8) {
      S.playerNeedClear = false;
      flash('✅ 已带出三分线 · 可以进攻了', '#7fe0c8', .9);
    }
  }

  function updateAI(dt) {
    const a = S.ai, p = S.player, b = S.ball;
    if (a.stun > 0) { a.stun -= dt; a.vx = a.vy = 0; a.pose = 'stun'; return; }
    if (a.stealCool > 0) a.stealCool -= dt;
    if (a.handsUp > 0) a.handsUp -= dt;
    // 出手后球已离手：补完落地动作，避免秦磷一直悬在空中
    if (a.rt.step === 'release' || a.rt.step === 'land') {
      a.rt.t += dt;
      a.jumpH = lerp(a.jumpH, 0, Math.min(1, dt * 7));
      a.pose = a.jumpH > 3 ? 'shoot' : 'land';
      if (a.rt.t >= .62) { a.jumpH = 0; a.rt.step = 'watch'; a.pose = 'defend'; }
    }

    /* ---- 秦磷持球：走完整回合状态机 ---- */
    if (b.state === 'held' && b.owner === 1 && S.roundPhase === 'live') {
      updateAiTurn(dt);
      return;
    }
    /* ---- 玩家持球：秦磷贴防 / 抢断 / 举手干扰 ---- */
    if (b.state === 'held' && b.owner === 0) {
      a.rt = freshAiRt();
      const ux = HOOP.x - p.x, uy = HOOP.y - p.y, ul = Math.hypot(ux, uy) || 1;
      const tx = p.x + ux / ul * diff.defDist + (p.x > HOOP.x ? 8 : -8);
      const ty = clamp(p.y + uy / ul * diff.defDist, COURT.y0 + 18, COURT.y1 - 8);
      const vx = tx - a.x, vy = ty - a.y, dl = Math.hypot(vx, vy) || 1;
      const sp = diff.speed * 1.05;
      a.vx = vx / dl * Math.min(sp, dl * 4); a.vy = vy / dl * Math.min(sp, dl * 4);
      a.x = clamp(a.x + a.vx * dt, COURT.x0 + 4, COURT.x1 - 4);
      a.y = clamp(a.y + a.vy * dt, COURT.y0 + 16, COURT.y1 - 4);
      a.pose = 'defend'; a.frame = Math.floor(S.t * 8) % 2;
      a.handsUp = S.shot.state === 'aiming' ? .8 : 0;
      // 发球哨期间不抢断
      if (S.ready <= 0 && a.stealCool <= 0 && dist(a.x, a.y, p.x, p.y) < 20 && Math.random() < diff.steal * dt * 2.4) {
        a.stealCool = 1.5; giveBall(1); p.stun = .4;
        flash('秦磷 抢断！快回防', '#e2564d', 1.0); sfx('steal');
      }
      // 玩家出手瞬间起跳封盖
      if (b.flight && b.shooter === 0 && b.vz > 0 && b.z < 40 && !b.blocked &&
          dist(a.x, a.y, p.x, p.y) < 24 && Math.random() < diff.contest * .30) {
        b.blocked = true; b.made = false; b.vx *= -.6; b.vy += 45; b.vz = Math.max(65, b.vz * .5);
        flash('被秦磷 大帽扇出', '#e2564d', 1.05); sfx('block');
      }
      return;
    }
    /* ---- 活球 / 球在空中：按篮板积极性扑落点 ---- */
    const tx = clamp(b.x + b.vx * .22, COURT.x0 + 6, COURT.x1 - 6);
    const ty = clamp(b.y + b.vy * .22, COURT.y0 + 18, COURT.y1 - 6);
    const vx = tx - a.x, vy = ty - a.y, dl = Math.hypot(vx, vy) || 1;
    const sp = diff.speed * (.60 + diff.reb * .66);
    a.vx = vx / dl * Math.min(sp, dl * 4); a.vy = vy / dl * Math.min(sp, dl * 4);
    a.x = clamp(a.x + a.vx * dt, COURT.x0 + 4, COURT.x1 - 4);
    a.y = clamp(a.y + a.vy * dt, COURT.y0 + 16, COURT.y1 - 4);
    // 出手后的落地动画期间别把姿态覆盖成 run
    if (a.rt.step !== 'release' && a.rt.step !== 'land') a.pose = 'run';
    a.frame = Math.floor(S.t * 8) % 2;
    a.dir = a.vy < -4 ? 0 : a.vx > 4 ? 1 : a.vx < -4 ? 2 : 3;
  }

  /* ---------------- 结束 / 奖励 ---------------- */
  function finish(who) {
    S.over = true; S.paused = true; S.roundPhase = 'dead';
    const unlocked = recordGame();
    const win = who === 0;
    const unlockLine = unlocked.length
      ? '\n🎁 解锁 ' + unlocked.map(k => k.icon + k.name).join(' / ')
      : '';
    flash((win ? '🏆 你赢了秦磷！' : '秦磷赢下这一局') + '\n' + S.score[0] + ' : ' + S.score[1] +
      unlockLine + '\n↻ 重开 / ⏹ 退出', win ? '#7fe0c8' : '#ffd25a', 99, true);
    sfx(win ? 'score' : 'whistle');
    try {
      const St = PC.State;
      if (St && St.change) {
        if (win) { St.change('mood', 6); St.change('fame', 2); St.d().money += 30; }
        else St.change('mood', 2);
        St.logMsg && St.logMsg('汾阳中学半场篮球 · ' + diff.name + ' · ' + S.score[0] + ':' + S.score[1] + (win ? ' 胜' : ' 负'));
        St.save && St.save();
      }
    } catch (e) {}
  }

  /* ---------------- 配乐：两曲随机轮换 ---------------- */
  function bbMusicStart() {
    const M = PC.Music; if (!M || !M.request) return;
    if (M.enabled === false) return;                 // 尊重用户全局静音
    const avail = BB_KEYS.filter(k => M.srcFor(k));
    if (!avail.length) return;                      // 两首都没放 → 静默
    bbMusicOn = true;
    // music.js 的 _apply 换源时会把 loop 设回 true；这里持续校正，
    // 保证播完触发 ended → 随机切到另一首
    clearInterval(bbLoopGuard);
    bbLoopGuard = setInterval(() => {
      if (!bbMusicOn) { clearInterval(bbLoopGuard); bbLoopGuard = 0; return; }
      try { if (M.audio && M.audio.loop) M.audio.loop = false; } catch (e) {}
    }, 120);
    const choose = () => {
      const list = avail.filter(k => k !== bbMusicKey);
      return list.length ? pick(list) : avail[0];
    };
    const play = key => {
      if (!bbMusicOn) return;
      bbMusicKey = key;
      try { M.request(key); } catch (e) { return; }
      if (M.audio) { M.audio.loop = false; M.audio.addEventListener('ended', bbEnded); }
    };
    bbEnded = () => { if (bbMusicOn) play(choose()); };
    play(pick(avail));
  }
  function bbMusicStop() {
    const M = PC.Music; if (!M) return;
    bbMusicOn = false;
    if (bbEnded && M.audio) { try { M.audio.removeEventListener('ended', bbEnded); } catch (e) {} }
    bbEnded = null; bbMusicKey = null;
    clearInterval(bbLoopGuard); bbLoopGuard = 0;
    try { if (M.release) M.release(); } catch (e) {}
    if (M.audio) M.audio.loop = true;
  }

  /* ---------------- 主循环 ---------------- */
  function update(dt) {
    S.t += dt;
    if (S.msgT > 0) { S.msgT -= dt; if (S.msgT <= 0) { const el = $('bbCenterMsg'); if (el) { el.classList.remove('on'); el.classList.remove('big'); } } }
    if (S.shot.resultT > 0) S.shot.resultT -= dt;
    if (S.netWave > 0) S.netWave = Math.max(0, S.netWave - dt * 2.2);
    if (S.confetti > 0) S.confetti = Math.max(0, S.confetti - dt);
    for (let i = S.particles.length - 1; i >= 0; i--) {
      const q = S.particles[i]; q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 90 * dt;
      if (q.t >= q.life) S.particles.splice(i, 1);
    }
    if (S.ready > 0) {
      S.ready -= dt;
      if (S.ready < 0) { S.ready = 0; S.roundPhase = 'live'; if (S.ball.owner === 1) startAiTurn(); }
    }
    if (S.paused) return;

    // 相机：跟随主角，AI 进攻时轻微往秦磷偏，镜头缓缓推近
    const dToHoop = dist(S.player.x, S.player.y, HOOP.x, HOOP.y);
    const targetZoom = 1.42 + .16 * (1 - clamp(dToHoop / 150, 0, 1));
    S.zoom += (targetZoom - S.zoom) * Math.min(1, dt * 2.2);
    const halfW = VW / (2 * S.zoom);
    const cx = S.ball.owner === 1 ? lerp(S.player.x, S.ai.x, .22) : S.player.x;
    S.cam.x += (clamp(cx, halfW, COURT.x1 - halfW + 20) - S.cam.x) * Math.min(1, dt * 3.4);
    S.cam.y += (clamp(S.player.y - 78, 82, 102) - S.cam.y) * Math.min(1, dt * 3.0);

    updatePlayer(dt);
    updateAI(dt);
    updateBall(dt);

    if (S.shot.state === 'aiming') {
      S.shot.t += dt;
      // 球权被断 / 进球 / 死球 → 自动收掉投篮条
      if (S.ball.state !== 'held' || S.ball.owner !== 0) {
        S.shot.state = 'idle'; S.shot.hold = false;
        const btn = $('bbShoot'); if (btn) btn.classList.remove('aiming');
      } else if (S.shot.t >= S.shot.dur + .32) releaseShot();   // 一直不出手 → 太晚
    }
    if (!S.over && S.roundPhase !== 'dead' && !S.ball.scored && !S.ball.flight) {
      S.shotClock -= dt;
      if (S.shotClock <= 0) deadBall('20 秒违例 · 换发球');
    }
    updateHUD();
  }

  /* ---------------- 绘制：球场（按当前皮肤主题） ---------------- */
  function glow(on, color, blur) {
    if (!on) { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; return; }
    ctx.shadowColor = color || '#8ff0ff'; ctx.shadowBlur = blur || 8;
  }

  function drawCourt() {
    const { x0, x1, y0, y1 } = COURT;
    const th = theme();
    const sk = currentSkin();
    let night = false;
    try { night = PC.State && PC.State.isNight && PC.State.isNight(); } catch (e) {}
    const glowOn = th.glow || night;

    /* 场外底色 + 皮肤专属纹理 */
    R(-60, -80, 540, 400, night && !th.glow ? '#16263a' : th.apron);
    for (let i = 0; i < 150; i++) {
      const gx = -50 + ((i * 67) % 520), gy = -60 + ((i * 43) % 360);
      if (th.deco === 'grid') {
        if (i % 2 === 0) { L(gx, gy, gx + 16, gy, 'rgba(143,240,255,.10)', 1); L(gx, gy, gx, gy + 16, 'rgba(143,240,255,.10)', 1); }
      } else if (th.deco === 'circuit') {
        R(gx, gy, 2, 2, i % 3 ? 'rgba(255,124,229,.28)' : 'rgba(127,224,200,.30)');
        if (i % 4 === 0) L(gx, gy, gx + 12, gy + 8, 'rgba(127,224,200,.16)', 1);
      } else if (th.deco === 'lantern') {
        R(gx, gy, 5, 2, i % 3 ? 'rgba(244,236,216,.10)' : 'rgba(178,59,50,.18)');
      } else {
        R(gx, gy, 3, 2, i % 3 ? th.apron2 : 'rgba(0,0,0,.10)');
      }
    }
    /* 远处教学楼 / 回廊 */
    R(20, -50, 380, 42, th.building);
    R(20, -50, 380, 4, th.line); R(20, -22, 380, 4, th.line);
    for (let q = 30; q < 392; q += 27) {
      const lit = (night || th.glow) && (q % 3 === 0);
      R(q, -41, 15, 12, lit ? th.window : th.building);
      R(q, -41, 15, 1, th.lineSoft);
      if (lit) R(q + 2, -39, 11, 8, th.deco === 'circuit' ? '#ff7ce5' : '#f4d98a');
    }
    if (th.deco === 'lantern') {
      for (let q = 44; q < 390; q += 54) {
        R(q - 1, -22, 2, 5, '#4a3028'); O(q, -16, 4, 5, '#b23b32');
        R(q - 3, -18, 6, 1, '#e8c98a'); R(q - 1, -11, 2, 4, '#e8c98a');
      }
    }
    /* 场边护栏 */
    for (let q = 0; q < 22; q++) {
      const fx = 8 + q * 21;
      L(fx, y0 - 20, fx + 10, y0 - 6, th.lineSoft, 1);
      L(fx + 10, y0 - 20, fx, y0 - 6, th.lineSoft, 1);
    }
    R(4, y0 - 22, 412, 1, th.lineSoft);
    if (th.glow) { glow(true, th.line, 6); R(4, y0 - 22, 412, 2, th.line); glow(false); }

    /* 广告板 */
    const ads = th.deco === 'ancient' || th.deco === 'lantern'
      ? ['汾陽中學', '激發潛能', '籃球 · 四片', '秦磷 · 體育課', '洪果 · 校長']
      : th.deco === 'circuit'
      ? ['NEON  HS', '921 // SAFE', 'INFINITE LV', 'CYBER  HOOP', '秦磷 // P.E.']
      : th.deco === 'grid'
      ? ['FENYANG HS', '921 · SENSOR', 'INFINITE LV', 'TECH  ARENA', '秦磷 · P.E.']
      : ['FENYANG  HS', '921  ·  SAFE LINE', 'INFINITE LIVES', 'SPALDING', '秦磷 · 体育课'];
    for (let q = 0; q < 5; q++) {
      const ax = x0 + q * 76;
      R(ax, y1 + 6, 72, 12, th.ads[q % 2]);
      R(ax, y1 + 6, 72, 2, th.line);
      txt(ads[q], ax + 36, y1 + 8, 5.5, th.text, 'center', true);
    }

    /* 场地底色 + 皮肤纹理 */
    R(x0 - 10, y0 - 2, x1 - x0 + 20, y1 - y0 + 12, th.skirt);
    R(x0, y0, x1 - x0, y1 - y0, th.floor);
    R(x0 + 4, y0 + 4, x1 - x0 - 8, y1 - y0 - 8, th.floor2);
    for (let i = 0; i < 300; i++) {
      const qx = x0 + ((i * 71) % (x1 - x0)), qy = y0 + ((i * 53) % (y1 - y0));
      if (th.pattern === 'grid') {
        if (i % 5 === 0) { L(qx, qy, qx + 8, qy, 'rgba(143,240,255,.09)', 1); L(qx, qy, qx, qy + 8, 'rgba(143,240,255,.09)', 1); }
      } else if (th.pattern === 'circuit') {
        R(qx, qy, 2, 2, i % 4 ? 'rgba(255,124,229,.20)' : 'rgba(127,224,200,.24)');
        if (i % 7 === 0) L(qx, qy, qx + 14, qy + 6, 'rgba(127,224,200,.20)', 1);
      } else if (th.pattern === 'brick') {
        R(qx, qy, 7, 2, i % 2 ? 'rgba(244,236,216,.11)' : 'rgba(60,52,40,.12)');
      } else {
        R(qx, qy, 3, 1, i % 3 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)');
      }
    }
    R(x0, y0, x1 - x0, 3, 'rgba(255,255,255,.06)');

    /* 线条 */
    const W = th.line;
    if (th.glow) glow(true, W, 7);
    ctx.strokeStyle = W; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    L(x0, 232, x1, 232, W, 2);
    L(HOOP.x - R3, y0, HOOP.x - R3, HOOP.y + 26, W, 2);
    L(HOOP.x + R3, y0, HOOP.x + R3, HOOP.y + 26, W, 2);
    strokeO(HOOP.x, HOOP.y, R3, R3, W, 2, Math.PI * .18, Math.PI * .82);
    ctx.strokeRect(HOOP.x - 32, y0, 64, 96);
    strokeO(HOOP.x, 102, 32, 32, W, 2, 0, Math.PI);
    ctx.setLineDash([5, 4]); strokeO(HOOP.x, 102, 32, 32, W, 1.5, Math.PI, 0); ctx.setLineDash([]);
    strokeO(HOOP.x, HOOP.y + 6, 20, 9, th.lineSoft, 1.5, 0, Math.PI);
    for (let q = 0; q < 3; q++) {
      L(HOOP.x - 40, 42 + q * 22, HOOP.x - 32, 42 + q * 22, W, 1);
      L(HOOP.x + 32, 42 + q * 22, HOOP.x + 40, 42 + q * 22, W, 1);
    }
    strokeO(HOOP.x, 232, 36, 36, W, 2, Math.PI, 0);
    glow(false);
    for (let q = 0; q < 9; q++) L(x0 + 8 + q * 44, 232, x0 + 8 + q * 44, 236, th.lineSoft, 1);

    /* 皮肤专属场边装饰 */
    if (th.deco === 'lantern') {
      for (let q = 0; q < 9; q++) {
        const tx = 6 + q * 52;
        R(tx - 1, y0 - 9, 2, 9, '#5d4632');
        O(tx, y0 - 13, 6, 4, '#6d3f38');            // 瓦檐
        O(tx, y0 - 6, 4, 5, '#b23b32');            // 灯笼
        R(tx - 3, y0 - 8, 6, 1, '#e8c98a');
      }
      for (let q = 0; q < 4; q++) { R(x1 + 8, 58 + q * 44, 18, 4, '#6d3f38'); R(x1 + 8, 54 + q * 44, 18, 3, '#8a6540'); }
    } else if (th.deco === 'grid') {
      for (let q = 0; q < 9; q++) {
        const tx = 6 + q * 52;
        R(tx, y0 - 16, 2, 16, '#8f92b5');
        C(tx + 1, y0 - 17, 3, th.accent);
        if (th.glow) { glow(true, th.accent, 9); C(tx + 1, y0 - 17, 2, '#e9ffff'); glow(false); }
      }
    } else if (th.deco === 'circuit') {
      for (let q = 0; q < 9; q++) {
        const tx = 6 + q * 52;
        R(tx - 1, y0 - 12, 2, 12, '#7fe0c8');
        C(tx, y0 - 13, 2.5, q % 2 ? '#ff7ce5' : '#7fe0c8');
        glow(true, q % 2 ? '#ff7ce5' : '#7fe0c8', 10); C(tx, y0 - 13, 1.5, '#fff'); glow(false);
      }
    } else {
      for (let q = 0; q < 9; q++) {
        const tx = 6 + q * 52;
        O(tx, y0 - 7, 9, 7, '#3f6b4a'); O(tx + 4, y0 - 11, 6, 5, '#4e7c52');
        R(tx - 1, y0 - 7, 2, 7, '#6b4a2f');
      }
      for (let q = 0; q < 4; q++) {
        R(x1 + 8, 60 + q * 44, 18, 5, '#8a6540'); R(x1 + 8, 56 + q * 44, 18, 4, '#c9a97e');
        R(x1 + 16, 56 + q * 44, 2, 9, '#c9a97e');
      }
    }
    for (let q = 0; q < 3; q++) {
      const lx = 60 + q * 130;
      R(lx, y1 - 4, 2, 16, th.accent);
      C(lx + 1, y1 - 6, 3, night || th.glow ? th.text : th.line);
      if (night || th.glow) { glow(true, th.accent, 10); O(lx + 1, y1 - 6, 12, 8, 'rgba(255,255,255,.07)'); glow(false); }
    }

    /* 世界内小记分牌 + 皮肤铭牌 */
    R(x0 + 6, y1 - 26, 74, 20, 'rgba(10,12,34,.82)');
    R(x0 + 6, y1 - 26, 74, 2, th.accent);
    txt('YOU  ' + S.score[0] + ' : ' + S.score[1] + '  秦磷', x0 + 43, y1 - 23, 6, th.text, 'center', true);
    txt(diff.en + '  ·  ' + Math.ceil(Math.max(0, S.shotClock)) + 's', x0 + 43, y1 - 14, 5, th.lineSoft, 'center');
    txt(sk.icon + ' ' + sk.en, x1 - 8, y1 - 24, 6, th.accent, 'right', true);

    drawHoop();
  }

  function drawHoop() {
    const th = theme(), hy = HOOP.y - HOOP.z * .55;
    // 支架
    R(HOOP.x - 2, hy - 15, 4, 13, th.accent);
    R(HOOP.x - 9, hy - 16, 18, 2, th.line);
    // 背板
    R(HOOP.x - 28, hy - 10, 56, 4, th.line);
    R(HOOP.x - 26, hy - 8, 52, 10, th.board);
    R(HOOP.x - 26, hy - 8, 52, 2, th.line);
    L(HOOP.x - 26, hy + 2, HOOP.x + 26, hy + 2, th.lineSoft, 1);
    L(HOOP.x - 26, hy - 8, HOOP.x - 26, hy + 2, th.lineSoft, 1);
    L(HOOP.x + 26, hy - 8, HOOP.x + 26, hy + 2, th.lineSoft, 1);
    ctx.strokeStyle = th.rim; ctx.lineWidth = 2;
    ctx.strokeRect(HOOP.x - 11, hy - 6, 22, 8);
    R(HOOP.x - 1, hy, 2, 3, th.accent);
    // 篮圈
    if (th.glow) glow(true, th.rim, 9);
    O(HOOP.x, hy + 3, HOOP.r + 2.5, 5, th.rim);
    O(HOOP.x, hy + 3, HOOP.r + 1.5, 3.7, th.rim);
    O(HOOP.x, hy + 3, HOOP.r - 1.5, 2.3, th.floor);
    glow(false);
    // 网：12 根，进球时摆动
    const w = S.netWave > 0 ? Math.sin(S.t * 26) * S.netWave * 2.4 : 0;
    for (let q = -5; q <= 5; q++) {
      const bx = HOOP.x + q * 1.8;
      L(bx, hy + 3, bx * .78 + HOOP.x * .22 + w * (q / 5), hy + 13 + Math.abs(q) * .2, th.net, 1);
    }
    strokeO(HOOP.x + w * .5, hy + 7, 6, 2, th.net, 1);
    strokeO(HOOP.x + w, hy + 13, 3.5, 1.4, th.net, 1);
    L(HOOP.x - 9, hy + 6, HOOP.x + 9, hy + 6, th.lineSoft, 1);
  }

  /* ---------------- 绘制：人物 ---------------- */
  function drawPerson(p, isAI) {
    const sk = isAI ? PC.BBALL_NPC.skin : '#f2c39a';
    const hr = isAI ? PC.BBALL_NPC.hair : '#2a2a3e';
    const jersey = isAI ? PC.BBALL_NPC.color : '#4fb8a8';
    const shorts = isAI ? PC.BBALL_NPC.shorts : '#2a2a5e';
    const num = isAI ? '7' : '1';
    const x = p.x, y = p.y, jh = p.jumpH || 0, lean = p.lean || 0;
    const yy = y - jh;
    // 影子
    O(x, y + 1, 8 + jh * .12, 2.5, 'rgba(10,20,30,.35)');
    // 动作残影
    if (p.act) {
      for (let i = 1; i <= 3; i++) {
        O(x - p.act.dx * i * 5 - lean * i * 2, yy - p.act.dy * i * 3, 7 - i, 2.4,
          'rgba(255,210,90,' + (.20 - i * .05).toFixed(2) + ')');
      }
    }
    ctx.save();
    ctx.translate(x, yy);
    if (lean) ctx.rotate(lean * .12);
    const px = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(dx), Math.round(dy), Math.round(w), Math.round(h)); };
    const pose = p.pose || 'idle';
    const step = p.frame ? 1 : 0;
    const shooting = pose === 'shoot' || pose === 'gather';
    const armsUp = shooting || p.handsUp > 0;

    // 腿
    if (shooting || jh > 4) {
      px(-5, -5, 3, 5, sk); px(2, -5, 3, 5, sk);          // 收腿起跳
      px(-5, -3, 3, 3, shorts); px(2, -3, 3, 3, shorts);
    } else {
      px(-5 + step, -6, 3, 6, sk); px(2 - step, -6, 3, 6, sk);
      px(-5 + step, -4, 3, 4, shorts); px(2 - step, -4, 3, 4, shorts);
    }
    px(-6 + step, -1, 4, 2, '#1b1c3a'); px(2 - step, -1, 4, 2, '#1b1c3a');
    px(-6 + step, -1, 4, 1, '#e9e0cc'); px(2 - step, -1, 4, 1, '#e9e0cc');
    // 身体
    px(-5, -14, 10, 9, jersey); px(-5, -14, 10, 2, '#f4f1e4');
    px(-1, -12, 2, 5, isAI ? '#c2453f' : '#fff3c4');
    txt(num, 0, -12, 6, '#10122b', 'center', true);
    // 手臂
    if (armsUp) {
      px(-8, -20, 2, 8, sk); px(6, -20, 2, 8, sk);
      px(-8, -21, 2, 2, jersey); px(6, -21, 2, 2, jersey);
      if (shooting) { C(-7, -21, 1.6, sk); C(7, -21, 1.6, sk); }
    } else if (pose === 'defend') {
      px(-9, -14, 3, 3, sk); px(6, -14, 3, 3, sk);
      px(-10, -15, 2, 4, jersey); px(8, -15, 2, 4, jersey);
    } else {
      const swing = step ? 1 : -1;
      px(-7, -13 + swing, 2, 6, sk); px(5, -13 - swing, 2, 6, sk);
      px(-7, -13 + swing, 2, 2, jersey); px(5, -13 - swing, 2, 2, jersey);
    }
    // 头
    px(-4, -21, 8, 7, sk);
    px(-4, -21, 8, 2, hr); px(-5, -20, 2, 3, hr);
    if (isAI) { px(-4, -22, 8, 1.5, '#e2564d'); px(3, -22, 2, 1.5, '#fff3c4'); }  // 发带
    px(-3, -18, 1, 1, '#1b1c3a'); px(2, -18, 1, 1, '#1b1c3a');
    ctx.restore();
    // 名牌
    txt(isAI ? '秦磷 · 7' : 'YOU · 1', x, y + 3, 6, isAI ? '#ffd25a' : '#7fe0c8', 'center', true);
    if (p.act) txt(p.act.en, x, yy - 30, 6, '#fff3c4', 'center', true);
    if (p.handsUp > 0) txt('✋', x + 10, yy - 20, 8, '#7fe0c8', 'center', true);
    if (p.stun > 0) txt('×', x, yy - 28, 9, '#e2564d', 'center', true);
  }

  function drawBall() {
    const b = S.ball;
    const sy = b.y - b.z * .55;
    const f = clamp(1 - b.z / 90, .12, .75);
    O(b.x, b.y + 2, 5 + b.z * .035, 2 + b.z * .012, 'rgba(6,14,20,' + f.toFixed(2) + ')');
    const r = 4.4 + b.z * .012;
    C(b.x, sy, r, '#b85a26'); C(b.x - 1, sy - 1, r - 1.4, '#ef8b43');
    ctx.save(); ctx.translate(b.x, sy); ctx.rotate(b.spin);
    ctx.strokeStyle = '#3b2a2a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * .75, -.9, .9); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * .75, Math.PI - .9, Math.PI + .9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
    ctx.restore();
    C(b.x - 1.4, sy - 1.6, .8, 'rgba(255,240,200,.55)');
  }

  function drawShotMeter() {
    if (S.shot.state !== 'aiming') return;
    const p = S.player, z = S.zoom;
    const sx = (p.x - S.cam.x) * z + VW / 2, sy = (p.y - S.cam.y) * z + VH / 2;
    const bx = clamp(sx + 20, 8, VW - 26), by = clamp(sy - 42, 12, VH - 66);
    const q = clamp(S.shot.t / S.shot.dur, 0, 1);
    const idx = Math.max(0, (PC.BBALL_DIFFS || []).indexOf(diff));
    const perfect = .62, width = .085 - idx * .007;
    R(bx - 4, by - 4, 18, 60, 'rgba(10,12,34,.88)');
    R(bx - 4, by - 4, 18, 2, '#5b57ad');
    R(bx, by, 10, 52, '#2a2a5e');
    R(bx + 1, by + 52 * (1 - (perfect + width)), 8, 52 * width * 2, '#4caf7d');
    R(bx + 1, by + 52 * (1 - (perfect + .028)), 8, 52 * .056, '#b6ffe4');
    R(bx - 2, by + 52 * (1 - q) - 1.5, 14, 3, '#fff3c4');
    txt('PERFECT', bx + 5, by - 12, 6, '#7fe0c8', 'center', true);
    txt('松手 / 再点', bx + 5, by + 54, 5.5, '#e9d9b8', 'center');
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // letterbox 外：竖屏填成草地/看台延伸，避免上下大黑边；横屏保留深色看台
    const portrait = cv.height > cv.width;
    let night = false;
    try { night = PC.State && PC.State.isNight && PC.State.isNight(); } catch (e) {}
    if (portrait) {
      const th0 = theme(); ctx.fillStyle = night && !th0.glow ? '#16263a' : th0.apron;
      ctx.fillRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < 220; i++) {
        const gx = (i * 97) % cv.width, gy = (i * 61) % cv.height;
        ctx.fillStyle = i % 3 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.07)';
        ctx.fillRect(gx, gy, 5, 3);
      }
      // 看台横线
      ctx.fillStyle = 'rgba(233,224,204,.07)';
      for (let q = 0; q < 8; q++) ctx.fillRect(0, q * 74, cv.width, 2);
    } else {
      ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, cv.width, cv.height);
    }
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offX, offY);
    ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.clip();
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    ctx.translate(VW / 2, VH / 2); ctx.scale(S.zoom, S.zoom); ctx.translate(-S.cam.x, -S.cam.y);
    drawCourt();
    const list = [{ p: S.player, ai: false, y: S.player.y }, { p: S.ai, ai: true, y: S.ai.y }];
    list.sort((a, b) => a.y - b.y);
    list.forEach(o => drawPerson(o.p, o.ai));
    drawBall();
    // 进球粒子
    S.particles.forEach(q => { C(q.x, q.y, 1.2, q.c); });
    ctx.restore();

    drawShotMeter();
    // 屏幕层 HUD
    if (S.shot.resultT > 0 && S.shot.result) txt(S.shot.result.key, VW / 2, 54, 9, S.shot.result.col, 'center', true);
    if (S.ball.state === 'held') {
      const owner0 = S.ball.owner === 0;
      txt(owner0 ? '● 你持球' : '● 秦磷持球 · 防守！', 8, 8, 7, owner0 ? '#7fe0c8' : '#ff8a7a', 'left', true);
    }
    const cw = clamp(S.shotClock / 20, 0, 1);
    R(VW - 8 - 60, 8, 60, 5, 'rgba(10,12,34,.8)');
    R(VW - 8 - 60, 8, 60 * cw, 5, S.shotClock < 5 ? '#e2564d' : '#ffd25a');
    txt(Math.ceil(Math.max(0, S.shotClock)) + 's', VW - 8, 15, 6, '#e9d9b8', 'right');
    if (S.ready > 0 && !S.over) txt('CHECK BALL…', VW / 2, VH / 2 + 44, 6, 'rgba(233,217,184,.75)', 'center');
    if (S.over) {
      R(VW / 2 - 92, VH / 2 - 30, 184, 60, 'rgba(10,12,34,.84)');
      txt('↻ 重开　　⏹ 退出', VW / 2, VH / 2 + 10, 8, '#fff3c4', 'center', true);
    }
    if (night) R(0, 0, VW, VH, 'rgba(11,16,48,.20)');
    ctx.restore();
  }

  function loop(ts) {
    if (!active) return;
    const dt = Math.min((ts - last) / 1000 || .016, .05); last = ts;
    update(dt); draw();
    raf = requestAnimationFrame(loop);
  }

  /* ---------------- 输入 ---------------- */
  function bindPad(el, onChange, onDir) {
    if (!el) return;
    const knob = el.querySelector('.bb-knob');
    let pid = null;
    const apply = (dx, dy) => {
      if (knob) { knob.style.left = (50 + dx * 31) + '%'; knob.style.top = (50 + dy * 31) + '%'; }
      onChange(dx, dy);
    };
    const set = e => {
      const r = el.getBoundingClientRect();
      let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
      apply(dx, dy);
      if (onDir) {
        let d = 'none';
        if (l > .62) {
          if (dy < -.42 && dx < -.42) d = 'ul'; else if (dy < -.42 && dx > .42) d = 'ur';
          else if (dy > .42 && dx < -.42) d = 'dl'; else if (dy > .42 && dx > .42) d = 'dr';
          else if (dy < -.5) d = 'up'; else if (dy > .5) d = 'down';
          else if (dx < -.5) d = 'left'; else if (dx > .5) d = 'right';
        }
        onDir(d, l);
      }
    };
    el.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; try { el.setPointerCapture(pid); } catch (err) {} set(e); });
    el.addEventListener('pointermove', e => { if (e.pointerId === pid) { e.preventDefault(); set(e); } });
    const end = e => { if (e.pointerId !== pid) return; pid = null; apply(0, 0); if (onDir) onDir('none', 0); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('lostpointercapture', end);
  }

  function bindUI() {
    if (uiBound) return; uiBound = true;
    bindPad($('bbMove'), (dx, dy) => { if (S) { S.input.mx = dx; S.input.my = dy; } });
    bindPad($('bbAct'), (dx, dy) => { if (S) { S.input.ax = dx; S.input.ay = dy; } },
      d => {
        if (!S || d === 'none') { if (S) S.input.lastDir = 'none'; return; }
        if (d !== S.input.lastDir) { S.input.lastDir = d; doAction(d); }
      });
    /* 投篮：按住蓄力松手出手；短按保留条等第二次点击 */
    const shoot = $('bbShoot');
    if (shoot) {
      shoot.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); shootDown(); });
      window.addEventListener('pointerup', e => { if (active) shootUp(); });
      shoot.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
    }
    const bind = (id, fn) => { const el = $(id); el && el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fn(); }); };
    bind('bbSteal', trySteal);
    bind('bbBlock', tryRebound);
    bind('bbRestart', () => { if (!active) return; reset(); flash('↻ 重新开球 · ' + diff.name, '#fff3c4', 1.2); sfx('whistle'); });
    bind('bbExit', stop);
    window.addEventListener('resize', () => { if (active) resize(); });
  }

  function bindKeys() {
    if (bound) return; bound = true;
    const MOVE = { w: 'u', a: 'l', s: 'd', d: 'r', arrowup: 'u', arrowleft: 'l', arrowdown: 'd', arrowright: 'r' };
    const ACT = { q: 'up', e: 'down', z: 'left', c: 'right', '1': 'up', '2': 'down', '3': 'left', '4': 'right', '5': 'ul', '6': 'ur' };
    window.addEventListener('keydown', e => {
      if (!active || !S) return;
      const k = e.key.toLowerCase();
      if (MOVE[k]) { S.keys[MOVE[k]] = true; e.preventDefault(); return; }
      if (k === ' ') { e.preventDefault(); if (!e.repeat) shootDown(); return; }
      if (k === 'f') { e.preventDefault(); trySteal(); return; }
      if (k === 'g') { e.preventDefault(); tryRebound(); return; }
      if (k === 'escape') { e.preventDefault(); stop(); return; }
      if (k === 'r') { e.preventDefault(); reset(); return; }
      if (ACT[k]) { e.preventDefault(); doAction(ACT[k]); }
    });
    window.addEventListener('keyup', e => {
      if (!active || !S) return;
      const k = e.key.toLowerCase();
      if (MOVE[k]) S.keys[MOVE[k]] = false;
      if (k === ' ') { e.preventDefault(); shootUp(); }
    });
    window.addEventListener('blur', () => { if (S) { S.keys = {}; S.input.mx = S.input.my = S.input.ax = S.input.ay = 0; if (S.shot.hold) shootUp(); } });
  }

  /* ---------------- 对外 ---------------- */
  function reset() {
    S = fresh();
    serve(0, '');
    S.paused = false;
    updateHUD();
  }

  function start(diffId) {
    if (active) return;
    diff = (PC.BBALL_DIFFS || []).find(d => d.id === diffId) || PC.BBALL_DIFFS[1];
    wrap = $('bbOverlay'); cv = $('bbCanvas');
    if (!wrap || !cv) return;
    ctx = cv.getContext('2d');
    const help = $('help');
    helpHiddenByUs = !!(help && !help.classList.contains('hidden'));
    if (helpHiddenByUs) help.classList.add('hidden');
    wrap.classList.remove('hidden', 'bb-out');
    wrap.setAttribute('aria-hidden', 'false');
    wrap.classList.add('bb-in');
    resize(); bindUI(); bindKeys();
    reset();
    active = true;
    try { PC.Orientation && PC.Orientation.hide && PC.Orientation.hide(); } catch (e) {}
    bbMusicStart();
    last = performance.now();
    raf = requestAnimationFrame(loop);
    setTimeout(() => { if (active) wrap.classList.remove('bb-in'); }, 90);
    flash('🏀 汾阳中学 · 半场\n' + diff.name + ' / ' + diff.en, '#fff3c4', 1.5, true);
    sfx('whistle'); updateHUD();
  }

  function stop() {
    if (!active) return;
    const unlocked = recordGame();          // 中途退出：打满一球或打够时间也算一局
    active = false;
    bbMusicStop();
    // 解锁结果已经在局末大字里呈现，退出时不再另弹提示
    try { PC.Orientation && PC.Orientation.sync && PC.Orientation.sync(); } catch (e) {}
    cancelAnimationFrame(raf);
    if (wrap) {
      wrap.classList.remove('bb-in'); wrap.classList.add('bb-out');
      setTimeout(() => { if (!active && wrap) { wrap.classList.add('hidden'); wrap.classList.remove('bb-out'); wrap.setAttribute('aria-hidden', 'true'); } }, 520);
    }
    if (helpHiddenByUs) { const h = $('help'); h && h.classList.remove('hidden'); helpHiddenByUs = false; }
    if (S) { S.keys = {}; S.input.mx = S.input.my = S.input.ax = S.input.ay = 0; }
    const el = $('bbCenterMsg'); el && el.classList.remove('on');
    if (typeof onExit === 'function') { const f = onExit; onExit = null; try { f(); } catch (e) {} }
    try { PC.UI && PC.UI.updateHUD && PC.UI.updateHUD(); } catch (e) {}
  }

  PC.Basketball = {
    start, stop,
    reset: () => { if (active) { reset(); flash('↻ 重新开球', '#fff3c4', 1.1); } },
    setOnExit: fn => { onExit = fn; },
    get active() { return active; },
    get diff() { return diff; },
    get state() { return S; },
    get musicKey() { return bbMusicKey; },
    progress: () => { const pr = loadProg(); return { games: pr.games, skin: pr.skin, seen: pr.seen.slice() }; },
    bonuses,
    skins,
    skin: currentSkin,
    setSkin,
    theme,
    _recordGame: recordGame,
    _setGames: n => { const pr = loadProg(); pr.games = Math.max(0, parseInt(n, 10) || 0);
      skins().forEach(k => { if (pr.games >= k.need && pr.seen.indexOf(k.id) < 0) pr.seen.push(k.id); });
      saveProg(); return pr.games; },
    _shoot: shootClick, _shootDown: shootDown, _shootUp: shootUp,
    _steal: trySteal, _rebound: tryRebound, _action: doAction,
    _update: dt => { if (active && S) { update(dt); draw(); } },
    _serve: who => { if (active && S) serve(who, ''); }
  };
})();
