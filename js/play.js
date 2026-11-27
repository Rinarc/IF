/* play.js —— 无限極人生 · 可玩性系统
 * 人生等级 / 每日挑战 / 收集图鉴 / NPC 好感 / 三个真能点的小游戏 / 扭蛋
 * 不改动原有赚钱与状态模块，只通过 mark() 埋点与 passive() 提供被动加成。
 */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U;

  const LEVELS = [
    { xp: 0,    rank: 'D',  title: '刚下地铁的人' },
    { xp: 60,   rank: 'D+', title: '认得路的街坊' },
    { xp: 160,  rank: 'C',  title: '有两家熟店' },
    { xp: 340,  rank: 'C+', title: '街区常客' },
    { xp: 620,  rank: 'B',  title: '会过日子的人' },
    { xp: 1000, rank: 'B+', title: '曙光路通' },
    { xp: 1500, rank: 'A',  title: '两头都熟' },
    { xp: 2200, rank: 'A+', title: '林景园业主' },
    { xp: 3200, rank: 'S',  title: '无限極居民' },
    { xp: 4600, rank: 'S+', title: '街区传说' },
    { xp: 6500, rank: '∞',  title: '这条街就是你' }
  ];

  const CHALLENGES = [
    { id: 'c_shops',  title: '逛 3 家店',        stat: 'shops',  goal: 3,   money: 120, xp: 30, tip: '进任意店铺就算' },
    { id: 'c_buy',    title: '买 2 件东西',      stat: 'bought', goal: 2,   money: 90,  xp: 25, tip: '柜台按 A 买点什么' },
    { id: 'c_steps',  title: '走 400 步',        stat: 'steps',  goal: 400, money: 110, xp: 30, tip: '摇杆 / WASD 走起来' },
    { id: 'c_earn',   title: '今天赚 ¥200',      stat: 'earned', goal: 200, money: 150, xp: 40, tip: '打工 / 委托 / 房租都算' },
    { id: 'c_events', title: '遇到 2 个随机事件', stat: 'events', goal: 2,   money: 100, xp: 25, tip: '走动时会自动触发' },
    { id: 'c_games',  title: '玩 1 次小游戏',    stat: 'games',  goal: 1,   money: 130, xp: 35, tip: '街机 / 捞锦鲤' },
    { id: 'c_photos', title: '拍 2 处打卡点',    stat: 'photos', goal: 2,   money: 110, xp: 30, tip: '找地上发亮的相机标记' },
    { id: 'c_jobs',   title: '打 2 份工',        stat: 'jobs',   goal: 2,   money: 140, xp: 40, tip: '店铺 / 小区 / 地铁零工' },
    { id: 'c_ride',   title: '坐 1 次地铁',      stat: 'ride',   goal: 1,   money: 90,  xp: 25, tip: '曙光路站买票上车' },
    { id: 'c_gacha',  title: '抽 1 次扭蛋',      stat: 'gacha',  goal: 1,   money: 80,  xp: 20, tip: '街边 / 小区 / 地下街都有' },
    { id: 'c_bond',   title: '和 2 位街坊聊聊',  stat: 'bond',   goal: 2,   money: 100, xp: 30, tip: '走到 NPC 旁边按 A' },
    { id: 'c_estate', title: '回一次家',         stat: 'home',   goal: 1,   money: 90,  xp: 25, tip: '手机里也能一键回家' }
  ];
  const BY_CH = Object.create(null); CHALLENGES.forEach(c => BY_CH[c.id] = c);

  const PHOTO_SPOTS = {
    shuguang_cross: '曙光路 · 街口', linjing_gate: '林景园 · 西洋风大门',
    fenyang_gate: '汾阳中学 · 新校门',
    bus921: '迂龙路 · 921 路站牌', road_slogan: '迂龙路 · 道路千万条',
    tram: '迂龙路 · 有轨电车站台', linjing_pond: '林景园 · 中央水池',
    underground: '地下小吃一条街'
  };

  const BOND_LINES = {
    1: '「哦，是你啊。今天也在这条街上转？」',
    2: '「上次那件事我还记着，谢啦。」',
    3: '「要是缺什么，我这儿有张券你拿去。」',
    4: '「在这条街上，你算是我少数能叫出名字的人。」',
    5: '「别的不说，你走过的地方我都记得。」'
  };

  function emptyDaily() {
    return { shops: 0, bought: 0, steps: 0, earned: 0, events: 0, games: 0,
      photos: 0, jobs: 0, ride: 0, gacha: 0, bond: 0, home: 0 };
  }
  function ensure(d) {
    if (!d.play || typeof d.play !== 'object') d.play = {
      xp: 0, seenLevel: 0, day: 0, challenges: [], claimed: [],
      col: { shops: [], items: [], events: [], photos: [], estates: [] },
      colReward: [], npc: {}, best: { coins: 0, fish: 0 },
      games: 0, gachaCount: 0, today: emptyDaily()
    };
    const p = d.play;
    p.col = Object.assign({ shops: [], items: [], events: [], photos: [], estates: [] }, p.col || {});
    ['shops', 'items', 'events', 'photos', 'estates'].forEach(k => { if (!Array.isArray(p.col[k])) p.col[k] = []; });
    if (!Array.isArray(p.colReward)) p.colReward = [];
    if (!Array.isArray(p.claimed)) p.claimed = [];
    if (!Array.isArray(p.challenges)) p.challenges = [];
    if (!p.npc || typeof p.npc !== 'object') p.npc = {};
    if (!p.best) p.best = { coins: 0, fish: 0 };
    p.today = Object.assign(emptyDaily(), p.today || {});
    if (typeof p.xp !== 'number') p.xp = 0;
    if (typeof p.seenLevel !== 'number') p.seenLevel = 0;
    if (p.day !== d.day) { p.day = d.day; newDay(d, true); }
    return p;
  }
  function pickChallenges(d) {
    // 按「天数 + 存档」做确定性抽取，刷新不换题
    const seed = d.day * 7919 + (d.stats ? Math.round((d.stats.shops || 0) * 3) : 0);
    const ids = CHALLENGES.map(c => c.id);
    const out = [];
    for (let i = 0; i < 3; i++) out.push(ids[(seed + i * 4 + i * i * 3) % ids.length]);
    return [...new Set(out)].slice(0, 3);
  }
  function newDay(d, silent) {
    const p = ensure(d);
    p.day = d.day;
    p.today = emptyDaily();
    p.claimed = [];
    p.challenges = pickChallenges(d);
    if (!silent) PC.State.logMsg('第 ' + d.day + ' 天 · 人生目标板刷新了 3 条新挑战');
  }

  /* ---------- 等级 / 被动 ---------- */
  function levelOf(xp) {
    let lv = 0;
    for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) lv = i;
    return lv;
  }
  function levelInfo() {
    const d = PC.State.d(), p = ensure(d), lv = levelOf(p.xp);
    const cur = LEVELS[lv], next = LEVELS[lv + 1];
    return {
      lv, rank: cur.rank, title: cur.title, xp: Math.round(p.xp),
      curXp: cur.xp, nextXp: next ? next.xp : cur.xp,
      pct: next ? U.clamp((p.xp - cur.xp) / (next.xp - cur.xp), 0, 1) : 1,
      max: !next
    };
  }
  function passive(key) {
    const lv = levelOf(ensure(PC.State.d()).xp);
    if (key === 'discount') return lv >= 6 ? .88 : lv >= 3 ? .95 : 1;
    if (key === 'stamina') return lv >= 1 ? (lv >= 8 ? .82 : .92) : 1;
    if (key === 'bonus') return 1 + Math.min(.25, lv * .025);
    if (key === 'challenge') return 1 + Math.min(.4, lv * .05);
    return 1;
  }
  function xpAdd(n, why) {
    const d = PC.State.d(), p = ensure(d), before = levelOf(p.xp);
    p.xp += Math.max(0, Math.round(n));
    const after = levelOf(p.xp);
    if (after > before) {
      const L = LEVELS[after];
      PC.State.logMsg('人生等级升到 ' + L.rank + ' · 「' + L.title + '」');
      if (PC.UI) PC.UI.toast('⭐ 升级！' + L.rank + ' · ' + L.title + '　' + levelPerk(after));
      if (PC.Audio) PC.Audio.sfx('ach');
      d.money += 40 * after;                    // 升级礼金
      p.seenLevel = after;
    }
    if (why && PC.UI && U.chance(.12)) PC.UI.toast('✦ ' + why + '　经验 +' + Math.round(n));
    PC.State.save();
  }
  function levelPerk(lv) {
    const a = [];
    if (lv >= 1) a.push('体力消耗降低');
    if (lv >= 3) a.push('购物折扣');
    if (lv >= 5) a.push('挑战奖励提升');
    if (lv >= 6) a.push('全场 88 折');
    if (lv >= 8) a.push('体力消耗再降');
    return a.length ? '解锁：' + a[a.length - 1] : '继续逛';
  }

  /* ---------- 埋点 ---------- */
  function mark(stat, id, n) {
    const d = PC.State.d(), p = ensure(d), v = n === undefined ? 1 : n;
    if (stat in p.today) p.today[stat] += v;
    if (stat === 'earned') p.today.earned = d.earnedToday || 0;
    // 收集图鉴
    if (id) {
      const map = { shop: 'shops', item: 'items', event: 'events', photo: 'photos', estate: 'estates' };
      const key = map[stat];
      if (key && p.col[key].indexOf(id) < 0) {
        p.col[key].push(id);
        const names = { shop: '店铺', item: '商品', event: '事件', photo: '打卡点', estate: '房产' };
        if (PC.UI) PC.UI.toast('📖 图鉴 +1 · ' + names[stat] + '（' + p.col[key].length + '）');
        xpAdd(8, '图鉴');
      }
    }
    if (stat !== 'steps') xpAdd(stat === 'games' ? 12 : stat === 'jobs' ? 10 : 3, '日常');
    // 挑战完成提示
    p.challenges.forEach(cid => {
      const c = BY_CH[cid];
      if (c && !p.claimed.includes(cid) && progress(d, c) >= c.goal) {
        if (PC.UI) PC.UI.toast('🎯 挑战完成：' + c.title + '　去目标板领奖');
      }
    });
    PC.State.save();
  }
  function progress(d, c) {
    const p = ensure(d);
    if (c.stat === 'earned') return Math.round(d.earnedToday || 0);
    return Math.round(p.today[c.stat] || 0);
  }
  function claim(cid) {
    const d = PC.State.d(), p = ensure(d), c = BY_CH[cid];
    if (!c || p.challenges.indexOf(cid) < 0) return { ok: false, msg: '这条挑战今天没刷出来。' };
    if (p.claimed.includes(cid)) return { ok: false, msg: '已经领过了。' };
    if (progress(d, c) < c.goal) return { ok: false, msg: '还差 ' + (c.goal - progress(d, c)) + '，再逛逛。' };
    p.claimed.push(cid);
    const m = Math.round(c.money * passive('challenge'));
    d.money += m; d.earnedToday = (d.earnedToday || 0) + m; d.earnedTotal = (d.earnedTotal || 0) + m;
    PC.State.logMsg('完成每日挑战「' + c.title + '」+' + U.money(m));
    PC.Audio.sfx('coin'); xpAdd(c.xp, '挑战');
    PC.State.save();
    return { ok: true, msg: '🎯 ' + c.title + ' 完成！+' + U.money(m) + ' · 经验 +' + c.xp };
  }

  /* ---------- 图鉴 ---------- */
  function totals() {
    return {
      shops: (PC.SHOPS || []).length, items: Object.keys(PC.ITEMS || {}).length,
      events: (PC.Events && PC.Events.list ? PC.Events.list.length : 0),
      photos: Object.keys(PHOTO_SPOTS).length,
      estates: (PC.Estate && PC.Estate.units ? PC.Estate.units.length : 0)
    };
  }
  function collection() {
    const p = ensure(PC.State.d()), T = totals(), out = [];
    [['shops', '🏪 店铺打卡', '走进每一家店'], ['items', '🎁 商品收集', '买下每一件东西'],
     ['events', '✦ 事件见闻', '遇到所有随机事件'], ['photos', '📸 街区相册', '拍下所有打卡点'],
     ['estates', '🏛 房产簿', '买下全部公寓与别墅']].forEach(([k, name, tip]) => {
      out.push({ key: k, name, tip, have: p.col[k].length, total: T[k],
        pct: T[k] ? p.col[k].length / T[k] : 0, done: T[k] > 0 && p.col[k].length >= T[k],
        claimed: p.colReward.indexOf(k) >= 0 });
    });
    return out;
  }
  function claimCol(k) {
    const d = PC.State.d(), p = ensure(d), row = collection().find(q => q.key === k);
    if (!row || !row.done) return { ok: false, msg: '这一页还没集齐。' };
    if (row.claimed) return { ok: false, msg: '这一页的奖励领过了。' };
    p.colReward.push(k);
    const m = { shops: 600, items: 800, events: 500, photos: 400, estates: 1200 }[k] || 400;
    d.money += m; d.earnedToday = (d.earnedToday || 0) + m; d.earnedTotal = (d.earnedTotal || 0) + m;
    d.fame += 10;
    PC.State.logMsg('集齐图鉴「' + row.name + '」奖励 ' + U.money(m));
    PC.Audio.sfx('ach'); xpAdd(120, '图鉴集齐'); PC.State.save();
    return { ok: true, msg: '📖 ' + row.name + ' 集齐！+' + U.money(m) + ' · 声望 +10 · 经验 +120' };
  }

  /* ---------- NPC 好感 ---------- */
  function bondInfo(name) {
    const p = ensure(PC.State.d()), b = p.npc[name] || { pts: 0, lv: 0, giftDay: -1 };
    const lv = Math.min(5, Math.floor(b.pts / 10));
    return { pts: b.pts, lv, next: lv >= 5 ? 0 : (lv + 1) * 10 - b.pts, max: lv >= 5 };
  }
  function bondTalk(name) {
    const d = PC.State.d(), p = ensure(d), b = p.npc[name] || (p.npc[name] = { pts: 0, lv: 0, giftDay: -1 });
    const before = Math.min(5, Math.floor(b.pts / 10));
    b.pts += 2;
    const after = Math.min(5, Math.floor(b.pts / 10));
    mark('bond');
    let extra = '';
    if (after > before) {
      const rewards = [0, 20, 40, 70, 110, 180];
      d.money += rewards[after];
      d.fame += 2;
      if (after === 3) d.coupons.mart = (d.coupons.mart || 0) + 1;
      extra = '　【好感 Lv.' + after + '】+' + U.money(rewards[after]) + ' 声望 +2';
      PC.Audio.sfx('ach');
      PC.State.logMsg('和「' + name + '」的好感升到 Lv.' + after);
    }
    PC.State.save();
    return { lv: after, line: (BOND_LINES[after] || BOND_LINES[1]) + extra };
  }
  function bondGift(name) {
    const d = PC.State.d(), p = ensure(d), b = p.npc[name] || (p.npc[name] = { pts: 0, lv: 0, giftDay: -1 });
    if (b.giftDay === d.day) return { ok: false, msg: '今天已经送过了，明天再来。' };
    if (d.money < 15) return { ok: false, msg: '买份小礼物要 ¥15。' };
    d.money -= 15; b.giftDay = d.day;
    const before = Math.min(5, Math.floor(b.pts / 10));
    b.pts += 8;
    const after = Math.min(5, Math.floor(b.pts / 10));
    d.mood = U.clamp(d.mood + 4, 0, 100);
    PC.Audio.sfx('coin'); PC.State.save();
    return { ok: true, msg: '「哎呀，还带东西来了。」好感 +8' + (after > before ? ' · 升到 Lv.' + after : '') + '，心情 +4' };
  }

  /* ---------- 打卡 / 扭蛋 ---------- */
  function photo(spot) {
    const p = ensure(PC.State.d());
    if (!PHOTO_SPOTS[spot]) return { ok: false, msg: '这里没什么好拍的。' };
    if (p.col.photos.indexOf(spot) >= 0) return { ok: false, msg: '这处已经拍过了，相册里有了。' };
    mark('photos'); mark('photo', spot);
    PC.State.addItem('postcard');
    PC.Audio.sfx('use');
    return { ok: true, msg: '📸 拍下「' + PHOTO_SPOTS[spot] + '」· 明信片 +1 · 经验 +8' };
  }
  const GACHA = [
    { w: 22, t: '一瓶水',           run: d => { PC.State.addItem('water'); } },
    { w: 16, t: '饭团 ×2',          run: d => { PC.State.addItem('onigiri', 2); } },
    { w: 12, t: '明信片 ×2',        run: d => { PC.State.addItem('postcard', 2); } },
    { w: 10, t: '街区早报',         run: d => { PC.State.addItem('newsPaper'); } },
    { w: 10, t: '8 折券（齐阵）',   run: d => { d.coupons.mart = (d.coupons.mart || 0) + 1; } },
    { w: 8,  t: '¥28 现金',         run: d => { d.money += 28; } },
    { w: 7,  t: '学识 +4',          run: d => { d.knowledge += 4; d.mood = U.clamp(d.mood + 3, 0, 100); } },
    { w: 6,  t: '体魄 +4',          run: d => { d.fitness += 4; } },
    { w: 5,  t: '考试护身符',       run: d => { PC.State.addItem('charm'); } },
    { w: 3,  t: '★ 稀有 · ¥120',    run: d => { d.money += 120; d.fame += 3; } },
    { w: 1,  t: '★★ 超稀有 · ¥480', run: d => { d.money += 480; d.fame += 10; } }
  ];
  function gacha() {
    const d = PC.State.d();
    if (d.money < 20) return { ok: false, msg: '扭蛋要 ¥20，先去赚点。' };
    d.money -= 20;
    const p = ensure(d); p.gachaCount++;
    let r = Math.random() * 100, pick = GACHA[GACHA.length - 1];
    for (const g of GACHA) { if (r < g.w) { pick = g; break; } r -= g.w; }
    pick.run(d);
    mark('gacha');
    PC.Audio.sfx('coin'); PC.State.logMsg('扭蛋开出：' + pick.t); PC.State.save();
    return { ok: true, msg: '🎰 咔哒——开出【' + pick.t + '】' };
  }

  /* ---------- 小游戏：抢金币 / 捞锦鲤 ---------- */
  let _timer = null, _state = null, _host = null;
  function hostEl() { return _host || document.getElementById('panelBody'); }
  function stopGame() {
    if (_timer) { clearInterval(_timer); _timer = null; }
    _state = null;
    const body = hostEl();
    if (body && body.onclick) body.onclick = null;
    _host = null;
  }
  function playBtn(action, label) {
    // 嵌进手机屏幕时走手机的事件通道，避免把整个手机面板冲掉
    return '<button class="mini" data-' + (_host ? 'ph' : 'play') + '="' +
      (_host && action === 'panel' ? 'app:games' : action) + '">' + label + '</button>';
  }
  function gameShell(inner) {
    return '<div class="pg-wrap"><div class="pg-head">🎮 无限極街机 · 无限極人生 OS</div>' + inner +
      '<p style="margin-top:.7em">' + playBtn('panel', _host ? '← 返回手机游戏' : '← 返回人生面板') + '</p></div>';
  }
  function startGame(kind, host) {
    stopGame();
    _host = host || null;
    const body = hostEl();
    if (!body) return;
    if (kind === 'coins') {
      _state = { kind, sec: 20, score: 0, cells: Array(9).fill(''), hit: 0 };
      body.innerHTML = gameShell(
        '<div class="pg-hud">⏱ <b id="pgSec">20</b>s　得分 <b id="pgScore">0</b>　连击 <b id="pgCombo">0</b></div>' +
        '<div class="pg-grid">' + _state.cells.map((_, i) =>
          '<button class="pg-cell" data-cell="' + i + '"></button>').join('') + '</div>' +
        '<div class="pg-tip">点亮的 <b style="color:#ffd25a">● 金币 +10</b>，<b style="color:#e2564d">✹ 炸弹 -15</b>。20 秒结束按分换钱。</div>');
      if (!_host) document.getElementById('panelTitle').textContent = '🎮 街机 · 抢金币';
      body.onclick = e => {
        const b = e.target.closest('[data-cell]'); if (!b || !_state) return;
        const i = Number(b.dataset.cell), c = _state.cells[i];
        if (c === 'coin') { _state.score += 10; _state.hit++; PC.Audio.sfx('coin'); }
        else if (c === 'bomb') { _state.score -= 15; _state.hit = 0; PC.Audio.sfx('error'); }
        else return;
        _state.cells[i] = '';
        updateCells();
      };
      _timer = setInterval(() => {
        if (!_state) return;
        _state.sec--;
        const secEl = document.getElementById('pgSec');
        if (secEl) secEl.textContent = _state.sec;
        _state.cells = Array(9).fill('');
        const n = 2 + (Math.random() < .35 ? 1 : 0);
        for (let k = 0; k < n; k++) {
          const i = U.randInt(0, 8);
          _state.cells[i] = Math.random() < .28 ? 'bomb' : 'coin';
        }
        updateCells();
        if (_state.sec <= 0) finishCoins();
      }, 620);
      updateCells();
    } else if (kind === 'fish') {
      _state = { kind, round: 1, score: 0, pos: 0, dir: 1, done: false };
      body.innerHTML = gameShell(
        '<div class="pg-hud">回合 <b id="pgRound">1</b>/5　得分 <b id="pgScore">0</b></div>' +
        '<div class="pg-pond"><div class="pg-target"></div><div class="pg-fish" id="pgFish">🐟</div></div>' +
        '<div class="pg-bar"><i id="pgBar"></i></div>' +
        '<div style="text-align:center;margin:.5em 0"><button class="mini" data-play="net">🥅 下网！</button></div>' +
        '<div class="pg-tip">锦鲤来回游，<b>按在中间绿色区</b>得 PERFECT +30，擦边 GOOD +12，空网 0。5 回合结算。</div>');
      if (!_host) document.getElementById('panelTitle').textContent = '🎣 林景园 · 捞锦鲤';
      body.onclick = e => {
        if (!e.target.closest('[data-play="net"]') || !_state || _state.done) return;
        const p = _state.pos, sc = p >= 42 && p <= 58 ? 30 : (p >= 32 && p <= 68 ? 12 : 0);
        _state.score += sc;
        PC.Audio.sfx(sc ? 'coin' : 'error');
        const tip = document.querySelector('.pg-tip');
        if (tip) tip.innerHTML = sc === 30 ? '<b style="color:#7fe0c8">PERFECT！+30</b>' : sc ? '<b style="color:#ffd25a">GOOD +12</b>' : '<b style="color:#e2564d">空网…</b>';
        _state.round++;
        if (_state.round > 5) { finishFish(); return; }
        const r = document.getElementById('pgRound'); if (r) r.textContent = _state.round;
        const s = document.getElementById('pgScore'); if (s) s.textContent = _state.score;
      };
      _timer = setInterval(() => {
        if (!_state || _state.done) return;
        _state.pos += _state.dir * 4;
        if (_state.pos >= 96) { _state.pos = 96; _state.dir = -1; }
        if (_state.pos <= 0) { _state.pos = 0; _state.dir = 1; }
        const f = document.getElementById('pgFish'), bar = document.getElementById('pgBar');
        if (f) f.style.left = _state.pos + '%';
        if (bar) bar.style.width = _state.pos + '%';
      }, 55);
    }
  }
  function updateCells() {
    if (!_state) return;
    document.querySelectorAll('.pg-cell').forEach((b, i) => {
      const c = _state.cells[i];
      b.textContent = c === 'coin' ? '●' : c === 'bomb' ? '✹' : '';
      b.className = 'pg-cell' + (c === 'coin' ? ' coin' : c === 'bomb' ? ' bomb' : '');
    });
    const s = document.getElementById('pgScore'), c = document.getElementById('pgCombo');
    if (s) s.textContent = _state.score;
    if (c) c.textContent = _state.hit;
  }
  function finishCoins() {
    const score = Math.max(0, _state.score), p = ensure(PC.State.d());
    const body = hostEl(), embedded = !!_host;
    stopGame();
    const money = Math.min(180, Math.round(score * passive('bonus') / 2));
    const d = PC.State.d();
    d.money += money; d.earnedToday = (d.earnedToday || 0) + money; d.earnedTotal = (d.earnedTotal || 0) + money;
    if (score > (p.best.coins || 0)) p.best.coins = score;
    mark('games'); xpAdd(Math.round(score / 4), '街机');
    PC.State.logMsg('街机抢金币得了 ' + score + ' 分，换 ' + U.money(money));
    PC.Audio.sfx('ach'); PC.State.save();
    if (body) body.innerHTML = '<div class="pg-wrap"><div class="pg-head">🎮 无限極街机</div>' +
      '<div class="pg-result"><b>时间到！</b><div class="pg-big">' + score + ' 分</div>' +
      '<p>换到 <b>' + U.money(money) + '</b>　历史最佳 ' + (p.best.coins || 0) + ' 分</p>' +
      (embedded ? '<button class="mini" data-ph="game:coins">再玩一局</button> <button class="mini" data-ph="app:games">← 手机游戏</button>'
                : '<button class="mini" data-play="game:coins">再玩一局</button> <button class="mini" data-play="panel">← 人生面板</button>') +
      '</div></div>';
  }
  function finishFish() {
    const score = _state.score, p = ensure(PC.State.d());
    _state.done = true;
    const body = hostEl(), embedded = !!_host;
    stopGame();
    const money = Math.min(160, Math.round(score * passive('bonus') / 2));
    const d = PC.State.d();
    d.money += money; d.earnedToday = (d.earnedToday || 0) + money; d.earnedTotal = (d.earnedTotal || 0) + money;
    d.mood = U.clamp(d.mood + 6, 0, 100);
    if (score > (p.best.fish || 0)) p.best.fish = score;
    mark('games'); xpAdd(Math.round(score / 4), '捞锦鲤');
    PC.State.logMsg('在林景园捞锦鲤得了 ' + score + ' 分');
    PC.Audio.sfx('ach'); PC.State.save();
    if (body) body.innerHTML = '<div class="pg-wrap"><div class="pg-head">🎮 无限極街机</div>' +
      '<div class="pg-result"><b>收网！</b><div class="pg-big">' + score + ' 分</div>' +
      '<p>换到 <b>' + U.money(money) + '</b> · 心情 +6　历史最佳 ' + (p.best.fish || 0) + ' 分</p>' +
      (embedded ? '<button class="mini" data-ph="game:fish">再捞一轮</button> <button class="mini" data-ph="app:games">← 手机游戏</button>'
                : '<button class="mini" data-play="game:fish">再捞一轮</button> <button class="mini" data-play="panel">← 人生面板</button>') +
      '</div></div>';
  }

  function steps(n) {   // 每帧调用：只累加，不写存档，避免卡顿
    const p = ensure(PC.State.d());
    p.today.steps += n;
  }

  /* ---------- 对外 ---------- */
  PC.Play = {
    LEVELS, CHALLENGES, PHOTO_SPOTS,
    ensure, newDay, levelInfo, passive, xpAdd, mark, steps, progress, claim,
    collection, claimCol, totals, bondInfo, bondTalk, bondGift,
    photo, gacha, startGame, stopGame, open() { if (PC.UI) PC.UI.openPlay(); },
    update(dt, sceneId) { /* 保留给后续扩展；目前统计由 mark() 驱动 */ }
  };
})();
