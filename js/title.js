/* title.js —— 真正的开始游戏界面 · 中央动态信息屏
 * 视觉语言沿用街区「地面 LED 显示屏」：呼吸发光边 / 点阵底纹 / 切页闪白 /
 * 进度条 / 滚动跑马灯 / 扫描线 / 移动亮线 / 噪点；但轮播内容换成
 * 版本号、更新日志、主角状态（读本地存档），每 4.6 秒自动切换。
 */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U, D = PC.Draw;
  const $ = id => document.getElementById(id);

  const VER = PC.VERSION = {
    v: 'v2.8.0',
    build: 'BUILD 2026.11.28 · PWA INSTALLABLE',
    engine: 'HTML5 / CANVAS 2D',
    title: '无限極人生'
  };

  /* 局部文字：固定字号，不受游戏画布 TEXT_SCALE 影响 */
  const FAM = '"Courier New","WenQuanYi Micro Hei","Microsoft YaHei",monospace';
  function font(ctx, size, bold) { ctx.font = (bold ? 'bold ' : '') + size + 'px ' + FAM; }
  function txt(ctx, str, x, y, size, color, align, bold) {
    font(ctx, size, bold);
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = color || '#fff';
    ctx.fillText(str, Math.round(x), Math.round(y));
  }
  function shadow(ctx, str, x, y, size, color, align) {
    txt(ctx, str, x + 1, y + 1, size, '#050818', align, true);
    txt(ctx, str, x, y, size, color || '#fff', align, true);
  }
  function measure(ctx, str, size) { font(ctx, size, false); return ctx.measureText(str).width; }

  /* ---------- 轮播页数据 ---------- */
  const UPDATES = [
    '◆ 做成 PWA：可安装到桌面 / 手机主屏幕，独立窗口打开',
    '◆ manifest.webmanifest + sw.js 离线缓存，装完断网也能玩',
    '◆ 图标占位在 icons/，把你的 logo 同名覆盖即可',
    '◆ 标题页可安装时才出现「安装到桌面」按钮，默认隐藏',
    '◆ 打开游戏先播工作室片头 media/opening.mp4，点按可跳过',
    '◆ 播完视频淡出，游戏标题从黑底渐显，开场没有任何按钮',
    '◆ 左下女/男厕所 / 2F 花园通道 / 6F 上花园下排球场',
    '◆ 7:40 上学潮与 18:00 放学潮，校门口作息钟可跳时间',
    '◆ 深蓝金边真校徽按你特意要求一字未动'
  ];

  function playerRows() {
    const St = PC.State;
    if (!St || !St.d) return [['存档', '读取中…']];
    const d = St.d();
    const music = PC.Music ? PC.Music.status().configured : 0;
    return [
      ['现金', '¥' + Math.round(d.money).toLocaleString('zh-CN')],
      ['体力', Math.round(d.stamina) + ' / 100'],
      ['心情', Math.round(d.mood) + ' / 100'],
      ['学识', Math.round(d.knowledge)],
      ['体魄', Math.round(d.fitness)],
      ['声望', Math.round(d.fame)],
      ['今日赚', '¥' + Math.round(d.earnedToday || 0)],
      ['累计赚', '¥' + Math.round(d.earnedTotal || 0)],
      ['街区', (() => {
        const id = PC.Main && PC.Main.scene ? PC.Main.scene.id : 'street';
        return ({ yulong: '迂龙路', underground: '地下小吃街', yuanyu: '渊迂中学', metro: '地铁站', train: '列车车厢', campus: '汾阳中学', park: '林景园小区', home: '林景园 · 我家' })[id] || (id.indexOf('villa:') === 0 ? '林景园 · 别墅' : '曙光路');
      })()],
      ['外卖', ((d.phone && d.phone.orders) || []).length + ' 单'],
      ['探索', (PC.Minimap && PC.Main && PC.Main.scene ? PC.Minimap.exploredPct(PC.Main.scene) : 0) + '%'],
      ['等级', (PC.Play ? 'RANK ' + PC.Play.levelInfo().rank + ' · ' + PC.Play.levelInfo().title : '—')],
      ['挑战', (PC.Play ? PC.Play.ensure(PC.State.d()).claimed.length + '/3 已领' : '—')],
      ['图鉴', (PC.Play ? Math.round(PC.Play.collection().reduce((a, r) => a + r.have, 0) / Math.max(1, PC.Play.collection().reduce((a, r) => a + r.total, 0)) * 100) + '%' : '—')],
      ['房产', (PC.Estate ? PC.Estate.summary() : '—')],
      ['手机', ((d.phone && d.phone.album) || []).length + ' 张照片 · ' + ((d.phone && d.phone.orders) || []).length + ' 单外卖'],
      ['正在听', (PC.Music && PC.Music.nowPlaying ? (PC.Music.nowPlaying().manual ? '♫ ' : '自动 · ') + PC.Music.nowPlaying().name : '—')],
      ['配乐', music + ' / ' + (PC.Music ? PC.Music.slots.length : 24) + ' 槽']
    ];
  }

  const PAGES = [
    { key: 'VERSION', tag: 'SYSTEM', title: '无限極人生', en: 'INFINITY LIVES / TITLE SCREEN' },
    { key: 'UPDATE', tag: 'PATCH', title: '本次更新', en: 'WHAT IS NEW IN v2.8.0' },
    { key: 'STATUS', tag: 'SAVE', title: '主角状态', en: 'PLAYER STATUS / LOCAL SAVE' }
  ];

  /* ---------- 绘制 ---------- */
  function draw(ctx, tm) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    const St = PC.State, d = St && St.d ? St.d() : null;
    const pulse = .5 + .5 * Math.sin(tm * 2.2);

    /* 底座 / 外框 / 呼吸发光边 */
    D.rect(ctx, 3, 4, w, h, 'rgba(8,8,24,.42)');
    D.rect(ctx, 0, 0, w, h, '#1b1c3a');
    D.rect(ctx, 3, 3, w - 6, h - 6, '#070c22');
    ctx.fillStyle = 'rgba(90,210,220,' + (.25 + .35 * pulse).toFixed(3) + ')';
    ctx.fillRect(1, 1, w - 2, 2); ctx.fillRect(1, h - 3, w - 2, 2);
    ctx.fillRect(1, 1, 2, h - 2); ctx.fillRect(w - 3, 1, 2, h - 2);
    ctx.fillStyle = 'rgba(90,120,200,.13)';
    for (let j = 6; j < h - 6; j += 6) for (let i = 6; i < w - 6; i += 6) ctx.fillRect(i, j, 1, 1);
    [[8, 8], [w - 10, 8], [8, h - 10], [w - 10, h - 10]].forEach(q => D.circle(ctx, q[0], q[1], 2, '#4b4b78'));

    /* 顶部状态条 */
    const barY = 7;
    D.rect(ctx, 9, barY, w - 18, 19, '#122048');
    D.rect(ctx, 9, barY, w - 18, 2, '#4fb8a8');
    txt(ctx, VER.title, 15, barY + 5, 9, '#ffd25a', 'left', true);
    txt(ctx, 'SHUGUANG LU', 68, barY + 7, 6, '#6f8fd0');
    txt(ctx, '◉ LIVE FEED', w / 2, barY + 6, 8, '#ffffff', 'center', true);
    const live = d ? ('D' + d.day + '  ' + (St.timeStr ? St.timeStr() : '')) : 'D1  08:00';
    txt(ctx, live, w - 15, barY + 6, 8, '#7fe0c8', 'right', true);
    if (Math.floor(tm * 2) % 2 === 0) D.rect(ctx, 226, barY + 7, 4, 8, '#ffd25a');

    /* 主区 */
    const mainY = 32, mainH = h - mainY - 25;
    const split = Math.floor(w * .65);
    D.rect(ctx, 9, mainY, split - 13, mainH, '#0e1a3e');
    D.rect(ctx, split + 2, mainY, w - split - 11, mainH, '#0a1430');
    D.frame(ctx, 9, mainY, split - 13, mainH, '#2b3a72', 1);
    D.frame(ctx, split + 2, mainY, w - split - 11, mainH, '#2b3a72', 1);

    const dur = 4.6;
    const n = Math.max(0, tm) / dur;
    const idx = Math.floor(n) % PAGES.length;
    const slot = n - Math.floor(n);
    const page = PAGES[idx] || PAGES[0];

    /* 切页瞬间闪白（与街区地面屏同一套效果） */
    if (slot < .06) {
      ctx.fillStyle = 'rgba(180,230,255,' + ((.06 - slot) / .06 * .55).toFixed(3) + ')';
      ctx.fillRect(9, mainY, split - 13, mainH);
    }

    const ax = 17, ay = mainY + 6;
    D.rect(ctx, ax, ay, 38, 11, idx === 1 ? '#e2564d' : '#3b3b8f');
    txt(ctx, page.tag, ax + 19, ay + 2, 6, '#fff', 'center', true);
    txt(ctx, 'PAGE ' + (idx + 1) + ' / ' + PAGES.length, ax + 44, ay + 3, 6, '#6f8fd0');
    shadow(ctx, page.title, ax, ay + 14, 11, '#ffd25a');
    txt(ctx, page.en, ax, ay + 28, 6, '#7fa6d0');

    /* 三页不同内容 */
    const rowY = ay + 36;   // 74，进度条在 132，五行 ×11 刚好放得下
    if (page.key === 'VERSION') {
      const rows = [
        ['版本', VER.v], ['构建', VER.build], ['引擎', VER.engine],
        ['街区', '曙光路 + 迂龙路 + 林景园'], ['存档', 'LOCAL / 自动']
      ];
      rows.forEach((r, i) => {
        const yy = rowY + i * 11;
        txt(ctx, r[0], ax, yy, 9, '#6f8fd0');
        txt(ctx, r[1], ax + 40, yy, 9, i === 0 ? '#ffd25a' : '#c9d8f0', 'left', i === 0);
      });
    } else if (page.key === 'UPDATE') {
      UPDATES.forEach((s, i) => {
        txt(ctx, s, ax, rowY + i * 11, 9, i % 2 ? '#a9e6f5' : '#c9d8f0');
      });
    } else {
      const rows = playerRows().slice(0, 12);
      const colW = Math.floor((split - 30) / 2);
      rows.forEach((r, i) => {
        const cx = ax + (i % 2) * colW, cy = rowY + Math.floor(i / 2) * 10;
        txt(ctx, r[0], cx, cy, 8, '#6f8fd0');
        txt(ctx, String(r[1]).slice(0, 8), cx + 36, cy, 8, '#ffe9a8');
      });
    }

    /* 轮播进度条 */
    D.rect(ctx, ax, mainY + mainH - 11, split - 30, 7, '#122048');
    D.rect(ctx, ax, mainY + mainH - 11, (split - 30) * slot, 7, '#4fb8a8');
    txt(ctx, 'AUTO ' + dur.toFixed(1) + 's', split - 8, mainY + mainH - 10, 6, '#6f8fd0', 'right');

    /* 右侧实时信息区：时间 / 天气 / 配乐 / 开始提示 */
    const rx = split + 10;
    txt(ctx, 'LIVE', rx, mainY + 6, 8, '#6f8fd0');
    const clock = d && St.timeStr ? St.timeStr() : '08:00';
    shadow(ctx, clock, rx, mainY + 17, 16, '#ffffff');
    txt(ctx, d ? ('DAY ' + d.day) : 'DAY 1', rx, mainY + 39, 9, '#ffd25a', 'left', true);
    const wth = St && St.weather ? St.weather() : { name: '晴', icon: '☀' };
    const temp = d && St.tempAt ? St.tempAt(d.pos && d.pos.scene) : 9;
    txt(ctx, wth.icon + ' ' + temp + '°C ' + wth.name, rx, mainY + 52, 8, '#7fe0c8', 'left', true);
    const mst = PC.Music ? PC.Music.status() : { configured: 0, total: 24 };
    txt(ctx, 'BGM  ' + mst.configured + '/' + mst.total, rx, mainY + 65, 8, '#a9e6f5');
    txt(ctx, 'AUTO SAVE', rx, mainY + 79, 8, '#6f8fd0');
    txt(ctx, 'ENTER ▸ START', rx, mainY + 92, 8, '#ffd25a');
    D.circle(ctx, w - 26, mainY + 22, 6 + pulse * 2, 'rgba(255,210,90,' + (.12 + .18 * pulse).toFixed(3) + ')');
    txt(ctx, '◉', w - 26, mainY + 17, 10, '#ffd25a', 'center', true);

    /* 底部滚动字幕 */
    const tickY = h - 21;
    D.rect(ctx, 9, tickY, w - 18, 15, '#1b1030');
    D.frame(ctx, 9, tickY, w - 18, 15, '#d99b1f', 1);
    const tick = '◆ 无限極人生 INFINITY LIVES　◆　' + VER.v + ' ' + VER.build +
      '　◆　' + (d ? '存档 D' + d.day + ' / ¥' + Math.round(d.money) : '新档案 等待首次瞬移') +
      '　◆　更新内容 / 主角状态 自动轮播　◆　按 ENTER 或点击开始游戏　◆　';
    ctx.save();
    ctx.beginPath(); ctx.rect(11, tickY + 2, w - 22, 12); ctx.clip();
    const tw = measure(ctx, tick, 8);
    const off = (tm * 40) % tw;
    txt(ctx, tick, 11 - off, tickY + 4, 8, '#ffd25a');
    txt(ctx, tick, 11 - off + tw, tickY + 4, 8, '#ffd25a');
    ctx.restore();

    /* 扫描线 / 移动亮线 / 噪点 */
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    for (let j = 4; j < h - 4; j += 4) ctx.fillRect(4, j, w - 8, 1);
    ctx.fillStyle = 'rgba(150,230,255,.13)';
    ctx.fillRect(4, 4 + ((tm * 48) % (h - 8)), w - 8, 3);
    ctx.fillStyle = 'rgba(255,255,255,.20)';
    for (let k = 0; k < 20; k++) {
      ctx.fillRect(Math.round(6 + U.noise2(k, Math.floor(tm * 8), 11) * (w - 12)),
        Math.round(6 + U.noise2(k, Math.floor(tm * 8), 12) * (h - 12)), 1, 1);
    }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    const cv = $('titleScreen');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const t0 = performance.now();
    function loop(now) {
      const help = $('help');
      if (!help || help.classList.contains('hidden')) return; // 进入游戏后停掉标题屏动画
      // rAF 的帧时间戳偶尔会早于注册时的 performance.now()，一律钳到非负
      const tm = Math.max(0, ((typeof now === 'number' ? now : performance.now()) - t0) / 1000);
      draw(ctx, tm);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // 真正的开始界面：回车 / 空格也能开始
    window.addEventListener('keydown', e => {
      const help = $('help');
      if (!help || help.classList.contains('hidden')) return;
      const appEl = $('app');
      // 开场视频期间、以及片头淡出 / 标题渐显期间都不启动游戏
      if (appEl && (appEl.classList.contains('opening-active') || appEl.classList.contains('opening-fade'))) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const b = $('btnStart'); if (b) b.click();
      }
    });

    // 版本角标
    const tag = $('titleBuild');
    if (tag) tag.textContent = VER.v + ' · ' + VER.build;
  }

  /* 便于控制台查看 / 以后改版本与更新日志 */
  PC.Title = { VER, PAGES, UPDATES, playerRows, draw };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
