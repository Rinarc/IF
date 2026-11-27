/* blueprint.js —— 手绘蓝图：按设计稿复刻整条曙光路的格纸平面图 */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U;

  const INK = '#3b3b8f', VIO = '#5b4fb3', RED = '#c2453f', PALE = '#7f7bc0';
  function render(canvas, state, scene, player, page) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const which = page || (scene && scene.id === 'yulong' ? 'yulong' : 'street');
    if (which === 'yulong') { drawYulong(ctx, W, H, state, scene, player); return; }
    // 纸
    ctx.fillStyle = '#f6f4e9'; ctx.fillRect(0, 0, W, H);
    // 格纸
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 24) { ctx.strokeStyle = x % 120 === 0 ? 'rgba(59,59,143,.30)' : 'rgba(59,59,143,.13)'; ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 24) { ctx.strokeStyle = y % 120 === 0 ? 'rgba(59,59,143,.30)' : 'rgba(59,59,143,.13)'; ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
    // 纸面斑驳
    for (let i = 0; i < 900; i++) {
      const x = U.noise2(i, 3, 1) * W, y = U.noise2(i, 9, 2) * H;
      ctx.fillStyle = 'rgba(59,59,143,.035)'; ctx.fillRect(x, y, 2, 2);
    }
    const jitter = () => (Math.random() - .5) * 1.3;
    function line(x1, y1, x2, y2, color, w) {
      ctx.strokeStyle = color || INK; ctx.lineWidth = w || 1.6; ctx.beginPath();
      ctx.moveTo(x1 + jitter(), y1 + jitter());
      const n = 5;
      for (let i = 1; i <= n; i++) ctx.lineTo(x1 + (x2 - x1) * i / n + jitter(), y1 + (y2 - y1) * i / n + jitter());
      ctx.stroke();
    }
    function box(x, y, w, h, color, wd) {
      line(x, y, x + w, y, color, wd); line(x + w, y, x + w, y + h, color, wd);
      line(x + w, y + h, x, y + h, color, wd); line(x, y + h, x, y, color, wd);
    }
    function txt(s, x, y, size, color, align, bold) {
      ctx.font = (bold ? 'bold ' : '') + (size || 15) + 'px "Comic Sans MS","WenQuanYi Micro Hei","Microsoft YaHei",cursive';
      ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = color || INK;
      ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -.055, 1, 0, 0); ctx.fillText(s, 0, 0); ctx.restore();
    }
    function cross(x, y, w, h, step) {
      step = step || 16;
      for (let i = 0; i < w; i += step) line(x + i, y, x + i + 6, y + h, PALE, 1);
    }

    /* ===== 顶部：站名与商铺带 ===== */
    box(0, 0, W, 96, INK, 2.4);
    line(0, 96, W, 96, INK, 2.4);
    txt('〈曙光路站〉', 12, 10, 26, INK, 'left', true);
    txt('SHUGUANG LU ST', 14, 45, 14, VIO);
    txt('ENTRANCE  ①②', 200, 12, 20, INK, 'left', true);
    txt('◁ 地铁通道', 200, 42, 13, VIO);
    const topShops = [
      ['M-Coffee 麦妃咖啡', '咖啡 / SALE'], ['FAMILY GO 齐率', '服饰'], ['食趣 SNACK SNACK', '零食'],
      ['齐阵 QIZHEN', '便利店 · 24H'], ['硬件运动', 'SPORT'], ['渊迂市汾阳中学', 'FENYANG M.S. 右上']
    ];
    const sx = 360, sw = 118;
    topShops.forEach((s, i) => {
      const x = sx + i * sw;
      box(x, 8, sw - 6, 80, VIO, 1.3);
      txt(s[0], x + 6, 20, 13, INK, 'left', true);
      txt(s[1], x + 6, 48, 11, PALE);
      line(x + 6, 70, x + sw - 14, 70, PALE, 1);
    });
    txt('无限極人生 / 自由赚钱', 1000, 58, 14, RED);

    /* ===== 左侧竖栏 ===== */
    box(0, 96, 150, H - 96, INK, 2);
    const left = [
      ['检测 15 PRO', '5%  ↓ 30%OFF'],
      ['旺铺招租 ON SALE', '联系 0577-00286'],
      ['环球旅行', 'TRAVEL AGENCY / 春季旅行推荐'],
      ['户连房产', '二室一厅 290万 / 330万 / 470万'],
      ['游泳健身', '月卡 50 / 年卡 550'],
      ['资深教练', '一次包会 · 学得失信']
    ];
    left.forEach((r, i) => {
      const y = 110 + i * 112;
      line(8, y + 100, 142, y + 100, PALE, 1);
      txt('▢ ' + r[0], 10, y + 8, 15, INK, 'left', true);
      txt(r[1], 16, y + 38, 11, VIO);
      line(16, y + 62, 110 - (i % 3) * 14, y + 62, PALE, 1);
    });

    /* ===== 右侧竖栏 ===== */
    const rx = 1052;
    box(rx, 96, W - rx, H - 96, INK, 2);
    const right = [
      ['◈ 曙光锁匠', '24H 自助 HOUR SELF'],
      ['麦芬文具 MY WORLD', '考试过！PASS ALL EXAM!'],
      ['旺铺招租 ON SALE!', '联系电话：12347769'],
      ["蒸汽烤肉 LET'S BARBECUE", '9AM–3AM / 6MM~3AM'],
      ['92 路', '曙光路 → 过街 → 曙光路'],
      ['自助售卖机', 'Auto Tied Vending']
    ];
    right.forEach((r, i) => {
      const y = 110 + i * 112;
      line(rx + 8, y + 100, W - 8, y + 100, PALE, 1);
      txt(r[0], rx + 10, y + 8, 14, INK, 'left', true);
      txt(r[1], rx + 14, y + 40, 11, VIO);
      line(rx + 14, y + 66, W - 22, y + 66, PALE, 1);
    });

    /* ===== 中央街区 ===== */
    const cx = 168, cy = 112, cw = 866, ch = 630;
    // 上方道路与施工
    line(cx, 150, rx, 150, INK, 1.6); line(cx, 158, rx, 158, PALE, 1);
    txt('← 通道 / 曙光路·中心街', 180, 118, 14, VIO);
    txt('请通行 ↑', 950, 118, 14, RED, 'left', true);
    box(760, 168, 130, 46, PALE, 1);
    txt('地铁施工围挡', 770, 178, 12, INK);
    cross(930, 168, 100, 46, 12);

    // 中央广告大牌
    const bx = 360, by = 230, bw = 570, bh = 372;
    box(bx, by, bw, bh, INK, 2.6);
    line(bx, by + 52, bx + bw, by + 52, INK, 2);
    txt('欢迎来到 曙光路', bx + 14, by + 12, 22, INK, 'left', true);
    txt('✧ 无限極人生 / INFINITY LIVES', bx + 280, by + 18, 14, VIO);
    txt('☀ 9°C SUNNY', bx + 14, by + 62, 17, INK, 'left', true);
    txt('📍曙光路·中心街', bx + 14, by + 88, 12, VIO);
    txt('曙光路·寺口  /  喝格隆热', bx + 330, by + 64, 12, PALE);
    txt('汾阳中学 · 新校门 50m', bx + 360, by + 92, 13, INK);
    txt('沁银行 100m', bx + 360, by + 114, 13, INK);
    txt('⌁ 5G', bx + 470, by + 62, 15, VIO, 'left', true);
    txt('〔中央地面显示屏 GROUND LED · 日期 / 天气 / 导航 / 广告 · 滚动中〕', bx + 14, by + 114, 11, RED, 'left', true);

    const cells = [
      ['FAMILY GO 齐率', '冰原新款！ON SALE', '8折 / 会员享7折'],
      ['无限起程', 'INFINITY LUOS', 'INFINITY LIVES'],
      ['食趣 SNACK²!', '会员特优 VIP GET!', 'FREE SALE! 新品 -60% OFF'],
      ['M-Coffee 麦妃咖啡 春季特优！', '蓝草咖啡 7折', '↓120m'],
      ['使命召唤 CALL OF DUTY', 'MODERN WARFARE', '米默旅行中！现在预购！BUY NOW!'],
      ['刺客信条 ASSASSINS', 'UBISOFT / 幻景 NEXT', '双一赠一 -30% / -20%']
    ];
    const gx0 = bx + 8, gy0 = by + 142, gw = (bw - 24) / 2, gh = (bh - 150) / 2;
    cells.forEach((c, i) => {
      const x = gx0 + (i % 2) * (gw + 8), y = gy0 + Math.floor(i / 2) * (gh + 6);
      box(x, y, gw - 4, gh - 6, VIO, 1.2);
      txt(c[0], x + 8, y + 10, 15, INK, 'left', true);
      txt(c[1], x + 8, y + 38, 12, VIO);
      txt(c[2], x + 8, y + 62, 12, RED);
      line(x + 8, y + 88, x + gw - 30, y + 88, PALE, 1);
    });

    // 左侧中部：通道与公告
    txt('← 通道', 176, 250, 14, VIO);
    line(176, 280, 340, 280, PALE, 1);
    txt('旺气铺 招租', 182, 300, 16, INK, 'left', true);
    txt('ON SALE · 联系', 182, 330, 12, VIO);
    txt('15 PRO  ↓30%OFF', 182, 380, 14, RED);
    txt('春季旅行推荐', 182, 450, 14, INK);
    txt('旅游推荐 →', 182, 478, 12, PALE);
    box(180, 530, 150, 96, PALE, 1);
    txt('二室一厅 290万', 188, 542, 12, INK);
    txt('好景三室 330万', 188, 566, 12, INK);
    txt('在林景园 470万', 188, 590, 12, INK);

    // 右侧道路 / 交通标志
    const roadX = 950;
    line(roadX, 96, roadX, 740, INK, 2); line(roadX + 82, 96, roadX + 82, 740, INK, 2);
    // 禁鸣
    ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(roadX + 41, 300, 26, 0, 7); ctx.stroke();
    line(roadX + 22, 318, roadX + 60, 282, RED, 3);
    txt('禁鸣', roadX + 41, 292, 12, RED, 'center', true);
    // 警告三角
    ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.beginPath();
    ctx.moveTo(roadX + 41, 372); ctx.lineTo(roadX + 14, 420); ctx.lineTo(roadX + 68, 420); ctx.closePath(); ctx.stroke();
    txt('!', roadX + 41, 388, 20, RED, 'center', true);
    // 箭头
    line(roadX + 41, 470, roadX + 41, 520, INK, 3);
    line(roadX + 41, 470, roadX + 26, 488, INK, 3);
    line(roadX + 41, 470, roadX + 56, 488, INK, 3);
    txt('↑', roadX + 41, 530, 22, INK, 'center', true);

    // 底部斑马线 / 过街通道
    const zy = 690;
    for (let i = 0; i < 30; i++) line(cx + i * 26, zy, cx + i * 26 + 12, zy + 42, PALE, 2);
    line(cx, zy, rx, zy, INK, 1.6); line(cx, zy + 42, rx, zy + 42, INK, 1.6);
    txt('立体过街通道', 200, 748, 14, VIO);
    txt('92 路  APRICE-3', 700, 748, 13, VIO);
    // 林景园 · 西洋风小区大门（罗马柱 + 三角山花 + 铁艺门）
    box(896, 574, 118, 52, INK, 1.8);
    [902, 918, 990, 1006].forEach(px2 => { line(px2, 592, px2, 620, PALE, 2); line(px2 - 3, 590, px2 + 3, 590, INK, 1.5); });
    line(896, 588, 955, 566, INK, 2); line(955, 566, 1014, 588, INK, 2);
    txt('林 景 园', 955, 574, 11, INK, 'center', true);
    for (let i = 0; i < 8; i++) line(926 + i * 8, 598, 926 + i * 8, 620, PALE, 1);
    line(900, 650, 990, 650, INK, 2); line(990, 650, 972, 636, INK, 2); line(990, 650, 972, 664, INK, 2);
    txt('林景园 · 小区大门', 896, 556, 13, INK, 'left', true);
    txt('LINJING GARDEN · 1/3/5 栋 + A/B/C 座', 896, 660, 9, VIO);
    txt('3 栋 502 我家 · 水池 / 健身区 / 售楼处', 896, 674, 9, PALE);
    txt('自助售卖机 Auto Tied Vending', 700, 662, 11, PALE);

    /* ===== YOU 标记 ===== */
    const sd = state.d ? state.d() : state;
    const wth = PC.WEATHERS[sd.weatherIdx] || PC.WEATHERS[0];
    txt('无限極人生 · 现在：' + (scene ? scene.label : '曙光路') + ' · D' + sd.day + ' ' + wth.icon + ' ' + sd.temp + '°C', 470, 116, 11, RED, 'left', true);
    if (scene && scene.id === 'street' && player) {
      const mx = 168 + (player.x / (PC.CFG.MAP_W * 16)) * 866;
      const my = 112 + (player.y / (PC.CFG.MAP_H * 16)) * 630;
      ctx.fillStyle = '#e0a020';
      ctx.beginPath(); ctx.moveTo(mx, my - 11); ctx.lineTo(mx - 8, my + 7); ctx.lineTo(mx + 8, my + 7); ctx.closePath(); ctx.fill();
      txt('YOU', mx + 10, my - 8, 12, RED, 'left', true);
    }

    /* ===== 右上：汾阳中学 · 一整栋楼 + 真校徽 + 校园平面 ===== */
    (function () {
      const gx = 940, gy = 214, gw = 104, gh = 160;
      ctx.fillStyle = '#f6f4e9'; ctx.fillRect(gx + 1, gy + 1, gw - 2, gh - 2);
      box(gx, gy, gw, gh, INK, 1.6);
      txt('汾阳中学 · 一整栋', gx + 6, gy + 6, 10, INK, 'left', true);
      // 一整栋连续楼体：一个贯通外框 + 两翼分界竖线 + 横贯腰线，中间不空
      box(gx + 8, gy + 26, gw - 16, 58, INK, 1.6);
      line(gx + 34, gy + 26, gx + 34, gy + 84, PALE, 1);
      line(gx + gw - 34, gy + 26, gx + gw - 34, gy + 84, PALE, 1);
      for (let k = 1; k <= 3; k++) line(gx + 8, gy + 26 + k * 14, gx + gw - 8, gy + 26 + k * 14, PALE, 1);
      line(gx + 34, gy + 31, gx + gw - 34, gy + 31, INK, 1.2);   // 连廊天桥
      txt('汾阳中学', gx + 21, gy + 18, 7, RED, 'center', true);
      txt('激发潜能', gx + gw - 21, gy + 18, 7, RED, 'center', true);
      box(gx + 30, gy + 66, gw - 60, 22, INK, 1.4);
      // 真校徽：金边 / 深蓝环 / 酒红内圆 / 青绿心形 / 白鸽
      const bcx = gx + gw / 2, bcy = gy + 77, br = 10;
      const bd = (r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bcx, bcy, r, 0, Math.PI * 2); ctx.fill(); };
      bd(br, '#d9a441'); bd(br - 1.5, '#1e3f8f'); bd(br - 3.5, '#8c1f2f');
      ctx.fillStyle = '#12726b';
      ctx.beginPath(); ctx.moveTo(bcx, bcy + 4);
      ctx.quadraticCurveTo(bcx - 5, bcy + 1, bcx - 4, bcy - 2);
      ctx.quadraticCurveTo(bcx - 2, bcy - 4, bcx, bcy - 2);
      ctx.quadraticCurveTo(bcx + 2, bcy - 4, bcx + 4, bcy - 2);
      ctx.quadraticCurveTo(bcx + 5, bcy + 1, bcx, bcy + 4); ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath(); ctx.moveTo(bcx - 4, bcy - 4); ctx.lineTo(bcx + 3, bcy - 5);
      ctx.lineTo(bcx + 1, bcy - 2); ctx.lineTo(bcx - 2, bcy - 1); ctx.closePath(); ctx.fill();
      // 深绿电动门 + 两侧栅栏
      box(gx + 38, gy + 88, gw - 76, 16, INK, 1.4);
      ctx.fillStyle = '#1c4a36'; ctx.fillRect(gx + 39, gy + 89, gw - 78, 14);
      for (let i = 0; i < 4; i++) {
        line(gx + 8 + i * 6, gy + 88, gx + 8 + i * 6, gy + 104, PALE, 1);
        line(gx + gw - 8 - i * 6, gy + 88, gx + gw - 8 - i * 6, gy + 104, PALE, 1);
      }
      line(gx + 4, gy + 108, gx + gw - 4, gy + 108, PALE, 1);
      txt('平面 · 右边这一栋', gx + 6, gy + 111, 9, VIO);
      const px = gx + 8, py = gy + 120, pw = gw - 16, ph = 30;
      box(px, py, pw, ph, INK, 1.2);
      box(px + pw * .58, py + 2, pw * .38, ph - 4, INK, 1.2);
      txt('六层楼', px + pw * .77, py + ph / 2 - 4, 7, INK, 'center', true);
      box(px + 2, py + 2, pw * .52, (ph - 5) / 2, PALE, 1);
      txt('操场', px + pw * .28, py + 4, 7, INK, 'center');
      box(px + 2, py + (ph - 1) / 2, pw * .52, (ph - 5) / 2, PALE, 1);
      txt('四宫格篮球', px + pw * .28, py + ph / 2 + 2, 7, VIO, 'center');
      txt('栅栏内 / 操场 / 四宫格 / 六层 / 7:40-18:00', gx + 6, gy + 152, 7, PALE);
    })()
  }


  /* ===== 第二张手绘设计稿 · 迂龙路 ===== */
  function drawYulong(ctx, W, H, state, scene, player) {
    ctx.fillStyle = '#f6f4e9'; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 24) { ctx.strokeStyle = x % 120 === 0 ? 'rgba(59,59,143,.30)' : 'rgba(59,59,143,.13)'; ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 24) { ctx.strokeStyle = y % 120 === 0 ? 'rgba(59,59,143,.30)' : 'rgba(59,59,143,.13)'; ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
    for (let i = 0; i < 700; i++) { ctx.fillStyle = 'rgba(59,59,143,.035)'; ctx.fillRect(U.noise2(i, 3, 1) * W, U.noise2(i, 9, 2) * H, 2, 2); }
    const jit = () => (Math.random() - .5) * 1.2;
    function ln(x1, y1, x2, y2, c, w) {
      ctx.strokeStyle = c || INK; ctx.lineWidth = w || 1.5; ctx.beginPath();
      ctx.moveTo(x1 + jit(), y1 + jit());
      for (let i = 1; i <= 5; i++) ctx.lineTo(x1 + (x2 - x1) * i / 5 + jit(), y1 + (y2 - y1) * i / 5 + jit());
      ctx.stroke();
    }
    function bx(x, y, w, h, c, wd) { ln(x, y, x + w, y, c, wd); ln(x + w, y, x + w, y + h, c, wd); ln(x + w, y + h, x, y + h, c, wd); ln(x, y + h, x, y, c, wd); }
    function tx(s, x, y, sz, c, align, bold) {
      ctx.font = (bold ? 'bold ' : '') + (sz || 14) + 'px "Comic Sans MS","WenQuanYi Micro Hei","Microsoft YaHei",cursive';
      ctx.textAlign = align || 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = c || INK;
      ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -.055, 1, 0, 0); ctx.fillText(s, 0, 0); ctx.restore();
    }
    /* ===== 顶部店带 ===== */
    bx(0, 0, W, 104, INK, 2.4);
    tx('迂龙地下通道', 12, 6, 20, INK, 'left', true);
    /* 左上角：地下小吃一条街的下沉大入口，一串斜线 + 地口圆牌 */
    for (let i = 0; i < 14; i++) ln(0, 96 - i * 2, 250, 8 + i * 5, PALE, 1.1);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(30, 70, 13, 0, 7); ctx.stroke();
    tx('地口', 30, 62, 10, INK, 'center', true);
    bx(112, 44, 128, 24, INK, 1.5);
    tx('小吃一条街', 118, 47, 14, INK, 'left', true);
    for (let i = 0; i < 6; i++) ln(118 + i * 20, 70, 118 + i * 20, 92, PALE, 1);
    ln(112, 92, 240, 92, INK, 1.4);
    tx('⬇ 在地下', 176, 76, 9, RED, 'left', true);
    /* 店带：星辰网吧 → 霍尔德比（两格连起来、两层）→ MN柳 → 游趣 → 迂龙交通 */
    const shops = [
      { x: 252, w: 148, a: '星晨网吧', b: '未满18禁止上网 / VIP 80%' },
      { x: 400, w: 300, a: '霍尔德比 HONER WARDROBE', b: 'UPSTAIRS HONOR! · 两层连铺' },
      { x: 700, w: 148, a: 'MN 柳 SALE!', b: '600FF / EMPIRE →' },
      { x: 848, w: 148, a: 'PAY NOW! 游趣', b: '无限極人生' },
      { x: 996, w: 148, a: '迂龙交通 1L', b: 'AB 1号线 · 票价 2元' }
    ];
    shops.forEach(s => {
      bx(s.x, 8, s.w - 6, 88, VIO, 1.3);
      tx(s.a, s.x + 6, 20, s.w > 200 ? 13 : 12, INK, 'left', true);
      tx(s.b, s.x + 6, 48, 10, PALE);
      ln(s.x + 6, 78, s.x + s.w - 14, 78, PALE, 1);
    });
    // 两层连铺：中间不封口，用虚线腰线 + 2F 标表示上下两层
    ln(400, 56, 694, 56, RED, 1.2);
    tx('2F  礼服橱窗  ◇ ◇ ◇ ◇ ◇ ◇', 410, 34, 10, VIO, 'left', true);
    tx('1F  ↙ UPSTAIRS HONOR!  门面', 410, 62, 10, INK, 'left', true);
    tx('两格连起来 · 同一家店', 410, 84, 9, RED);
    tx('第二张设计稿 · 迂龙路', 1000, 84, 11, RED);
    /* ===== 长矩形 921 路途径站牌 ===== */
    bx(12, 140, 548, 100, INK, 2);
    for (let i = 0; i < 46; i++) ln(16 + i * 12, 152, 26 + i * 12, 142, PALE, 1);   // 顶边斜线纹理带
    ln(12, 152, 560, 152, INK, 1.4);
    bx(20, 158, 74, 34, INK, 1.6);
    tx('921 路', 24, 164, 18, INK, 'left', true);
    tx('曙光路 ⇆ 景迂路', 106, 164, 17, INK, 'left', true);
    tx('SAFE LINE', 548, 164, 13, VIO, 'right');
    ln(12, 198, 560, 198, INK, 1.3);
    ['曙光路', '迂龙路', '为疾路', '景迂路'].forEach((s, i) => {
      const x = 26 + i * 78;
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x + 6, 206); ctx.lineTo(x + 12, 212); ctx.lineTo(x + 6, 218); ctx.lineTo(x, 212); ctx.closePath(); ctx.stroke();
      s.split('').forEach((ch, k) => tx(ch, x + 2, 222 + k * 11, 10, INK));
      if (i < 3) ln(x + 18, 212, x + 70, 212, PALE, 1);
    });
    tx('◇ 公交途径站', 430, 206, 10, PALE);
    /* 右下角一小块：班车 / 天气 / 路 */
    bx(280, 228, 280, 112, INK, 2);
    tx('迂龙路  ☀ 17°C', 290, 234, 17, INK, 'left', true);
    ln(280, 258, 560, 258, INK, 1.2);
    ['下一班车：3min', '下一班车：13min', '下一班车：20min'].forEach((s, i) => tx(s, 290, 264 + i * 19, 12, INK));
    ln(430, 260, 430, 332, PALE, 1);
    tx('天气降温', 440, 264, 14, RED, 'left', true);
    tx('记得保暖添衣 ≪', 440, 292, 12, VIO);
    tx('路：921 ⇆ 景迂路', 440, 314, 9, PALE);
    /* ===== 中央：印在地上的大箭头 + 渊迂市渊迂中学 ===== */
    for (let i = 0; i < 6; i++) ln(470 + i * 26, 110, 470 + i * 26, 620, PALE, 1);
    ln(452, 110, 1030, 110, INK, 1.6); ln(452, 620, 1030, 620, INK, 1.6);
    // 空心双层大箭头
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(490, 396); ctx.lineTo(536, 350); ctx.lineTo(536, 372); ctx.lineTo(578, 372);
    ctx.lineTo(578, 420); ctx.lineTo(536, 420); ctx.lineTo(536, 442); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = VIO;
    ctx.beginPath(); ctx.moveTo(506, 396); ctx.lineTo(532, 372); ctx.lineTo(506, 348); ctx.stroke();
    tx('渊迂市渊迂中学', 592, 356, 27, INK, 'left', true);
    tx('YUANYU HIGH SCHOOL', 594, 396, 15, VIO);
    tx('（市交巡体中心往南中）', 594, 420, 11, PALE);
    tx('↑ 箭头尽头就是校门', 594, 438, 9, RED);
    // 「道路千万条」是印在地上的：压扁 + 倾斜 + 磨损
    ctx.save(); ctx.translate(700, 470); ctx.transform(1, 0, -.14, .78, 0, 0);
    tx('道路千万条，安全第一条。', 0, 0, 16, INK, 'left', true);
    tx('行车不规范，亲人两行泪。', 0, 26, 16, INK, 'left', true);
    ctx.restore();
    tx('（印在车道地面上的白字）', 700, 512, 9, RED);
    ln(880, 540, 880, 590, INK, 3); ln(880, 540, 860, 562, INK, 3); ln(880, 540, 900, 562, INK, 3);
    /* ===== 右上法院 / 停车场 / 保安亭 ===== */
    bx(1035, 110, 165, 500, INK, 2);
    tx('渊迂市高级人民法院', 1044, 120, 14, INK, 'left', true);
    tx('> 立案 Register', 1044, 156, 12, VIO);
    tx('> 判决查询 Judgement', 1044, 180, 12, VIO);
    tx('为人民服务', 1048, 226, 18, RED, 'left', true);
    bx(1044, 276, 140, 70, PALE, 1);
    tx('停车场', 1052, 286, 13, INK);
    tx('PARK LAR', 1052, 310, 11, VIO);
    bx(1044, 380, 140, 46, INK, 1.5);
    tx('POLICE 保安亭', 1050, 392, 12, INK, 'left', true);
    tx('→ 曙光路', 1050, 470, 14, VIO);
    tx('◇ 渊迂市高级人民法院 ◇', 1040, 520, 10, PALE);
    /* ===== 竖直有轨电车：轨道 / 站台 / 进站口（房顶信息屏） ===== */
    bx(900, 110, 132, 500, INK, 1.6);
    // 两条竖直钢轨 + 枕木
    [924, 1008].forEach(rx => { ln(rx, 110, rx, 610, INK, 2.2); ln(rx + 3, 110, rx + 3, 610, PALE, 1); });
    for (let i = 0; i < 22; i++) ln(918, 130 + i * 22, 1014, 130 + i * 22, PALE, 1);
    // 进站口：尖顶五边形房子
    ctx.fillStyle = '#f6f4e9'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(906, 156); ctx.lineTo(966, 112); ctx.lineTo(1026, 156);
    ctx.lineTo(1026, 300); ctx.quadraticCurveTo(966, 336, 906, 300); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // 房顶信息屏
    bx(916, 160, 100, 26, INK, 1.2);
    tx('LINE 1 / AIR L1', 922, 164, 10, RED, 'left', true);
    tx('票价2元 · 晴17°C · 下一站中华门', 922, 176, 7, VIO);
    ['景迂路', '中华门', '癸年路', '爱民路', '沁公园'].forEach((s, i) => tx('· ' + s, 920, 194 + i * 15, 9, PALE));
    ln(916, 274, 1016, 274, INK, 1.2);
    tx('迂龙有轨 YLoong AIR', 920, 280, 9, INK, 'left', true);
    ['✓ 下一站', '✓ 中华门', '✓ ZHONGHUA'].forEach((s, i) => tx(s, 920, 296 + i * 13, 9, INK));
    // 站台（轨道右侧的雨棚）
    bx(1010, 350, 22, 150, VIO, 1);
    tx('站台', 1012, 356, 8, INK, 'left', true);
    ln(1010, 370, 1032, 370, INK, 1);
    tx('雨棚 / 长椅', 1012, 380, 7, PALE);
    tx('ENTRANCE ↑', 908, 520, 11, RED, 'left', true);
    tx('无限極人生', 908, 540, 12, INK, 'left', true);
    tx('创造你的路', 908, 558, 10, VIO);
    tx('迂龙有轨电车 1号线', 908, 578, 9, INK);
    // 底部 XXXXX 道口
    bx(900, 586, 132, 24, INK, 1.2);
    for (let i = 0; i < 9; i++) { ln(902 + i * 15, 586, 916 + i * 15, 610, INK, 1); ln(916 + i * 15, 586, 902 + i * 15, 610, INK, 1); }
    tx('幸一村 · 道口', 906, 612, 8, PALE);
    /* 底部一排 */
    bx(0, 636, W, 164, INK, 2.4);
    ln(0, 636, W, 636, INK, 2.4);
    tx('〈迂龙路 地铁站〉', 14, 646, 17, INK, 'left', true);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(38, 690, 17, 0, 7); ctx.stroke();
    tx('M', 38, 680, 16, INK, 'center', true);
    const bottom = [
      ['51 迂龙路 北中', '列车到达 Arrival / Train', '2分钟  《谷园 晨楼东》'],
      ['迂龙地铁商务', '地铁旺铺 · 请前往总部', '或访问网站 letsgomlq'],
      ['迂龙大排档', '客栈里边请', '今日爆款：迂龙三黄鸡 32元/份'],
      ['1L 星降电信', '办理手机号 / 更换电话卡', '网络办理'],
      ['ACMA 机场联络线', '轨交图：迂龙南路 · 龙川路', 'T1 / T2 航站楼 · 列车进站'],
      ['S1 / S2 线', 'SI 谷园方向  S2 中华门方向', 'We are hiring! 公司招人！'],
      ['< 广告招租 >', '公司招人！', '→ 曙光路']
    ];
    const bw = (W - 250) / bottom.length;
    bottom.forEach((c, i) => {
      const x = 250 + i * bw;
      bx(x, 646, bw - 5, 144, VIO, 1.1);
      tx(c[0], x + 6, 656, 12, INK, 'left', true);
      tx(c[1], x + 6, 692, 10, PALE);
      tx(c[2], x + 6, 722, 10, i === 2 ? RED : PALE);
      ln(x + 6, 756, x + bw - 20, 756, PALE, 1);
    });
    /* YOU 标记 */
    const sd = state.d ? state.d() : state;
    const wth = PC.WEATHERS[sd.weatherIdx] || PC.WEATHERS[0];
    tx('无限極人生 · 现在：' + (scene ? scene.label : '迂龙路') + ' · D' + sd.day + ' ' + wth.icon + ' ' + (sd.temp + 8) + '°C', 470, 112, 11, RED, 'left', true);
    if (scene && scene.id === 'yulong' && player) {
      const mx = 12 + (player.x / (PC.CFG.MAP_W * 16)) * (W - 24);
      const my = 110 + (player.y / (PC.CFG.MAP_H * 16)) * (H - 130);
      ctx.fillStyle = '#e0a020';
      ctx.beginPath(); ctx.moveTo(mx, my - 11); ctx.lineTo(mx - 8, my + 7); ctx.lineTo(mx + 8, my + 7); ctx.closePath(); ctx.fill();
      tx('YOU', mx + 10, my - 8, 12, RED, 'left', true);
    }
    tx('手绘蓝图 02 / 02  ·  迂龙路 YULONG ROAD', 14, 776, 11, PALE);
  }

  PC.Blueprint = { render };
})();
