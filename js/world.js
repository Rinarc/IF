/* world.js —— 场景构建 / 碰撞 / 瓦片与街景渲染
   每类店铺有专属室内（家具 / 地板 / 墙面 / 海报全部取自手绘设计稿） */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U, D = PC.Draw, P = PC.PAL, A = PC.Art, T = PC.CFG.TILE;
  let activeFloor = '#ded6b8';

  function grid(w, h, val) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill(val)); return g; }
  function fill(g, r, val) { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (g[y] && x >= 0 && x < g[0].length) g[y][x] = val; }
  function px(v) { return v * T + 8; }

  function baseScene(id, w, h, ground) {
    return {
      id, w, h, ground: grid(w, h, ground || 'pave'), solid: grid(w, h, 0),
      buildings: [], billboards: [], screens: [], decos: [], props: [], points: [], npcs: [], pickups: [],
      spawn: { x: w * T / 2, y: h * T / 2 }, label: '', shop: null, indoor: false, floorColor: null
    };
  }
  function border(s) {
    for (let x = 0; x < s.w; x++) { s.solid[0][x] = 1; s.solid[s.h - 1][x] = 1; }
    for (let y = 0; y < s.h; y++) { s.solid[y][0] = 1; s.solid[y][s.w - 1] = 1; }
  }
  function point(s, p) {
    s.points.push({ id: p.id, type: p.type, x: px(p.tx), y: px(p.ty), label: p.label, board: p.board, shop: p.shop, data: p.data, taken: false });
  }

  /* ---------------- 街区通用构建（曙光路 / 迂龙路共用同一套管线） ---------------- */
  function district(L, id, label) {
    const s = baseScene(id, PC.CFG.MAP_W, PC.CFG.MAP_H, 'pave');
    s.layout = L;
    L.roads.forEach(r => fill(s.ground, r, 'road'));
    L.plazas.forEach(r => fill(s.ground, r, 'plaza'));
    L.grass.forEach(r => fill(s.ground, r, 'grass'));
    (L.water || []).forEach(r => fill(s.ground, r, 'water'));
    L.buildings.forEach(b => {
      const shop = PC.SHOP_BY_ID[b.shop];
      if (!shop) return;
      fill(s.solid, b, 1);
      s.buildings.push({ x: b.x, y: b.y, w: b.w, h: b.h, shop });
      let dx, dy;
      if (shop.door === 'left') { dx = b.x * T - 8; dy = (b.y + b.h - 2) * T + 8; }
      else if (shop.door === 'right') { dx = (b.x + b.w) * T + 8; dy = (b.y + b.h - 2) * T + 8; }
      else if (shop.door === 'top') { dx = (b.x + b.w / 2) * T; dy = b.y * T - 12; }
      else { dx = (b.x + b.w / 2) * T; dy = (b.y + b.h) * T + 10; }
      s.points.push({ id: 'door_' + shop.id, type: 'door', x: dx, y: dy, label: '进入 ' + shop.name, shop: shop.id });
    });
    (L.screens || []).forEach(sc => s.screens.push({ x: sc.x, y: sc.y, w: sc.w, h: sc.h, kind: sc.kind || 'ground' }));
    L.decos.forEach(d => {
      s.decos.push(d);
      if (d.solid || d.kind === 'car' || d.kind === 'fence' || d.kind === 'tower5g' || d.kind === 'parkGate' || d.kind === 'busStop' || d.kind === 'stairs') {
        fill(s.solid, { x: d.tx, y: d.ty, w: d.w || 1, h: d.h || 1 }, 1);
      }
    });
    L.points.forEach(p => point(s, p));
    L.npcs.forEach((n, i) => s.npcs.push({
      name: n.name, color: n.color, x: px(n.tx), y: px(n.ty),
      path: n.path.map(q => ({ x: px(q[0]), y: px(q[1]) })), pi: 0, wait: 0, dir: 0, frame: 0, id: 'npc' + i
    }));
    border(s);
    s.spawn = (L.spawn || { x: 47 * T + 8, y: 34 * T + 8 });
    s.label = label;
    respawnPickups(s);
    return s;
  }
  function street() {
    const s = district(PC.LAYOUT, 'street', '曙光路 · 中心街');
    // 林景园 · 西洋风小区大门（罗马柱 + 三角山花 + 铁艺门 + 门卫亭 + 门前喷泉）
    s.props.push({ kind: 'estateGate', x: 72, y: 49, w: 14, h: 7 });
    s.props.push({ kind: 'estateGateLamp', x: 70, y: 52, w: 2, h: 4 });
    s.props.push({ kind: 'estateGateLamp', x: 86, y: 52, w: 2, h: 4 });
    // 街面细节：井盖 / 路灯 / 鸽子 / 飘叶 / 树影 / 磨损
    [[18, 26], [44, 40], [70, 20], [30, 50], [84, 44]].forEach(q => s.props.push({ kind: 'manhole', x: q[0], y: q[1], w: 1, h: 1 }));
    [[12, 30], [38, 30], [64, 30], [88, 30]].forEach(q => s.props.push({ kind: 'streetLampY', x: q[0], y: q[1], w: 1, h: 3 }));
    s.props.push({ kind: 'roadWear', x: 8, y: 28, w: 82, h: 22 });
    s.props.push({ kind: 'pigeons', x: 20, y: 36, w: 30, h: 8 });
    s.props.push({ kind: 'leafFall', x: 4, y: 4, w: 90, h: 56 });
    s.props.push({ kind: 'treeShade', x: 26, y: 44, w: 3, h: 3 });
    // 玩法终端
    s.props.push({ kind: 'questBoard', x: 26, y: 33, w: 4, h: 3 });
    s.props.push({ kind: 'gachaMachine', x: 34, y: 33, w: 2, h: 3 });
    s.props.push({ kind: 'arcadeCab', x: 38, y: 33, w: 2, h: 3 });
    s.props.push({ kind: 'photoSpot', x: 46, y: 33, w: 2, h: 2 });
    s.props.push({ kind: 'photoSpot', x: 76, y: 50, w: 2, h: 2 });
    // 广场零工（街口派传单 / 卖艺 / 问卷）
    s.points.push({ id: 'job_street', type: 'jobs', x: px(24), y: px(35), label: '街口打零工 · 派传单 / 卖艺', ctx: 'street' });
    s.points.push({ id: 'questBoardS', type: 'questboard', x: px(28), y: px(35), label: '🎯 人生目标板 · 每日挑战 / 等级 / 图鉴' });
    s.points.push({ id: 'gachaS', type: 'gacha', x: px(35), y: px(35), label: '🎰 扭蛋机 · ¥20 抽一次' });
    s.points.push({ id: 'arcadeS', type: 'arcadeGame', x: px(39), y: px(35), label: '🎮 街机 · 抢金币小游戏' });
    s.points.push({ id: 'photoS1', type: 'photo', x: px(47), y: px(34), label: '📸 打卡 · 曙光路口', spot: 'shuguang_cross' });
    s.points.push({ id: 'photoS2', type: 'photo', x: px(77), y: px(51), label: '📸 打卡 · 林景园大门', spot: 'linjing_gate' });
    return s;
  }
  /* ---------------- 第二张设计稿：迂龙路 ---------------- */
  function yulong() {
    const s = district(PC.LAYOUT_YULONG, 'yulong', '迂龙路 · YULONG ROAD');
    s.spawn = { x: 12 * T, y: 47 * T };   // 从地铁口出来
    /* ===== 第二张手绘稿的地面大件，逐处照着复刻 ===== */
    // 左上角：地下小吃一条街的下沉大入口（一组斜线 = 往下去的楼梯）
    s.props.push({ kind: 'undergroundGate', x: 1, y: 1, w: 13, h: 13 });
    s.props.push({ kind: 'underpassMouth', x: 3, y: 16, w: 5, h: 2 });
    // 印在地上的大空心箭头 + 渊迂市渊迂中学
    s.props.push({ kind: 'bigArrow', x: 20, y: 38, w: 14, text: '渊迂市渊迂中学', sub: 'YUANYU HIGH SCHOOL' });
    // 「道路千万条」是直接漆在车道地面上的白字，不是立牌
    s.props.push({ kind: 'roadSlogan', x: 46, y: 30, w: 22, h: 6 });
    s.props.push({ kind: 'groundArrow', x: 52, y: 40, w: 5, h: 6 });
    // 竖直有轨电车：轨道、车、站台、进站口（房顶带信息屏）、道口
    s.props.push({ kind: 'tramRails', x: 71, y: 0, w: 9, h: 64 });
    s.props.push({ kind: 'tramGateHouse', x: 71, y: 0, w: 9, h: 15 });
    s.props.push({ kind: 'tramCarV', x: 72, y: 19, w: 5, h: 14 });
    s.props.push({ kind: 'tramPlatform', x: 77, y: 24, w: 5, h: 22 });
    s.props.push({ kind: 'tramCrossing', x: 70, y: 47, w: 12, h: 3 });
    // 法院 / 保安亭 / 底部一排招牌
    s.props.push({ kind: 'courtGate', x: 84, y: 14, w: 10 });
    s.props.push({ kind: 'policeBox', x: 90, y: 33, w: 5, h: 4 });
    s.props.push({ kind: 'arrivalBoard', x: 2, y: 52, w: 10 });
    s.props.push({ kind: 'routeMap', x: 43, y: 52, w: 10 });
    s.props.push({ kind: 'hiring', x: 64, y: 52, w: 9 });
    s.props.push({ kind: 'metroStairY', x: 6, y: 44, w: 6 });
    /* ===== 精修层：让 17°C 的街面真的在呼吸 ===== */
    // 井盖 / 路缘石 / 护栏 / 树影 / 磨损
    [[16, 24], [38, 24], [58, 20], [28, 44], [62, 40], [10, 34], [46, 48]].forEach(q =>
      s.props.push({ kind: 'manhole', x: q[0], y: q[1], w: 1, h: 1 }));
    s.props.push({ kind: 'bollard', x: 68, y: 24, w: 3, h: 2 });
    s.props.push({ kind: 'bollard', x: 68, y: 44, w: 3, h: 2 });
    s.props.push({ kind: 'roadWear', x: 4, y: 18, w: 64, h: 32 });
    s.props.push({ kind: 'treeShade', x: 14, y: 24, w: 4, h: 3 });
    s.props.push({ kind: 'treeShade', x: 58, y: 34, w: 4, h: 3 });
    s.props.push({ kind: 'awningShadow', x: 20, y: 50, w: 3, h: 2 });
    // 架空线 / 接触网火花 / 信号灯 / 站台钟
    s.props.push({ kind: 'wire', x: 69, y: 6, w: 12, h: 2 });
    s.props.push({ kind: 'wire', x: 69, y: 30, w: 12, h: 2 });
    s.props.push({ kind: 'tramSpark', x: 74, y: 12, w: 1, h: 4 });
    s.props.push({ kind: 'tramSignal', x: 80, y: 22, w: 1, h: 2 });
    s.props.push({ kind: 'stationClock', x: 78, y: 27, w: 2, h: 2 });
    // 路灯（夜里一圈光晕）
    [[8, 22], [34, 22], [58, 22], [16, 46], [44, 46], [64, 46]].forEach(q =>
      s.props.push({ kind: 'streetLampY', x: q[0], y: q[1], w: 1, h: 3 }));
    // 鸽子与飘落的叶子
    s.props.push({ kind: 'pigeons', x: 18, y: 20, w: 34, h: 10 });
    s.props.push({ kind: 'pigeons', x: 44, y: 42, w: 26, h: 8 });
    s.props.push({ kind: 'leafFall', x: 2, y: 2, w: 68, h: 50 });
    // 玩法终端
    s.props.push({ kind: 'questBoard', x: 24, y: 22, w: 4, h: 3 });
    s.props.push({ kind: 'gachaMachine', x: 33, y: 22, w: 2, h: 3 });
    s.props.push({ kind: 'arcadeCab', x: 37, y: 22, w: 2, h: 3 });
    s.props.push({ kind: 'photoSpot', x: 50, y: 22, w: 2, h: 2 });
    s.props.push({ kind: 'photoSpot', x: 55, y: 44, w: 2, h: 2 });
    s.props.push({ kind: 'photoSpot', x: 78, y: 34, w: 2, h: 2 });
    // 更多街上的活人
    s.npcs.push({ name: '等 921 路的人', color: '#4b8fb5', x: 40 * T, y: 26 * T, stationary: true, dir: 1, frame: 0, id: 'yl1' });
    s.npcs.push({ name: '拍照的游客', color: '#c05b86', x: 56 * T, y: 44 * T, stationary: true, dir: 3, frame: 0, id: 'yl2' });
    s.npcs.push({ name: '卖报的小孩', color: '#d99b1f', x: 18 * T, y: 46 * T, path: [{ x: 18 * T, y: 46 * T }, { x: 34 * T, y: 46 * T }], pi: 0, wait: 0, dir: 1, frame: 0, id: 'yl3' });
    s.npcs.push({ name: '交通协管', color: '#4caf7d', x: 80 * T, y: 46 * T, stationary: true, dir: 0, frame: 0, id: 'yl4' });
    s.npcs.push({ name: '遛狗的迂龙路人', color: '#e2564d', x: 30 * T, y: 28 * T, path: [{ x: 30 * T, y: 28 * T }, { x: 52 * T, y: 28 * T }, { x: 52 * T, y: 34 * T }], pi: 0, wait: 0, dir: 1, frame: 0, id: 'yl5' });
    // 交互点
    s.points.push({ id: 'questBoardY', type: 'questboard', x: px(26), y: px(24), label: '🎯 人生目标板 · 每日挑战 / 等级 / 图鉴' });
    s.points.push({ id: 'gachaY', type: 'gacha', x: px(34), y: px(24), label: '🎰 扭蛋机 · ¥20 抽一次' });
    s.points.push({ id: 'arcadeY', type: 'arcadeGame', x: px(38), y: px(24), label: '🎮 街机 · 抢金币小游戏' });
    s.points.push({ id: 'photoY1', type: 'photo', x: px(51), y: px(23), label: '📸 打卡 · 921 路站牌', spot: 'bus921' });
    s.points.push({ id: 'photoY2', type: 'photo', x: px(56), y: px(45), label: '📸 打卡 · 道路千万条', spot: 'road_slogan' });
    s.points.push({ id: 'photoY3', type: 'photo', x: px(79), y: px(35), label: '📸 打卡 · 有轨电车', spot: 'tram' });
    return s;
  }

  /* ---------------- 地下小吃一条街：真的在地下 ---------------- */
  function underground() {
    const s = baseScene('underground', 34, 20, 'pave');
    s.indoor = true; s.floorColor = '#8e8a7c';
    s.shop = PC.SHOP_BY_ID.y_snackstreet;
    border(s);
    // 吊顶与墙
    s.props.push({ kind: 'wall', x: 0, y: 0, w: 34, h: 2, color: '#3b3b52', trim: '#5b4fb3' });
    s.props.push({ kind: 'kickline', x: 0, y: 18, w: 34, h: 1, color: '#c9a97e' });
    for (let y = 0; y < s.h; y++) { s.solid[y][0] = 1; s.solid[y][s.w - 1] = 1; }
    // 一排吊顶灯
    for (let i = 0; i < 6; i++) s.props.push({ kind: 'underLamp', x: 3 + i * 5, y: 2 });
    // 下沉楼梯（左上有光）
    s.props.push({ kind: 'downStairs', x: 2, y: 3, w: 6, h: 5 });
    // 一排小吃摊
    [[9, 4], [17, 4], [25, 4], [9, 12], [17, 12], [25, 12]].forEach((q, i) => {
      s.props.push({ kind: 'snackStall', x: q[0], y: q[1] });
      fill(s.solid, { x: q[0], y: q[1], w: 6, h: 2 }, 1);
    });
    s.props.push({ kind: 'banner', x: 9, y: 1, text: '地下小吃一条街  ·  迂龙地下通道 地口' });
    s.props.push({ kind: 'underSign', x: 2, y: 8, w: 6, h: 3 });
    s.props.push({ kind: 'vendingIn', x: 30, y: 8 });
    // 交互点
    s.points.push({ id: 'counter', type: 'counter', x: 17 * T, y: 10 * T, label: '地下小吃街 · 买点吃的' });
    s.points.push({ id: 'job_under', type: 'jobs', x: 26 * T, y: 10 * T, label: '💼 地下街零工 · 看摊 / 收桌', ctx: 'y_snackstreet' });
    s.points.push({ id: 'exit', type: 'exit', x: 4 * T, y: 6 * T, label: '⬆ 上楼回到 迂龙路' });
    s.props.push({ kind: 'gachaMachine', x: 30, y: 13, w: 2, h: 3 });
    s.props.push({ kind: 'photoSpot', x: 17, y: 17, w: 2, h: 2 });
    s.points.push({ id: 'gachaU', type: 'gacha', x: 31 * T, y: 15 * T, label: '🎰 地下街扭蛋机 · ¥20 抽一次' });
    s.points.push({ id: 'photoU', type: 'photo', x: 18 * T, y: 17 * T, label: '📸 打卡 · 地下小吃一条街', spot: 'underground' });
    s.npcs.push({ name: '摊主', color: '#d99b1f', x: 12 * T, y: 10 * T, stationary: true, dir: 0, frame: 0, id: 'u1' });
    s.npcs.push({ name: '端着碗的客人', color: '#e2564d', x: 22 * T, y: 10 * T, stationary: true, dir: 3, frame: 0, id: 'u2' });
    s.spawn = { x: 4 * T, y: 7 * T };
    s.label = '地下小吃一条街 · 下沉街';
    return s;
  }

  /* ---------------- 渊迂市渊迂中学：地上大箭头指向的校门 ---------------- */
  function yuanyu() {
    const s = baseScene('yuanyu', 40, 24, 'grass');
    border(s);
    fill(s.ground, { x: 0, y: 0, w: 40, h: 24 }, 'pave');
    fill(s.ground, { x: 4, y: 14, w: 32, h: 9 }, 'grass');
    s.props.push({ kind: 'yuanyuGate', x: 10, y: 2, w: 20, h: 5 });
    s.props.push({ kind: 'yuanyuBuilding', x: 6, y: 8, w: 28, h: 5 });
    s.props.push({ kind: 'flagPole', x: 20, y: 15, w: 1, h: 7 });
    s.props.push({ kind: 'trackOval', x: 5, y: 17, w: 30, h: 6 });
    s.props.push({ kind: 'banner', x: 9, y: 7, text: 'YUANYU HIGH SCHOOL  ·  渊迂市渊迂中学' });
    fill(s.solid, { x: 6, y: 8, w: 28, h: 5 }, 1);
    s.points.push({ id: 'exit', type: 'exit', x: 20 * T, y: 21 * T, label: '出了校门，回到 迂龙路' });
    s.points.push({ id: 'schoolNotice', type: 'sign', x: 12 * T, y: 6 * T, label: '校门公告 · 市交巡体中心往南中' });
    s.points.push({ id: 'job_yuanyu', type: 'jobs', x: 28 * T, y: 15 * T, label: '💼 渊迂中学 · 值日 / 抄笔记', ctx: 'yuanyu' });
    s.points.push({ id: 'track', type: 'sign', x: 20 * T, y: 19 * T, label: '操场 · 跑一圈' });
    s.npcs.push({ name: '渊迂中学值日生', color: '#4caf7d', x: 16 * T, y: 15 * T, stationary: true, dir: 0, frame: 0, id: 'y1' });
    s.npcs.push({ name: '渊迂中学的同学', color: '#4fb8a8', x: 26 * T, y: 15 * T, stationary: true, dir: 3, frame: 0, id: 'y2' });
    s.spawn = { x: 20 * T, y: 20 * T };
    s.label = '渊迂市渊迂中学 · 校门';
    return s;
  }

  /* ---------------- 街面拾荒物 ---------------- */
  function respawnPickups(s) {
    if (!s) {
      ['street', 'yulong'].forEach(k => { if (cache[k]) respawnPickups(cache[k]); });
      return;
    }
    s.points = s.points.filter(p => p.type !== 'pickup');
    s.pickups = [];
    const zones = (s.layout && s.layout.pickupZones) || PC.LAYOUT.pickupZones || [];
    const ids = Object.keys(PC.RECYCLE);
    const total = 10;
    let guard = 0;
    while (s.pickups.length < total && guard++ < 300) {
      const z = U.pick(zones);
      const tx = U.randInt(z.x, z.x + z.w - 1), ty = U.randInt(z.y, z.y + z.h - 1);
      if (tx < 1 || ty < 1 || tx >= s.w - 1 || ty >= s.h - 1) continue;
      if (s.solid[ty][tx]) continue;
      if (s.pickups.some(q => q.tx === tx && q.ty === ty)) continue;
      const item = U.pick(ids);
      const p = { id: 'pick_' + tx + '_' + ty + '_' + s.pickups.length, type: 'pickup', x: px(tx), y: px(ty),
        label: '捡起 ' + PC.RECYCLE[item].name, item, tx, ty, taken: false };
      s.points.push(p); s.pickups.push(p);
    }
  }

  /* ================================================================
     店铺专属室内配置（文案 / 家具 / 配色均来自手绘设计稿）
     ================================================================ */
  const KITS = {
    /* ===== 第二张设计稿 · 迂龙路专属室内 ===== */
    snackstreet: {
      floor: '#d8c9a0', wall: '#8a5b3b', trim: '#c98a4b',
      title: '小吃一条街', sign: '蒸笼 / 烤串 / 炒面', poster: ['小吃一条街', 'SNACK STREET'], lamp: '#ffd25a',
      counter: { x: 11, y: 3, w: 9, h: 2 }, clerk: { x: 13, y: 2, name: '摊主' },
      solids: [[11, 3, 9, 2], [3, 8, 6, 2], [21, 8, 6, 2], [3, 13, 6, 2], [21, 13, 6, 2]],
      props: [
        { kind: 'snackStall', x: 3, y: 8 }, { kind: 'snackStall', x: 21, y: 8 },
        { kind: 'snackStall', x: 3, y: 13 }, { kind: 'snackStall', x: 21, y: 13 },
        { kind: 'banner', x: 8, y: 1, text: '小吃一条街 · 先吃后付' },
        { kind: 'lampIn', x: 9, y: 6 }, { kind: 'lampIn', x: 20, y: 11 },
        { kind: 'priceTag', x: 12, y: 8, text: '烤串 ¥9' }, { kind: 'priceTag', x: 18, y: 12, text: '炒面 ¥16' }
      ]
    },
    netbar: {
      floor: '#2b2c48', wall: '#1b1c3a', trim: '#5b4fb3',
      title: '星晨网吧', sign: '未满18禁止上网！18 LIMITED', poster: ['VIP 80%', 'MORNING NETBAR'], lamp: '#7fe0c8',
      counter: { x: 22, y: 3, w: 6, h: 2 }, clerk: { x: 24, y: 2, name: '网管' },
      solids: [[22, 3, 6, 2], [3, 6, 5, 2], [10, 6, 5, 2], [17, 6, 5, 2], [3, 11, 5, 2], [10, 11, 5, 2], [17, 11, 5, 2]],
      props: [
        { kind: 'netbarPC', x: 3, y: 6 }, { kind: 'netbarPC', x: 10, y: 6 }, { kind: 'netbarPC', x: 17, y: 6 },
        { kind: 'netbarPC', x: 3, y: 11 }, { kind: 'netbarPC', x: 10, y: 11 }, { kind: 'netbarPC', x: 17, y: 11 },
        { kind: 'poster', x: 2, y: 1, w: 6, h: 2, text: '18 LIMITED', color: '#e2564d' },
        { kind: 'banner', x: 10, y: 1, text: 'VIP 80% · 星晨网吧' },
        { kind: 'vendingIn', x: 25, y: 11 }, { kind: 'ledStrip', x: 2, y: 9, w: 26 }
      ]
    },
    wardrobe: {
      floor: '#e3d9c8', wall: '#6b4630', trim: '#c05b86',
      title: 'HONER WARDROBE', sign: 'UPSTAIRS HONOR! · 特价', poster: ['HONER WARDROBE', 'UPSTAIRS'], lamp: '#ffe6a8',
      counter: { x: 20, y: 3, w: 7, h: 2 }, clerk: { x: 22, y: 2, name: '裁缝' },
      solids: [[20, 3, 7, 2], [3, 5, 4, 5], [9, 5, 4, 5], [3, 12, 4, 3], [9, 12, 4, 3]],
      props: [
        { kind: 'clothesRack', x: 3, y: 5 }, { kind: 'clothesRack', x: 9, y: 5 },
        { kind: 'mannequin', x: 16, y: 7 }, { kind: 'mirror', x: 24, y: 9 },
        { kind: 'fitting', x: 3, y: 12 }, { kind: 'poster', x: 2, y: 1, w: 7, h: 2, text: 'UPSTAIRS HONOR!', color: '#c05b86' },
        { kind: 'banner', x: 12, y: 1, text: '霍尔德比 · 2F 楼上还有一排' }, { kind: 'rug', x: 13, y: 10, w: 8, h: 3, color: '#c05b86' }
      ]
    },
    sale: {
      floor: '#e8dcc0', wall: '#b5503c', trim: '#d99b1f',
      title: 'MN 柳 / PAY NOW', sign: 'SALE! 600FF · EMPIRE →', poster: ['SALE!', '600FF'], lamp: '#fff3c4',
      counter: { x: 4, y: 3, w: 12, h: 2 }, clerk: { x: 8, y: 2, name: '收银员' },
      solids: [[4, 3, 12, 2], [20, 8, 5, 4], [10, 12, 5, 2]],
      props: [
        { kind: 'promoFlag', x: 2, y: 1 }, { kind: 'snackPile', x: 20, y: 8 },
        { kind: 'priceTag', x: 10, y: 9, text: 'SALE 600FF' }, { kind: 'priceTag', x: 18, y: 13, text: 'PAY NOW!' },
        { kind: 'poster', x: 19, y: 2, w: 8, h: 3, text: 'SALE!', color: '#e2564d' },
        { kind: 'banner', x: 6, y: 1, text: 'MN 柳 · PAY NOW 游趣' }
      ]
    },
    ticket: {
      floor: '#c9c6b4', wall: '#3b3b8f', trim: '#4fb8a8',
      title: '迂龙交通 1L', sign: 'AB 1号线 / 2号线 · 票价 2元', poster: ['LINE 1', '票价 2元'], lamp: '#eaf4ff',
      counter: { x: 12, y: 3, w: 10, h: 2 }, clerk: { x: 15, y: 2, name: '站务员' },
      solids: [[12, 3, 10, 2], [3, 8, 5, 4], [22, 8, 5, 4]],
      props: [
        { kind: 'ticketMachine', x: 3, y: 8 }, { kind: 'routeMapIn', x: 22, y: 8 },
        { kind: 'lightbox', x: 9, y: 1, w: 8, h: 2, text: '票价 2元 / LINE 1' },
        { kind: 'gateM', x: 8, y: 12, w: 3, h: 2 }, { kind: 'gateM', x: 19, y: 12, w: 3, h: 2 },
        { kind: 'banner', x: 2, y: 15, text: '下一站 中华门 ZHONGHUA' }
      ]
    },
    court: {
      floor: '#cfc9b8', wall: '#8f92b5', trim: '#3f6b8f',
      title: '渊迂市高级人民法院', sign: '立案 Register · 判决查询 Judgement', poster: ['为人民服务', 'Register / Judgement'], lamp: '#f4f1e4',
      counter: { x: 9, y: 4, w: 12, h: 2 }, clerk: { x: 14, y: 3, name: '书记员' },
      solids: [[9, 4, 12, 2], [3, 10, 5, 2], [10, 10, 5, 2], [17, 10, 5, 2], [24, 10, 4, 2]],
      props: [
        { kind: 'lawDesk', x: 9, y: 4, w: 12 },
        { kind: 'desk', x: 3, y: 10, w: 5, h: 2 }, { kind: 'desk', x: 10, y: 10, w: 5, h: 2 },
        { kind: 'desk', x: 17, y: 10, w: 5, h: 2 }, { kind: 'desk', x: 24, y: 10, w: 4, h: 2 },
        { kind: 'poster', x: 10, y: 1, w: 10, h: 2, text: '为人民服务', color: '#e2564d' },
        { kind: 'banner', x: 3, y: 1, text: '立案 Register / 判决查询 Judgement' }
      ]
    },
    dapaidang: {
      floor: '#c9a97e', wall: '#b5503c', trim: '#8a5b3b',
      title: '迂龙大排档', sign: '今日爆款：迂龙三黄鸡 32元/份', poster: ['客栈里边请', '32元/份'], lamp: '#ffd25a',
      counter: { x: 22, y: 3, w: 6, h: 2 }, clerk: { x: 24, y: 2, name: '掌勺的' },
      solids: [[22, 3, 6, 2], [4, 5, 6, 3], [8, 11, 4, 2], [17, 11, 4, 2]],
      props: [
        { kind: 'chickenPot', x: 4, y: 5 },
        { kind: 'roundTable', x: 8, y: 11 }, { kind: 'roundTable', x: 17, y: 11 },
        { kind: 'beerKeg', x: 25, y: 12 }, { kind: 'nightLamp', x: 12, y: 4 },
        { kind: 'banner', x: 6, y: 1, text: '今日爆款 · 迂龙三黄鸡 32元/份' },
        { kind: 'priceTag', x: 13, y: 8, text: '三黄鸡 ¥32' }
      ]
    },
    telecom: {
      floor: '#d8e4e8', wall: '#3d9a94', trim: '#4fb8a8',
      title: '星降电信 1L', sign: '办理手机号 / 更换电话卡 / 网络办理', poster: ['SIM', '1L 星降电信'], lamp: '#eaf4ff',
      counter: { x: 10, y: 3, w: 12, h: 2 }, clerk: { x: 14, y: 2, name: '营业员' },
      solids: [[10, 3, 12, 2], [3, 8, 5, 5], [22, 8, 5, 5]],
      props: [
        { kind: 'simWall', x: 3, y: 8 }, { kind: 'phoneWall', x: 22, y: 8 },
        { kind: 'lightbox', x: 9, y: 1, w: 10, h: 2, text: '办理手机号 / 换卡 / 网络' },
        { kind: 'filmDesk', x: 12, y: 12 }, { kind: 'ledStrip', x: 2, y: 7, w: 26 },
        { kind: 'banner', x: 4, y: 15, text: '星降电信 · 1L' }
      ]
    },
    police: {
      floor: '#c9c6b4', wall: '#3f6b8f', trim: '#5b7d95',
      title: 'POLICE 保安亭', sign: '为人民服务', poster: ['POLICE', '为人民服务'], lamp: '#eaf4ff',
      counter: { x: 12, y: 4, w: 8, h: 2 }, clerk: { x: 15, y: 3, name: '值班保安' },
      solids: [[12, 4, 8, 2], [4, 11, 4, 2], [22, 11, 4, 2]],
      props: [
        { kind: 'lawDesk', x: 12, y: 4, w: 8 },
        { kind: 'poster', x: 9, y: 1, w: 10, h: 2, text: '为人民服务', color: '#e2564d' },
        { kind: 'lightbox', x: 3, y: 1, w: 5, h: 2, text: 'POLICE' },
        { kind: 'desk', x: 4, y: 11, w: 4, h: 2 }, { kind: 'desk', x: 22, y: 11, w: 4, h: 2 }
      ]
    },
    cafe: {
      floor: '#c9a97e', wall: '#6b4630', trim: '#8a5b3b',
      title: 'M-COFFEE / 麦妃咖啡', sign: '春季特优！蓝草咖啡 7折',
      poster: ['蓝草咖啡 7折', 'M-Coffee 麦妃咖啡'], lamp: '#ffe6a8',
      counter: { x: 4, y: 3, w: 15, h: 2 }, clerk: { x: 8, y: 2, name: '咖啡师' },
      solids: [[4, 3, 15, 2], [22, 8, 4, 5], [10, 12, 4, 2], [18, 12, 4, 2]],
      props: [
        { kind: 'coffeeMachine', x: 5, y: 2 }, { kind: 'menuBoard', x: 20, y: 2 },
        { kind: 'roundTable', x: 8, y: 9 }, { kind: 'roundTable', x: 18, y: 9 },
        { kind: 'cup', x: 10, y: 5 }, { kind: 'cup', x: 12, y: 5 },
        { kind: 'beanSack', x: 24, y: 14 }, { kind: 'banner', x: 10, y: 1, text: 'M-COFFEE · 春季特优' },
        { kind: 'shelf', x: 22, y: 8, w: 4, h: 5 }, { kind: 'rug', x: 10, y: 12, w: 12, h: 3 }
      ]
    },
    mart: {
      floor: '#d8dce0', wall: '#3f4683', trim: '#5b4fb3',
      title: 'QIZHEN / 齐阵', sign: '齐阵 · SALE · 24H',
      poster: ['SALE · 24H', '齐阵 QIZHEN'], lamp: '#eaf4ff',
      counter: { x: 21, y: 3, w: 6, h: 2 }, clerk: { x: 23, y: 2, name: '收银员' },
      solids: [[21, 3, 6, 2], [3, 4, 4, 6], [3, 11, 4, 4], [9, 12, 4, 2], [17, 12, 4, 2]],
      props: [
        { kind: 'fridge', x: 3, y: 4, w: 4, h: 6 }, { kind: 'fridge', x: 3, y: 11, w: 4, h: 4 },
        { kind: 'register', x: 22, y: 2 }, { kind: 'oden', x: 17, y: 4 },
        { kind: 'umbrellaRack', x: 27, y: 12 }, { kind: 'lightbox', x: 10, y: 1, w: 7, h: 2, text: '齐阵 · 24H' },
        { kind: 'banner', x: 8, y: 1, text: 'SALE / 便利' },
        { kind: 'shelf', x: 9, y: 12, w: 4, h: 2 }, { kind: 'shelf', x: 17, y: 12, w: 4, h: 2 },
        { kind: 'priceTag', x: 9, y: 9, text: '¥3 水' }, { kind: 'priceTag', x: 15, y: 9, text: '¥7 饭团' }
      ]
    },
    tech: {
      floor: '#b9c2cf', wall: '#2b4a55', trim: '#4fb8a8',
      title: '15 PRO / 极设数码', sign: '检测 15 PRO · 30%OFF',
      poster: ['检测 15 PRO', '5% · 30%OFF'], lamp: '#a9f0e6',
      counter: { x: 4, y: 3, w: 20, h: 2 }, clerk: { x: 21, y: 2, name: '店员' },
      solids: [[4, 3, 20, 2], [4, 10, 4, 4], [22, 10, 4, 4]],
      props: [
        { kind: 'phoneWall', x: 6, y: 1, w: 14 }, { kind: 'glassCase', x: 5, y: 8, w: 8, h: 3 },
        { kind: 'filmDesk', x: 18, y: 9, w: 6 }, { kind: 'ledStrip', x: 4, y: 1, w: 22 },
        { kind: 'banner', x: 7, y: 6, text: '15 PRO 检测 · 5%' },
        { kind: 'priceTag', x: 6, y: 12, text: '30% OFF' }, { kind: 'priceTag', x: 18, y: 12, text: '贴膜 5%' },
        { kind: 'shelf', x: 4, y: 10, w: 4, h: 4 }, { kind: 'shelf', x: 22, y: 10, w: 4, h: 4 }
      ]
    },
    clothes: {
      floor: '#e6d9d2', wall: '#8a3a38', trim: '#e2564d',
      title: 'FAMILY GO / 齐率', sign: '冰原新款！ON SALE 8折 · 会员7折',
      poster: ['冰原新款！ON SALE', '会员享 7 折'], lamp: '#ffd9c4',
      counter: { x: 23, y: 3, w: 4, h: 2 }, clerk: { x: 24, y: 2, name: '店员' },
      solids: [[23, 3, 4, 2], [4, 5, 3, 5], [12, 5, 3, 5], [20, 9, 3, 5]],
      props: [
        { kind: 'clothesRack', x: 4, y: 5, w: 3 }, { kind: 'clothesRack', x: 9, y: 5, w: 3 },
        { kind: 'mannequin', x: 15, y: 8 }, { kind: 'mannequin', x: 19, y: 8 },
        { kind: 'fitting', x: 24, y: 10, w: 3, h: 4 }, { kind: 'mirror', x: 3, y: 12, w: 3, h: 4 },
        { kind: 'promoFlag', x: 6, y: 1, w: 18 }, { kind: 'banner', x: 6, y: 2, text: '冰原新款 ON SALE 8折' },
        { kind: 'priceTag', x: 8, y: 12, text: '8折 / 会员7折' }
      ]
    },
    snack: {
      floor: '#e9dcae', wall: '#8a6416', trim: '#d99b1f',
      title: 'SNACK² / 食趣', sign: '会员特优 VIP GET! 新品 -60% OFF',
      poster: ['VIP GET! FREE SALE!', '新品 -60% OFF'], lamp: '#fff0a8',
      counter: { x: 20, y: 3, w: 7, h: 2 }, clerk: { x: 22, y: 2, name: '店员' },
      solids: [[20, 3, 7, 2], [3, 7, 4, 4], [10, 7, 4, 4], [4, 13, 5, 2], [18, 13, 5, 2]],
      props: [
        { kind: 'snackPile', x: 3, y: 7, w: 4, h: 4 }, { kind: 'snackPile', x: 10, y: 7, w: 4, h: 4 },
        { kind: 'promoFlag', x: 4, y: 1, w: 22 }, { kind: 'speaker', x: 26, y: 2 },
        { kind: 'banner', x: 5, y: 3, text: 'FREE SALE!' },
        { kind: 'priceTag', x: 4, y: 12, text: '-60% OFF' }, { kind: 'priceTag', x: 18, y: 12, text: 'VIP GET!' },
        { kind: 'shelf', x: 4, y: 13, w: 5, h: 2 }, { kind: 'shelf', x: 18, y: 13, w: 5, h: 2 }
      ]
    },
    sport: {
      floor: '#c3c9bd', wall: '#33634a', trim: '#4caf7d',
      title: 'HARDWARE / 硬件运动', sign: '硬件 / 运动',
      poster: ['硬件 / 运动', 'SPORT'], lamp: '#d6f5dd',
      counter: { x: 23, y: 3, w: 4, h: 2 }, clerk: { x: 24, y: 2, name: '教练' },
      solids: [[23, 3, 4, 2], [3, 5, 4, 5], [9, 5, 4, 5], [16, 11, 8, 2]],
      props: [
        { kind: 'dumbbellRack', x: 3, y: 5, w: 4, h: 5 }, { kind: 'dumbbellRack', x: 9, y: 5, w: 4, h: 5 },
        { kind: 'treadmill', x: 16, y: 7, w: 7 }, { kind: 'mat', x: 4, y: 13, w: 6, h: 2 },
        { kind: 'mat', x: 12, y: 13, w: 6, h: 2 }, { kind: 'banner', x: 6, y: 1, text: 'HARDWARE SPORT' },
        { kind: 'priceTag', x: 16, y: 12, text: '先试举 再谈价' }
      ]
    },
    book: {
      floor: '#c7b89c', wall: '#5b4a7a', trim: '#7a6a9c',
      title: 'LEISURE / 消遣书学', sign: '消遣 · 书学',
      poster: ['消遣 · 书学', '蓝格子那排'], lamp: '#f4e6b0',
      counter: { x: 22, y: 3, w: 5, h: 2 }, clerk: { x: 23, y: 2, name: '店员' },
      solids: [[22, 3, 5, 2], [3, 4, 4, 6], [9, 4, 4, 6], [3, 12, 4, 3], [9, 12, 4, 3]],
      props: [
        { kind: 'bookshelf', x: 3, y: 4, w: 4, h: 6 }, { kind: 'bookshelf', x: 9, y: 4, w: 4, h: 6 },
        { kind: 'bookshelf', x: 3, y: 12, w: 4, h: 3 }, { kind: 'readingNook', x: 17, y: 10, w: 7, h: 5 },
        { kind: 'ladder', x: 15, y: 5 }, { kind: 'banner', x: 6, y: 1, text: '消遣 · 书学' },
        { kind: 'priceTag', x: 15, y: 12, text: '地图册 →' }
      ]
    },
    travel: {
      floor: '#c8d8e0', wall: '#2f5f7a', trim: '#4b8fb5',
      title: 'TRAVEL / 环球旅行', sign: '春季旅行推荐',
      poster: ['春季旅行推荐', 'TRAVEL AGENCY'], lamp: '#d8f0ff',
      counter: { x: 4, y: 3, w: 14, h: 2 }, clerk: { x: 8, y: 2, name: '旅行顾问' },
      solids: [[4, 3, 14, 2], [20, 10, 6, 4]],
      props: [
        { kind: 'globe', x: 20, y: 3 }, { kind: 'posterWall', x: 20, y: 1, w: 7, h: 3, theme: 'sea' },
        { kind: 'luggage', x: 22, y: 12 }, { kind: 'luggage', x: 25, y: 12 },
        { kind: 'banner', x: 6, y: 1, text: '一元环旅行 · 春季推荐' },
        { kind: 'priceTag', x: 20, y: 15, text: '春季路线' }
      ]
    },
    estate: {
      floor: '#d6cbb4', wall: '#6b4a33', trim: '#9a6b4f',
      title: 'ESTATE / 户连房产', sign: '二室一厅 290万 / 330万 / 470万',
      poster: ['二室一厅 290万', '林景园 470万'], lamp: '#ffe9c4',
      counter: { x: 4, y: 3, w: 13, h: 2 }, clerk: { x: 8, y: 2, name: '中介' },
      solids: [[4, 3, 13, 2], [19, 10, 8, 4]],
      props: [
        { kind: 'planWall', x: 4, y: 1, w: 22 }, { kind: 'model', x: 20, y: 10, w: 6, h: 4 },
        { kind: 'roundTable', x: 10, y: 10 }, { kind: 'banner', x: 6, y: 6, text: '290万 / 330万 / 470万' },
        { kind: 'priceTag', x: 6, y: 12, text: '看看不收钱' }
      ]
    },
    gym: {
      floor: '#b9cdd0', wall: '#23625f', trim: '#3d9a94',
      title: 'SWIM & FIT / 游泳健身', sign: '月卡50 / 年卡550 · 一次包会',
      poster: ['月卡 50 / 年卡 550', '资深教练 一次包会'], lamp: '#d6fff4',
      counter: { x: 4, y: 3, w: 10, h: 2 }, clerk: { x: 7, y: 2, name: '前台' },
      solids: [[4, 3, 10, 2], [17, 6, 9, 5], [4, 11, 6, 4]],
      props: [
        { kind: 'pool', x: 17, y: 6, w: 9, h: 5 }, { kind: 'treadmill', x: 5, y: 11, w: 7 },
        { kind: 'locker', x: 3, y: 6, w: 3, h: 5 }, { kind: 'banner', x: 8, y: 1, text: '游泳健身 · 一次包会 学得失信' },
        { kind: 'priceTag', x: 15, y: 2, text: '月卡50 年卡550' }
      ]
    },
    lock: {
      floor: '#b9bcc9', wall: '#4a4d68', trim: '#6b6f8c',
      title: '24H HOUR SELF / 曙光锁匠', sign: '曙光锁匠 24H 自助',
      poster: ['24H 自助 HOUR SELF', '半夜也能配钥匙'], lamp: '#ffd25a',
      counter: { x: 4, y: 3, w: 10, h: 2 }, clerk: { x: 7, y: 2, name: '锁匠' },
      solids: [[4, 3, 10, 2], [18, 6, 5, 5], [4, 11, 5, 4]],
      props: [
        { kind: 'keyWall', x: 16, y: 1, w: 11 }, { kind: 'keyMachine', x: 18, y: 6, w: 5, h: 5 },
        { kind: 'lightbox', x: 4, y: 1, w: 8, h: 2, text: '24H HOUR SELF' },
        { kind: 'shelf', x: 4, y: 11, w: 5, h: 4 }, { kind: 'banner', x: 4, y: 8, text: '曙光锁匠 · 配钥匙' }
      ]
    },
    study: {
      floor: '#e0d0e0', wall: '#8a3a63', trim: '#c05b86',
      title: 'MY WORLD / 麦芬文具', sign: '考试过！PASS ALL EXAM!',
      poster: ['考试过！PASS ALL EXAM!', '模拟卷 五本装'], lamp: '#ffd6f0',
      counter: { x: 22, y: 3, w: 5, h: 2 }, clerk: { x: 23, y: 2, name: '店员' },
      solids: [[22, 3, 5, 2], [3, 6, 4, 3], [9, 6, 4, 3], [15, 6, 4, 3], [3, 12, 4, 3], [9, 12, 4, 3], [15, 12, 4, 3]],
      props: [
        { kind: 'blackboard', x: 4, y: 1, w: 18 }, { kind: 'desk', x: 3, y: 6, w: 4, h: 3 },
        { kind: 'desk', x: 9, y: 6, w: 4, h: 3 }, { kind: 'desk', x: 15, y: 6, w: 4, h: 3 },
        { kind: 'desk', x: 3, y: 12, w: 4, h: 3 }, { kind: 'desk', x: 9, y: 12, w: 4, h: 3 },
        { kind: 'examPile', x: 20, y: 10 }, { kind: 'banner', x: 5, y: 4, text: 'PASS ALL EXAM! 考试过！' }
      ]
    },
    bbq: {
      floor: '#a98c78', wall: '#6b2f24', trim: '#b5503c',
      title: "LET'S BARBECUE / 蒸汽烤肉", sign: '营业 9AM–3AM',
      poster: ['9AM–3AM', "LET'S BARBECUE"], lamp: '#ffb46a',
      counter: { x: 4, y: 3, w: 12, h: 2 }, clerk: { x: 7, y: 2, name: '烤师' },
      solids: [[4, 3, 12, 2], [18, 5, 8, 4], [4, 11, 5, 3], [12, 11, 5, 3], [20, 11, 5, 3]],
      props: [
        { kind: 'grill', x: 18, y: 5, w: 8, h: 4 }, { kind: 'beerKeg', x: 27, y: 9 },
        { kind: 'roundTable', x: 5, y: 11 }, { kind: 'roundTable', x: 14, y: 11 }, { kind: 'roundTable', x: 22, y: 11 },
        { kind: 'banner', x: 5, y: 1, text: '营业 9AM–3AM · 凌晨有折扣' }, { kind: 'nightLamp', x: 16, y: 2 }
      ]
    },
    arcade: {
      floor: '#2b2b52', wall: '#171738', trim: '#5b4fb3',
      title: 'INFINITY LIVES / 无限起程', sign: '无限起程 INFINITY LIVES',
      poster: ['INFINITY LIVES', '命很多 随便花'], lamp: '#a9b6ff',
      counter: { x: 4, y: 3, w: 8, h: 2 }, clerk: { x: 6, y: 2, name: '老板' },
      solids: [[4, 3, 8, 2], [14, 6, 4, 5], [19, 6, 4, 5], [24, 6, 3, 5]],
      props: [
        { kind: 'arcadeRow', x: 14, y: 6, w: 13, h: 5 }, { kind: 'tokenDesk', x: 4, y: 10, w: 6, h: 4 },
        { kind: 'neon', x: 5, y: 1, w: 20, text: 'INFINITY LIVES' }, { kind: 'neon', x: 8, y: 15, w: 14, text: '无限起程' },
        { kind: 'priceTag', x: 20, y: 12, text: '一枚币 一条命' }
      ]
    },
    game: {
      floor: '#36365e', wall: '#1c1c3e', trim: '#3b3b8f',
      title: 'BUY NOW! / 像素电玩', sign: '使命召唤 预购 / UBISOFT -20%',
      poster: ['现在预购！BUY NOW!', 'UBISOFT -20% / -30%'], lamp: '#c3bfff',
      counter: { x: 4, y: 3, w: 12, h: 2 }, clerk: { x: 7, y: 2, name: '店员' },
      solids: [[4, 3, 12, 2], [18, 8, 8, 5]],
      props: [
        { kind: 'posterWall', x: 4, y: 1, w: 22, h: 2, theme: 'game' },
        { kind: 'preorderStand', x: 18, y: 8, w: 8, h: 5 }, { kind: 'gamepadShelf', x: 5, y: 10, w: 8, h: 4 },
        { kind: 'neon', x: 6, y: 6, w: 16, text: 'BUY NOW!' }, { kind: 'priceTag', x: 18, y: 14, text: '双一赠一 -20%' }
      ]
    },
    rent: {
      floor: '#b9b4a3', wall: '#7a6a4a', trim: '#a08a5b',
      title: 'ON SALE! / 旺铺招租', sign: '旺铺招租 联系电话 12347769',
      poster: ['旺铺招租 ON SALE!', '12347769'], lamp: '#d8cda8',
      counter: { x: 21, y: 3, w: 6, h: 2 }, clerk: { x: 23, y: 2, name: '中介' },
      solids: [[21, 3, 6, 2], [4, 12, 5, 3]],
      props: [
        { kind: 'shutter', x: 4, y: 1, w: 14 }, { kind: 'boxes', x: 4, y: 12, w: 5, h: 3 },
        { kind: 'boxes', x: 12, y: 13, w: 4, h: 2 }, { kind: 'banner', x: 5, y: 7, text: 'ON SALE! 旺铺招租' },
        { kind: 'priceTag', x: 19, y: 8, text: '12347769' }, { kind: 'dust', x: 8, y: 9, w: 10, h: 4 }
      ]
    },
    vending: {
      floor: '#c9c6b4', wall: '#3a5a68', trim: '#4fb8a8',
      title: 'AUTO VENDING', sign: '自助售卖机 · 请勿踢',
      poster: ['Auto Tied Vending', '请勿踢'], lamp: '#d8f4f0',
      counter: { x: 4, y: 3, w: 10, h: 2 }, clerk: { x: 7, y: 2, name: '补货员' },
      solids: [[4, 3, 10, 2], [18, 6, 4, 6]],
      props: [
        { kind: 'vendingIn', x: 18, y: 6, w: 4, h: 6 }, { kind: 'lightbox', x: 4, y: 1, w: 9, h: 2, text: 'AUTO VENDING' },
        { kind: 'banner', x: 5, y: 9, text: '请勿踢' }
      ]
    }
  };

  function interior(shopId) {
    const shop = PC.SHOP_BY_ID[shopId] || PC.SHOP_BY_ID.mart;
    const kit = KITS[shop.type] || KITS.mart;
    const s = baseScene('interior:' + shopId, 30, 18, 'roomFloor');
    border(s);
    s.floorColor = kit.floor;
    s.indoor = true; s.shop = shop; s.label = shop.name + ' · 店内';
    // 墙面
    s.props.push({ kind: 'wall', x: 0, y: 0, w: 30, h: 2, color: kit.wall, trim: kit.trim });
    s.props.push({ kind: 'kickline', x: 0, y: 16, w: 30, h: 1, color: kit.trim });
    for (let y = 0; y < s.h; y++) { s.solid[y][0] = 1; s.solid[y][s.w - 1] = 1; }
    // 专属家具
    (kit.solids || []).forEach(r => fill(s.solid, { x: r[0], y: r[1], w: r[2], h: r[3] }, 1));
    (kit.props || []).forEach(p => s.props.push(Object.assign({ color: kit.trim, lamp: kit.lamp, text2: kit.title }, p)));
    // 柜台
    const c = kit.counter;
    s.props.push({ kind: 'counter', x: c.x, y: c.y, w: c.w, h: c.h, color: kit.trim, title: kit.title, sub: kit.sign });
    // 吊灯
    s.props.push({ kind: 'lampIn', x: 9, y: 5, lamp: kit.lamp });
    s.props.push({ kind: 'lampIn', x: 21, y: 5, lamp: kit.lamp });
    // 店员
    s.npcs.push({ name: kit.clerk.name, color: kit.trim, x: kit.clerk.x * T, y: kit.clerk.y * T + 8, stationary: true, dir: 0, frame: 0, id: 'clerk' });
    // 交互点：货架 / 兼职 / 出口
    const cx = c.x * T + c.w * T / 2;
    s.points.push({ id: 'counter', type: 'counter', x: cx, y: (c.y + c.h) * T + 18, label: '打开 ' + shop.name + ' 货架' });
    s.points.push({ id: 'job_' + shopId, type: 'jobs', x: cx + (c.w > 12 ? -46 : 40), y: (c.y + c.h) * T + 18, label: '💼 在 ' + shop.name + ' 打个工', ctx: shopId });
    s.points.push({ id: 'exit', type: 'exit', x: 15 * T, y: 17 * T + 10, label: '离开 ' + shop.name });
    s.spawn = { x: 15 * T, y: 15 * T };
    return s;
  }

  /* ---------------- 林景园 · 大型西洋风住宅小区 ----------------
     主角家就在 3 栋 502；1 / 3 / 5 栋是居民楼，A / B / C 座是别墅。
     中央是喷泉水池与栈道，南门进来是主轴，西侧健身区、东侧售楼处。 */
  function park() {
    const s = baseScene('park', 72, 48, 'grass');
    // 南北主轴 + 东西散步道 + 南门广场 + 环水池步道
    fill(s.ground, { x: 33, y: 0, w: 6, h: 48 }, 'plaza');
    fill(s.ground, { x: 0, y: 31, w: 72, h: 4 }, 'plaza');
    fill(s.ground, { x: 28, y: 40, w: 16, h: 8 }, 'plaza');
    fill(s.ground, { x: 25, y: 16, w: 22, h: 14 }, 'plaza');
    // 中央大水池（中间一条栈道能走过去）
    fill(s.ground, { x: 28, y: 18, w: 16, h: 9 }, 'water');
    for (let y = 18; y < 27; y++) for (let x = 28; x < 44; x++) s.solid[y][x] = 1;
    for (let y = 18; y < 27; y++) for (let x = 35; x < 38; x++) { s.solid[y][x] = 0; s.ground[y][x] = 'plaza'; }
    // 北端花坛
    fill(s.ground, { x: 31, y: 1, w: 10, h: 3 }, 'plaza');
    border(s);

    /* 三栋居民楼（实心） */
    const blocks = [
      { id: 1, x: 3, y: 3, w: 14, h: 12, name: '1 栋', color: '#c9a97e', door: '1 栋 单元门' },
      { id: 3, x: 19, y: 3, w: 12, h: 12, name: '3 栋', color: '#d8c4a4', door: '3 栋 · 我家在 502' },
      { id: 5, x: 45, y: 3, w: 14, h: 12, name: '5 栋', color: '#b9a8a0', door: '5 栋 单元门' }
    ];
    blocks.forEach(b => {
      fill(s.solid, { x: b.x, y: b.y, w: b.w, h: b.h }, 1);
      s.props.push({ kind: 'apartmentBlock', x: b.x, y: b.y, w: b.w, h: b.h, no: b.name, color: b.color });
    });
    /* 售楼处 / 会所 */
    fill(s.solid, { x: 60, y: 3, w: 10, h: 12 }, 1);
    s.props.push({ kind: 'estateOffice', x: 60, y: 3, w: 10, h: 12 });
    /* 三栋别墅 */
    const villas = [
      { id: 'villaA', x: 19, y: 36, w: 12, h: 8, name: 'A 座', color: '#e6d4b8' },
      { id: 'villaB', x: 41, y: 36, w: 12, h: 8, name: 'B 座', color: '#e9d9d0' },
      { id: 'villaC', x: 56, y: 36, w: 13, h: 8, name: 'C 座', color: '#d8dce0' }
    ];
    villas.forEach(v => {
      fill(s.solid, { x: v.x, y: v.y, w: v.w, h: v.h }, 1);
      s.props.push({ kind: 'villaHouse', x: v.x, y: v.y, w: v.w, h: v.h, no: v.name, color: v.color, unit: v.id });
    });
    /* 健身器材区 */
    s.props.push({ kind: 'gymEquipment', x: 3, y: 36, w: 14, h: 8 });
    /* 喷泉水池 / 水池装饰 / 南门内侧 / 小区铭牌 */
    s.props.push({ kind: 'fountainBig', x: 33, y: 18, w: 6, h: 7 });
    s.props.push({ kind: 'estatePondProp', x: 28, y: 18, w: 16, h: 9 });
    s.props.push({ kind: 'estateGateInner', x: 31, y: 44, w: 10, h: 4 });
    s.props.push({ kind: 'estateSign', x: 33, y: 39, w: 6, h: 2 });
    s.props.push({ kind: 'estatePlanter', x: 29, y: 29, w: 4, h: 2 });
    s.props.push({ kind: 'estatePlanter', x: 39, y: 29, w: 4, h: 2 });
    /* 树 / 花 / 长椅 / 路灯 */
    [[2, 19], [8, 19], [17, 19], [24, 19], [47, 19], [54, 19], [59, 19], [69, 19],
     [2, 27], [10, 27], [17, 27], [24, 27], [47, 27], [55, 27], [62, 27], [69, 27],
     [2, 40], [16, 40], [35, 35], [54, 40], [69, 40], [2, 45], [16, 45], [53, 45], [69, 45]]
      .forEach(([x, y]) => { s.decos.push({ kind: 'tree', tx: x, ty: y }); fill(s.solid, { x, y, w: 1, h: 1 }, 1); });
    [[6, 24], [20, 24], [50, 24], [65, 24], [6, 34], [24, 34], [48, 34], [66, 34]]
      .forEach(([x, y]) => s.decos.push({ kind: 'flower', tx: x, ty: y }));
    [[12, 29], [22, 29], [48, 29], [60, 29], [8, 34], [26, 34], [45, 34], [64, 34], [30, 42], [42, 42]]
      .forEach(([x, y]) => s.decos.push({ kind: 'bench', tx: x, ty: y }));
    [[16, 16], [26, 16], [46, 16], [56, 16], [16, 30], [26, 30], [46, 30], [56, 30], [18, 40], [54, 40], [30, 44], [42, 44]]
      .forEach(([x, y]) => s.decos.push({ kind: 'lamp', tx: x, ty: y }));

    /* 交互点 */
    s.points.push({ id: 'exit', type: 'exit', x: 36 * T, y: 46 * T, label: '出小区门 · 回到 曙光路' });
    s.points.push({ id: 'estateGateSign', type: 'sign', x: 33 * T, y: 44 * T, label: '林景园 LINJING GARDEN · 西洋风小区南门' });
    s.points.push({ id: 'estateOffice', type: 'estate', x: 65 * T, y: 16 * T, label: '🏛 林景园 售楼处 · 买公寓 / 买别墅 / 出租' });
    s.points.push({ id: 'pond', type: 'estatePond', x: 36 * T, y: 17 * T, label: '⛲ 中央水池 · 喂锦鲤 / 许愿' });
    s.points.push({ id: 'fishGame', type: 'fishGame', x: 36 * T, y: 27 * T, label: '🎣 捞锦鲤 · 小游戏' });
    s.props.push({ kind: 'fishSpot', x: 29, y: 18, w: 14, h: 8 });
    s.props.push({ kind: 'photoSpot', x: 36, y: 40, w: 2, h: 2 });
    s.props.push({ kind: 'gachaMachine', x: 46, y: 42, w: 2, h: 3 });
    s.points.push({ id: 'photoE', type: 'photo', x: 37 * T, y: 41 * T, label: '📸 打卡 · 林景园中轴', spot: 'linjing_pond' });
    s.points.push({ id: 'gachaE', type: 'gacha', x: 47 * T, y: 43 * T, label: '🎰 小区扭蛋机 · ¥20 抽一次' });
    s.points.push({ id: 'fountainPt', type: 'sign', x: 30 * T, y: 17 * T, label: '喷水池 · 林景园中轴' });
    s.points.push({ id: 'gym', type: 'estateGym', x: 9 * T, y: 42 * T, label: '🏋 健身区 · 练一会儿' });
    s.points.push({ id: 'apt1Door', type: 'aptDoor', x: 10 * T, y: 16 * T, label: '1 栋 单元门 · 拜访邻居', unit: 'apt3' });
    s.points.push({ id: 'apt3Door', type: 'home', x: 25 * T, y: 16 * T, label: '🏠 3 栋 502 · 回我家' });
    s.points.push({ id: 'apt5Door', type: 'aptDoor', x: 52 * T, y: 16 * T, label: '5 栋 单元门 · 看看两居', unit: 'apt2' });
    villas.forEach(v => s.points.push({
      id: 'villaDoor_' + v.id, type: 'villaDoor', unit: v.id,
      x: (v.x + v.w / 2) * T, y: (v.y + v.h) * T + 10, label: '🏡 ' + v.name + ' 别墅 · ' + (PC.Estate && PC.Estate.owned(v.id) ? '进去坐坐' : '看房 / 买下')
    }));
    s.points.push({ id: 'job_park', type: 'jobs', x: 6 * T, y: 33 * T, label: '💼 林景园零工 · 遛狗 / 捡瓶', ctx: 'park' });
    s.points.push({ id: 'job_estate', type: 'jobs', x: 24 * T, y: 43 * T, label: '💼 小区零工 · 保洁 / 代收快递 / 园艺', ctx: 'estate' });
    s.points.push({ id: 'estateLedger', type: 'earn', x: 44 * T, y: 43 * T, label: '💰 街区账本 · 房租也在里面' });
    s.npcs.push({ name: '小区保安', color: '#3b3b8f', x: 33 * T, y: 44 * T, stationary: true, dir: 0, frame: 0, id: 'pk0' });
    s.npcs.push({ name: '公园里的跑者', color: '#4fb8a8', x: 8 * T, y: 29 * T, path: [{ x: 8 * T, y: 29 * T }, { x: 64 * T, y: 29 * T }, { x: 64 * T, y: 33 * T }, { x: 8 * T, y: 33 * T }], pi: 0, wait: 0, dir: 3, frame: 0, id: 'pk1' });
    s.npcs.push({ name: '遛狗的上班族', color: '#e2564d', x: 26 * T, y: 20 * T, path: [{ x: 26 * T, y: 20 * T }, { x: 26 * T, y: 28 * T }, { x: 46 * T, y: 28 * T }], pi: 0, wait: 0, dir: 0, frame: 0, id: 'pk2' });
    s.npcs.push({ name: '看房的情侣', color: '#c05b86', x: 62 * T, y: 20 * T, stationary: true, dir: 3, frame: 0, id: 'pk3' });
    s.npcs.push({ name: '修剪蔷薇的园丁', color: '#4caf7d', x: 58 * T, y: 34 * T, stationary: true, dir: 1, frame: 0, id: 'pk4' });
    s.spawn = { x: 36 * T, y: 43 * T };
    s.label = '林景园 · LINJING GARDEN 小区';
    return s;
  }

  /* ---------------- 林景园 · 我家（公寓，按名下户型变化） ---------------- */
  function home() {
    const E = PC.Estate, unit = E ? E.homeUnit() : { id: 'apt1', name: '3 栋 502 · 一室一厅' };
    const big = unit.id === 'apt2', pent = unit.id === 'apt3';
    const W = pent ? 40 : big ? 36 : 30, H = pent ? 24 : big ? 20 : 18;
    const s = baseScene('home', W, H, 'roomFloor');
    s.indoor = true; s.floorColor = pent ? '#e0d2b8' : big ? '#d8c9ae' : '#d8c4a4';
    border(s);
    s.props.push({ kind: 'wall', x: 0, y: 0, w: W, h: 2, color: '#7a5a72', trim: '#c05b86' });
    s.props.push({ kind: 'kickline', x: 0, y: H - 2, w: W, h: 1, color: '#c05b86' });
    for (let y = 0; y < s.h; y++) { s.solid[y][0] = 1; s.solid[y][s.w - 1] = 1; }
    [[3, 4, 5, 3], [20, 3, 5, 2], [25, 6, 3, 4], [3, 11, 6, 2], [20, 11, 5, 2], [12, 3, 3, 4], [10, 12, 4, 2]]
      .forEach(r => fill(s.solid, { x: r[0], y: r[1], w: r[2], h: r[3] }, 1));
    s.props.push({ kind: 'windowH', x: 8, y: 1, w: 6 });
    s.props.push({ kind: 'poster', x: 15, y: 1, w: 5, text: 'INFINITY LIVES', color: '#5b4fb3' });
    s.props.push({ kind: 'bed', x: 3, y: 4, w: 5, h: 3 });
    s.props.push({ kind: 'homeDesk', x: 20, y: 3, w: 5, h: 2 });
    s.props.push({ kind: 'wardrobe', x: 25, y: 6, w: 3, h: 4 });
    s.props.push({ kind: 'kitchen', x: 3, y: 11, w: 6, h: 2 });
    s.props.push({ kind: 'tv', x: 20, y: 11, w: 5, h: 2 });
    s.props.push({ kind: 'sofa', x: 10, y: 12, w: 4, h: 2 });
    s.props.push({ kind: 'rug', x: 11, y: 8, w: 9, h: 3, color: '#c05b86' });
    s.props.push({ kind: 'piggy', x: 23, y: 9 });
    s.props.push({ kind: 'cat', x: 16, y: 14 });
    s.props.push({ kind: 'lampIn', x: 9, y: 5, lamp: '#ffe6a8' });
    s.props.push({ kind: 'lampIn', x: 22, y: 7, lamp: '#ffe6a8' });
    s.props.push({ kind: 'banner', x: 5, y: 1, text: '林景园 LINJING GARDEN · ' + unit.name + ' · 欢迎回家' });
    s.props.push({ kind: 'balconyDoor', x: W - 8, y: H - 6, w: 5, h: 4 });
    s.props.push({ kind: 'unitPlate', x: W - 4, y: H - 3, text: unit.name.split(' · ')[0] });
    if (big || pent) {
      // 两居 / 复式：多一间书房 + 第二间卧室 + 书架
      fill(s.solid, { x: 29, y: 4, w: 5, h: 3 }, 1);
      s.props.push({ kind: 'bookshelf', x: 29, y: 4, w: 5, h: 4 });
      s.props.push({ kind: 'homeDesk', x: W - 12, y: H - 10, w: 5, h: 2 });
      s.props.push({ kind: 'villaWindow', x: W - 11, y: 1, w: 6, h: 4 });
      s.props.push({ kind: 'catTower', x: 27, y: H - 6 });
      s.points.push({ id: 'hStudy', type: 'homeAction', act: 'study', x: 30 * T, y: (H - 5) * T, label: '📚 书房看会儿书 · 学识 +4' });
    }
    if (pent) {
      s.props.push({ kind: 'villaStairs', x: 32, y: H - 9, w: 6, h: 6 });
      s.props.push({ kind: 'chandelier', x: 18, y: 2, w: 4 });
      s.props.push({ kind: 'rug', x: 22, y: H - 7, w: 10, h: 3, color: '#5b4fb3' });
      s.points.push({ id: 'hTerrace', type: 'homeAction', act: 'terrace', x: 26 * T, y: (H - 4) * T, label: '🌇 露台看整条曙光路 · 心情 +8' });
    }
    s.points.push({ id: 'hSleep', type: 'homeAction', act: 'sleep', x: 5 * T, y: 8 * T, label: '🛏 睡一觉 · 回满体力到明早' });
    s.points.push({ id: 'hFridge', type: 'homeAction', act: 'fridge', x: 13 * T, y: 8 * T, label: '🧊 冰箱找点吃的 · 体力 +12' });
    s.points.push({ id: 'hPiggy', type: 'homeAction', act: 'piggy', x: 23 * T, y: 10 * T, label: '🐷 存钱罐 · 存 / 取 ¥50' });
    s.points.push({ id: 'hPhone', type: 'homeAction', act: 'phone', x: 22 * T, y: 6 * T, label: '📱 窝着刷手机' });
    s.points.push({ id: 'hAlbum', type: 'homeAction', act: 'album', x: 9 * T, y: 13 * T, label: '📷 看看相册 / 成就' });
    s.points.push({ id: 'hEstate', type: 'homeAction', act: 'estate', x: (W - 3) * T, y: (H - 3) * T, label: '🏛 翻翻林景园房产手册' });
    s.points.push({ id: 'exit', type: 'exit', x: Math.floor(W / 2) * T, y: (H - 1) * T - 8, label: '出门 · 回林景园小区' });
    s.spawn = { x: Math.floor(W / 2) * T, y: 9 * T };
    s.label = '林景园 · 我家 · ' + unit.name;
    return s;
  }

  /* ---------------- 林景园 · 别墅室内（买下才能进） ---------------- */
  function villa(unitId) {
    const E = PC.Estate, u = (E && E.get(unitId)) || { name: '别墅', no: 'A 座' };
    const THEME = {
      villaA: { wall: '#4a6b7c', floor: '#e2d8c0', trim: '#7fe0c8', name: '水岸 · 临池' },
      villaB: { wall: '#8a5b72', floor: '#eadfd6', trim: '#ffd25a', name: '蔷薇 · 暖房' },
      villaC: { wall: '#4b5a76', floor: '#d8dce0', trim: '#c3bfff', name: '林荫 · 双车库' }
    }[unitId] || { wall: '#4a6b7c', floor: '#e2d8c0', trim: '#7fe0c8', name: '别墅' };
    const s = baseScene('villa:' + unitId, 42, 26, 'roomFloor');
    s.indoor = true; s.floorColor = THEME.floor;
    s.villaUnit = unitId;
    border(s);
    s.props.push({ kind: 'wall', x: 0, y: 0, w: 42, h: 2, color: THEME.wall, trim: THEME.trim });
    s.props.push({ kind: 'kickline', x: 0, y: 24, w: 42, h: 1, color: THEME.trim });
    for (let y = 0; y < s.h; y++) { s.solid[y][0] = 1; s.solid[y][s.w - 1] = 1; }
    // 分区地面：客厅 / 书房 / 车库 / 露台泳池
    fill(s.ground, { x: 24, y: 14, w: 16, h: 10 }, 'water');
    for (let y = 14; y < 24; y++) for (let x = 24; x < 40; x++) s.solid[y][x] = 1;
    fill(s.ground, { x: 2, y: 17, w: 12, h: 6 }, 'metroFloor');
    // 大件
    s.props.push({ kind: 'villaWindow', x: 5, y: 1, w: 10, h: 5 });
    s.props.push({ kind: 'chandelier', x: 15, y: 2, w: 5 });
    s.props.push({ kind: 'fireplace', x: 2, y: 4, w: 6, h: 6 });
    s.props.push({ kind: 'sofa', x: 12, y: 9, w: 6, h: 3 });
    s.props.push({ kind: 'rug', x: 11, y: 13, w: 10, h: 3, color: THEME.trim });
    s.props.push({ kind: 'bookshelf', x: 30, y: 3, w: 8, h: 5 });
    s.props.push({ kind: 'homeDesk', x: 31, y: 9, w: 6, h: 2 });
    s.props.push({ kind: 'villaStairs', x: 20, y: 3, w: 6, h: 7 });
    s.props.push({ kind: 'garageDoor', x: 2, y: 17, w: 12, h: 6 });
    s.props.push({ kind: 'poolProp', x: 24, y: 14, w: 16, h: 10 });
    s.props.push({ kind: 'villaBed', x: 3, y: 9, w: 7, h: 4 });
    s.props.push({ kind: 'banner', x: 12, y: 1, text: '林景园 ' + u.no + ' · ' + THEME.name + ' · ' + u.name });
    s.props.push({ kind: 'unitPlate', x: 38, y: 22, text: u.no });
    // 碰撞
    [[2, 4, 6, 6], [12, 9, 6, 3], [30, 3, 8, 5], [31, 9, 6, 2], [20, 3, 6, 7], [3, 9, 7, 4], [2, 17, 12, 6]]
      .forEach(r => fill(s.solid, { x: r[0], y: r[1], w: r[2], h: r[3] }, 1));
    // 交互
    s.points.push({ id: 'vSleep', type: 'homeAction', act: 'sleep', x: 6 * T, y: 14 * T, label: '🛏 主卧睡一觉 · 回满体力到明早' });
    s.points.push({ id: 'vFire', type: 'homeAction', act: 'fire', x: 4 * T, y: 11 * T, label: '🔥 壁炉边坐一会儿 · 心情 +10' });
    s.points.push({ id: 'vStudy', type: 'homeAction', act: 'study', x: 33 * T, y: 12 * T, label: '📚 书房翻书 · 学识 +6' });
    s.points.push({ id: 'vGarage', type: 'homeAction', act: 'garage', x: 14 * T, y: 21 * T, label: '🚗 车库擦擦车 · 声望 +3' });
    s.points.push({ id: 'vPool', type: 'homeAction', act: 'pool', x: 23 * T, y: 18 * T, label: '🏊 泳池游两圈 · 体魄 +5' });
    s.points.push({ id: 'vParty', type: 'homeAction', act: 'party', x: 17 * T, y: 15 * T, label: '🎉 办场聚会（¥120）· 心情 / 声望' });
    s.points.push({ id: 'vEstate', type: 'homeAction', act: 'estate', x: 38 * T, y: 12 * T, label: '🏛 房产手册 · 搬家 / 出租' });
    s.points.push({ id: 'vPhone', type: 'homeAction', act: 'phone', x: 16 * T, y: 8 * T, label: '📱 窝在沙发刷手机' });
    s.points.push({ id: 'exit', type: 'exit', x: 21 * T, y: 24 * T, label: '出门 · 回林景园小区' });
    s.spawn = { x: 21 * T, y: 13 * T };
    s.label = '林景园 · ' + u.name;
    return s;
  }

  /* ---------------- 真正的地铁站：站厅 → 闸机 → 站台 → 上车 ----------------
     设计稿里「曙光路站 / 迂龙路站」是坐地铁的地方，不是地下商业街。
     两站共用这一套站台，从哪个街区进来就坐回另一个街区。 */
  function metro() {
    const s = baseScene('metro', 46, 24, 'metroFloor');
    border(s);
    fill(s.ground, { x: 0, y: 0, w: 46, h: 11 }, 'metroFloor');
    fill(s.ground, { x: 0, y: 11, w: 46, h: 13 }, 'platform');
    /* ================= 站厅 ================= */
    // 墙面瓷砖、吊顶灯带、地面盲道与导向箭头
    s.props.push({ kind: 'metroTiles', x: 0, y: 0, w: 46, h: 11 });
    s.props.push({ kind: 'ceilingLights', x: 0, y: 0, w: 46, h: 1 });
    s.props.push({ kind: 'floorGuide', x: 0, y: 8, w: 46, h: 3 });
    // 站名 / 线路 / 轨交图 / 灯箱 / 广告
    s.props.push({ kind: 'metroTitle', x: 2, y: 1, w: 17, h: 3 });
    s.props.push({ kind: 'metroHallSign', x: 21, y: 1, w: 23, h: 3 });
    s.props.push({ kind: 'metroMap', x: 2, y: 5, w: 15, h: 6 });
    s.props.push({ kind: 'lightbox', x: 19, y: 5, w: 8, h: 3, text: '票价 2元 / FARE' });
    s.props.push({ kind: 'lightbox', x: 29, y: 5, w: 8, h: 3, text: 'LINE 1 ⇄ 2' });
    s.props.push({ kind: 'lightbox', x: 39, y: 5, w: 6, h: 3, text: 'S1 / S2' });
    s.props.push({ kind: 'adLightbox', x: 19, y: 2, w: 12, h: 2 });
    s.props.push({ kind: 'arrivalDisplay', x: 33, y: 2, w: 11, h: 2 });
    s.props.push({ kind: 'banner', x: 2, y: 4, text: 'ENTRANCE ①②  ·  下一站 中华门 ZHONGHUA' });
    // 两台售票机、安检机、三组闸机、扶梯
    s.props.push({ kind: 'ticketMachine', x: 2, y: 10 });
    s.props.push({ kind: 'ticketMachine', x: 6, y: 10 });
    s.props.push({ kind: 'securityGate', x: 14, y: 8, w: 4, h: 3 });
    fill(s.solid, { x: 10, y: 9, w: 3, h: 2 }, 1);
    fill(s.solid, { x: 20, y: 9, w: 3, h: 2 }, 1);
    fill(s.solid, { x: 30, y: 9, w: 3, h: 2 }, 1);
    [[10, 9], [20, 9], [30, 9]].forEach(q => s.props.push({ kind: 'gateM', x: q[0], y: q[1], w: 3, h: 2 }));
    s.props.push({ kind: 'escalator', x: 39, y: 7, w: 6, h: 4 });
    s.props.push({ kind: 'stairsM', x: 40, y: 9 });
    // 柱子、监控、消防、垃圾桶
    [[6, 3], [22, 3], [36, 3]].forEach(q => s.props.push({ kind: 'pillarNum', x: q[0], y: q[1], num: (q[0] / 6) | 0 }));
    s.props.push({ kind: 'cctv', x: 25, y: 1 });
    s.props.push({ kind: 'stationBits', x: 17, y: 9 });
    /* ================= 站台 ================= */
    s.props.push({ kind: 'yellowLine', x: 0, y: 12, w: 46 });
    s.props.push({ kind: 'tactileStrip', x: 0, y: 13, w: 46, h: 1 });
    s.props.push({ kind: 'platformSign', x: 3, y: 13, w: 40 });
    s.props.push({ kind: 'arrivalDisplay', x: 18, y: 12, w: 10, h: 2 });
    s.props.push({ kind: 'lightbox', x: 3, y: 8, w: 7, h: 3, text: 'SHUGUANG LU' });
    s.props.push({ kind: 'lightbox', x: 36, y: 8, w: 8, h: 3, text: 'YULONG ROAD →' });
    [[6, 12], [22, 12], [38, 12]].forEach(q => s.props.push({ kind: 'pillar', x: q[0], y: q[1] }));
    s.props.push({ kind: 'platformBench', x: 8, y: 20, w: 8 });
    s.props.push({ kind: 'platformBench', x: 30, y: 20, w: 8 });
    s.props.push({ kind: 'stationBits', x: 22, y: 20 });
    // 轨道与道床（在屏蔽门后）
    s.props.push({ kind: 'trackBed', x: 2, y: 15, w: 42, h: 4 });
    // 停靠的列车
    fill(s.solid, { x: 2, y: 15, w: 42, h: 4 }, 1);
    s.props.push({ kind: 'trainBody', x: 2, y: 15, w: 42, h: 4 });
    // 一排屏蔽门（列车到站时与车门对齐）
    s.props.push({ kind: 'platformDoors', x: 2, y: 14, w: 42, h: 5 });
    // 隧道洞口
    s.props.push({ kind: 'tunnelMouth', x: 0, y: 15, w: 2, h: 4 });
    s.props.push({ kind: 'tunnelMouth', x: 44, y: 15, w: 2, h: 4 });
    s.decos.push({ kind: 'vending', tx: 2, ty: 21 }); s.decos.push({ kind: 'atm', tx: 42, ty: 21 });
    s.props.push({ kind: 'banner', x: 12, y: 22, w: 22, text: '道路千万条，安全第一条 · 请先下后上' });
    /* ---- 交互点 ---- */
    s.points.push({ id: 'exit', type: 'exit', x: 40 * T, y: 7 * T, label: '上楼 · 回到街区' });
    s.points.push({ id: 'ticket', type: 'ticket', x: 3 * T, y: 12 * T, label: '🎫 自动售票机 · 票价 2元' });
    s.points.push({ id: 'board', type: 'ride', x: 22 * T, y: 13 * T, label: '🚇 上车 · 选择线路' });
    s.points.push({ id: 'metroMapPt', type: 'sign', x: 9 * T, y: 7 * T, label: '轨交图 · 迂龙南路 / 龙川路 / 迂龙北' });
    s.points.push({ id: 'vendingU', type: 'vending', x: 3 * T, y: 22 * T, label: '站台 自助售卖机' });
    s.points.push({ id: 'atmU', type: 'atm', x: 42 * T, y: 22 * T, label: '沁银行 ATM' });
    s.points.push({ id: 'job_metro', type: 'jobs', x: 34 * T, y: 10 * T, label: '💼 站台零工 · 引导 / 清扫', ctx: 'metro' });
    s.npcs.push({ name: '站台工作人员', color: '#3b3b8f', x: 25 * T, y: 7 * T, stationary: true, dir: 0, frame: 0, id: 'staff' });
    s.npcs.push({ name: '赶车的上班族', color: '#e2564d', x: 8 * T, y: 7 * T, path: [{ x: 8 * T, y: 7 * T }, { x: 36 * T, y: 7 * T }, { x: 36 * T, y: 13 * T }, { x: 8 * T, y: 13 * T }], pi: 0, wait: 0, dir: 3, frame: 0, id: 'commuter' });
    s.npcs.push({ name: '等车的中学生', color: '#4caf7d', x: 12 * T, y: 13 * T, stationary: true, dir: 1, frame: 0, id: 'student' });
    s.npcs.push({ name: '看手机的乘客', color: '#4fb8a8', x: 33 * T, y: 13 * T, stationary: true, dir: 3, frame: 0, id: 'phone' });
    s.spawn = { x: 22 * T, y: 6 * T };
    s.label = '地铁站 · 1号线站台';
    return s;
  }

  /* ---------------- 列车车厢：真的「坐」一段地铁 ---------------- */
  function train(opts) {
    const s = baseScene('train', 30, 14, 'roomFloor');
    s.indoor = true; s.floorColor = '#b9becb';
    s.ride = opts || { name: '1 号线', car: '#4fb8a8', to: 'yulong', mins: 6 };
    border(s);
    s.props.push({ kind: 'wall', x: 0, y: 0, w: 30, h: 2, color: '#2b2c48', trim: s.ride.car || '#4fb8a8' });
    s.props.push({ kind: 'kickline', x: 0, y: 12, w: 30, h: 1, color: '#8f92b5' });
    for (let y = 0; y < s.h; y++) { s.solid[y][0] = 1; s.solid[y][s.w - 1] = 1; }
    // 车顶灯带、空调格栅、地板导向线
    s.props.push({ kind: 'carCeiling', x: 1, y: 0, w: 28, h: 2 });
    s.props.push({ kind: 'carFloor', x: 1, y: 9, w: 28, h: 4 });
    // 车窗（隧道灯带在窗外流动，偶尔掠过站台）
    [[3, 2], [9, 2], [15, 2], [21, 2]].forEach(q => s.props.push({ kind: 'carWindow', x: q[0], y: q[1] }));
    // 广告框、线路屏、线路图
    s.props.push({ kind: 'carAd', x: 3, y: 5, w: 5 });
    s.props.push({ kind: 'carAd', x: 22, y: 5, w: 5 });
    s.props.push({ kind: 'carStrip', x: 1, y: 1, w: 28 });
    s.props.push({ kind: 'carMap', x: 12, y: 5, w: 8 });
    s.props.push({ kind: 'carNumber', x: 26, y: 1, w: 3 });
    // 座椅（含优先座）、扶手、吊环
    [[2, 7], [8, 7], [16, 7], [22, 7]].forEach(q => s.props.push({ kind: 'carSeat', x: q[0], y: q[1] }));
    s.props.push({ kind: 'prioritySeat', x: 2, y: 7, w: 5 });
    [[6, 4], [13, 4], [20, 4], [27, 4]].forEach(q => s.props.push({ kind: 'carPole', x: q[0], y: q[1] }));
    s.props.push({ kind: 'carRings', x: 1, y: 3, w: 28 });
    s.props.push({ kind: 'carBin', x: 28, y: 9 });
    // 车门
    s.props.push({ kind: 'carDoor', x: 13, y: 10, w: 4 });
    s.props.push({ kind: 'carDoor', x: 25, y: 3, w: 3 });
    fill(s.solid, { x: 13, y: 10, w: 4, h: 2 }, 1);
    s.points.push({ id: 'alight', type: 'alight', x: 15 * T, y: 9 * T, label: '🚪 到站下车' });
    s.points.push({ id: 'carWindowPt', type: 'sign', x: 5 * T, y: 5 * T, label: '看看窗外 · 隧道里一格一格的灯' });
    s.points.push({ id: 'carStripPt', type: 'sign', x: 15 * T, y: 3 * T, label: '线路屏 · 下一站' });
    s.points.push({ id: 'carPhone', type: 'carPhone', x: 9 * T, y: 9 * T, label: '📱 车上刷会儿手机' });
    s.npcs.push({ name: '打瞌睡的乘客', color: '#5b4fb3', x: 4 * T, y: 8 * T, stationary: true, dir: 1, frame: 0, id: 'p1' });
    s.npcs.push({ name: '看手机的乘客', color: '#e2564d', x: 23 * T, y: 8 * T, stationary: true, dir: 3, frame: 0, id: 'p2' });
    s.spawn = { x: 15 * T, y: 7 * T };
    s.label = s.ride.name + ' · 行驶中 → ' + (s.ride.to === 'yulong' ? '迂龙路' : '曙光路');
    return s;
  }

  /* ================================================================
     汾阳中学 · 六层教学行政楼的平面图数据（纯函数，楼层与房间共用）
     平面图右侧 = 大门方向；门一律开向内侧过道 / 中庭。
     ================================================================ */
  function floorLayout(n) {
    const F = PC.SCHOOL_FLOORS[n - 1];
    const rooms = [];
    const add = (name, x, y, w, h, door, doorX, doorY, along) => {
      const i = rooms.length;
      rooms.push({
        name, x, y, w, h, door, floor: n, idx: i,
        doorX, doorY,
        throughX: along === 'x' ? Math.max(2 * T, Math.min(57 * T, doorX + 4 * T)) : doorX,
        throughY: along === 'y' ? Math.max(9 * T, Math.min(21 * T, doorY + 4 * T)) : doorY
      });
    };
    const band = (names, x0, x1, y0, y1, door, along) => {
      const cnt = names.length; if (!cnt) return;
      const step = Math.floor((x1 - x0) / cnt);
      names.forEach((nm, k) => {
        const bx = x0 + k * step, bw = k === cnt - 1 ? x1 - bx : step;
        const cx = bx + Math.floor(bw / 2);
        const dp = door === 's' ? [cx * T + 8, 7 * T + 8]
          : [cx * T + 8, 23 * T + 8];
        add(nm, bx, y0, bw, y1 - y0, door, dp[0], dp[1], along);
      });
    };
    band(F.top, 2, 58, 1, 7, 's', 'x');       // 上排：门朝南，开在 y=7 过道
    band(F.bottom, 2, 58, 24, 29, 'n', 'x');  // 下排：门朝北，开在 y=23 过道
    const side = (names, x0, door, y0, y1) => {
      const cnt = names.length; if (!cnt) return;
      const span = y1 - y0;
      names.forEach((nm, k) => {
        const by = y0 + Math.round(span * k / cnt), be = y0 + Math.round(span * (k + 1) / cnt);
        const bh = Math.max(2, be - by);
        add(nm, x0, by, 11, bh, door, door === 'e' ? 13 * T + 8 : 46 * T + 8, (by + Math.floor(bh / 2)) * T + 8, 'y');
      });
    };
    side(F.left, 2, 'e', 9, 22);                                   // 左列：门朝东
    side(F.right, 47, 'w', F.rightY0 || 9, F.rightY1 || 22);      // 右列：只有 2F 有一段花园通道
    return { F, rooms };
  }

  /* ---------------- 楼层内部（1~6F） ---------------- */
  function schoolFloor(n, opts) {
    const L = floorLayout(n), F = L.F;
    const s = baseScene('floor:' + n, 60, 30, 'roomFloor');
    border(s);
    s.indoor = true;
    s.zoom = 1.18;
    s.floorColor = F.atrium === 'roof' ? '#c96a4f' : F.atrium === 'garden' ? '#d8cba8' : '#c9c6b4';
    s.label = '汾阳中学 · ' + F.n + 'F ' + F.atriumName + ' · 平面图 ' + F.code;
    fill(s.ground, { x: 1, y: 7, w: 58, h: 2 }, 'plaza');
    fill(s.ground, { x: 1, y: 22, w: 58, h: 2 }, 'plaza');
    fill(s.ground, { x: 13, y: 9, w: 2, h: 13 }, 'plaza');
    fill(s.ground, { x: 45, y: 9, w: 2, h: 13 }, 'plaza');
    fill(s.ground, { x: 15, y: 9, w: 30, h: 13 }, F.atrium === 'garden' ? 'grass' : 'roomFloor');
    /* 右侧（大门方向）除 2F 花园通道外都敞开：白柱矮栏 + 花台，不封房间 */
    s.props.push({ kind: 'schoolOpenSide', x: 47, y: 9, w: 11, h: 13,
      skip: n === 2 ? [F.rightY0 || 14, F.rightY1 || 18] : null });
    L.rooms.forEach(r => { fill(s.solid, { x: r.x, y: r.y, w: r.w, h: r.h }, 1); s.props.push({ kind: 'schoolRoom', room: r }); });
    if (F.atrium === 'void') fill(s.solid, { x: 15, y: 9, w: 30, h: 13 }, 1);
    s.props.push({ kind: 'schoolAtrium', x: 15, y: 9, w: 30, h: 13, mode: F.atrium, code: F.code, pass: !!F.pass });
    s.props.push({ kind: 'wall', x: 0, y: 0, w: 60, h: 1, color: '#7d4a43', trim: '#e9e0cc' });
    s.props.push({ kind: 'kickline', x: 0, y: 29, w: 60, h: 1, color: '#8f92b5' });
    // 回字形外廊：四条走道连续铺地砖、白立柱、绿安全灯、红消防箱
    s.props.push({ kind: 'schoolCorridor', x: 1, y: 7, w: 58, h: 2, dir: 'h' });
    s.props.push({ kind: 'schoolCorridor', x: 1, y: 22, w: 58, h: 2, dir: 'h' });
    s.props.push({ kind: 'schoolCorridor', x: 13, y: 9, w: 2, h: 13, dir: 'v' });
    s.props.push({ kind: 'schoolCorridor', x: 45, y: 9, w: 2, h: 13, dir: 'v' });
    for (let q = 6; q < 58; q += 12) s.props.push({ kind: 'schoolFlower', x: q, y: 7, w: 5, h: 1 });
    /* 每一间标注的房间都能进去 */
    L.rooms.forEach(r => {
      s.points.push({
        id: 'rm_' + n + '_' + r.idx, type: 'schoolRoom', x: r.doorX, y: r.doorY,
        label: '🚪 ' + r.name + '（按 A 进入）', floor: n, idx: r.idx,
        back: { x: r.doorX, y: r.doorY }, through: { x: r.throughX, y: r.throughY }
      });
    });
    /* 楼梯 / 出楼 / 导览都在平面图右侧（大门方向） */
    if (n < 6) s.points.push({ id: 'up', type: 'floorStairs', x: 50 * T + 8, y: 8 * T + 8, label: '⬆ 上楼 → ' + (n + 1) + 'F', to: n + 1 });
    if (n > 1) s.points.push({ id: 'down', type: 'floorStairs', x: 50 * T + 8, y: 22 * T + 8, label: '⬇ 下楼 → ' + (n - 1) + 'F', to: n - 1 });
    s.points.push({ id: 'floorNote', type: 'schoolNote', x: 9 * T + 8, y: 8 * T + 8, label: '🗺 ' + n + 'F 平面图 ' + F.code + ' · ' + F.atriumName,
      text: F.note + '\n\n本层共 ' + L.rooms.length + ' 间可进入的房间：' + L.rooms.map(r => r.name).join(' / ') });
    s.points.push({ id: 'out', type: 'floorExit', x: 55 * T + 8, y: 22 * T + 8, label: '🚪 出楼 · 回到校园前庭', campus: { x: 28 * T, y: 13 * T } });
    s.npcs.push({ name: '值日生', color: '#c05b86', x: 20 * T, y: 8 * T, stationary: true, dir: 0, frame: 0, id: 'duty' + n });
    s.npcs.push({ name: '抱作业本的同学', color: '#4caf7d', x: 40 * T, y: 22 * T, path: [{ x: 40 * T, y: 22 * T }, { x: 20 * T, y: 22 * T }, { x: 20 * T, y: 8 * T }, { x: 40 * T, y: 8 * T }], pi: 0, wait: 0, dir: 3, frame: 0, id: 'stu' + n });
    /* 九位教师按名册分布到六层，走道里能遇到、能对话涨好感 */
    (PC.SCHOOL_STAFF || []).filter(st => st.floor === n).forEach(st => {
      const npc = {
        name: st.name, color: st.color, x: st.x * T, y: st.y * T,
        stationary: !st.path, dir: st.dir || 0, frame: 0, id: 'staff_' + st.name
      };
      if (st.path) { npc.path = st.path.map(q => ({ x: q[0] * T, y: q[1] * T })); npc.pi = 0; npc.wait = 0; }
      s.npcs.push(npc);
    });
    s.spawn = (opts && opts.spawn) || { x: 46 * T + 8, y: 15 * T + 8 };
    s.rooms = L.rooms;
    return s;
  }

  /* ---------------- 单间房室内（两扇门：原路回 / 从另一边出） ---------------- */
  function schoolRoomScene(n, idx, opts) {
    const L = floorLayout(n), r = L.rooms[idx] || L.rooms[0];
    const kind = PC.SCHOOL_ROOM_KIND(r.name);
    const s = baseScene('sroom:' + n + ':' + idx, 22, 14, 'roomFloor');
    border(s);
    s.indoor = true;
    s.zoom = 1;
    const floors = { classroom: '#ded6b8', office: '#d3cfc0', lab: '#c9d3d6', canteen: '#d8cba8', library: '#c9b89c', arts: '#d3c3d8', toilet: '#c9d3d6', hall: '#d8d2c2' };
    s.floorColor = floors[kind] || '#ded6b8';
    s.label = '汾阳中学 · ' + n + 'F · ' + r.name;
    s.props.push({ kind: 'wall', x: 0, y: 0, w: 22, h: 2, color: '#b9b2a0', trim: '#e9e0cc' });
    s.props.push({ kind: 'kickline', x: 0, y: 13, w: 22, h: 1, color: '#6b6f8c' });
    s.props.push({ kind: 'roomKit', x: 0, y: 0, w: 22, h: 14, rt: kind, name: r.name, floor: s.floorColor, idx: idx });
    s.props.push({ kind: 'roomPlate', x: 7, y: 0, w: 8, h: 2, name: r.name, sub: n + 'F / ' + L.F.code });
    s.props.push({ kind: 'roomDoor', x: 0, y: 5, w: 2, h: 4, text: '← 原路', col: '#e9d9b8' });
    s.props.push({ kind: 'roomDoor', x: 20, y: 5, w: 2, h: 4, text: '另一边 →', open: true, col: '#7fe0c8' });
    s.points.push({ id: 'roomBack', type: 'roomBack', x: 3 * T, y: 7 * T + 8, label: '← 原路出门 · 回到过道', floor: n, dest: { x: r.doorX, y: r.doorY } });
    s.points.push({ id: 'roomThrough', type: 'roomThrough', x: 19 * T, y: 7 * T + 8, label: '→ 从另一边出门 · 穿过房间', floor: n, dest: { x: r.throughX, y: r.throughY } });
    const info = PC.SCHOOL_ROOM_INFO[r.name] || '一间按平面图复原的房间，' + r.name + '。';
    s.points.push({ id: 'roomNote', type: 'schoolNote', x: 11 * T, y: 12 * T + 8, label: '📖 看看这间',
      text: '【' + n + 'F · ' + r.name + '】\n' + info + '\n\n平面图编号 ' + L.F.code + '。门开在靠过道 / 中庭那一侧，从另一扇门出去就到对面。' });
    s.spawn = (opts && opts.spawn) || { x: 4 * T, y: 7 * T + 8 };
    return s;
  }

  /* ---------------- 渊迂市汾阳中学 · 校园 ----------------
     · 铁栅栏围住整个校园：操场、四宫格篮球场、花园全在里面
     · 篮球场是 2×2 四宫格，不是一字排开
     · 教学楼就是 art.schoolFacade 那一整栋楼，样子不变；门前只放一小段
       浅色门廊标记，绝不用黑块代替楼体
     · 校门在南、教学楼门口在北，中间留一大段前庭林荫道
     --------------------------------------------------------------- */
  function campus() {
    const s = baseScene('campus', 56, 36, 'grass');
    border(s);
    s.zoom = 1.28;
    s.label = '渊迂市汾阳中学 · 校园 / 四宫格篮球场 / 操场 / 六层教学行政楼';
    // 前庭主轴 + 楼前横广场
    fill(s.ground, { x: 24, y: 12, w: 8, h: 22 }, 'plaza');
    fill(s.ground, { x: 24, y: 13, w: 18, h: 3 }, 'plaza');
    fill(s.ground, { x: 2, y: 12, w: 20, h: 14 }, 'plaza');   // 四宫格球场基底
    fill(s.ground, { x: 2, y: 1, w: 20, h: 10 }, 'plaza');    // 操场基底
    /* 铁栅栏围住整个校园（南边中间留校门） */
    s.props.push({ kind: 'schoolFence', x: 0, y: 0, w: 56, h: 36 });
    s.props.push({ kind: 'schoolGateInner', x: 24, y: 32, w: 8, h: 3 });
    s.props.push({ kind: 'fyCross', x: 24, y: 34, w: 8, h: 1 });
    /* 左后侧：操场 */
    s.props.push({ kind: 'track', x: 3, y: 2, w: 18, h: 8 });
    /* 左前侧：篮球场 2×2 四宫格 */
    s.props.push({ kind: 'basketQuad', x: 2, y: 13, w: 19, h: 11 });
    /* 教学楼：就是那一整栋楼，和沿街共用同一套立面，样子不变 */
    fill(s.solid, { x: 24, y: 2, w: 28, h: 11 }, 1);
    s.buildings.push({ x: 24, y: 2, w: 28, h: 11, shop: PC.SHOP_BY_ID.school });
    /* 门前一小段浅色门廊 + 门牌（不是黑块，楼体完整可见） */
    s.props.push({ kind: 'schoolPorch', x: 25, y: 13, w: 7, h: 2 });
    s.props.push({ kind: 'fyWires', x: 0, y: 0, w: 56, h: 3 });
    /* 前庭：花带 / 树 / 路灯 / 长椅 / 喷水池 / 大片花草 */
    for (let i = 0; i < 16; i++) {
      const yy = 16 + i;
      s.props.push({ kind: 'schoolFlower', x: 22, y: yy, w: 2, h: 1 });
      s.props.push({ kind: 'schoolFlower', x: 33, y: yy, w: 2, h: 1 });
    }
    [[20, 14], [36, 14], [20, 26], [36, 26], [20, 30], [36, 30], [8, 27], [46, 27], [8, 31], [46, 31]].forEach(q => s.props.push({ kind: 'schoolFlower', x: q[0], y: q[1], w: 4, h: 1 }));
    [[2, 11], [22, 11], [2, 27], [52, 27], [2, 31], [52, 31], [34, 27], [44, 27]].forEach(q => s.props.push({ kind: 'fyTree', x: q[0], y: q[1], w: 2, h: 3 }));
    s.props.push({ kind: 'fountain', x: 27, y: 28, w: 2, h: 2 });
    [[22, 12], [34, 12], [22, 22], [34, 22]].forEach(q => s.props.push({ kind: 'fyLamp', x: q[0], y: q[1], w: 1, h: 3 }));
    [[6, 11], [48, 27], [6, 31], [48, 31]].forEach(q => s.decos.push({ kind: 'bench', tx: q[0], ty: q[1] }));
    for (let i = 0; i < 26; i++) s.decos.push({ kind: 'flower', tx: 34 + (i * 5) % 20, ty: 17 + (i * 7) % 17 });
    s.props.push({ kind: 'flag', x: 23, y: 4 });
    s.props.push({ kind: 'photoSpot', x: 27, y: 30, w: 2, h: 2 });
    /* 校门口作息钟：显示 7:40 / 18:00 两个时刻的人潮，按 A 可跳过去看 */
    s.props.push({ kind: 'schoolClock', x: 33, y: 29, w: 8, h: 3 });

    s.points.push({ id: 'exit', type: 'exit', x: 28 * T, y: 34 * T + 8, label: '出了校门 · 返回曙光路' });
    s.points.push({ id: 'schoolEnter', type: 'schoolEnter', x: 28 * T, y: 15 * T, label: '🏫 靠近教学楼门廊 · 黑屏进入楼内（1F 中心花园）' });
    s.points.push({ id: 'notice', type: 'sign', x: 26 * T, y: 31 * T, label: '🏫 校园 · 栅栏围住整片学校', board: 'notice' });
    s.points.push({ id: 'track', type: 'sign', x: 12 * T, y: 6 * T, label: '🏃 操场 · 左后侧', board: 'track' });
    s.points.push({ id: 'basketball', type: 'sign', x: 5 * T, y: 15 * T, label: '🏀 四宫格篮球场 · 2×2 · 看板', board: 'basketball' });
    /* 体育老师秦磷守着半场，按 A 可以挑难度打一场街头篮球 */
    s.points.push({ id: 'bballGame', type: 'basketballGame', x: 11 * T, y: 20 * T, label: '🏀 秦磷老师 · 来打半场街头篮球（选难度）' });
    s.points.push({ id: 'photoFenyang', type: 'photo', x: 28 * T, y: 30 * T, label: '📸 打卡 · 汾阳中学这一整栋楼', spot: 'fenyang_gate' });
    s.points.push({ id: 'job_campus', type: 'jobs', x: 36 * T, y: 30 * T, label: '💼 校园零工 · 值日 / 抄笔记', ctx: 'campus' });
    s.points.push({ id: 'schoolBell', type: 'schoolBell', x: 37 * T, y: 30 * T, label: '🕖 作息钟 · 7:40 上学潮 / 18:00 放学' });

    s.npcs.push({ name: '背书包的同学', color: '#4caf7d', x: 28 * T, y: 24 * T, path: [{ x: 28 * T, y: 24 * T }, { x: 28 * T, y: 16 * T }, { x: 34 * T, y: 16 * T }, { x: 28 * T, y: 24 * T }], pi: 0, wait: 0, dir: 3, frame: 0, id: 'stu1' });
    s.npcs.push({ name: '值日生', color: '#c05b86', x: 34 * T, y: 20 * T, stationary: true, dir: 0, frame: 0, id: 'stu2' });
    s.npcs.push({ name: '校门门卫', color: '#3b3b8f', x: 25 * T, y: 32 * T, stationary: true, dir: 0, frame: 0, id: 'guard' });
    s.npcs.push({ name: '拍照的家长', color: '#d99b1f', x: 30 * T, y: 18 * T, stationary: true, dir: 2, frame: 0, id: 'parent' });
    s.npcs.push({ name: '返校的校友', color: '#4fb8a8', x: 12 * T, y: 28 * T, path: [{ x: 12 * T, y: 28 * T }, { x: 28 * T, y: 30 * T }, { x: 28 * T, y: 16 * T }, { x: 12 * T, y: 28 * T }], pi: 0, wait: 0, dir: 1, frame: 0, id: 'alumni' });
    s.npcs.push({ name: '打篮球的同学', color: '#ffb347', x: 6 * T, y: 16 * T, stationary: true, dir: 1, frame: 0, id: 'hoop' });
    /* 秦磷：体育老师，黑皮，站在四宫格半场里；靠近按 A 触发半场篮球 */
    s.npcs.push({ name: '秦磷', color: '#ffd25a', skin: '#4a2c1c', hair: '#191922',
      x: 10 * T, y: 18 * T, stationary: true, dir: 1, frame: 0, id: 'qinlin' });
    s.npcs.push({ name: '浇花的园丁', color: '#7fe0c8', x: 40 * T, y: 26 * T, stationary: true, dir: 3, frame: 0, id: 'gardener' });

    s.spawn = { x: 28 * T, y: 30 * T };
    return s;
  }

  /* ---------------- 地面瓦片 ---------------- */
  function tile(ctx, kind, x, y, tx, ty, t) {
    switch (kind) {
      case 'road':
        D.rect(ctx, x, y, T, T, P.road);
        D.dither(ctx, x, y, T, T, '#5c5d76', .16, tx + ty);
        break;
      case 'pave':
        D.rect(ctx, x, y, T, T, P.pave);
        D.line(ctx, x, y + 8, x + T, y + 8, '#b6b3a4', 1);
        if (tx % 2 === 0) D.line(ctx, x + 8, y, x + 8, y + 8, '#b6b3a4', 1);
        if (tx % 2 === 1) D.line(ctx, x, y, x, y + 8, '#b6b3a4', 1);
        D.dither(ctx, x, y, T, T, '#a9a79a', .12, tx * 3 + ty);
        break;
      case 'plaza':
        D.rect(ctx, x, y, T, T, '#d6d2be');
        D.frame(ctx, x, y, T, T, 'rgba(120,116,150,.22)', 1);
        break;
      case 'grass':
        D.rect(ctx, x, y, T, T, P.grass);
        D.dither(ctx, x, y, T, T, '#4e7c4c', .35, tx * 7 + ty);
        if (U.noise2(tx, ty, 9) > .86) { D.rect(ctx, x + 5, y + 6, 2, 2, '#f4e6a0'); D.rect(ctx, x + 9, y + 10, 2, 2, '#e2564d'); }
        break;
      case 'water': {
        D.rect(ctx, x, y, T, T, P.water);
        const ph = Math.floor((t.time * 1.5 + tx * 3 + ty * 5) % 16);
        D.rect(ctx, x + (ph % 10), y + 4, 5, 1, 'rgba(220,240,250,.55)');
        D.rect(ctx, x + (16 - ph) % 12, y + 11, 4, 1, 'rgba(220,240,250,.35)');
        break;
      }
      case 'floor':
      case 'roomFloor': {
        D.rect(ctx, x, y, T, T, activeFloor);
        D.line(ctx, x, y + 8, x + T, y + 8, 'rgba(40,30,20,.13)', 1);
        D.line(ctx, x + (ty % 2 ? 12 : 4), y, x + (ty % 2 ? 12 : 4), y + 8, 'rgba(40,30,20,.10)', 1);
        D.dither(ctx, x, y, T, T, 'rgba(255,255,255,.10)', .08, tx * 3 + ty);
        break;
      }
      case 'metroFloor':
        D.rect(ctx, x, y, T, T, '#4a4b62');
        D.frame(ctx, x, y, T, T, '#3f4055', 1);
        if (tx % 3 === 0 && ty % 3 === 0) D.rect(ctx, x + 6, y + 6, 4, 4, '#575971');
        break;
      case 'platform':
        D.rect(ctx, x, y, T, T, '#5b5c76');
        D.rect(ctx, x, y + 12, T, 3, '#d9b64f');
        for (let i = 2; i < T; i += 5) D.rect(ctx, x + i, y + 13, 2, 1, '#8a7430');
        break;
      default: D.rect(ctx, x, y, T, T, P.pave);
    }
  }

  /* ---------------- 道具绘制 ---------------- */
  function prop(ctx, p, t) {
    const x = p.x * T, y = p.y * T, w = (p.w || 1) * T, h = (p.h || 1) * T;
    const K = P.ink;
    switch (p.kind) {
      /* ---- 通用基础 ---- */
      case 'wall':
        D.rect(ctx, x, y, w, h, p.color || '#3b3b8f');
        D.rect(ctx, x, y, w, 3, p.trim || '#5b4fb3');
        D.rect(ctx, x, y + h - 4, w, 4, 'rgba(10,10,30,.35)');
        for (let i = 0; i < w; i += 24) D.rect(ctx, x + i, y + 6, 2, h - 12, 'rgba(255,255,255,.08)');
        break;
      case 'counter':
        D.rect(ctx, x + 3, y + 5, w, h + 4, 'rgba(10,10,30,.22)');
        D.rect(ctx, x, y, w, h, K);
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, p.color);
        D.rect(ctx, x + 2, y + 2, w - 4, 4, A.shade(p.color, 40));
        D.shadowText(ctx, p.title || 'COUNTER', x + w / 2, y + 6, 8, '#fff3c4', 'center');
        if (p.sub) D.text(ctx, p.sub.slice(0, 26), x + w / 2, y + 18, 6, '#ffe9a8', 'center');
        break;
      case 'shelf':
        D.rect(ctx, x + 2, y + 3, w - 2, h - 2, 'rgba(10,10,30,.20)');
        D.rect(ctx, x, y, w, h, K);
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#8a6540');
        for (let j = 0; j < h; j += 12) {
          D.rect(ctx, x + 2, y + j + 9, w - 4, 2, '#5b4028');
          for (let i = 4; i < w - 6; i += 8) {
            const cols = ['#e2564d', '#ffd25a', '#4fb8a8', '#7a6a9c', '#4caf7d'];
            D.rect(ctx, x + i, y + j + 2, 5, 6, cols[Math.abs(Math.floor(U.noise2(i + (p.seed || 3), j, 2) * 5)) % 5]);
          }
        }
        break;
      case 'poster':
        D.rect(ctx, x + 2, y + 2, w - 2, h - 2, 'rgba(10,10,30,.22)');
        D.rect(ctx, x, y, w, h, K);
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, A.shade(p.color, -18));
        D.rect(ctx, x + 2, y + 2, w - 4, 4, A.shade(p.color, 48));
        D.text(ctx, p.text, x + w / 2, y + 12, 7, '#fff', 'center', true);
        break;
      case 'rug':
        D.rect(ctx, x, y, w, h, A.shade(p.color, -20)); D.frame(ctx, x, y, w, h, '#f4f1e4', 2);
        D.rect(ctx, x + 6, y + 6, w - 12, h - 12, 'rgba(255,255,255,.14)');
        break;
      case 'lampIn':
        D.rect(ctx, x + 7, y, 2, 6, '#4a4b62'); D.rect(ctx, x + 3, y + 6, 10, 4, p.lamp || '#ffd25a');
        ctx.fillStyle = 'rgba(255,220,120,.09)'; ctx.beginPath(); ctx.arc(x + 8, y + 12, 24, 0, 7); ctx.fill();
        break;
      case 'kickline':
        D.rect(ctx, x, y, w, 3, p.color || '#5b4fb3');
        D.rect(ctx, x, y + 3, w, 2, 'rgba(10,10,30,.25)');
        break;
      case 'banner': {
        const bw = p.w ? w : 12 * T;
        D.rect(ctx, x, y, bw, 13, K);
        D.rect(ctx, x + 2, y + 2, bw - 4, 9, p.color || '#5b4fb3');
        D.text(ctx, p.text || '', x + bw / 2, y + 3, 7, '#fff3c4', 'center', true);
        break;
      }
      case 'priceTag': {
        const pw = 6 * T;
        D.rect(ctx, x, y, pw, 12, '#fff3c4'); D.frame(ctx, x, y, pw, 12, '#a33b35', 1);
        D.text(ctx, (p.text || '').slice(0, 12), x + 4, y + 2, 7, '#a33b35', 'left', true);
        break;
      }
      case 'lightbox':
        D.rect(ctx, x, y, w, h, K); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#f4f1e4');
        D.rect(ctx, x + 2, y + 2, w - 4, 3, '#4fb8a8');
        D.text(ctx, p.text, x + w / 2, y + Math.max(7, h / 2 - 3), 7, P.blue, 'center', true);
        break;
      case 'plant':
        D.rect(ctx, x + 3, y + 8, 10, 8, '#8a6540');
        D.rect(ctx, x + 5, y + 1, 6, 8, '#4caf7d'); D.rect(ctx, x + 2, y + 3, 12, 4, '#3f8a55');
        break;
      /* ---- 咖啡店 M-Coffee 麦妃咖啡 ---- */
      case 'coffeeMachine':
        D.rect(ctx, x, y, 4 * T, 2 * T, '#3b3b46'); D.rect(ctx, x + 3, y + 3, 4 * T - 6, 8, '#c9c6b4');
        D.rect(ctx, x + 6, y + 12, 10, 8, '#6b4630'); D.rect(ctx, x + 9, y + 20, 4, 5, '#1b1c3a');
        D.rect(ctx, x + 22, y + 12, 22, 8, '#8a5b3b'); D.circle(ctx, x + 33, y + 10, 3, '#ffd25a');
        D.text(ctx, 'M-COFFEE', x + 2, y + 2 * T + 2, 6, '#ffe9a8');
        break;
      case 'menuBoard':
        D.rect(ctx, x, y, 6 * T, 4 * T, K); D.rect(ctx, x + 2, y + 2, 6 * T - 4, 4 * T - 4, '#2b2118');
        D.text(ctx, 'MENU / 春季特优', x + 6, y + 6, 7, '#ffd25a', 'left', true);
        ['蓝草咖啡  7折  ¥12', '拿铁       ¥15', '美式       ¥9', '春季蛋糕   ¥22'].forEach((s, i) =>
          D.text(ctx, s, x + 6, y + 20 + i * 10, 6, '#f4f1e4'));
        break;
      case 'roundTable':
        D.circle(ctx, x + 20, y + 14, 14, '#6b4a2f'); D.circle(ctx, x + 20, y + 14, 11, '#a9764a');
        D.rect(ctx, x + 17, y + 11, 6, 6, '#f4f1e4');
        D.rect(ctx, x - 4, y + 8, 6, 10, '#8a6540'); D.rect(ctx, x + 38, y + 8, 6, 10, '#8a6540');
        break;
      case 'cup':
        D.rect(ctx, x, y, 8, 9, '#f4f1e4'); D.rect(ctx, x + 1, y + 2, 6, 5, '#6b4630');
        D.rect(ctx, x + 8, y + 2, 3, 5, '#f4f1e4'); D.rect(ctx, x, y - 2, 8, 2, '#e2564d');
        break;
      case 'beanSack':
        D.rect(ctx, x, y + 4, 24, 16, '#8a5b3b'); D.rect(ctx, x + 3, y, 18, 8, '#a9764a');
        D.text(ctx, 'BEANS', x + 12, y + 9, 6, '#f4e6a0', 'center');
        break;
      /* ---- 齐阵便利店 ---- */
      case 'fridge':
        D.rect(ctx, x, y, w, h, K); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#8fb8cf');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, 'rgba(180,230,255,.22)');
        for (let j = 8; j < h - 6; j += 16) {
          D.rect(ctx, x + 2, y + j, w - 4, 2, '#5b7d95');
          for (let i = 4; i < w - 6; i += 10) D.rect(ctx, x + i, y + j - 8, 5, 6, ['#ffd25a', '#e2564d', '#4fb8a8'][Math.floor(i / 10) % 3]);
        }
        D.rect(ctx, x + w - 7, y + 6, 3, 14, '#d8e8f0');
        break;
      case 'register':
        D.rect(ctx, x, y + 8, 18, 10, '#3b3b8f'); D.rect(ctx, x + 3, y + 2, 12, 8, '#8fb8cf');
        D.rect(ctx, x + 4, y + 10, 8, 3, '#ffd25a'); D.text(ctx, '¥', x + 9, y + 4, 7, P.ink, 'center', true);
        break;
      case 'oden':
        D.rect(ctx, x, y, 3 * T, 2 * T, '#8a6540'); D.rect(ctx, x + 3, y + 3, 3 * T - 6, 2 * T - 6, '#c9c6b4');
        for (let i = 0; i < 4; i++) { D.circle(ctx, x + 9 + i * 10, y + 13, 4, '#d9a45b'); D.circle(ctx, x + 9 + i * 10, y + 13, 2, '#f4e6a0'); }
        D.text(ctx, '关东煮', x + 4, y + 2, 6, '#6b4630');
        break;
      case 'umbrellaRack':
        D.rect(ctx, x, y, 16, 18, '#5b4fb3'); D.rect(ctx, x + 2, y + 2, 12, 14, '#3b3b8f');
        ['#e2564d', '#4fb8a8', '#ffd25a'].forEach((c, i) => { D.rect(ctx, x + 3 + i * 4, y + 2, 2, 14, c); D.circle(ctx, x + 4 + i * 4, y + 2, 2, c); });
        D.text(ctx, '伞', x + 8, y + 20, 6, '#fff');
        break;
      /* ---- 极设数码 ---- */
      case 'phoneWall':
        D.rect(ctx, x, y, w, 2 * T, K); D.rect(ctx, x + 2, y + 2, w - 4, 2 * T - 4, '#1b2430');
        for (let i = 0; i < 5; i++) {
          const px2 = x + 8 + i * 32;
          D.rect(ctx, px2, y + 5, 16, 24, '#3b3b8f'); D.rect(ctx, px2 + 2, y + 7, 12, 20, i % 2 ? '#4fb8a8' : '#7fa6c9');
          D.rect(ctx, px2 + 6, y + 8, 4, 2, '#1b1c3a');
        }
        D.text(ctx, '15 PRO / 30%OFF', x + w / 2, y + 2 * T + 2, 7, '#ffd25a', 'center', true);
        break;
      case 'glassCase':
        D.rect(ctx, x, y, w, h, K); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, 'rgba(150,210,230,.32)');
        D.frame(ctx, x + 2, y + 2, w - 4, h - 4, '#a9e6f5', 1);
        for (let i = 0; i < 4; i++) D.rect(ctx, x + 10 + i * 22, y + 8, 10, 16, '#3b3b8f');
        D.rect(ctx, x + 2, y + 2, w - 4, 2, 'rgba(255,255,255,.55)');
        break;
      case 'filmDesk':
        D.rect(ctx, x, y + 6, w, 16, '#6b4630'); D.rect(ctx, x, y, w, 8, A.shade(p.color, -10));
        D.rect(ctx, x + 6, y - 6, 12, 6, '#dff2f0'); D.circle(ctx, x + w - 14, y - 4, 4, p.lamp || '#a9f0e6');
        D.text(ctx, '贴膜 5%', x + 4, y + 9, 7, '#fff3c4');
        break;
      case 'ledStrip':
        for (let i = 0; i < w; i += 8) D.rect(ctx, x + i, y + 4, 5, 2, i % 16 ? '#4fb8a8' : '#ffd25a');
        break;
      /* ---- FAMILY GO 齐率 ---- */
      case 'clothesRack':
        D.rect(ctx, x, y + 2, w, 3, '#8f92b5'); D.rect(ctx, x + 2, y, 2, 2 * T, '#8f92b5'); D.rect(ctx, x + w - 4, y, 2, 2 * T, '#8f92b5');
        ['#e2564d', '#4b8fb5', '#ffd25a', '#4caf7d'].forEach((c, i) => {
          const cx2 = x + 6 + i * 10;
          D.rect(ctx, cx2, y + 5, 8, 18, c); D.rect(ctx, cx2 + 1, y + 5, 6, 3, '#1b1c3a');
          D.rect(ctx, cx2 + 2, y + 8, 2, 14, 'rgba(255,255,255,.25)');
        });
        break;
      case 'mannequin':
        D.rect(ctx, x + 6, y + 26, 8, 4, '#8f92b5'); D.rect(ctx, x + 8, y + 10, 4, 16, '#c9c6b4');
        D.rect(ctx, x + 3, y + 2, 14, 12, '#e2564d'); D.rect(ctx, x + 6, y - 2, 8, 4, '#c9c6b4');
        D.text(ctx, '冰原', x + 10, y + 30, 6, '#fff3c4', 'center');
        break;
      case 'fitting':
        D.rect(ctx, x, y, w, h, '#6b3a38'); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#a85a55');
        for (let i = 0; i < w; i += 8) D.rect(ctx, x + i, y + 2, 2, h - 4, 'rgba(255,255,255,.10)');
        D.text(ctx, '试衣间', x + w / 2, y + 4, 7, '#ffe9a8', 'center');
        break;
      case 'mirror':
        D.rect(ctx, x, y, w, h, K); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#9fc4d8');
        D.rect(ctx, x + 3, y + 3, w - 6, 3, 'rgba(255,255,255,.65)');
        D.line(ctx, x + 4, y + 4, x + w - 5, y + h - 4, 'rgba(255,255,255,.35)', 2);
        break;
      case 'promoFlag':
        for (let i = 0; i < w; i += 12) {
          const c = i % 24 ? '#ffd25a' : '#e2564d';
          ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + i, y + 2); ctx.lineTo(x + i + 10, y + 2); ctx.lineTo(x + i + 5, y + 12); ctx.fill();
        }
        D.line(ctx, x, y + 2, x + w, y + 2, K, 1);
        D.text(ctx, 'ON SALE / VIP GET!', x + w / 2, y + 14, 7, '#a33b35', 'center', true);
        break;
      /* ---- 零食 / 运动 ---- */
      case 'snackPile':
        D.rect(ctx, x, y, w, h, '#8a6416'); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#d99b1f');
        for (let j = 6; j < h - 4; j += 12) for (let i = 4; i < w - 6; i += 12)
          D.rect(ctx, x + i, y + j, 9, 8, ['#e2564d', '#ffd25a', '#4caf7d', '#c05b86'][Math.floor((i + j) / 12) % 4]);
        D.text(ctx, 'SNACK²', x + w / 2, y + h - 10, 7, '#fff', 'center', true);
        break;
      case 'speaker':
        D.rect(ctx, x, y, 14, 18, '#3b3b8f'); D.circle(ctx, x + 7, y + 9, 5, '#1b1c3a');
        D.circle(ctx, x + 7, y + 9, 3, '#5b4fb3'); D.text(ctx, '♪', x + 7, y + 20, 8, '#ffd25a', 'center');
        break;
      case 'dumbbellRack':
        D.rect(ctx, x, y, w, h, '#3f5b45'); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#6b8f70');
        ['#4a4b62', '#5b5c76', '#6b6f8c'].forEach((c, i) => {
          const yy = y + 8 + i * 18;
          D.rect(ctx, x + 6, yy, w - 12, 3, '#1b1c3a');
          D.rect(ctx, x + 4, yy - 4, 5, 11, c); D.rect(ctx, x + w - 9, yy - 4, 5, 11, c);
        });
        break;
      case 'treadmill':
        D.rect(ctx, x, y + 8, w, 14, '#3b3b8f'); D.rect(ctx, x + 4, y + 10, w - 8, 8, '#1b1c3a');
        D.rect(ctx, x + w - 12, y - 8, 3, 18, '#8f92b5'); D.rect(ctx, x + w - 18, y - 8, 9, 3, '#8f92b5');
        D.rect(ctx, x + w - 16, y - 6, 5, 5, '#4fb8a8');
        D.text(ctx, 'RUN', x + 6, y + 12, 6, '#7fe0c8');
        break;
      case 'mat':
        D.rect(ctx, x, y, w, h, '#4caf7d'); D.frame(ctx, x, y, w, h, '#3f8a55', 2);
        D.rect(ctx, x + 8, y + 4, w - 16, h - 8, 'rgba(255,255,255,.12)');
        break;
      /* ---- 书屋 / 旅行 / 房产 ---- */
      case 'bookshelf':
        D.rect(ctx, x, y, w, h, K); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#6b4a2f');
        for (let j = 8; j < h - 4; j += 14) {
          D.rect(ctx, x + 2, y + j, w - 4, 2, '#4a301f');
          for (let i = 4; i < w - 6; i += 7) D.rect(ctx, x + i, y + j - 9, 5, 8, ['#7a6a9c', '#4b8fb5', '#e2564d', '#d99b1f', '#4caf7d'][Math.floor((i + j) / 7) % 5]);
        }
        break;
      case 'readingNook':
        D.rect(ctx, x, y, w, h, '#7a6a9c'); D.rect(ctx, x + 3, y + 3, w - 6, h - 6, '#c9b89c');
        D.rect(ctx, x + 8, y + 10, 18, 14, '#8a6540'); D.rect(ctx, x + 10, y + 8, 14, 4, '#a9764a');
        D.rect(ctx, x + w - 16, y + 6, 10, 10, '#3b3b8f'); D.rect(ctx, x + w - 14, y + 3, 6, 4, '#ffd25a');
        D.text(ctx, '消遣', x + w / 2, y + h - 8, 6, '#4b3a6c', 'center', true);
        break;
      case 'ladder':
        D.rect(ctx, x, y, 3, 3 * T, '#8a6540'); D.rect(ctx, x + 10, y, 3, 3 * T, '#8a6540');
        for (let j = 6; j < 3 * T; j += 12) D.rect(ctx, x, y + j, 13, 2, '#a9764a');
        break;
      case 'globe':
        D.circle(ctx, x + 14, y + 14, 13, '#4b8fb5'); D.circle(ctx, x + 14, y + 14, 10, '#6f9e63');
        D.rect(ctx, x + 1, y + 1, 26, 2, '#c9c6b4'); D.rect(ctx, x + 13, y + 27, 3, 8, '#8a6540');
        D.rect(ctx, x + 6, y + 35, 18, 3, '#6b4a2f');
        break;
      case 'posterWall': {
        D.rect(ctx, x, y, w, h, K);
        const themes = p.theme === 'game'
          ? [['CALL OF DUTY', '现在预购！BUY NOW!', '#3b3b8f'], ["ASSASSIN'S CREED", 'UBISOFT -20%', '#5b4fb3'], ['幻景 NEXT', '买双一赠一', '#8a3a38']]
          : [['春季旅行推荐', 'SEA / 褪色照片', '#4b8fb5'], ['环球旅行', 'TRAVEL AGENCY', '#3d9a94'], ['一元环旅行', '到春游行推荐', '#d99b1f']];
        const cw = w / 3;
        themes.forEach((th, i) => {
          const cx2 = x + i * cw + 2;
          D.rect(ctx, cx2, y + 2, cw - 4, h - 4, th[2]);
          D.text(ctx, th[0].slice(0, 14), cx2 + 4, y + 7, 7, '#fff', 'left', true);
          D.text(ctx, th[1].slice(0, 16), cx2 + 4, y + 19, 6, '#ffe9a8');
        });
        break;
      }
      case 'luggage':
        D.rect(ctx, x, y + 4, 20, 20, p.color || '#8a6540'); D.rect(ctx, x + 3, y + 7, 14, 14, 'rgba(255,255,255,.12)');
        D.rect(ctx, x + 7, y, 6, 5, '#3b3b8f'); D.rect(ctx, x + 2, y + 24, 3, 3, '#1b1c3a'); D.rect(ctx, x + 15, y + 24, 3, 3, '#1b1c3a');
        break;
      case 'planWall':
        D.rect(ctx, x, y, w, 2 * T, K); D.rect(ctx, x + 2, y + 2, w - 4, 2 * T - 4, '#f4f1e4');
        ['290万 二室一厅', '330万 好景三室', '470万 林景园'].forEach((s, i) => {
          const cx2 = x + 8 + i * (w / 3);
          D.frame(ctx, cx2, y + 5, w / 3 - 14, 22, '#3b3b8f', 1);
          D.rect(ctx, cx2 + 3, y + 8, 12, 12, '#c9c6b4');
          D.rect(ctx, cx2 + 18, y + 8, 14, 5, '#c9c6b4');
          D.text(ctx, s.slice(0, 12), cx2 + 2, y + 24, 6, P.ink);
        });
        break;
      case 'model':
        D.rect(ctx, x, y, w, h, '#8a6540'); D.rect(ctx, x + 3, y + 3, w - 6, h - 6, '#6f9e63');
        for (let i = 0; i < 5; i++) D.rect(ctx, x + 8 + i * 16, y + 10 + (i % 2) * 12, 10, 12, '#c9c6b4');
        D.text(ctx, '沙盘', x + w / 2, y + h - 10, 7, '#fff', 'center', true);
        break;
      /* ---- 健身房 / 锁匠 / 麦芬文具 ---- */
      case 'pool':
        D.rect(ctx, x, y, w, h, '#1b1c3a'); D.rect(ctx, x + 3, y + 3, w - 6, h - 6, '#3d9a94');
        D.rect(ctx, x + 3, y + 3, w - 6, 4, '#7fe0c8');
        for (let j = 10; j < h - 6; j += 12) for (let i = 6; i < w - 8; i += 16)
          D.rect(ctx, x + i + ((j / 12) % 2) * 6, y + j, 8, 1, 'rgba(220,250,255,.45)');
        D.text(ctx, 'SWIM', x + w / 2, y + h - 12, 7, '#d8f4f0', 'center', true);
        break;
      case 'locker':
        D.rect(ctx, x, y, w, h, '#3d6b68');
        for (let j = 0; j < h; j += 16) for (let i = 0; i < w; i += 12) {
          D.frame(ctx, x + i, y + j, 11, 15, '#23625f', 1);
          D.rect(ctx, x + i + 8, y + j + 7, 2, 2, '#ffd25a');
        }
        break;
      case 'keyWall':
        D.rect(ctx, x, y, w, 2 * T, K); D.rect(ctx, x + 2, y + 2, w - 4, 2 * T - 4, '#4a4d68');
        for (let i = 0; i < 12; i++) {
          const cx2 = x + 8 + (i % 6) * 22, cy2 = y + 8 + Math.floor(i / 6) * 12;
          D.circle(ctx, cx2, cy2, 3, '#ffd25a'); D.rect(ctx, cx2 + 3, cy2 - 1, 8, 2, '#ffd25a');
        }
        break;
      case 'keyMachine':
        D.rect(ctx, x, y, w, h, '#5b5c76'); D.rect(ctx, x + 3, y + 3, w - 6, h - 6, '#8f92b5');
        D.rect(ctx, x + 6, y + 8, w - 12, 10, '#1b1c3a'); D.rect(ctx, x + 8, y + 10, w - 16, 4, '#4fb8a8');
        D.rect(ctx, x + 6, y + 24, w - 12, 4, '#ffd25a');
        D.text(ctx, '24H SELF', x + w / 2, y + h - 12, 7, '#fff', 'center', true);
        break;
      case 'blackboard': {
        const bw = w || 12 * T, bh = p.h ? h : 2 * T;
        D.rect(ctx, x, y, bw, bh, '#6b4a2f'); D.rect(ctx, x + 3, y + 3, bw - 6, bh - 6, '#2c4a3c');
        D.text(ctx, (p.text || '考试过！PASS ALL EXAM!').slice(0, 26), x + 8, y + 8, 8, '#f4f1e4', 'left', true);
        D.rect(ctx, x + 6, y + bh - 6, 20, 2, '#f4f1e4');
        break;
      }
      case 'desk':
        D.rect(ctx, x, y + 10, w, 12, '#8a6540'); D.rect(ctx, x + 2, y + 4, w - 4, 8, '#c9a97e');
        D.rect(ctx, x + 3, y + 22, 3, 10, '#6b4a2f'); D.rect(ctx, x + w - 6, y + 22, 3, 10, '#6b4a2f');
        D.rect(ctx, x + 6, y + 6, 10, 6, '#f4f1e4');
        break;
      case 'examPile':
        for (let i = 0; i < 5; i++) {
          D.rect(ctx, x + i * 2, y + i * 3, 26, 8, i % 2 ? '#f4f1e4' : '#e3e0f5');
          D.rect(ctx, x + i * 2 + 3, y + i * 3 + 2, 14, 1, '#8b87c0');
        }
        D.text(ctx, '模拟卷 ×5', x, y + 20, 6, '#a33b35');
        break;
      /* ---- 烤肉 / 电玩 ---- */
      case 'grill':
        D.rect(ctx, x, y, w, h, '#4a2c22'); D.rect(ctx, x + 3, y + 3, w - 6, h - 6, '#2b1a16');
        for (let i = 0; i < 6; i++) D.rect(ctx, x + 8 + i * 14, y + 10, 2, h - 20, '#8f92b5');
        for (let i = 0; i < 5; i++) D.rect(ctx, x + 10 + i * 16, y + 14, 10, 4, '#d99b1f');
        D.rect(ctx, x, y - 8, w, 8, '#6b6f8c'); D.rect(ctx, x + w / 2 - 8, y - 20, 16, 12, '#6b6f8c');
        D.text(ctx, '9AM–3AM', x + w / 2, y + h - 12, 7, '#ffb46a', 'center', true);
        break;
      case 'beerKeg':
        D.rect(ctx, x, y, 14, 24, '#8a6540'); D.rect(ctx, x + 2, y + 3, 10, 18, '#c9a45b');
        D.rect(ctx, x + 4, y - 3, 6, 5, '#8f92b5'); D.text(ctx, 'BEER', x + 7, y + 10, 5, '#3b2c22', 'center');
        break;
      case 'nightLamp':
        D.circle(ctx, x + 8, y + 8, 7, 'rgba(255,180,100,.35)'); D.rect(ctx, x + 4, y + 4, 8, 8, '#ffb46a');
        break;
      case 'arcadeRow': {
        const n = Math.max(3, Math.floor(w / 34));
        for (let i = 0; i < n; i++) {
          const cx2 = x + i * (w / n) + 2;
          D.rect(ctx, cx2, y, w / n - 4, h, '#1b1c3a');
          D.rect(ctx, cx2 + 3, y + 5, w / n - 10, 18, '#3b3b8f');
          const blink = Math.sin((t.time || 0) * 3 + i * 2) > 0;
          D.rect(ctx, cx2 + 5, y + 7, w / n - 14, 14, blink ? '#5b4fb3' : '#4fb8a8');
          D.text(ctx, ['MW', 'AC', '∞'][i % 3], cx2 + 8, y + 10, 7, '#ffd25a', 'left', true);
          D.rect(ctx, cx2 + 5, y + 26, w / n - 10, 8, '#2b2b66');
          D.circle(ctx, cx2 + 10, y + 30, 2, '#e2564d'); D.circle(ctx, cx2 + 18, y + 30, 2, '#ffd25a');
        }
        break;
      }
      case 'tokenDesk':
        D.rect(ctx, x, y, w, h, '#3b3b8f'); D.rect(ctx, x + 3, y + 3, w - 6, h - 6, '#5b4fb3');
        for (let i = 0; i < 6; i++) D.circle(ctx, x + 10 + (i % 3) * 14, y + 10 + Math.floor(i / 3) * 12, 4, '#ffd25a');
        D.text(ctx, 'TOKEN ¥5', x + w / 2, y + h - 12, 7, '#fff3c4', 'center', true);
        break;
      case 'neon': {
        const bw = p.w ? w : 10 * T;
        const pulse = .55 + .45 * Math.sin((t.time || 0) * 3);
        D.rect(ctx, x, y, bw, 14, '#171738');
        ctx.fillStyle = 'rgba(255,210,90,' + (.10 * pulse).toFixed(2) + ')';
        ctx.fillRect(x - 4, y - 4, bw + 8, 22);
        D.shadowText(ctx, p.text || 'INFINITY LIVES', x + bw / 2, y + 3, 9, '#ffd25a', 'center');
        break;
      }
      case 'preorderStand':
        D.rect(ctx, x, y, w, h, '#1b1c3a'); D.rect(ctx, x + 3, y + 3, w - 6, h - 6, '#3b3b8f');
        D.rect(ctx, x + 8, y + 8, w - 16, 20, '#5b4fb3');
        D.text(ctx, 'BUY NOW!', x + w / 2, y + 13, 9, '#ffd25a', 'center', true);
        D.text(ctx, '预购 / -20%', x + w / 2, y + 34, 7, '#c3bfff', 'center');
        break;
      case 'gamepadShelf':
        D.rect(ctx, x, y, w, h, '#1b1c3a'); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#3b3b8f');
        for (let i = 0; i < 4; i++) A.sprite(ctx, 'gamepad', x + 8 + (i % 2) * 30, y + 8 + Math.floor(i / 2) * 22, 2);
        break;
      /* ---- 旺铺招租 / 售卖机 ---- */
      case 'shutter':
        D.rect(ctx, x, y, w, 3 * T, '#3b3b46');
        for (let j = 0; j < 2 * T; j += 5) {
          D.rect(ctx, x, y + j, w, 3, j % 10 ? '#6b6f8c' : '#8f92b5');
        }
        D.rect(ctx, x, y, w, 6, '#a08a5b');
        D.text(ctx, '旺铺招租 ON SALE!', x + w / 2, y + 2 * T + 6, 9, '#ffd25a', 'center', true);
        break;
      case 'boxes':
        for (let i = 0; i < 3; i++) {
          const bx = x + i * 16, by = y + (i % 2) * 12;
          D.rect(ctx, bx, by, 18, 16, '#a08a5b'); D.rect(ctx, bx + 2, by + 2, 14, 12, '#b99a6b');
          D.line(ctx, bx, by + 8, bx + 18, by + 8, '#8a7440', 1);
        }
        break;
      case 'dust':
        D.dither(ctx, x, y, w, h, 'rgba(255,255,255,.18)', .10, 7);
        break;
      case 'vendingIn':
        D.rect(ctx, x, y, w, h, K); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#4fb8a8');
        D.rect(ctx, x + 5, y + 6, w - 10, 20, '#dff2f0');
        ['#e2564d', '#ffd25a', '#4b8fb5'].forEach((c, i) => D.rect(ctx, x + 8 + i * 12, y + 10, 6, 12, c));
        D.rect(ctx, x + 6, y + 32, w - 12, 6, '#1b1c3a'); D.text(ctx, '请勿踢', x + w / 2, y + h - 14, 7, '#fff', 'center', true);
        break;
      /* ---- 公园 / 校园 / 地铁 ---- */
      case 'fountain':
        D.circle(ctx, x + T, y + T, 13, '#3f7fa5'); D.circle(ctx, x + T, y + T, 9, '#5ba5c4');
        D.rect(ctx, x + T - 2, y + 2, 4, 14, '#c9c6b4');
        break;
      case 'parkSign':
        D.rect(ctx, x, y, 5 * T, 16, '#6b4a2f'); D.rect(ctx, x + 2, y + 2, 5 * T - 4, 12, '#f4f1e4');
        D.text(ctx, '林景园 NEIGHBOURHOOD  →', x + 8, y + 3, 7, P.blue, 'left', true);
        break;
      case 'gate':
        D.rect(ctx, x, y + 6, w, 12, '#3b3b8f'); D.rect(ctx, x + 2, y + 8, w - 4, 8, '#5b5c76');
        for (let i = 0; i < 3; i++) D.rect(ctx, x + 4 + i * 16, y + 2, 4, 8, '#ffd25a');
        break;
      case 'stairsM':
        for (let i = 0; i < 6; i++) D.rect(ctx, x + i * 4, y + i * 3, 6 * T - i * 8, 3, i % 2 ? '#b8b4a2' : '#d8d4c0');
        D.text(ctx, '↑ ENTRANCE ①②', x + 3 * T, y - 4, 7, P.gold, 'center', true);
        break;
      case 'train': {
        D.rect(ctx, x, y, w, h, K); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#c9c6b4');
        const n = Math.floor(w / 28);
        for (let i = 0; i < n; i++) {
          const wx = x + 8 + i * (w / n);
          D.rect(ctx, wx, y + 6, 20, 14, '#3b3b8f');
          D.rect(ctx, wx + 2, y + 8, 16, 8, (i + Math.floor((t.time || 0) * 2)) % 3 ? '#8fb8cf' : '#ffe9a8');
          D.rect(ctx, wx + 10, y + 8, 1, 8, '#1b1c3a');
        }
        D.rect(ctx, x + 4, y + h - 6, w - 8, 3, '#e2564d');
        D.rect(ctx, x + 6, y + 2, 8, 3, Math.floor((t.time || 0) * 3) % 2 ? '#ffd25a' : '#7fe0c8');
        D.text(ctx, 'SHUGUANG LU  ⇄  92 ROAD', x + w / 2, y + h + 3, 7, '#ffd25a', 'center');
        break;
      }
      case 'track':
        D.rect(ctx, x, y, w, h, '#b5503c');
        D.rect(ctx, x + 3, y + 3, w - 6, h - 6, '#6f9e63');
        D.frame(ctx, x, y, w, h, '#f4f1e4', 1);
        D.frame(ctx, x + 3, y + 3, w - 6, h - 6, 'rgba(244,241,228,.55)', 1);
        D.rect(ctx, x + w / 2 - 1, y + 3, 2, h - 6, 'rgba(244,241,228,.45)');
        D.text(ctx, 'RUN / 操场', x + w / 2, y + h / 2 - 3, 8, '#f4f1e4', 'center', true);
        break;
      case 'schoolBoard':
        D.rect(ctx, x, y, 5 * T, 22, '#f4f1e4'); D.frame(ctx, x, y, 5 * T, 22, K, 2);
        D.rect(ctx, x + 2, y + 2, 5 * T - 4, 4, '#3f6b8f');
        D.text(ctx, '渊迂市汾阳中学 · 新校门 / PASS ALL EXAM!', x + 6, y + 9, 7, K, 'left', true);
        break;
      /* 正门已并入 art.schoolFacade 的整栋楼立面，不再单独画门楼 */
      case 'flag':
        D.rect(ctx, x + 7, y - 10, 2, 3 * T, '#8f92b5');
        D.rect(ctx, x + 9, y - 10, 20, 12, '#1e3f8f');
        D.rect(ctx, x + 9, y - 10, 20, 3, '#ffd25a');
        D.rect(ctx, x + 3, y + 3 * T - 10, 10, 3, '#6b6f8c');
        break;
      case 'dutyBoard':
        D.rect(ctx, x, y, 4 * T, 2 * T, '#f4f1e4'); D.frame(ctx, x, y, 4 * T, 2 * T, K, 2);
        D.rect(ctx, x + 2, y + 2, 4 * T - 4, 4, '#3f6b8f');
        D.text(ctx, '值 日 表', x + 4, y + 9, 8, K, 'left', true);
        ['擦黑板 / 扫地', '关门 / 关灯', 'PASS ALL EXAM!'].forEach((s, i) => D.text(ctx, s, x + 4, y + 20 + i * 8, 6, '#5b4fb3'));
        break;
      case 'metroTitle':
        D.rect(ctx, x, y, w, h, '#1b1c3a'); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#3b3b8f');
        D.text(ctx, '〈曙光路站〉', x + 6, y + 5, 12, '#ffd25a', 'left', true);
        D.text(ctx, 'SHUGUANG LU ST  /  ENTRANCE ①②', x + 6, y + 22, 7, '#c3bfff');
        break;
      case 'direction':
        D.rect(ctx, x, y, 8 * T, 16, '#f4f1e4'); D.frame(ctx, x, y, 8 * T, 16, K, 1);
        D.text(ctx, p.text || '→', x + 6, y + 4, 7, P.blue, 'left', true);
        break;
      case 'metroShop':
        D.rect(ctx, x, y, w, h, '#1b1c3a'); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, p.color || '#3b3b8f');
        D.rect(ctx, x + 2, y + 2, w - 4, 3, A.shade(p.color || '#3b3b8f', 45));
        D.text(ctx, p.name || '', x + w / 2, y + 12, 7, '#fff', 'center', true);
        D.rect(ctx, x + w / 2 - 8, y + h - 14, 16, 10, '#8fb8cf');
        break;
      case 'gateM':
        D.rect(ctx, x, y + 4, w, 14, '#3b3b8f'); D.rect(ctx, x + 2, y + 6, w - 4, 10, '#5b5c76');
        for (let i = 0; i < 3; i++) D.rect(ctx, x + 4 + i * 14, y - 2, 4, 8, '#ffd25a');
        D.rect(ctx, x + w - 8, y + 8, 5, 4, '#7fe0c8');
        break;
      case 'yellowLine':
        D.rect(ctx, x, y, w, 3, '#d9b64f');
        for (let i = 0; i < w; i += 12) D.rect(ctx, x + i, y + 1, 6, 1, '#8a7430');
        break;
      case 'pillar':
        D.rect(ctx, x, y, 14, 4 * T, '#8f92b5'); D.rect(ctx, x + 2, y, 10, 4 * T, '#c9c6b4');
        D.rect(ctx, x, y, 14, 5, '#3b3b8f'); D.text(ctx, '①', x + 7, y + 12, 9, P.ink, 'center', true);
        break;
      /* ================= 林景园 · 西洋风小区大门 ================= */
      case 'estateGate': {
        const tm = t.time || 0, cx = x + w / 2;
        // 石阶与基座
        D.rect(ctx, x + 4, y + h - 12, w - 8, 12, '#b9b3a2');
        D.rect(ctx, x + 4, y + h - 12, w - 8, 3, '#e6e0cc');
        for (let i = 0; i < w; i += 18) D.line(ctx, x + i, y + h - 12, x + i, y + h, 'rgba(90,88,80,.35)', 1);
        // 两侧门卫亭
        [[x, y + 34], [x + w - 34, y + 34]].forEach((q, i) => {
          D.rect(ctx, q[0] + 2, q[1] - 18, 32, 52, '#e2dcc8');
          D.rect(ctx, q[0], q[1] - 18, 36, 6, '#a89a7e');
          ctx.fillStyle = '#8a6a4a'; ctx.beginPath();
          ctx.moveTo(q[0] - 2, q[1] - 18); ctx.lineTo(q[0] + 18, q[1] - 34); ctx.lineTo(q[0] + 38, q[1] - 18); ctx.closePath(); ctx.fill();
          D.rect(ctx, q[0] + 7, q[1] - 6, 20, 16, '#7fa6c9');
          D.rect(ctx, q[0] + 7, q[1] - 6, 20, 3, '#f4f1e4');
          D.text(ctx, i ? '安保' : '门卫', q[0] + 17, q[1] + 14, 6, '#3b3b8f', 'center', true);
          D.rect(ctx, q[0] + 15, q[1] - 42, 3, 10, '#8f92b5');
          D.rect(ctx, q[0] + 18, q[1] - 42, 12, 7, '#e2564d');
        });
        // 四根罗马柱（凹槽 + 柱头）
        const cols = [x + 38, x + 66, x + w - 82, x + w - 54];
        cols.forEach(cx2 => {
          D.rect(ctx, cx2 - 8, y + 22, 16, h - 34, '#ded7c2');
          D.rect(ctx, cx2 - 8, y + 22, 3, h - 34, '#f4f1e4');
          D.rect(ctx, cx2 + 5, y + 22, 3, h - 34, 'rgba(120,112,96,.35)');
          for (let k = 0; k < 3; k++) D.line(ctx, cx2 - 2 + k * 3, y + 28, cx2 - 2 + k * 3, y + h - 16, 'rgba(150,142,124,.5)', 1);
          D.rect(ctx, cx2 - 11, y + 18, 22, 6, '#c9c0a8');
          D.rect(ctx, cx2 - 11, y + h - 16, 22, 6, '#c9c0a8');
        });
        // 山花（三角楣）
        ctx.fillStyle = '#e8e1cd'; ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 30, y + 18); ctx.lineTo(cx, y - 8); ctx.lineTo(x + w - 30, y + 18); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#d8cfb6'; ctx.beginPath();
        ctx.moveTo(x + 48, y + 14); ctx.lineTo(cx, y); ctx.lineTo(x + w - 48, y + 14); ctx.closePath(); ctx.fill();
        D.circle(ctx, cx, y + 8, 5, '#e2a33a');
        // 金匾
        D.rect(ctx, x + 44, y + 22, w - 88, 22, '#2a2a5e');
        D.rect(ctx, x + 46, y + 24, w - 92, 18, '#3b3b8f');
        D.text(ctx, '林 景 园', cx, y + 25, 13, '#ffd25a', 'center', true);
        D.text(ctx, 'LINJING GARDEN  ·  EST. 无限極', cx, y + 39, 6, '#c3bfff', 'center');
        // 铁艺大门（中间两扇，金色竖条 + 菱形）
        const gx = x + 72, gw = w - 144;
        D.rect(ctx, gx, y + 48, gw, h - 58, 'rgba(30,32,60,.55)');
        for (let i = 0; i <= gw; i += 9) {
          D.rect(ctx, gx + i, y + 48, 2, h - 58, '#c9a86a');
          D.circle(ctx, gx + i + 1, y + 54, 1.5, '#ffd25a');
        }
        D.rect(ctx, gx, y + 60, gw, 3, '#c9a86a');
        D.rect(ctx, gx, y + h - 24, gw, 3, '#c9a86a');
        for (let i = 0; i < gw; i += 18) {
          ctx.strokeStyle = '#e2c07a'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(gx + i, y + 63); ctx.lineTo(gx + i + 9, y + 75); ctx.lineTo(gx + i + 18, y + 63); ctx.stroke();
        }
        D.text(ctx, 'WELCOME', cx, y + h - 18, 7, '#ffe9a8', 'center', true);
        // 门前小喷泉（会动）
        D.rect(ctx, cx - 22, y + h - 4, 44, 8, '#a9c6d6');
        const jet = 6 + Math.sin(tm * 3) * 3;
        D.rect(ctx, cx - 2, y + h - 8 - jet, 4, jet, 'rgba(180,230,255,.85)');
        D.circle(ctx, cx - 12, y + h - 6 - jet / 2, 2, 'rgba(200,240,255,.8)');
        D.circle(ctx, cx + 12, y + h - 6 - jet / 2, 2, 'rgba(200,240,255,.8)');
        // 顶上小旗
        D.rect(ctx, cx - 1, y - 22, 2, 14, '#8f92b5');
        D.rect(ctx, cx + 1, y - 22, 16, 9, Math.floor(tm) % 2 ? '#e2564d' : '#c2453f');
        break;
      }
      case 'estateGateLamp': {
        const cx = x + w / 2;
        D.rect(ctx, cx - 2, y + 10, 4, 3 * T, '#8f92b5');
        D.rect(ctx, cx - 8, y + 4, 16, 10, '#3b3b8f');
        D.rect(ctx, cx - 6, y + 6, 12, 7, '#ffe9a8');
        D.rect(ctx, cx - 10, y + 2, 20, 3, '#c9a86a');
        D.rect(ctx, cx - 6, y + 3 * T + 8, 12, 4, '#b9b3a2');
        break;
      }
      /* 小区南门内侧：两根小柱 + 铭牌 */
      case 'estateGateInner': {
        const cx = x + w / 2;
        D.rect(ctx, x, y + 10, w, 8, '#c9c0a8');
        [x + 6, x + w - 16].forEach(px2 => {
          D.rect(ctx, px2, y - 10, 10, 36, '#ded7c2');
          D.rect(ctx, px2 - 2, y - 14, 14, 6, '#f4f1e4');
          D.circle(ctx, px2 + 5, y - 20, 4, '#e2a33a');
        });
        D.rect(ctx, x + 14, y - 6, w - 28, 18, '#2a2a5e');
        D.text(ctx, '林景园 · LINJING GARDEN', cx, y - 3, 9, '#ffd25a', 'center', true);
        D.text(ctx, '3 栋 502  ← ︱ →  A/B/C 座别墅', cx, y + 8, 6, '#c3bfff', 'center');
        break;
      }
      case 'estateSign':
        D.rect(ctx, x, y + 4, w, h - 4, '#f4f1e4');
        D.frame(ctx, x, y + 4, w, h - 4, P.ink, 1.5);
        D.text(ctx, '← 1 / 3 / 5 栋', x + 4, y + 8, 7, P.ink, 'left', true);
        D.text(ctx, 'A / B / C 座 →', x + 4, y + 18, 7, '#c2453f', 'left', true);
        break;
      case 'estatePlanter':
        D.rect(ctx, x, y + 6, w, h, '#a9805a');
        D.rect(ctx, x + 2, y + 8, w - 4, h - 4, '#6f4f36');
        for (let i = 0; i < 5; i++) {
          const fx = x + 5 + i * (w - 10) / 5;
          D.circle(ctx, fx, y + 6, 3, i % 2 ? '#e2564d' : '#ffd25a');
          D.rect(ctx, fx - 1, y + 6, 2, 7, '#4caf7d');
        }
        break;
      /* 居民楼：窗格 / 阳台 / 单元门 / 门牌 / 空调外机 */
      case 'apartmentBlock': {
        const base = p.color || '#d8c4a4', dark = A.shade(base, -40), light = A.shade(base, 28), tm = t.time || 0;
        D.rect(ctx, x + 4, y + 6, w, h, 'rgba(10,10,30,.22)');
        D.rect(ctx, x, y, w, h, '#2a2a3e');
        D.rect(ctx, x + 3, y + 3, w - 6, h - 6, base);
        // 屋顶线脚与檐口
        D.rect(ctx, x, y, w, 10, dark);
        D.rect(ctx, x, y, w, 3, light);
        for (let i = 8; i < w - 8; i += 14) D.rect(ctx, x + i, y + 5, 6, 3, light);
        D.rect(ctx, x, y + h - 10, w, 4, dark);
        // 楼层窗（4 层 × 4 列）
        const rows = 4, cols = 4, cw = (w - 24) / cols, ch = (h - 40) / rows;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const wx = x + 10 + c * cw, wy = y + 14 + r * ch;
          D.rect(ctx, wx, wy, cw - 4, ch - 8, '#2a2a3e');
          const lit = t.night && ((r * 7 + c * 3 + Math.floor(tm / 3)) % 4 !== 0);
          D.rect(ctx, wx + 2, wy + 2, cw - 8, ch - 12, lit ? '#ffd25a' : '#7fa6c9');
          D.rect(ctx, wx + 2, wy + 2, cw - 8, 3, lit ? '#fff3c4' : '#a9cfe6');
          D.rect(ctx, wx + cw / 2 - 3, wy + 2, 2, ch - 12, '#2a2a3e');
          // 阳台栏杆
          D.rect(ctx, wx - 1, wy + ch - 10, cw - 2, 3, '#c9c6b4');
          for (let k = 0; k < 4; k++) D.rect(ctx, wx + k * (cw - 4) / 4, wy + ch - 10, 1, 5, '#c9c6b4');
          if (c % 2 === 1) D.rect(ctx, wx + cw - 9, wy + ch - 5, 6, 4, '#8f92b5'); // 空调外机
        }
        // 单元门
        const dw = 26, dx = x + w / 2 - dw / 2, dy = y + h - 26;
        D.rect(ctx, dx - 4, dy - 6, dw + 8, 6, '#5b4fb3');
        D.rect(ctx, dx, dy, dw, 20, '#3b2c22');
        D.rect(ctx, dx + 2, dy + 2, dw / 2 - 3, 16, '#8fb8cf');
        D.rect(ctx, dx + dw / 2 + 1, dy + 2, dw / 2 - 3, 16, '#8fb8cf');
        D.circle(ctx, dx + dw - 5, dy + 12, 1.5, '#ffd25a');
        D.rect(ctx, dx - 6, dy + 20, dw + 12, 3, '#c9c0a8');
        // 门牌
        D.rect(ctx, x + 4, y + h - 22, 34, 14, '#1b1c3a');
        D.text(ctx, p.no || '3 栋', x + 21, y + h - 20, 8, '#ffd25a', 'center', true);
        D.text(ctx, 'LINJING', x + w - 6, y + h - 20, 6, 'rgba(59,59,143,.65)', 'right', true);
        break;
      }
      /* 别墅：坡屋顶 / 老虎窗 / 门廊罗马柱 / 落地窗 / 车库 / 花园 */
      case 'villaHouse': {
        const base = p.color || '#e6d4b8', dark = A.shade(base, -45), tm = t.time || 0, cx = x + w / 2;
        D.rect(ctx, x + 4, y + 8, w, h, 'rgba(10,10,30,.22)');
        D.rect(ctx, x, y + 20, w, h - 20, '#2a2a3e');
        D.rect(ctx, x + 3, y + 23, w - 6, h - 26, base);
        // 坡屋顶
        ctx.fillStyle = dark; ctx.strokeStyle = '#2a2a3e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 4, y + 24); ctx.lineTo(cx, y - 4); ctx.lineTo(x + w + 4, y + 24); ctx.closePath(); ctx.fill(); ctx.stroke();
        for (let i = 0; i < 7; i++) D.line(ctx, x + 6 + i * (w - 12) / 7, y + 22, cx - (cx - x - 6 - i * (w - 12) / 7) * .2, y + 4, 'rgba(255,255,255,.12)', 1);
        // 老虎窗
        D.rect(ctx, cx - 10, y + 6, 20, 14, '#f4f1e4');
        D.rect(ctx, cx - 8, y + 8, 16, 10, t.night ? '#ffd25a' : '#8fb8cf');
        ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(cx - 13, y + 6); ctx.lineTo(cx, y - 2); ctx.lineTo(cx + 13, y + 6); ctx.closePath(); ctx.fill();
        // 烟囱
        D.rect(ctx, x + w - 26, y + 2, 10, 18, '#a9805a');
        D.rect(ctx, x + w - 28, y, 14, 4, '#8a6a4a');
        // 门廊：两根小罗马柱 + 三角小山花
        [x + 10, x + w - 20].forEach(px2 => {
          D.rect(ctx, px2, y + 34, 10, h - 40, '#f4f1e4');
          D.rect(ctx, px2 - 2, y + 31, 14, 5, '#e6e0cc');
          D.line(ctx, px2 + 3, y + 38, px2 + 3, y + h - 8, 'rgba(140,130,110,.5)', 1);
        });
        ctx.fillStyle = '#e8e1cd'; ctx.beginPath();
        ctx.moveTo(x + 6, y + 32); ctx.lineTo(cx, y + 20); ctx.lineTo(x + w - 6, y + 32); ctx.closePath(); ctx.fill();
        // 落地窗（夜里亮）
        for (let i = 0; i < 3; i++) {
          const wx = x + 24 + i * (w - 48) / 3;
          D.rect(ctx, wx, y + 40, (w - 52) / 3, h - 48, '#2a2a3e');
          D.rect(ctx, wx + 2, y + 42, (w - 52) / 3 - 4, h - 52, t.night ? '#ffd25a' : '#8fb8cf');
          D.rect(ctx, wx + 2, y + 42, (w - 52) / 3 - 4, 3, '#fff3c4');
          D.line(ctx, wx + (w - 52) / 6, y + 42, wx + (w - 52) / 6, y + h - 10, '#2a2a3e', 1);
        }
        // 大门
        D.rect(ctx, cx - 8, y + h - 24, 16, 22, '#6b4a2f');
        D.circle(ctx, cx + 5, y + h - 13, 1.5, '#ffd25a');
        // 车库卷帘
        D.rect(ctx, x + 4, y + h - 20, 22, 18, '#a9aebc');
        for (let i = 0; i < 5; i++) D.line(ctx, x + 4, y + h - 20 + i * 4, x + 26, y + h - 20 + i * 4, 'rgba(59,59,90,.4)', 1);
        // 花园栅栏与门牌
        D.rect(ctx, x - 2, y + h - 2, w + 4, 4, '#e6e0cc');
        for (let i = 0; i < w; i += 10) D.rect(ctx, x + i, y + h - 8, 2, 8, '#e6e0cc');
        D.rect(ctx, cx - 18, y + h - 14, 36, 12, '#1b1c3a');
        D.text(ctx, p.no || 'A 座', cx, y + h - 12, 8, '#ffd25a', 'center', true);
        const owned = PC.Estate && PC.Estate.owned(p.unit);
        if (owned) { D.circle(ctx, x + w - 8, y + h - 12, 4, '#7fe0c8'); D.text(ctx, '✓', x + w - 8, y + h - 15, 6, '#0b1030', 'center', true); }
        // 花园里两丛会摇的蔷薇
        [x + 8, x + w - 12].forEach(px2 => {
          const sway = Math.sin(tm * 1.7 + px2) * 1.5;
          D.rect(ctx, px2, y + h - 14, 2, 10, '#4caf7d');
          D.circle(ctx, px2 + sway, y + h - 16, 3, '#e2564d');
          D.circle(ctx, px2 + 4 + sway, y + h - 13, 2, '#ffd25a');
        });
        break;
      }
      /* 售楼处 / 会所 */
      case 'estateOffice': {
        const cx = x + w / 2;
        D.rect(ctx, x + 4, y + 6, w, h, 'rgba(10,10,30,.22)');
        D.rect(ctx, x, y + 8, w, h - 8, '#2a2a3e');
        D.rect(ctx, x + 3, y + 11, w - 6, h - 14, '#e8e1cd');
        ctx.fillStyle = '#a9805a'; ctx.beginPath();
        ctx.moveTo(x - 2, y + 12); ctx.lineTo(cx, y - 2); ctx.lineTo(x + w + 2, y + 12); ctx.closePath(); ctx.fill();
        [x + 6, x + w - 14].forEach(px2 => { D.rect(ctx, px2, y + 18, 8, h - 24, '#f4f1e4'); D.rect(ctx, px2 - 2, y + 15, 12, 5, '#ded7c2'); });
        D.rect(ctx, x + 5, y + 14, w - 10, 18, '#1b1c3a');
        D.text(ctx, '林景园 售楼处', cx, y + 16, 9, '#ffd25a', 'center', true);
        D.text(ctx, 'ESTATE OFFICE', cx, y + 27, 6, '#c3bfff', 'center');
        // 沙盘窗
        D.rect(ctx, x + 7, y + 36, w - 14, 30, '#7fa6c9');
        D.rect(ctx, x + 9, y + 38, w - 18, 26, '#a9cfe6');
        for (let i = 0; i < 5; i++) D.rect(ctx, x + 12 + i * (w - 28) / 5, y + 48 + (i % 2) * 5, 8, 12, '#d8c4a4');
        D.text(ctx, '沙盘 · 1/3/5 栋 + A/B/C 座', cx, y + 68, 6, P.ink, 'center');
        // 海报：设计稿上的房价
        D.rect(ctx, x + 6, y + 74, w - 12, 26, '#f4f1e4');
        D.frame(ctx, x + 6, y + 74, w - 12, 26, '#c2453f', 1.5);
        D.text(ctx, '二室 290万 / 好景 330万', cx, y + 77, 6, '#c2453f', 'center', true);
        D.text(ctx, '在林景园 470万', cx, y + 88, 7, P.ink, 'center', true);
        D.text(ctx, '▶ 按 A 看在售房源', cx, y + h - 10, 6, '#ffd25a', 'center', true);
        break;
      }
      /* 中央大喷泉 */
      case 'fountainBig': {
        const tm = t.time || 0, cx = x + w / 2, cy = y + h / 2;
        D.rect(ctx, x, y + h * .4, w, h * .55, '#2a2a3e');
        D.rect(ctx, x + 3, y + h * .4 + 3, w - 6, h * .55 - 6, '#7fb8cf');
        for (let i = 0; i < 7; i++) {
          const wx = x + 6 + ((i * 29 + tm * 14) % (w - 12));
          D.line(ctx, wx, y + h * .55, wx + 8, y + h * .55, 'rgba(255,255,255,.55)', 1);
        }
        // 中央雕塑与喷泉
        D.rect(ctx, cx - 7, cy - 16, 14, 20, '#ded7c2');
        D.circle(ctx, cx, cy - 20, 6, '#f4f1e4');
        const jet = 12 + Math.sin(tm * 2.6) * 5;
        D.rect(ctx, cx - 2, cy - 22 - jet, 4, jet, 'rgba(200,240,255,.9)');
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3 + tm * .5;
          D.circle(ctx, cx + Math.cos(a) * 22, cy + Math.sin(a) * 9 - 4, 2, 'rgba(220,245,255,.8)');
        }
        D.text(ctx, 'LINJING', cx, y + h - 8, 6, '#eaf6ff', 'center', true);
        break;
      }
      /* 大水池：水波 / 睡莲 / 锦鲤 / 栈道 */
      case 'estatePondProp': {
        const tm = t.time || 0;
        for (let i = 0; i < 16; i++) {
          const wx = x + 6 + ((i * 37 + tm * 10) % (w - 12));
          const wy = y + 8 + (i * 13) % (h - 16);
          D.line(ctx, wx, wy, wx + 10, wy, 'rgba(220,245,255,.28)', 1);
        }
        // 睡莲
        [[.15, .3], [.28, .72], [.78, .24], [.85, .68], [.62, .82]].forEach((q, i) => {
          const lx = x + w * q[0], ly = y + h * q[1];
          D.circle(ctx, lx, ly, 5, '#4caf7d');
          D.circle(ctx, lx + 2, ly - 1, 2, i % 2 ? '#e2564d' : '#ffd25a');
        });
        // 锦鲤游动
        for (let i = 0; i < 4; i++) {
          const fx = x + 10 + ((i * 41 + tm * 16) % (w - 20));
          const fy = y + 12 + ((i * 23) % (h - 24));
          D.circle(ctx, fx, fy, 2.5, i % 2 ? '#e2564d' : '#ffd25a');
          D.line(ctx, fx + 2, fy, fx + 6, fy - 2, 'rgba(255,255,255,.6)', 1);
        }
        // 栈道（中间那一条）
        D.rect(ctx, x + w * .44, y, w * .12, h, 'rgba(190,160,110,.85)');
        for (let i = 0; i < h; i += 9) D.line(ctx, x + w * .44, y + i, x + w * .56, y + i, 'rgba(90,70,50,.5)', 1);
        D.text(ctx, '⛲ 中央水池', x + 6, y + 5, 6, '#eaf6ff', 'left', true);
        break;
      }
      /* 健身器材区 */
      case 'gymEquipment': {
        const tm = t.time || 0;
        D.rect(ctx, x, y, w, h, 'rgba(201,198,180,.55)');
        for (let i = 0; i < w; i += 12) for (let j = 0; j < h; j += 12) D.circle(ctx, x + i + 3, y + j + 3, 1, 'rgba(90,90,120,.18)');
        // 单杠
        D.rect(ctx, x + 8, y + 14, 3, 40, '#8f92b5'); D.rect(ctx, x + 44, y + 14, 3, 40, '#8f92b5');
        D.rect(ctx, x + 6, y + 12, 43, 3, '#5b4fb3');
        // 漫步机（会晃）
        const sw = Math.sin(tm * 2) * 5;
        D.rect(ctx, x + 56, y + 20, 3, 34, '#8f92b5');
        D.line(ctx, x + 57, y + 22, x + 50 + sw, y + 50, '#4fb8a8', 2);
        D.line(ctx, x + 57, y + 22, x + 66 - sw, y + 50, '#4fb8a8', 2);
        D.rect(ctx, x + 46 + sw, y + 50, 9, 3, '#3b3b8f');
        D.rect(ctx, x + 62 - sw, y + 50, 9, 3, '#3b3b8f');
        // 扭腰器
        D.circle(ctx, x + 88, y + 42, 10, '#e2564d');
        D.circle(ctx, x + 88, y + 42, 4, '#f4f1e4');
        D.rect(ctx, x + 86, y + 50, 4, 14, '#8f92b5');
        // 仰卧板
        D.rect(ctx, x + 108, y + 44, 34, 5, '#5b4fb3');
        D.rect(ctx, x + 110, y + 49, 3, 10, '#8f92b5');
        D.rect(ctx, x + 138, y + 49, 3, 10, '#8f92b5');
        // 告示牌
        D.rect(ctx, x + 4, y + 60, w - 8, 16, '#f4f1e4');
        D.frame(ctx, x + 4, y + 60, w - 8, 16, P.ink, 1.3);
        D.text(ctx, '健身区 · 免费使用', x + w / 2, y + 63, 7, P.ink, 'center', true);
        D.text(ctx, 'LINJING FITNESS  /  按 A 练一会儿', x + w / 2, y + 71, 5, '#5b4fb3', 'center');
        break;
      }
      /* ================= 公寓 / 别墅 · 室内家具 ================= */
      case 'balconyDoor':
        D.rect(ctx, x, y, w, h, '#2a2a3e');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, t.night ? '#2a3a6a' : '#8fb8cf');
        D.rect(ctx, x + 2, y + 2, w - 4, 3, '#fff3c4');
        D.rect(ctx, x + w / 2 - 1, y + 2, 2, h - 4, '#2a2a3e');
        D.rect(ctx, x - 2, y + h, w + 4, 3, '#c9c0a8');
        D.text(ctx, '阳台 →', x + 2, y + h + 4, 5, '#5b4fb3');
        break;
      case 'unitPlate':
        D.rect(ctx, x, y, 4 * T, 12, '#1b1c3a');
        D.text(ctx, (p.text || '502').slice(0, 8), x + 2, y + 2, 7, '#ffd25a', 'left', true);
        break;
      case 'bookshelf':
        D.rect(ctx, x, y, w, h, '#6b4a2f');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#3b2c22');
        const cols = ['#e2564d', '#4fb8a8', '#ffd25a', '#5b4fb3', '#7fe0c8', '#c05b86'];
        for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) {
          D.rect(ctx, x + 5 + i * (w - 10) / 7, y + 5 + r * (h - 8) / 3, (w - 14) / 8, (h - 12) / 3 - 3, cols[(i + r) % cols.length]);
        }
        D.text(ctx, 'BOOKS', x + w / 2, y + h - 8, 5, '#ffe9a8', 'center');
        break;
      case 'villaWindow':
        D.rect(ctx, x, y, w, h, '#2a2a3e');
        D.rect(ctx, x + 3, y + 3, w - 6, h - 6, t.night ? '#2a3a6a' : '#8fb8cf');
        D.rect(ctx, x + 3, y + 3, w - 6, 4, '#fff3c4');
        for (let i = 1; i < 3; i++) D.rect(ctx, x + (w / 3) * i - 1, y + 3, 2, h - 6, '#2a2a3e');
        D.rect(ctx, x - 3, y + h, w + 6, 4, '#c9c0a8');
        break;
      case 'catTower':
        D.rect(ctx, x, y + 10, 14, 22, '#a9805a');
        D.rect(ctx, x - 2, y + 4, 18, 8, '#c9a97e');
        D.rect(ctx, x + 2, y, 12, 6, '#c9a97e');
        D.circle(ctx, x + 7, y + 2, 3, '#3b3b46');
        D.circle(ctx, x + 6, y + 1, 1, '#ffd25a');
        break;
      case 'villaStairs':
        for (let i = 0; i < 5; i++) {
          D.rect(ctx, x + i * 6, y + h - 8 - i * 6, w - i * 6, 7, i % 2 ? '#c9c0a8' : '#ded7c2');
          D.rect(ctx, x + i * 6, y + h - 8 - i * 6, w - i * 6, 2, '#f4f1e4');
        }
        D.rect(ctx, x + w - 3, y, 2, h, '#8f92b5');
        D.text(ctx, '2F ↑', x + 3, y + 2, 6, '#5b4fb3', 'left', true);
        break;
      case 'chandelier': {
        const tm = t.time || 0, cx = x + w / 2;
        D.rect(ctx, cx - 1, y, 2, 12, '#c9a86a');
        D.rect(ctx, x, y + 12, w, 4, '#e2c07a');
        for (let i = 0; i < 5; i++) {
          const lx = x + 4 + i * (w - 8) / 5;
          D.circle(ctx, lx, y + 18 + Math.sin(tm * 2 + i) * 1, 3, '#ffe9a8');
          D.rect(ctx, lx - 1, y + 16, 2, 5, 'rgba(255,233,168,.5)');
        }
        break;
      }
      case 'fireplace': {
        const tm = t.time || 0;
        D.rect(ctx, x, y, w, h, '#c9c0a8');
        D.rect(ctx, x + 2, y + 2, w - 4, 6, '#e6e0cc');
        D.rect(ctx, x + 5, y + 10, w - 10, h - 12, '#2a2a3e');
        for (let i = 0; i < 4; i++) {
          const fh = 8 + Math.abs(Math.sin(tm * 3 + i * 1.3)) * 10;
          ctx.fillStyle = i % 2 ? '#e2564d' : '#ffd25a';
          ctx.beginPath();
          ctx.moveTo(x + 9 + i * (w - 18) / 4, y + h - 4);
          ctx.lineTo(x + 12 + i * (w - 18) / 4, y + h - 4 - fh);
          ctx.lineTo(x + 16 + i * (w - 18) / 4, y + h - 4);
          ctx.closePath(); ctx.fill();
        }
        D.rect(ctx, x - 3, y + h - 3, w + 6, 3, '#8f92b5');
        break;
      }
      case 'garageDoor':
        D.rect(ctx, x, y, w, h, '#2a2a3e');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#a9aebc');
        for (let i = 0; i < 8; i++) D.line(ctx, x + 2, y + 4 + i * (h - 8) / 8, x + w - 2, y + 4 + i * (h - 8) / 8, 'rgba(59,59,90,.45)', 1);
        D.rect(ctx, x + w / 2 - 12, y + h - 12, 24, 8, '#1b1c3a');
        D.text(ctx, 'GARAGE', x + w / 2, y + h - 11, 6, '#ffd25a', 'center', true);
        break;
      case 'poolProp': {
        const tm = t.time || 0;
        D.rect(ctx, x, y, w, h, '#2a2a3e');
        D.rect(ctx, x + 4, y + 4, w - 8, h - 8, '#4fb8cf');
        for (let i = 0; i < 14; i++) {
          const wx = x + 8 + ((i * 43 + tm * 12) % (w - 16));
          const wy = y + 8 + (i * 17) % (h - 16);
          D.line(ctx, wx, wy, wx + 12, wy, 'rgba(255,255,255,.4)', 1);
        }
        D.rect(ctx, x + w - 14, y + 4, 3, h - 8, '#f4f1e4');
        D.text(ctx, 'PRIVATE POOL', x + w / 2, y + h - 10, 6, '#eaf6ff', 'center', true);
        break;
      }
      case 'villaBed':
        D.rect(ctx, x, y + 4, w, h, '#5b4fb3');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#f4f1e4');
        D.rect(ctx, x + 2, y + 2, w - 4, 8, '#e6e0cc');
        D.rect(ctx, x + 4, y + 12, w - 8, h - 14, '#7fe0c8');
        D.rect(ctx, x + 4, y + 12, w - 8, 3, '#4fb8a8');
        D.text(ctx, '主卧', x + w - 16, y + h - 10, 5, '#5b4fb3');
        break;
      /* ---- 我家的家具 ---- */
      case 'bed':
        D.rect(ctx, x, y + 4, w, h, '#3b3b8f');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#e3e0f5');
        D.rect(ctx, x + 2, y + 2, w - 4, 8, '#f4f1e4');
        D.rect(ctx, x + 4, y + 12, w - 8, h - 14, '#7fe0c8');
        D.rect(ctx, x + 4, y + 12, w - 8, 3, '#4fb8a8');
        D.text(ctx, 'Z z z', x + w - 16, y + h - 12, 6, '#5b4fb3');
        break;
      case 'homeDesk':
        D.rect(ctx, x, y + 4, w, h, '#8a5b3b');
        D.rect(ctx, x + 2, y + 2, w - 4, 5, '#a97a50');
        D.rect(ctx, x + 6, y - 12, w - 12, 14, '#1b1c3a');
        D.rect(ctx, x + 8, y - 10, w - 16, 10, '#4fb8a8');
        D.text(ctx, '▮▮', x + w / 2, y - 9, 6, '#0b1636', 'center');
        D.rect(ctx, x + 3, y + 8, 5, 3, '#f4f1e4');
        break;
      case 'wardrobe':
        D.rect(ctx, x, y, w, h, '#8a5b3b');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#a97a50');
        D.rect(ctx, x + w / 2 - 1, y + 2, 2, h - 4, '#5b3b28');
        D.circle(ctx, x + w / 2 - 5, y + h / 2, 1.5, '#ffd25a');
        D.circle(ctx, x + w / 2 + 5, y + h / 2, 1.5, '#ffd25a');
        break;
      case 'kitchen':
        D.rect(ctx, x, y + 4, w, h, '#9aa0b5');
        D.rect(ctx, x + 2, y + 2, w - 4, 4, '#c9c6b4');
        D.rect(ctx, x + w - 14, y + 5, 10, h - 6, '#8fb8cf');
        D.rect(ctx, x + w - 13, y + 6, 8, h - 8, '#d8ecf5');
        D.text(ctx, '🧊', x + w - 12, y + h / 2, 9, '#2a2a5e');
        D.circle(ctx, x + 8, y + 4, 2, '#e2564d'); D.circle(ctx, x + 16, y + 4, 2, '#4caf7d');
        break;
      case 'tv':
        D.rect(ctx, x, y + 6, w, h, '#8a5b3b');
        D.rect(ctx, x + 4, y, w - 8, 18, '#1b1c3a');
        D.rect(ctx, x + 6, y + 2, w - 12, 14, '#3b3b8f');
        D.text(ctx, Math.floor((t.time || 0) * 2) % 2 ? 'INFINITY' : 'LIVES', x + w / 2, y + 6, 6, '#ffd25a', 'center');
        break;
      case 'sofa':
        D.rect(ctx, x, y + 4, w, h, '#5b4fb3');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 6, '#7a6cc9');
        D.rect(ctx, x + 2, y + h - 6, 4, 6, '#3b3b8f');
        D.rect(ctx, x + w - 6, y + h - 6, 4, 6, '#3b3b8f');
        break;
      case 'piggy':
        D.rect(ctx, x, y + 6, 16, 12, '#e8a0b5');
        D.circle(ctx, x + 8, y + 10, 5, '#e8a0b5');
        D.rect(ctx, x + 12, y + 4, 3, 6, '#e8a0b5');
        D.rect(ctx, x + 3, y + 16, 3, 3, '#c05b86'); D.rect(ctx, x + 11, y + 16, 3, 3, '#c05b86');
        D.rect(ctx, x + 6, y + 8, 2, 2, '#2a2a5e');
        D.text(ctx, '¥', x + 8, y - 6, 8, '#ffd25a', 'center', true);
        break;
      case 'cat':
        D.rect(ctx, x + 3, y + 9, 12, 8, '#3a2c3e');
        D.circle(ctx, x + 9, y + 7, 5, '#3a2c3e');
        D.rect(ctx, x + 5, y + 2, 3, 4, '#3a2c3e'); D.rect(ctx, x + 11, y + 2, 3, 4, '#3a2c3e');
        D.rect(ctx, x + 6, y + 6, 2, Math.floor((t.time || 0) * 1.5) % 2 ? 2 : 1, '#ffd25a');
        D.rect(ctx, x + 11, y + 6, 2, Math.floor((t.time || 0) * 1.5) % 2 ? 2 : 1, '#ffd25a');
        D.rect(ctx, x + 15, y + 10, 6, 2, '#3a2c3e');
        break;
      case 'windowH':
        D.rect(ctx, x, y + 2, w, 18, '#8fb8cf');
        D.rect(ctx, x + 2, y + 4, w - 4, 14, '#bfe0f0');
        D.rect(ctx, x + w / 2 - 1, y + 4, 2, 14, '#f4f1e4');
        D.rect(ctx, x + 2, y + 10, w - 4, 2, '#f4f1e4');
        D.rect(ctx, x, y + 18, w, 3, '#f4f1e4');
        D.text(ctx, '☀ 9°C', x + 3, y + 5, 6, '#3b3b8f');
        break;
      /* ================= 迂龙路 · 店铺专属家具 ================= */
      case 'snackStall':
        D.rect(ctx, x, y + 10, 6 * T, 3 * T, '#8a5b3b');
        D.rect(ctx, x, y, 6 * T, 10, '#e2564d');
        for (let i = 0; i < 3; i++) D.rect(ctx, x + i * 2 * T, y, 2 * T - 3, 10, i % 2 ? '#f4f1e4' : '#ffd25a');
        D.rect(ctx, x + 6, y + 13, 3 * T, 14, '#c9c6b4');
        D.circle(ctx, x + 2 * T, y + 14, 9, '#f4f1e4');
        D.circle(ctx, x + 4 * T, y + 14, 9, '#f4e6a0');
        D.text(ctx, '小吃', x + 3 * T, y + 3, 7, '#fff', 'center', true);
        break;
      case 'netbarPC':
        D.rect(ctx, x, y + 8, 4 * T, 10, '#4a4b62');
        D.rect(ctx, x + 4, y, 3 * T, 2 * T, '#1b1c3a');
        D.rect(ctx, x + 7, y + 3, 3 * T - 6, 2 * T - 6,
          Math.floor((t.time || 0) * 2 + x) % 3 ? '#4fb8a8' : '#5b4fb3');
        D.text(ctx, Math.floor((t.time || 0) * 3 + x) % 2 ? '▮▮▮' : '▮ ▮', x + 12, y + 10, 6, '#7fe0c8');
        D.rect(ctx, x + 6, y + 2 * T + 8, 2 * T, 6, '#8f92b5');
        break;
      case 'chickenPot':
        D.rect(ctx, x, y + 6, 6 * T, 2 * T, '#3b3b46');
        D.circle(ctx, x + 3 * T, y + 14, 24, '#2a2a5e');
        D.circle(ctx, x + 3 * T, y + 14, 19, '#d99b1f');
        for (let i = 0; i < 6; i++) D.circle(ctx, x + 16 + i * 13, y + 8 + (i % 2) * 9, 3, '#f4f1e4');
        D.text(ctx, '迂龙三黄鸡  ¥32', x + 3 * T, y + 2 * T + 10, 8, '#e2564d', 'center', true);
        D.text(ctx, '♨', x + 3 * T, y - 2, 9, '#ffd25a', 'center');
        break;
      case 'simWall':
        D.rect(ctx, x, y, 5 * T, 5 * T, '#eaf4ff'); D.frame(ctx, x, y, 5 * T, 5 * T, '#4fb8a8', 2);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
          D.rect(ctx, x + 6 + i * 18, y + 8 + j * 20, 13, 9, i % 2 ? '#ffd25a' : '#7fe0c8');
          D.text(ctx, 'SIM', x + 7 + i * 18, y + 9 + j * 20, 5, '#2a2a5e');
        }
        D.text(ctx, '办理手机号 / 换卡', x + 4, y + 5 * T - 12, 6, '#3b3b8f');
        break;
      case 'lawDesk':
        D.rect(ctx, x, y + 8, w, 22, '#4a3a58');
        D.rect(ctx, x + 2, y + 4, w - 4, 8, '#6b5370');
        D.circle(ctx, x + w / 2, y - 8, 9, '#e2564d');
        D.text(ctx, '★', x + w / 2, y - 15, 9, '#ffd25a', 'center', true);
        D.text(ctx, '立案 Register', x + 6, y + 16, 6, '#fff3c4');
        D.text(ctx, '判决查询 Judgement', x + w / 2, y + 16, 6, '#fff3c4');
        break;
      case 'ticketMachine':
        D.rect(ctx, x, y, 3 * T, 5 * T, '#3b3b8f');
        D.rect(ctx, x + 4, y + 4, 3 * T - 8, 2 * T, '#0b1636');
        D.rect(ctx, x + 7, y + 7, 3 * T - 14, 2 * T - 6,
          Math.floor((t.time || 0) * 2) % 2 ? '#123048' : '#1b3c58');
        D.text(ctx, '¥ 2', x + 3 * T / 2, y + 14, 9, '#ffd25a', 'center', true);
        D.text(ctx, 'TICKET', x + 3 * T / 2, y + 2 * T + 12, 6, '#a9e6f5', 'center');
        D.rect(ctx, x + 8, y + 4 * T, 2 * T, 6, '#1b1c3a');
        D.circle(ctx, x + 2 * T + 6, y + 3 * T + 8, 3, '#7fe0c8');
        break;
      case 'routeMapIn':
        D.rect(ctx, x, y, 5 * T, 5 * T, '#f4f1e4'); D.frame(ctx, x, y, 5 * T, 5 * T, '#3b3b8f', 2);
        ['#4fb8a8', '#5b4fb3', '#e2564d', '#d99b1f'].forEach((c, i) => {
          D.rect(ctx, x + 6, y + 12 + i * 16, 5 * T - 12, 3, c);
          D.circle(ctx, x + 12 + i * 12, y + 13 + i * 16, 3, '#fff');
        });
        D.text(ctx, '迂龙南路 / 龙川路 / 迂龙北', x + 4, y + 5 * T - 12, 6, '#2a2a5e');
        break;
      /* ================= 迂龙路 · 街区大件（照着第二张手绘稿） ================= */
      case 'underpass':
        for (let i = 0; i < 7; i++) D.line(ctx, x, y + 10 + i * 8, x + w, y - 4 + i * 8, '#5b4fb3', 1);
        D.rect(ctx, x + 2, y - 10, w - 4, 12, 'rgba(244,241,228,.85)');
        D.text(ctx, '迂龙地下通道', x + 6, y - 8, 10, P.ink, 'left', true);
        D.text(ctx, 'UNDERPASS', x + 6, y + 4, 6, '#5b4fb3');
        break;
      /* ===== 左上角：地下小吃一条街的大入口（一串斜线就是往下去的楼梯） ===== */
      case 'undergroundGate': {
        const tm = t.time || 0;
        // 下沉口的暗色梯形底
        ctx.fillStyle = 'rgba(28,30,66,.78)';
        ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h * .12);
        ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
        // 一组平行斜线（稿子上最显眼的纹理）
        const step = 11, off = (tm * 6) % step;
        for (let i = -14; i < 26; i++) {
          const sx = x + i * step + off;
          D.line(ctx, sx, y + h, sx + w * .72, y + h * .12, 'rgba(200,205,245,.62)', 1.4);
          D.line(ctx, sx + 2, y + h, sx + w * .72 + 2, y + h * .12, 'rgba(42,42,94,.45)', 1);
        }
        // 顶部墨线
        D.line(ctx, x, y + h, x + w, y + h * .12, P.ink, 2);
        // 标题与「地口」圆牌
        D.rect(ctx, x + 4, y + 2, w * .78, 18, 'rgba(246,244,233,.92)');
        D.text(ctx, '迂龙地下通道', x + 8, y + 5, 11, P.ink, 'left', true);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(x + 16, y + 36, 11, 0, Math.PI * 2); ctx.stroke();
        D.text(ctx, '地口', x + 16, y + 30, 8, P.ink, 'center', true);
        // 「小吃一条街」横牌 + 一排摊位雨棚
        const bw = Math.min(w - 24, 118);
        D.rect(ctx, x + w - bw - 6, y + 44, bw, 20, '#f4f1e4');
        D.frame(ctx, x + w - bw - 6, y + 44, bw, 20, P.ink, 1.5);
        D.text(ctx, '小吃一条街', x + w - bw - 1, y + 48, 10, P.ink, 'left', true);
        for (let i = 0; i < 5; i++) {
          const sx = x + w - bw - 2 + i * 22;
          D.rect(ctx, sx, y + 68, 19, 4, '#e2564d');
          D.rect(ctx, sx + 2, y + 72, 15, 12, 'rgba(244,241,228,.8)');
          for (let j = 0; j < 4; j++) D.line(ctx, sx + 3 + j * 4, y + 72, sx + 3 + j * 4, y + 84, '#7f7bc0', 1);
        }
        // 楼梯尽头的黑口
        D.rect(ctx, x + w * .56, y + h * .72, w * .4, h * .2, '#0b1030');
        D.text(ctx, '⬇ 地下', x + w * .6, y + h * .76, 7, '#ffd25a', 'left', true);
        break;
      }
      case 'underpassMouth':
        D.rect(ctx, x, y, w, h, '#1b1c3a');
        for (let i = 0; i < 4; i++) D.line(ctx, x + 2, y + i * 8, x + w - 2, y + i * 8, '#8f92b5', 1.5);
        D.text(ctx, '地下通道 ⇄', x + 2, y + h + 2, 7, P.ink, 'left', true);
        break;
      /* ===== 印在地上的大空心箭头：渊迂市渊迂中学 ===== */
      case 'bigArrow': {
        const ax = x + 4 * T, ay = y + 2 * T;
        ctx.strokeStyle = 'rgba(59,59,143,.9)'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ax, ay + 2 * T); ctx.lineTo(ax + 3 * T, ay - T); ctx.lineTo(ax + 3 * T, ay - 2 * T);
        ctx.lineTo(ax + 5 * T, ay - 2 * T); ctx.lineTo(ax + 5 * T, ay + 2 * T); ctx.closePath(); ctx.stroke();
        // 内圈的空心小箭头（稿子上是双层空心箭头）
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(91,79,179,.8)';
        ctx.beginPath();
        ctx.moveTo(ax + 8, ay + T); ctx.lineTo(ax + 2 * T, ay); ctx.lineTo(ax + 8, ay - T); ctx.stroke();
        D.text(ctx, p.text || '', x + 6 * T + 10, y + 8, 13, P.ink, 'left', true);
        D.text(ctx, p.sub || '', x + 6 * T + 10, y + 27, 9, '#5b4fb3');
        D.text(ctx, '（市交巡体中心往南中）', x + 6 * T + 10, y + 41, 8, '#7f7bc0');
        // 地面磨损
        for (let k = 0; k < 18; k++) D.rect(ctx,
          x + 6 * T + 10 + U.noise2(k, 2, 3) * 120, y + 6 + U.noise2(k, 5, 4) * 48, 3, 1, 'rgba(201,198,180,.55)');
        break;
      }
      /* ===== 「道路千万条」是漆在车道地面上的白字，不是立牌 ===== */
      case 'roadSlogan': {
        const lines = ['道路千万条，安全第一条。', '行车不规范，亲人两行泪。'];
        ctx.save();
        ctx.translate(x + 6, y + 6);
        ctx.transform(1, 0, -.12, .82, 0, 0);   // 贴地：倾斜 + 纵向压扁
        lines.forEach((s, li) => {
          D.text(ctx, s, 0, li * 26, 13, 'rgba(238,244,255,.92)', 'left', true);
          D.text(ctx, s, 1, li * 26 + 1, 13, 'rgba(59,59,143,.35)', 'left', true);
        });
        ctx.restore();
        // 被车轮磨掉的点
        for (let k = 0; k < 30; k++) D.rect(ctx,
          x + 6 + U.noise2(k, 7, 9) * (w - 12), y + 6 + U.noise2(k, 11, 6) * (h - 12),
          3 + (k % 3) * 2, 2, 'rgba(74,75,98,.5)');
        break;
      }
      /* ===== 竖直有轨电车：两条钢轨 + 枕木 + 接触网 ===== */
      case 'tramRails': {
        const tm = t.time || 0;
        D.rect(ctx, x, y, w, h, 'rgba(120,118,105,.55)');           // 道床
        for (let i = 0; i < h; i += 11) D.rect(ctx, x + 6, y + i, w - 12, 3, 'rgba(70,66,58,.55)'); // 枕木
        const r1 = x + w * .3, r2 = x + w * .7;
        [r1, r2].forEach(rx => {
          D.rect(ctx, rx - 3, y, 6, h, '#2a2a3a');
          D.rect(ctx, rx - 2, y, 2, h, '#b9becb');
          D.rect(ctx, rx + 1, y, 1, h, 'rgba(255,255,255,.35)');
        });
        // 接触网
        D.line(ctx, x + w / 2, y, x + w / 2, y + h, 'rgba(59,59,143,.45)', 1);
        for (let i = 0; i < h; i += 120) D.line(ctx, x + 2, y + i, x + w / 2, y + i, '#5b4fb3', 1);
        // 轨面反光缓慢往下走
        const gleam = (tm * 40) % h;
        D.rect(ctx, r1 - 2, y + gleam, 4, 12, 'rgba(255,240,190,.5)');
        D.rect(ctx, r2 - 2, y + gleam, 4, 12, 'rgba(255,240,190,.5)');
        break;
      }
      /* ===== 进站口：尖顶小房子，房顶上一块会滚的信息屏 ===== */
      case 'tramGateHouse': {
        const tm = t.time || 0, cx = x + w / 2;
        // 五边形轮廓（尖顶 + 圆弧底），照稿子
        ctx.fillStyle = '#f6f4e9'; ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 3 * T); ctx.lineTo(cx, y + 4); ctx.lineTo(x + w - 2, y + 3 * T);
        ctx.lineTo(x + w - 2, y + h - 3 * T);
        ctx.quadraticCurveTo(cx, y + h + 8, x + 2, y + h - 3 * T);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // 房顶信息屏（房顶上显示信息）
        D.rect(ctx, x + 8, y + 2 * T, w - 16, 26, '#0b1636');
        D.frame(ctx, x + 8, y + 2 * T, w - 16, 26, '#e2a33a', 1);
        const info = 'LINE 1 / AIR L1　◆　票价 2元　◆　晴 17°C SUNNY　◆　下一站 中华门 ZHONGHUA　◆　ENTRANCE ↑　◆　';
        ctx.save(); ctx.beginPath(); ctx.rect(x + 10, y + 2 * T + 3, w - 20, 10); ctx.clip();
        ctx.font = '7px "Courier New","WenQuanYi Micro Hei",monospace';
        const iw = Math.max(180, ctx.measureText(info).width), io = (tm * 22) % iw;
        D.text(ctx, info, x + 10 - io, y + 2 * T + 4, 7, '#7fe0c8');
        D.text(ctx, info, x + 10 - io + iw, y + 2 * T + 4, 7, '#7fe0c8');
        ctx.restore();
        D.text(ctx, Math.floor(tm * 1.6) % 2 ? 'LINE 1 ▮' : 'LINE 1  ', x + 12, y + 2 * T + 15, 8, '#ffd25a', 'left', true);
        // 房身：站名列表
        D.text(ctx, 'AIR L1', cx, y + 2 * T + 34, 9, '#5b4fb3', 'center', true);
        ['景迂路', '中华门', '癸年路', '爱民路', '沁公园'].forEach((s, i) =>
          D.text(ctx, '· ' + s, x + 12, y + 2 * T + 48 + i * 11, 7, i === 1 ? '#c2453f' : '#7f7bc0'));
        D.rect(ctx, x + 8, y + 2 * T + 108, w - 16, 3, P.ink);
        D.text(ctx, '迂龙有轨 YLoong AIR', cx, y + 2 * T + 116, 7, P.ink, 'center', true);
        ['✓ 下一站', '✓ 中华门', '✓ ZHONGHUA'].forEach((s, i) =>
          D.text(ctx, s, x + 12, y + 2 * T + 130 + i * 11, 7, P.ink));
        D.text(ctx, 'ENTRANCE ↑', cx, y + h - 3 * T - 6, 7, '#c2453f', 'center', true);
        break;
      }
      /* ===== 竖直停在轨道上的有轨电车 ===== */
      case 'tramCarV': {
        const tm = t.time || 0;
        // 集电弓
        D.line(ctx, x + w / 2, y - 10, x + w / 2 - 6, y + 2, '#3b3b8f', 2);
        D.line(ctx, x + w / 2 - 6, y + 2, x + w / 2 + 6, y + 2, '#3b3b8f', 2);
        D.rect(ctx, x, y, w, h, '#e2564d');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#f0e6da');
        D.rect(ctx, x + 2, y + 2, w - 4, 7, '#4fb8a8');
        // 竖向一排车窗
        for (let i = 0; i < 6; i++) {
          const wy = y + 14 + i * ((h - 30) / 6);
          D.rect(ctx, x + 6, wy, w - 12, (h - 34) / 7, '#1b2c48');
          D.rect(ctx, x + 8, wy + 2, w - 16, (h - 34) / 7 - 4, 'rgba(160,220,255,.42)');
        }
        // 车门与线路编号
        D.rect(ctx, x + 3, y + h - 30, w - 6, 24, '#3b3b46');
        D.rect(ctx, x + 5, y + h - 28, w / 2 - 6, 20, '#8fb8cf');
        D.rect(ctx, x + w / 2 + 1, y + h - 28, w / 2 - 6, 20, '#8fb8cf');
        D.text(ctx, '1L', x + w / 2, y + 5, 7, '#fff', 'center', true);
        // 车灯
        D.circle(ctx, x + 8, y + 5, Math.floor(tm * 2) % 2 ? 3 : 2, '#ffd25a');
        D.circle(ctx, x + w - 8, y + 5, Math.floor(tm * 2) % 2 ? 3 : 2, '#ffd25a');
        D.text(ctx, '迂龙有轨电车 1号线', x + w / 2, y + h + 4, 6, P.ink, 'center', true);
        break;
      }
      /* ===== 轨道旁边的站台：雨棚、长椅、黄线、站牌 ===== */
      case 'tramPlatform': {
        D.rect(ctx, x, y, w, h, 'rgba(201,198,180,.9)');
        for (let i = 0; i < h; i += 16) D.line(ctx, x, y + i, x + w, y + i, 'rgba(59,59,143,.25)', 1);
        // 黄线
        D.rect(ctx, x + 2, y, 3, h, '#ffd25a');
        for (let i = 0; i < h; i += 12) D.rect(ctx, x + 6, y + i, 3, 5, 'rgba(255,210,90,.55)');
        // 雨棚
        D.rect(ctx, x + 2, y + 4, w - 4, 10, '#3b3b8f');
        D.rect(ctx, x + 2, y + 4, w - 4, 3, '#5b4fb3');
        D.rect(ctx, x + 4, y + 14, 2, h - 16, '#8f92b5');
        D.rect(ctx, x + w - 6, y + 14, 2, h - 16, '#8f92b5');
        // 长椅
        D.rect(ctx, x + 8, y + h * .45, w - 16, 5, '#8a5b3b');
        D.rect(ctx, x + 8, y + h * .45 - 8, w - 16, 3, '#8a5b3b');
        // 站牌
        D.rect(ctx, x + 6, y + 20, w - 12, 30, '#f4f1e4');
        D.frame(ctx, x + 6, y + 20, w - 12, 30, P.ink, 1);
        D.text(ctx, '迂龙有轨', x + w / 2, y + 23, 7, P.ink, 'center', true);
        D.text(ctx, '1号线', x + w / 2, y + 33, 7, '#c2453f', 'center', true);
        D.text(ctx, '下一站 中华门', x + w / 2, y + 42, 6, '#5b4fb3', 'center');
        D.text(ctx, 'ENTRANCE ↑', x + w / 2, y + h - 14, 7, '#c2453f', 'center', true);
        break;
      }
      /* ===== 道口：稿子底部那排 XXXXX 交叉纹 ===== */
      case 'tramCrossing':
        D.rect(ctx, x, y, w, h, 'rgba(244,241,228,.75)');
        for (let cx = x; cx < x + w; cx += 14) {
          D.line(ctx, cx, y, cx + 12, y + h, P.ink, 1.4);
          D.line(ctx, cx + 12, y, cx, y + h, P.ink, 1.4);
        }
        D.rect(ctx, x, y, w, 1, P.ink); D.rect(ctx, x, y + h - 1, w, 1, P.ink);
        D.text(ctx, '幸一村 · 道口', x + 4, y + h + 2, 6, '#7f7bc0');
        break;
      /* ===== 地下小吃街的灯 / 楼梯 / 指示牌 ===== */
      case 'underLamp':
        D.rect(ctx, x, y, 3 * T, 3, '#5b4fb3');
        D.rect(ctx, x + 4, y + 3, 3 * T - 8, 5, '#ffe9a8');
        D.rect(ctx, x + 6, y + 8, 3 * T - 12, 2, 'rgba(255,233,168,.35)');
        break;
      case 'downStairs':
        for (let i = 0; i < 6; i++) D.rect(ctx, x + i * 6, y + i * 8, w - i * 6, 6, i % 2 ? '#6b6f8c' : '#8f92b5');
        D.text(ctx, '↑ 地面', x + 4, y + 6, 7, '#ffd25a', 'left', true);
        break;
      case 'underSign':
        D.rect(ctx, x, y, w, h, '#1b1c3a'); D.frame(ctx, x, y, w, h, '#d99b1f', 1);
        D.text(ctx, '小吃一条街', x + 3, y + 5, 9, '#ffd25a', 'left', true);
        D.text(ctx, 'UNDERGROUND', x + 3, y + 20, 6, '#7fe0c8');
        break;
      /* ===== 渊迂市渊迂中学 ===== */
      case 'yuanyuGate':
        [[x + 2, y], [x + w - 10, y]].forEach(q => D.rect(ctx, q[0], q[1], 8, h, '#c9c6b4'));
        D.rect(ctx, x - 4, y - 8, w + 8, 16, '#2a2a5e');
        D.text(ctx, '渊迂市渊迂中学', x + w / 2, y - 5, 11, '#fff', 'center', true);
        D.text(ctx, 'YUANYU HIGH SCHOOL', x + w / 2, y + 12, 7, '#ffd25a', 'center');
        break;
      case 'yuanyuBuilding':
        D.rect(ctx, x, y, w, h, '#3f6b8f');
        D.rect(ctx, x + 2, y + 2, w - 4, 8, '#2a4f73');
        for (let i = 0; i < 8; i++) {
          D.rect(ctx, x + 8 + i * (w - 16) / 8, y + 16, (w - 24) / 9, 22, '#8fb8cf');
          D.rect(ctx, x + 8 + i * (w - 16) / 8 + 2, y + 18, (w - 24) / 9 - 4, 18, 'rgba(200,230,255,.5)');
        }
        D.rect(ctx, x + w / 2 - 16, y - 18, 32, 18, '#c9c6b4');
        D.circle(ctx, x + w / 2, y - 9, 6, '#f4f1e4');
        D.text(ctx, 'YUANYU', x + w / 2, y + h - 14, 8, '#fff3c4', 'center', true);
        break;
      case 'flagPole':
        D.rect(ctx, x, y, 3, h, '#c9c6b4');
        D.rect(ctx, x + 3, y + 4, 20, 12, '#e2564d');
        break;
      case 'trackOval':
        ctx.strokeStyle = '#b5503c'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#6f9e63'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 12, h / 2 - 12, 0, 0, Math.PI * 2); ctx.stroke();
        break;
      case 'lineTower':
        D.rect(ctx, x, y + 2 * T, w, h - 2 * T, 'rgba(244,241,228,.9)');
        D.frame(ctx, x, y + 2 * T, w, h - 2 * T, '#5b4fb3', 1);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(x, y + 2 * T); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w, y + 2 * T); ctx.stroke();
        D.text(ctx, 'LINE 1', x + w / 2, y + 3 * T, 9, P.ink, 'center', true);
        D.text(ctx, 'AIR L1', x + w / 2, y + 4 * T + 4, 8, '#5b4fb3', 'center');
        ['景迂路', '中华门', '癸年路', '爱民路', '沁公园'].forEach((s, i) =>
          D.text(ctx, s, x + 4, y + 5 * T + i * 10, 6, '#7f7bc0'));
        break;
      case 'tram':
        D.rect(ctx, x, y + 4, w, h - 4, '#e2564d');
        D.rect(ctx, x + 2, y + 6, w - 4, 10, '#f4f1e4');
        for (let i = 0; i < 5; i++) D.rect(ctx, x + 6 + i * (w - 12) / 5, y + 8, (w - 20) / 6, 8, '#8fb8cf');
        D.rect(ctx, x, y + h - 8, w, 5, '#1b1c3a');
        D.circle(ctx, x + 12, y + h - 2, 4, '#2a2a5e'); D.circle(ctx, x + w - 12, y + h - 2, 4, '#2a2a5e');
        D.line(ctx, x + w / 2, y + 4, x + w / 2 - 6, y - 8, '#3b3b8f', 2);
        D.line(ctx, x + w / 2 - 6, y - 8, x + w / 2 + 8, y - 8, '#3b3b8f', 1);
        D.text(ctx, '迂龙有轨电车 1号线', x + w / 2, y + h + 3, 7, P.ink, 'center', true);
        break;
      case 'courtGate':
        D.rect(ctx, x, y + 3 * T, w, 10, '#8f92b5');
        [[x + 4, y], [x + w - 12, y]].forEach(q => D.rect(ctx, q[0], q[1], 8, 3 * T, '#c9c6b4'));
        D.rect(ctx, x - 4, y - 10, w + 8, 12, '#2a2a5e');
        D.text(ctx, '渊迂市高级人民法院', x + w / 2, y - 8, 9, '#fff', 'center', true);
        D.text(ctx, '为人民服务', x + w / 2, y + 3 * T + 12, 9, '#e2564d', 'center', true);
        D.text(ctx, '立案 Register  /  判决查询 Judgement', x + w / 2, y + 3 * T + 24, 6, '#5b4fb3', 'center');
        break;
      case 'policeBox':
        D.rect(ctx, x, y + 8, w, h - 8, '#3f6b8f');
        D.rect(ctx, x + 3, y + 12, w - 6, 12, '#c9e8ff');
        D.rect(ctx, x - 3, y, w + 6, 10, '#2a2a5e');
        D.text(ctx, 'POLICE 保安亭', x + w / 2, y + 1, 7, '#fff', 'center', true);
        break;
      /* ================= 迂龙路精细层：会动的街面 ================= */
      case 'manhole': {
        D.circle(ctx, x + w / 2, y + h / 2, Math.min(w, h) / 2 - 1, '#6b6f8c');
        D.circle(ctx, x + w / 2, y + h / 2, Math.min(w, h) / 2 - 3, '#3b3b52');
        for (let i = 0; i < 4; i++) D.line(ctx, x + 4 + i * 4, y + 3, x + 4 + i * 4, y + h - 3, 'rgba(220,220,240,.22)', 1);
        D.text(ctx, 'W', x + w / 2, y + h / 2 - 3, 5, 'rgba(220,220,240,.5)', 'center');
        break;
      }
      case 'bollard': {
        for (let i = 0; i < w / 12; i++) {
          const bx = x + 6 + i * 12;
          D.rect(ctx, bx, y + 6, 5, 12, '#8f92b5');
          D.rect(ctx, bx, y + 6, 5, 3, '#f4f1e4');
          D.rect(ctx, bx - 1, y + 17, 7, 2, 'rgba(10,10,30,.3)');
        }
        break;
      }
      case 'streetLampY': {
        const tm = t.time || 0, cx = x + w / 2;
        D.rect(ctx, cx - 2, y + 8, 4, h - 8, '#6b6f8c');
        D.rect(ctx, cx - 9, y + 2, 18, 7, '#3b3b52');
        D.rect(ctx, cx - 7, y + 4, 14, 4, t.night ? '#ffe9a8' : '#c9d8e6');
        if (t.night) {
          const g = ctx.createRadialGradient(cx, y + 12, 2, cx, y + 12, 46);
          g.addColorStop(0, 'rgba(255,225,150,.28)'); g.addColorStop(1, 'rgba(255,225,150,0)');
          ctx.fillStyle = g; ctx.fillRect(cx - 46, y, 92, 70);
        }
        D.rect(ctx, cx - 1, y, 2, -8, '#6b6f8c');
        break;
      }
      case 'wire': {
        // 电车架空接触网：几条弧垂线 + 连杆
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = 'rgba(40,44,70,.75)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, y + i * 9 + 4);
          ctx.quadraticCurveTo(x + w / 2, y + i * 9 + 13, x + w, y + i * 9 + 4); ctx.stroke();
        }
        for (let i = 0; i < 4; i++) D.rect(ctx, x + i * w / 4, y - 6, 2, 8, '#6b6f8c');
        break;
      }
      case 'tramSpark': {
        const tm = t.time || 0, on = Math.floor(tm * 9) % 5 === 0, cx = x + w / 2;
        D.rect(ctx, cx - 1, y, 2, h, '#8f92b5');
        if (on) {
          D.circle(ctx, cx + Math.sin(tm * 22) * 2, y + h * .3, 3, '#fff3c4');
          D.circle(ctx, cx + Math.cos(tm * 17) * 3, y + h * .3 + 2, 2, '#7fe0c8');
          for (let i = 0; i < 5; i++) D.line(ctx, cx, y + h * .3, cx + (i - 2) * 3, y + h * .3 + 6 + i, 'rgba(255,240,180,.8)', 1);
        }
        break;
      }
      case 'tramSignal': {
        const tm = t.time || 0, on = Math.floor(tm / 2) % 2;
        D.rect(ctx, x, y, 9, 18, '#2a2a3e');
        D.circle(ctx, x + 4.5, y + 4, 2.5, on ? '#e2564d' : '#5a2b2b');
        D.circle(ctx, x + 4.5, y + 10, 2.5, on ? '#5a4a1f' : '#ffd25a');
        D.circle(ctx, x + 4.5, y + 15, 2.5, on ? '#2a3a2a' : '#4caf7d');
        break;
      }
      case 'stationClock': {
        const tm = t.time || 0, cx = x + w / 2, cy = y + h / 2;
        D.circle(ctx, cx, cy, Math.min(w, h) / 2, '#1b1c3a');
        D.circle(ctx, cx, cy, Math.min(w, h) / 2 - 2, '#f4f1e4');
        for (let i = 0; i < 12; i++) {
          const a = i * Math.PI / 6;
          D.line(ctx, cx + Math.sin(a) * (w / 2 - 5), cy - Math.cos(a) * (w / 2 - 5),
            cx + Math.sin(a) * (w / 2 - 3), cy - Math.cos(a) * (w / 2 - 3), P.ink, 1);
        }
        D.line(ctx, cx, cy, cx + Math.sin(tm * .3) * 5, cy - Math.cos(tm * .3) * 5, P.ink, 1.4);
        D.line(ctx, cx, cy, cx + Math.sin(tm * 2) * 8, cy - Math.cos(tm * 2) * 8, '#c2453f', 1);
        break;
      }
      case 'pigeons': {
        const tm = t.time || 0;
        for (let i = 0; i < 5; i++) {
          const px = x + ((i * 41 + tm * (8 + i * 3)) % Math.max(10, w));
          const py = y + (i * 7) % Math.max(6, h) + Math.sin(tm * 2 + i) * 3;
          const flap = Math.floor(tm * 7 + i) % 2;
          D.circle(ctx, px, py, 2, '#8f92b5');
          D.line(ctx, px - 1, py, px - 5, py - (flap ? 3 : -2), '#c9c6b4', 1.5);
          D.line(ctx, px + 1, py, px + 5, py - (flap ? 3 : -2), '#c9c6b4', 1.5);
          D.circle(ctx, px + 2, py - 1, 1, '#e2564d');
        }
        break;
      }
      case 'leafFall': {
        const tm = t.time || 0;
        for (let i = 0; i < 14; i++) {
          const lx = x + ((i * 53 + Math.sin(tm * .4 + i) * 22) % Math.max(10, w));
          const ly = y + ((i * 29 + tm * (11 + i % 4)) % Math.max(10, h));
          const c = ['#d99b1f', '#c2453f', '#8a6a4a', '#4caf7d'][i % 4];
          D.rect(ctx, lx, ly, 3, 2, c);
          D.line(ctx, lx, ly, lx + 2, ly - 1, 'rgba(90,70,50,.6)', 1);
        }
        break;
      }
      case 'roadWear': {
        const tm = t.time || 0;
        // 裂缝 / 修补块 / 口香糖点 / 轮胎印
        for (let i = 0; i < 10; i++) {
          const cx = x + (i * 37) % Math.max(10, w), cy = y + (i * 23) % Math.max(10, h);
          ctx.strokeStyle = 'rgba(30,32,50,.28)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 5, cy + 2); ctx.lineTo(cx + 8, cy - 1); ctx.stroke();
        }
        for (let i = 0; i < 5; i++) D.rect(ctx, x + (i * 29) % Math.max(10, w), y + (i * 17) % Math.max(10, h), 6, 3, 'rgba(200,196,180,.28)');
        for (let i = 0; i < 4; i++) D.circle(ctx, x + (i * 43) % Math.max(10, w), y + (i * 13) % Math.max(10, h), 1.5, 'rgba(255,210,150,.32)');
        break;
      }
      case 'treeShade': {
        D.circle(ctx, x + w / 2, y + h / 2, Math.min(w, h) / 2, 'rgba(24,48,34,.13)');
        for (let i = 0; i < 6; i++) D.circle(ctx, x + 4 + i * 5, y + 3 + (i % 3) * 4, 3, 'rgba(24,48,34,.10)');
        break;
      }
      case 'awningShadow': {
        for (let i = 0; i < 7; i++) D.rect(ctx, x + i * 7, y + (i % 2) * 2, 4, h, 'rgba(20,20,40,.10)');
        break;
      }
      /* ---- 玩法终端：目标板 / 扭蛋机 / 街机 / 打卡点 / 钓鱼点 ---- */
      case 'questBoard': {
        const tm = t.time || 0;
        D.rect(ctx, x + 3, y + 6, w, h, 'rgba(10,10,30,.25)');
        D.rect(ctx, x, y, w, h, '#6b4a2f');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#2a3a34');
        D.rect(ctx, x + 2, y + 2, w - 4, 8, '#3b3b8f');
        D.text(ctx, '🎯 人生目标板', x + w / 2, y + 3, 6, '#ffe9a8', 'center', true);
        for (let i = 0; i < 3; i++) {
          D.rect(ctx, x + 6, y + 14 + i * 9, w - 12, 2, 'rgba(244,241,228,.45)');
          D.circle(ctx, x + 7, y + 13 + i * 9, 1.5, i === Math.floor(tm / 2) % 3 ? '#ffd25a' : '#7fe0c8');
        }
        D.text(ctx, 'DAILY / 按 A', x + w / 2, y + h - 9, 5, '#7fe0c8', 'center');
        break;
      }
      case 'gachaMachine': {
        const tm = t.time || 0, cx = x + w / 2;
        D.rect(ctx, x + 3, y + 6, w, h, 'rgba(10,10,30,.22)');
        D.rect(ctx, x + 3, y + h - 14, w - 6, 14, '#5b4fb3');
        D.circle(ctx, cx, y + h * .42, w * .34, '#1b1c3a');
        D.circle(ctx, cx, y + h * .42, w * .34 - 2, '#a9cfe6');
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3 + Math.sin(tm + i) * .12;
          D.circle(ctx, cx + Math.cos(a) * w * .2, y + h * .42 + Math.sin(a) * w * .2, 3.5,
            ['#e2564d', '#ffd25a', '#4fb8a8', '#5b4fb3', '#c05b86', '#7fe0c8'][i]);
        }
        D.rect(ctx, cx - 4, y + h - 11, 8, 6, '#1b1c3a');
        D.text(ctx, '扭蛋 ¥20', cx, y + 2, 6, '#fff3c4', 'center', true);
        break;
      }
      case 'arcadeCab': {
        const tm = t.time || 0, on = Math.floor(tm * 3) % 2;
        D.rect(ctx, x + 3, y + 5, w, h, 'rgba(10,10,30,.28)');
        D.rect(ctx, x, y, w, h, '#2a2a5e');
        D.rect(ctx, x + 3, y + 4, w - 6, h * .42, '#1b1c3a');
        D.rect(ctx, x + 5, y + 6, w - 10, h * .42 - 4, on ? '#4fb8a8' : '#5b4fb3');
        D.rect(ctx, x + 5, y + 6, w - 10, 3, '#fff3c4');
        D.rect(ctx, x + 3, y + h * .5, w - 6, 5, '#c9a86a');
        D.circle(ctx, x + w * .35, y + h * .56, 3, '#e2564d');
        D.rect(ctx, x + w * .6, y + h * .54, 3, 5, '#7fe0c8');
        D.text(ctx, '🎮 抢金币', x + w / 2, y + h * .78, 5, '#ffd25a', 'center', true);
        break;
      }
      case 'photoSpot': {
        const tm = t.time || 0, blink = Math.floor(tm * 2) % 2;
        D.rect(ctx, x - 2, y - 2, w + 4, h + 4, blink ? '#ffd25a' : '#8f92b5');
        D.rect(ctx, x, y, w, h, '#1b1c3a');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#2a3a5e');
        D.circle(ctx, x + w / 2, y + h / 2, 4, '#f4f1e4');
        D.circle(ctx, x + w / 2, y + h / 2, 2, blink ? '#ffd25a' : '#5b4fb3');
        D.rect(ctx, x + 3, y + h - 6, w - 6, 3, '#7fe0c8');
        D.text(ctx, '📸 打卡', x + w / 2, y - 10, 5, '#fff3c4', 'center', true);
        break;
      }
      case 'fishSpot': {
        const tm = t.time || 0;
        D.rect(ctx, x, y, w, h, 'rgba(20,50,70,.2)');
        for (let i = 0; i < 5; i++) {
          const fx = x + ((i * 23 + tm * 12) % Math.max(10, w));
          const fy = y + ((i * 11) % Math.max(6, h));
          D.circle(ctx, fx, fy, 2.5, i % 2 ? '#e2564d' : '#ffd25a');
          D.line(ctx, fx + 2, fy, fx + 5, fy - 2, 'rgba(255,255,255,.6)', 1);
        }
        D.text(ctx, '🎣 捞锦鲤 · 按 A', x + w / 2, y - 10, 5, '#eaf6ff', 'center', true);
        break;
      }
      /* ================= 汾阳中学 · 新校门街景 ================= */
      case 'fyWires': {
        // 横过校门上方的几条架空线（照片里那几根）
        for (let k = 0; k < 4; k++) {
          ctx.strokeStyle = 'rgba(35,38,58,.7)'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y + 4 + k * 6);
          ctx.quadraticCurveTo(x + w / 2, y + 12 + k * 6, x + w, y + 4 + k * 6);
          ctx.stroke();
        }
        for (let i = 0; i < 5; i++) D.rect(ctx, x + i * w / 5, y - 4, 2, 10, '#6b6f8c');
        break;
      }
      case 'fyTree': {
        const tm = t.time || 0, cx = x + w / 2;
        D.rect(ctx, cx - 3, y + h * .45, 6, h * .55, '#6b4a2f');
        D.rect(ctx, cx - 5, y + h - 4, 10, 3, 'rgba(20,40,25,.28)');
        const cols = ['#2f6b45', '#3f8253', '#4caf7d', '#356f49'];
        for (let i = 0; i < 5; i++) {
          const sway = Math.sin(tm * 1.2 + i) * 1.4;
          D.circle(ctx, cx + (i % 2 ? 7 : -7) + sway, y + h * .3 + (i % 3) * 5, 8 - (i % 2), cols[i % cols.length]);
        }
        D.circle(ctx, cx + Math.sin(tm * 1.1) * 1.6, y + h * .18, 9, '#3f8253');
        D.circle(ctx, cx - 5, y + h * .28, 7, '#4caf7d');
        break;
      }
      case 'fyLamp': {
        const tm = t.time || 0, cx = x + w / 2;
        D.rect(ctx, cx - 2, y + 6, 4, h - 8, '#8f92b5');
        // 弯杆
        ctx.strokeStyle = '#8f92b5'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, y + 6);
        ctx.quadraticCurveTo(cx, y - 4, cx + 14, y - 4); ctx.stroke();
        D.rect(ctx, cx + 10, y - 6, 12, 5, '#3b3b52');
        D.rect(ctx, cx + 11, y - 4, 10, 3, t.night ? '#ffe9a8' : '#c9d8e6');
        if (t.night) {
          const g = ctx.createRadialGradient(cx + 16, y + 4, 2, cx + 16, y + 4, 44);
          g.addColorStop(0, 'rgba(255,225,150,.3)'); g.addColorStop(1, 'rgba(255,225,150,0)');
          ctx.fillStyle = g; ctx.fillRect(cx - 28, y - 6, 90, 70);
        }
        D.rect(ctx, cx - 5, y + h - 2, 10, 2, '#6b6f8c');
        break;
      }
      case 'fyTraffic': {
        const tm = t.time || 0, on = Math.floor(tm / 3) % 2;
        D.rect(ctx, x + 2, y, 3, h, '#3b3b52');
        D.rect(ctx, x - 2, y - 8, 12, 20, '#1b1c2e');
        D.circle(ctx, x + 4, y - 4, 2.6, on ? '#5a2b2b' : '#e2564d');
        D.circle(ctx, x + 4, y + 2, 2.6, on ? '#5a4a1f' : '#ffd25a');
        D.circle(ctx, x + 4, y + 8, 2.6, on ? '#4caf7d' : '#2a3a2a');
        break;
      }
      case 'fyCross': {
        // 校门前斑马线 + 路面白线
        for (let i = 0; i < 9; i++) D.rect(ctx, x + 3 + i * (w - 6) / 9, y + 2, (w - 10) / 13, h - 4, 'rgba(244,241,228,.78)');
        D.line(ctx, x, y + h + 2, x + w, y + h + 2, 'rgba(244,241,228,.5)', 2);
        break;
      }
      case 'basketball': {
        // 左前侧篮球场：整片场地 + 中圈 + 三分弧 + 两端篮架
        D.rect(ctx, x, y, w, h, '#2f6b63');
        D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#3b7d6f');
        D.frame(ctx, x + 2, y + 2, w - 4, h - 4, '#f4f1e4', 2);
        D.line(ctx, x + w / 2, y + 2, x + w / 2, y + h - 2, '#f4f1e4', 2);
        ctx.strokeStyle = '#f4f1e4'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * .17, 0, Math.PI * 2); ctx.stroke();
        [0, 1].forEach(side => {
          const cx2 = side ? x + w : x;
          ctx.beginPath(); ctx.arc(cx2, y + h / 2, h * .38, -Math.PI / 2, Math.PI / 2, side === 1); ctx.stroke();
          D.frame(ctx, side ? x + w - 18 : x + 2, y + h / 2 - 12, 16, 24, '#f4f1e4', 1.5);
          const bx2 = side ? x + w - 14 : x + 6, by2 = y + h / 2;
          D.rect(ctx, bx2, by2 - 9, 10, 14, '#f4f1e4');
          D.rect(ctx, bx2 + 1, by2 - 8, 8, 12, 'rgba(255,255,255,.32)');
          D.rect(ctx, side ? bx2 - 7 : bx2 + 10, by2 - 2, 7, 3, '#e2564d');
          D.rect(ctx, side ? bx2 - 6 : bx2 + 11, by2 + 1, 5, 2, 'rgba(244,241,228,.8)');
          D.rect(ctx, bx2 + 4, by2 + 5, 2, 10, '#8f92b5');
        });
        D.text(ctx, '篮球场 / BASKETBALL', x + w / 2, y + h - 11, 6, '#f4f1e4', 'center', true);
        break;
      }
      /* ================= 汾阳中学 · 校园 / 楼内 ================= */
      case 'schoolFence': {
        // 黑铁栅栏围住整个校园（操场、四片篮球场、花园都在栅栏里面）
        const iron = '#16161f', brick = '#7d4a43', cap = '#e9e0cc';
        const gateA = 24 * T, gateB = 32 * T;
        const seg = (x1, y1, x2, y2) => {
          D.rect(ctx, x1, y1, x2 - x1, 3, iron);
          D.rect(ctx, x1, y2 - 3, x2 - x1, 3, iron);
          for (let q = x1 + 3; q < x2 - 2; q += 7) {
            D.rect(ctx, q, y1, 2, y2 - y1, iron);
            D.circle(ctx, q + 1, y1 - 1, 1.6, iron);
            D.line(ctx, q, y1 + 4, q + 5, y2 - 4, 'rgba(22,22,31,.45)', 1);
            D.line(ctx, q + 5, y1 + 4, q, y2 - 4, 'rgba(22,22,31,.45)', 1);
          }
        };
        seg(x + 4, y, x + w - 4, y + 14);                       // 北
        seg(x + 4, y + h - 14, x + gateA, y + h);               // 南（左）
        seg(x + gateB, y + h - 14, x + w - 4, y + h);           // 南（右，中间留校门）
        const vseg = (vx) => {
          D.rect(ctx, vx, y, 3, h, iron); D.rect(ctx, vx + 11, y, 3, h, iron);
          for (let q = y + 4; q < y + h - 3; q += 7) {
            D.rect(ctx, vx, q, 14, 2, iron);
            D.circle(ctx, vx + 1, q + 1, 1.4, iron);
            D.circle(ctx, vx + 12, q + 1, 1.4, iron);
          }
        };
        vseg(x); vseg(x + w - 14);
        // 砖柱
        for (let q = 0; q < w; q += 10 * T) {
          D.rect(ctx, x + q, y - 3, 10, 17, brick); D.rect(ctx, x + q - 2, y - 5, 14, 4, cap);
          D.rect(ctx, x + q, y + h - 14, 10, 17, brick); D.rect(ctx, x + q - 2, y + h - 3, 14, 4, cap);
        }
        break;
      }
      case 'schoolGateInner': {
        // 校园内侧看校门：两根石柱 + 绿门 + 深蓝金边真校徽
        const brick = '#7d4a43', cream = '#e9e0cc';
        [x, x + w - 16].forEach(px => {
          D.rect(ctx, px, y - 6, 16, h + 6, brick);
          for (let yy = y; yy < y + h; yy += 6) D.line(ctx, px, yy, px + 16, yy, 'rgba(58,30,26,.4)', 1);
          D.rect(ctx, px - 2, y - 9, 20, 5, cream);
        });
        D.rect(ctx, x + 16, y + 6, w - 32, h - 6, '#1c4a36');
        for (let yy = y + 9; yy < y + h; yy += 5) D.line(ctx, x + 16, yy, x + w - 16, yy, 'rgba(127,224,170,.3)', 1);
        D.rect(ctx, x + w / 2 - 1, y + 6, 2, h - 6, '#0c2419');
        D.rect(ctx, x + w / 2 - 46, y - 12, 92, 18, '#6b3f3a');
        if (PC.Art && PC.Art.drawFenyangBadge) PC.Art.drawFenyangBadge(ctx, x + w / 2, y - 3, 9, t);
        D.text(ctx, '渊迂市汾阳中学 · 校门内侧', x + w / 2, y + h + 2, 6, '#3b2a2a', 'center', true);
        break;
      }
      case 'schoolPorch': {
        // 教学楼门前的一小段浅色门廊：只有台阶、白柱、门牌与安全灯，
        // 楼体本身由 art.schoolFacade 完整绘制，不用任何黑块代替。
        const cream = '#e9e0cc', brick = '#7d4a43';
        D.rect(ctx, x, y + h - 4, w, 4, '#c9c6b4');
        for (let i = 0; i < 3; i++) D.rect(ctx, x + 2, y + h - 3 + i, w - 4, 1, i % 2 ? '#a9a99e' : cream);
        [x + 1, x + w - 5].forEach(cx2 => {
          D.rect(ctx, cx2, y - 4, 4, h, cream);
          D.rect(ctx, cx2 - 1, y - 5, 6, 2, '#f4f1e4');
          D.rect(ctx, cx2 + 1, y + 2, 2, 3, 'rgba(90,80,70,.25)');
        });
        D.rect(ctx, x + 5, y - 8, w - 10, 8, '#3b3b8f');
        D.frame(ctx, x + 5, y - 8, w - 10, 8, '#ffd25a', 1);
        D.text(ctx, '教学行政楼 · 入内', x + w / 2, y - 7, 6, '#fff3c4', 'center', true);
        // 绿色安全出口灯（照片里每层都有）
        D.rect(ctx, x + w / 2 - 7, y + h - 1, 14, 5, '#123c2c');
        D.text(ctx, 'EXIT', x + w / 2, y + h, 5, '#7fe0c8', 'center', true);
        D.rect(ctx, x + w - 8, y - 2, 4, 5, '#c2453f');   // 红消防箱
        D.line(ctx, x, y + h, x + w, y + h, brick, 1);
        break;
      }
      case 'basketQuad': {
        /* 2×2 四宫格：四片场子共用同一份皮肤主题，换肤时四块一起变。
           主题来自 js/basketball.js 的 PC.Basketball.theme()；
           该文件在本文件之后加载，但这里是运行时绘制，此时已就绪。 */
        const B = PC.Basketball;
        const th = (B && B.theme && B.theme()) || {
          floor: '#2f6b63', floor2: '#3b7d6f', skirt: '#24544e', line: '#f4f1e4',
          lineSoft: 'rgba(244,241,228,.55)', rim: '#e2564d', board: 'rgba(169,207,224,.55)',
          accent: '#e2564d', text: '#fff3c4', glow: false, deco: 'grass', pattern: 'grain', label: 'NO.'
        };
        const sk = (B && B.skin && B.skin()) || { name: '塑胶绿地', en: 'CLASSIC' };
        const cw = Math.floor((w - 2) / 2), ch = Math.floor((h - 2) / 2);

        const court = (qx, qy, qww, qhh, no) => {
          D.rect(ctx, qx, qy, qww, qhh, th.skirt);
          D.rect(ctx, qx + 2, qy + 2, qww - 4, qhh - 4, th.floor);
          // 皮肤纹理：全息网格 / 电路 / 青砖 / 塑胶颗粒
          for (let i = 0; i < 26; i++) {
            const gx = qx + 4 + ((i * 13) % Math.max(1, qww - 8));
            const gy = qy + 4 + ((i * 9) % Math.max(1, qhh - 8));
            if (th.pattern === 'grid') {
              D.line(ctx, gx, gy, gx + 5, gy, 'rgba(143,240,255,.22)', 1);
            } else if (th.pattern === 'circuit') {
              D.rect(ctx, gx, gy, 2, 2, i % 2 ? 'rgba(255,124,229,.45)' : 'rgba(127,224,200,.5)');
            } else if (th.pattern === 'brick') {
              D.rect(ctx, gx, gy, 5, 1, 'rgba(244,236,216,.22)');
            } else {
              D.rect(ctx, gx, gy, 2, 1, i % 2 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.10)');
            }
          }
          // 内场稍亮一块
          D.rect(ctx, qx + 5, qy + 5, qww - 10, qhh - 10, th.floor2);
          if (th.glow) {
            ctx.save(); ctx.shadowColor = th.line; ctx.shadowBlur = 6;
            D.frame(ctx, qx + 2, qy + 2, qww - 4, qhh - 4, th.line, 2);
            ctx.restore();
          } else {
            D.frame(ctx, qx + 2, qy + 2, qww - 4, qhh - 4, th.line, 2);
          }
          D.line(ctx, qx + qww / 2, qy + 2, qx + qww / 2, qy + qhh - 2, th.line, 2);
          ctx.strokeStyle = th.line; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(qx + qww / 2, qy + qhh / 2, Math.min(qww, qhh) * .17, 0, Math.PI * 2); ctx.stroke();
          [0, 1].forEach(side => {
            const cx2 = side ? qx + qww : qx;
            ctx.beginPath(); ctx.arc(cx2, qy + qhh / 2, qhh * .38, -Math.PI / 2, Math.PI / 2, side === 1); ctx.stroke();
            const bx2 = side ? qx + qww - 14 : qx + 6, by2 = qy + qhh / 2;
            // 篮板：皮肤玻璃色 + 主题边框
            D.rect(ctx, bx2, by2 - 9, 10, 14, th.line);
            D.rect(ctx, bx2 + 1, by2 - 8, 8, 12, th.board);
            D.rect(ctx, bx2 + 2, by2 - 5, 6, 6, th.rim);
            D.rect(ctx, side ? bx2 - 7 : bx2 + 10, by2 - 2, 7, 3, th.rim);
            D.rect(ctx, bx2 + 4, by2 + 5, 2, 10, th.accent);
          });
          // 皮肤铭牌（每片都写，四块一起变）
          D.text(ctx, th.label + no, qx + qww / 2, qy + 4, 6, th.text, 'center', true);
          if (th.deco === 'lantern') {
            D.rect(ctx, qx + 4, qy + qhh - 8, 3, 4, '#b23b32');
            D.rect(ctx, qx + qww - 7, qy + qhh - 8, 3, 4, '#b23b32');
          } else if (th.deco === 'circuit' || th.deco === 'grid') {
            D.rect(ctx, qx + 4, qy + qhh - 7, 4, 2, th.accent);
            D.rect(ctx, qx + qww - 8, qy + qhh - 7, 4, 2, th.accent);
          }
        };
        court(x + 1, y + 1, cw - 1, ch - 1, 1);
        court(x + cw + 2, y + 1, cw - 1, ch - 1, 2);
        court(x + 1, y + ch + 2, cw - 1, ch - 1, 3);
        court(x + cw + 2, y + ch + 2, cw - 1, ch - 1, 4);
        // 中间十字走道：随皮肤换色
        const walk = th.deco === 'circuit' ? '#2b1757' : th.deco === 'grid' ? '#0e2b4d'
          : th.deco === 'lantern' ? '#8a8574' : '#d6d2be';
        D.rect(ctx, x + cw, y, 2, h, walk);
        D.rect(ctx, x, y + ch, w, 2, walk);
        D.line(ctx, x + cw + 1, y, x + cw + 1, y + h, th.lineSoft, 1);
        D.line(ctx, x, y + ch + 1, x + w, y + ch + 1, th.lineSoft, 1);
        // 整片球场外的皮肤标记（一眼能看出换了哪套）
        D.text(ctx, sk.en, x + w / 2, y + h - 3, 5, th.text, 'center', true);
        break;
      }
      case 'schoolCorridor': {
        // 回字形外廊：连续地砖、白色立柱、绿色安全出口灯、红色消防箱、长椅花盆
        const cream = '#e9e0cc', ink = '#3b3b8f';
        D.rect(ctx, x, y, w, h, 'rgba(214,210,190,.55)');
        if (p.dir === 'h') {
          for (let q = x + 4; q < x + w - 4; q += 16) D.line(ctx, q, y + 1, q, y + h - 1, 'rgba(120,116,150,.22)', 1);
          for (let q = x + 8; q < x + w - 8; q += 48) {
            D.rect(ctx, q, y + 2, 3, h - 4, cream);                 // 白立柱
            D.rect(ctx, q - 1, y, 5, 2, '#f4f1e4');
            D.rect(ctx, q + 6, y + 3, 8, 5, '#123c2c');             // 绿安全灯
            D.text(ctx, 'EXIT', q + 10, y + 3, 5, '#7fe0c8', 'center');
            D.rect(ctx, q + 20, y + 2, 5, 7, '#c2453f');            // 红消防箱
            D.rect(ctx, q + 21, y + 3, 3, 2, '#f4f1e4');
          }
        } else {
          for (let q = y + 4; q < y + h - 4; q += 16) D.line(ctx, x + 1, q, x + w - 1, q, 'rgba(120,116,150,.22)', 1);
          for (let q = y + 10; q < y + h - 10; q += 46) {
            D.rect(ctx, x + 2, q, w - 4, 3, cream);
            D.rect(ctx, x + 1, q - 1, w - 2, 5, 'rgba(244,241,228,.5)');
            D.rect(ctx, x + 3, q + 8, 5, 8, '#123c2c');
            D.text(ctx, 'EXIT', x + 5, q + 9, 5, '#7fe0c8', 'center');
            D.rect(ctx, x + w - 8, q + 8, 5, 7, '#c2453f');
          }
        }
        break;
      }
      case 'schoolOpenSide': {
        // 右侧（大门方向）其他楼层都没有房间：开放式矮栏 + 白柱 + 花台
        const cream = '#e9e0cc', brick = '#9c5b52';
        const y0 = y, y1 = y + h, skip = p.skip;
        const blocked = q => skip && q >= skip[0] * T - 6 && q < skip[1] * T + 6;
        D.rect(ctx, x, y0, w, h, 'rgba(214,210,190,.5)');
        for (let q = x + 4; q < x + w - 2; q += 16) D.line(ctx, q, y0 + 2, q, y1 - 2, 'rgba(120,116,150,.16)', 1);
        // 上下两道砖栏 + 米色压顶
        [y0 + 6, y1 - 10].forEach(qy => {
          D.rect(ctx, x + 2, qy, w - 4, 5, brick);
          D.rect(ctx, x + 2, qy, w - 4, 2, cream);
        });
        // 竖向白柱（通道带那段留空）
        for (let q = x + 6; q < x + w - 4; q += 26) {
          if (blocked(q)) continue;
          D.rect(ctx, q, y0 + 4, 3, h - 8, cream);
          D.rect(ctx, q - 2, y0 + 2, 7, 3, '#f4f1e4');
          D.rect(ctx, q + 6, y0 + h / 2 - 6, 10, 5, '#6b4a2f');
          D.circle(ctx, q + 9, y0 + h / 2 - 7, 3, '#4caf7d');
          D.circle(ctx, q + 13, y0 + h / 2 - 7, 3, '#e2564d');
        }
        D.rect(ctx, x + 4, y0 + h / 2 + 7, w - 8, 3, 'rgba(233,224,204,.5)');
        D.text(ctx, '敞开 · 无房间', x + w / 2, y0 + 14, 6, '#3b3b8f', 'center', true);
        break;
      }
      case 'schoolClock': {
        // 校门口作息钟：静态作息 + 当前游戏时间 + 当前人潮状态
        const c = t.clock || {};
        const ph = c.phase === 'morning' ? '上学潮 · 学生涌入'
          : c.phase === 'evening' ? '放学 · 学生回家' : '上课中 · 校园安静';
        D.rect(ctx, x + 2, y + 3, w, h, 'rgba(10,10,30,.18)');
        D.rect(ctx, x, y, w, h, '#3b2a2a');
        D.frame(ctx, x, y, w, h, '#ffd25a', 1);
        D.rect(ctx, x + 3, y + 3, w - 6, 9, '#1e3f8f');
        D.text(ctx, '作息钟 / SCHOOL CLOCK', x + w / 2, y + 4, 6, '#fff3c4', 'center', true);
        D.text(ctx, '07:40 上学   18:00 放学', x + w / 2, y + 15, 6, '#e9d9b8', 'center');
        D.text(ctx, (c.str || '08:00') + '  ' + ph, x + w / 2, y + 25, 6,
          c.phase === 'morning' ? '#7fe0c8' : c.phase === 'evening' ? '#ffd25a' : '#c9c6b4', 'center', true);
        break;
      }
      case 'schoolAtrium': {
        const m = p.mode, tm = t.time || 0;
        const brick = '#9c5b52', cream = '#f0ece0', wall = '#d8cbb0', win = '#2b3348';
        const ink = '#3b3b8f';
        const cx = x + w / 2, cy = y + h / 2;
        /* 中庭四边：一圈回字形外廊栏板（红砖 + 白立柱 + 米色压顶） */
        const rail = (qx, qy, qw, qh, horiz) => {
          D.rect(ctx, qx, qy, qw, qh, brick);
          for (let q = qx + 2; q < qx + qw - 2; q += 6) D.rect(ctx, q, qy + 1, 1, qh - 2, 'rgba(58,30,26,.35)');
          D.rect(ctx, qx, qy, qw, 2, cream);
          if (horiz) for (let q = qx + 6; q < qx + qw; q += 28) D.rect(ctx, q, qy - 3, 4, qh + 6, cream);
          else for (let q = qy + 6; q < qy + qh; q += 28) D.rect(ctx, qx - 3, q, qw + 6, 4, cream);
        };
        const bandH = 9;
        rail(x, y, w, bandH, true);
        rail(x, y + h - bandH, w, bandH, true);
        rail(x, y, bandH, h, false);
        rail(x + w - bandH, y, bandH, h, false);

        if (m === 'garden') {
          /* 1F 中心花园：俯拍照片里的绿地、灌木、针叶树、浅色小径、水池 */
          D.rect(ctx, x + bandH, y + bandH, w - bandH * 2, h - bandH * 2, '#5f8a55');
          for (let i = 0; i < 70; i++) {
            const gx = x + bandH + 4 + U.noise2(i, 3, 11) * (w - bandH * 2 - 8);
            const gy = y + bandH + 4 + U.noise2(i, 7, 13) * (h - bandH * 2 - 8);
            D.rect(ctx, gx, gy, 2, 2, i % 3 ? '#4caf7d' : '#3f8253');
          }
          // 工字 / 十字浅色小径
          D.rect(ctx, x + bandH + 6, cy - 6, w - bandH * 2 - 12, 12, '#d8cba8');
          D.rect(ctx, cx - 6, y + bandH + 6, 12, h - bandH * 2 - 12, '#d8cba8');
          D.line(ctx, x + bandH + 6, cy, x + w - bandH - 6, cy, 'rgba(160,148,118,.5)', 1);
          // 灌木丛：两侧成团
          for (let i = 0; i < 18; i++) {
            const side = i % 2 ? 1 : -1;
            const bx2 = cx + side * (w * .18 + U.noise2(i, 5, 9) * w * .16);
            const by2 = y + bandH + 18 + Math.floor(i / 2) * 13;
            D.circle(ctx, bx2, by2, 10 + (i % 3) * 3, i % 3 ? '#3f6b4a' : '#4e7c52');
            D.circle(ctx, bx2 + 3, by2 - 2, 6, '#5f8a55');
          }
          // 针叶树（照片里那种细高塔形）
          [0, 1, 2, 3].forEach(i => {
            const tx2 = x + bandH + 30 + i * (w - bandH * 2 - 60) / 3;
            const ty2 = y + h - bandH - 34 - (i % 2) * 10;
            D.rect(ctx, tx2 - 1, ty2 + 16, 3, 14, '#6b4a2f');
            for (let k = 0; k < 4; k++) {
              const ww = 12 - k * 2;
              D.rect(ctx, tx2 - ww / 2, ty2 + k * 5, ww, 6, k % 2 ? '#2f5f45' : '#3f6b4a');
            }
          });
          // 中央水池 + 睡莲 + 涟漪
          const pw = Math.min(96, w * .22);
          D.rect(ctx, cx - pw / 2, cy - 20, pw, 40, '#4b8fb5');
          D.frame(ctx, cx - pw / 2, cy - 20, pw, 40, '#e9e0cc', 2);
          for (let i = 0; i < 4; i++) {
            const yy = cy - 16 + i * 9;
            D.line(ctx, cx - pw / 2 + 4 + Math.sin(tm * 1.4 + i) * 3, yy, cx + pw / 2 - 8, yy, 'rgba(255,255,255,.35)', 1);
          }
          [0, 1, 2].forEach(i => { D.circle(ctx, cx - 26 + i * 26, cy - 8 + (i % 2) * 14, 5, '#4caf7d'); D.circle(ctx, cx - 26 + i * 26, cy - 9 + (i % 2) * 14, 2, '#e2564d'); });
          D.text(ctx, '中心花园 / 开放式柱廊', cx, cy + 30, 7, '#f4f1e4', 'center', true);
        } else if (m === 'void') {
          /* 2~5F：从本层往下看，一层层回字形走道（照片正是对面几层楼） */
          D.rect(ctx, x + bandH, y + bandH, w - bandH * 2, h - bandH * 2, '#7d8290');
          const levels = 4;
          for (let L = 0; L < levels; L++) {
            const inset = bandH + 6 + L * 15;
            const ix = x + inset, iy = y + inset, iw = w - inset * 2, ih = h - inset * 2;
            if (iw < 20 || ih < 20) break;
            const fade = 1 - L * .16;
            // 米色墙面
            D.rect(ctx, ix, iy, iw, ih, L % 2 ? '#c3bca8' : '#d2cbb4');
            // 红砖栏板（上下两条）
            D.rect(ctx, ix, iy + 2, iw, 7, brick);
            D.rect(ctx, ix, iy + ih - 9, iw, 7, brick);
            for (let q = ix + 3; q < ix + iw - 3; q += 7) D.rect(ctx, q, iy + 3, 1, 5, 'rgba(58,30,26,.3)');
            D.rect(ctx, ix, iy, iw, 2, cream);
            // 白色立柱
            for (let q = ix + 8; q < ix + iw - 4; q += 30) {
              D.rect(ctx, q, iy - 2, 5, ih + 4, cream);
              D.rect(ctx, q - 1, iy - 3, 7, 2, '#ffffff');
            }
            // 深色窗 / 门，一排紧挨着
            for (let q = ix + 14; q < ix + iw - 16; q += 24) {
              const ww = Math.min(16, ix + iw - 16 - q);
              D.rect(ctx, q, iy + 12, ww, 12, '#3b2a2a');
              D.rect(ctx, q + 1, iy + 13, ww - 2, 10, t.night ? '#8a7a3c' : win);
              D.line(ctx, q + ww / 2, iy + 13, q + ww / 2, iy + 23, '#8f92b5', 1);
              D.rect(ctx, q, iy + 24, ww, 2, cream);
              D.rect(ctx, q, iy + ih - 24, ww, 12, '#3b2a2a');
              D.rect(ctx, q + 1, iy + ih - 23, ww - 2, 10, t.night ? '#8a7a3c' : win);
            }
            // 绿色安全出口灯 + 红色消防箱
            for (let q = ix + 20; q < ix + iw - 20; q += 60) {
              D.rect(ctx, q, iy + 27, 8, 5, '#123c2c');
              D.text(ctx, 'EXIT', q + 4, iy + 27, 5, '#7fe0c8', 'center');
              D.rect(ctx, q + 24, iy + 26, 6, 7, '#c2453f');
              D.rect(ctx, q + 25, iy + 27, 4, 2, '#f4f1e4');
            }
          }
          // 井底阴影
          D.rect(ctx, cx - 42, cy - 34, 84, 30, 'rgba(30,36,54,.55)');
          D.text(ctx, '天井 / ' + (p.code || '0010'), cx, cy - 30, 8, '#fff3c4', 'center', true);
          D.text(ctx, '一层层回字外廊 · 俯视', cx, cy - 19, 6, '#e9d9b8', 'center');
          /* 只有 2F：一条花园通道横着穿过天井，把左右两边连起来 */
          if (p.pass) {
            const py = cy - 10, ph = 20;
            D.rect(ctx, x + 2, py, w - 4, ph, '#d8cba8');
            D.line(ctx, x + 2, py, x + w - 2, py, '#e9e0cc', 2);
            D.line(ctx, x + 2, py + ph, x + w - 2, py + ph, '#e9e0cc', 2);
            for (let q = x + 8; q < x + w - 8; q += 14) {
              D.line(ctx, q, py + 2, q, py + ph - 2, 'rgba(160,148,118,.35)', 1);
              D.rect(ctx, q + 3, py - 3, 8, 4, '#6b4a2f');
              D.circle(ctx, q + 5, py - 4, 3, '#4caf7d');
              D.circle(ctx, q + 9, py - 4, 3, '#e2564d');
            }
            // 两端接着左右过道
            D.rect(ctx, x - 6, py, 10, ph, '#d8cba8');
            D.rect(ctx, x + w - 4, py, 10, ph, '#d8cba8');
            D.text(ctx, '花园通道 · 连通两边（仅 2F）', cx, py + 5, 7, '#3b3b8f', 'center', true);
          }
        } else {
          /* 6F 天台：上面一侧 = 屋顶花园，下面一侧 = 一个排球场 */
          const ix = x + bandH + 4, iy = y + bandH + 4, iw = w - bandH * 2 - 8, ih = h - bandH * 2 - 8;
          const half = Math.floor(ih / 2);
          /* --- 上半：屋顶花园 --- */
          D.rect(ctx, ix, iy, iw, half - 2, '#5f8a55');
          for (let k = 0; k < 46; k++) {
            const gx = ix + 4 + U.noise2(k, 3, 11) * (iw - 8);
            const gy = iy + 4 + U.noise2(k, 7, 13) * (half - 12);
            D.rect(ctx, gx, gy, 2, 2, k % 3 ? '#4caf7d' : '#3f8253');
          }
          // 花坛与浅色小径
          D.rect(ctx, ix + 8, iy + half / 2 - 5, iw - 16, 10, '#d8cba8');
          D.rect(ctx, cx - 5, iy + 6, 10, half - 14, '#d8cba8');
          for (let k = 0; k < 10; k++) {
            const bx2 = ix + 14 + k * (iw - 28) / 9;
            const by2 = iy + (k % 2 ? 14 : half - 22);
            D.circle(ctx, bx2, by2, 8, k % 3 ? '#3f6b4a' : '#4e7c52');
            D.circle(ctx, bx2 + 2, by2 - 2, 4, ['#e2564d', '#ffd25a', '#c05b86', '#f4f1e4'][k % 4]);
          }
          // 三棵塔形针叶树
          [0, 1, 2].forEach(k => {
            const tx2 = ix + iw * (.22 + k * .28), ty2 = iy + 10;
            D.rect(ctx, tx2 - 1, ty2 + 12, 3, 10, '#6b4a2f');
            for (let j = 0; j < 4; j++) { const ww = 10 - j * 2; D.rect(ctx, tx2 - ww / 2, ty2 + j * 4, ww, 5, j % 2 ? '#2f5f45' : '#3f6b4a'); }
          });
          D.rect(ctx, cx - 76, iy + half - 18, 152, 13, 'rgba(30,36,54,.55)');
          D.text(ctx, '上面一侧 · 屋顶花园', cx, iy + half - 16, 7, '#f4f1e4', 'center', true);
          /* 分界矮栏 */
          D.rect(ctx, ix, iy + half - 3, iw, 5, '#e9e0cc');
          for (let q = ix + 6; q < ix + iw - 4; q += 18) D.rect(ctx, q, iy + half - 6, 3, 8, '#f4f1e4');
          /* --- 下半：一个排球场 --- */
          const cy0 = iy + half + 4;
          D.rect(ctx, ix, cy0, iw, ih - half - 6, '#c96a4f');
          D.rect(ctx, ix + 8, cy0 + 8, iw - 16, ih - half - 22, '#d2775c');
          D.frame(ctx, ix + 14, cy0 + 12, iw - 28, ih - half - 30, '#f4f1e4', 2);
          // 球网：横在场地中间，把一侧球场分成两半
          const netY = cy0 + (ih - half - 6) / 2;
          D.line(ctx, ix + 14, netY, ix + iw - 14, netY, '#f4f1e4', 2);
          for (let q = ix + 16; q < ix + iw - 16; q += 6) D.line(ctx, q, netY - 5, q, netY + 5, 'rgba(244,241,228,.6)', 1);
          D.rect(ctx, ix + 12, netY - 8, 3, 16, '#8f92b5');
          D.rect(ctx, ix + iw - 15, netY - 8, 3, 16, '#8f92b5');
          // 进攻线（网上下各一条）+ 发球区短线 + 中线标记
          D.line(ctx, ix + 14, netY - 28, ix + iw - 14, netY - 28, 'rgba(244,241,228,.5)', 1);
          D.line(ctx, ix + 14, netY + 28, ix + iw - 14, netY + 28, 'rgba(244,241,228,.5)', 1);
          for (let k = 0; k < 4; k++) {
            const sx = ix + 24 + k * (iw - 48) / 3;
            D.rect(ctx, sx, cy0 + 12, 2, 9, 'rgba(244,241,228,.6)');
            D.rect(ctx, sx, cy0 + ih - half - 21, 2, 9, 'rgba(244,241,228,.6)');
          }
          // 几只排球 + 场边记分牌 / 长椅
          [0, 1, 2].forEach(k => {
            const vx = ix + 34 + k * 76, vy = netY + (k % 2 ? 42 : -44);
            D.circle(ctx, vx, vy, 5, '#f4f1e4');
            D.line(ctx, vx - 4, vy - 2, vx + 4, vy + 2, '#c2453f', 1);
            D.line(ctx, vx - 4, vy + 2, vx + 4, vy - 2, '#4fb8a8', 1);
          });
          D.rect(ctx, ix + iw - 44, cy0 + 12, 32, 14, '#3b2a2a');
          D.text(ctx, '0 : 0', ix + iw - 28, cy0 + 15, 6, '#ffd25a', 'center', true);
          D.rect(ctx, ix + 16, cy0 + ih - half - 20, 44, 6, '#8a6540');
          D.rect(ctx, ix + 16, cy0 + ih - half - 24, 44, 5, '#c9a97e');
          D.rect(ctx, cx - 84, cy0 + 4, 168, 12, 'rgba(30,36,54,.55)');
          D.text(ctx, '下面一侧 · 排球场（一片）', cx, cy0 + 6, 7, '#fff3c4', 'center', true);
        }
        /* 四边细节：开放式柱廊（1~5F）或高隔离网（6F） */
        if (m === 'roof') {
          const net = 12;
          ctx.strokeStyle = 'rgba(233,224,204,.75)'; ctx.lineWidth = 1;
          for (let q = x; q < x + w; q += 6) {
            ctx.beginPath(); ctx.moveTo(q, y); ctx.lineTo(q, y + net); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(q, y + h - net); ctx.lineTo(q, y + h); ctx.stroke();
          }
          for (let q = y; q < y + h; q += 6) {
            ctx.beginPath(); ctx.moveTo(x, q); ctx.lineTo(x + net, q); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + w - net, q); ctx.lineTo(x + w, q); ctx.stroke();
          }
          for (let q = x; q <= x + w; q += 26) {
            D.rect(ctx, q, y - 8, 3, net + 8, '#8f92b5'); D.circle(ctx, q + 1, y - 9, 2, '#ffd25a');
            D.rect(ctx, q, y + h - net, 3, net + 8, '#8f92b5');
          }
          D.frame(ctx, x, y, w, h, '#e9e0cc', 2);
          D.text(ctx, '高隔离网 · 球飞不出去', cx, y + h - 16, 6, '#fff3c4', 'center', true);
        } else {
          for (let q = x + 6; q < x + w - 6; q += 28) {
            D.rect(ctx, q, y - 4, 5, 9, cream); D.rect(ctx, q, y + h - 5, 5, 9, cream);
            D.rect(ctx, q - 2, y - 6, 9, 3, '#c9c6b4');
            D.rect(ctx, q - 2, y + h + 2, 9, 3, '#c9c6b4');
          }
          for (let q = y + 6; q < y + h - 6; q += 26) {
            D.rect(ctx, x - 4, q, 9, 5, cream); D.rect(ctx, x + w - 5, q, 9, 5, cream);
          }
          // 靠花园一侧不封墙：几处白色矮柱与花台，留出入口
          D.rect(ctx, cx - 20, y + h - 7, 40, 4, '#d8cba8');
          D.circle(ctx, cx - 14, y + h - 9, 4, '#4caf7d');
          D.circle(ctx, cx + 14, y + h - 9, 4, '#3f8253');
        }
        break;
      }
      case 'schoolRoom': {
        // 房间外观：米色墙 + 红砖腰线 + 一排深色窗 + 木门 + 门牌 +
        // 绿色安全灯 / 红色消防箱。房间彼此紧挨，靠墙缝线区分。
        const r = p.room;
        const rx = r.x * T, ry = r.y * T, rw = r.w * T, rh = r.h * T;
        const cream = '#e9e0cc', wall = '#d2cbb4', brick = '#9c5b52', ink = '#2b3348';
        const small = rh < 40;
        D.rect(ctx, rx, ry, rw, rh, wall);
        D.frame(ctx, rx, ry, rw, rh, '#8f92b5', 1);           // 相邻房间的墙缝
        D.rect(ctx, rx, ry, rw, 2, cream);
        D.rect(ctx, rx, ry + rh - 4, rw, 4, '#6b6f8c');       // 踢脚
        // 红砖腰线
        D.rect(ctx, rx, ry + (small ? 5 : 9), rw, small ? 4 : 6, brick);
        for (let q = rx + 3; q < rx + rw - 3; q += 7) D.rect(ctx, q, ry + (small ? 6 : 10), 1, small ? 2 : 4, 'rgba(58,30,26,.3)');
        // 一排深色窗（带窗框、玻璃、反光、窗台）
        if (!small) {
          for (let q = rx + 6; q < rx + rw - 12; q += 18) {
            const ww = Math.min(12, rx + rw - 8 - q);
            D.rect(ctx, q, ry + 18, ww, 11, '#3b2a2a');
            D.rect(ctx, q + 1, ry + 19, ww - 2, 9, t.night ? '#8a7a3c' : ink);
            D.line(ctx, q + ww / 2, ry + 19, q + ww / 2, ry + 28, '#8f92b5', 1);
            D.line(ctx, q + 1, ry + 21, q + ww - 1, ry + 21, 'rgba(180,210,230,.35)', 1);
            D.rect(ctx, q - 1, ry + 29, ww + 2, 2, cream);
          }
        }
        // 木门（朝向过道 / 中庭那一侧）
        const doorC = r.door === 's' ? { x: rx + rw / 2 - 8, y: ry + rh - 13, w: 16, h: 13 }
          : r.door === 'n' ? { x: rx + rw / 2 - 8, y: ry, w: 16, h: 13 }
          : r.door === 'e' ? { x: rx + rw - 13, y: ry + rh / 2 - 8, w: 13, h: 16 }
          : { x: rx, y: ry + rh / 2 - 8, w: 13, h: 16 };
        D.rect(ctx, doorC.x - 1, doorC.y - 1, doorC.w + 2, doorC.h + 2, cream);
        D.rect(ctx, doorC.x, doorC.y, doorC.w, doorC.h, '#4a332c');
        D.rect(ctx, doorC.x + 2, doorC.y + 2, doorC.w - 4, doorC.h - 4, '#6b4a33');
        D.rect(ctx, doorC.x + 3, doorC.y + 3, doorC.w - 6, 4, t.night ? '#8a7a3c' : '#8fb8cf');
        D.circle(ctx, doorC.x + doorC.w - 4, doorC.y + doorC.h / 2, 1.4, '#ffd25a');
        // 门牌：蓝底金字
        const plateW = Math.min(rw - 6, Math.max(30, r.name.length * (small ? 6 : 8) + 8));
        const plateH = small ? 10 : 14;
        const plateX = rx + rw / 2 - plateW / 2;
        const plateY = r.door === 'n' ? ry + doorC.h + 2 : (r.door === 's' ? ry + rh - 13 - plateH - 2 : ry + rh / 2 - plateH / 2);
        D.rect(ctx, plateX, plateY, plateW, plateH, '#1e3f8f');
        D.frame(ctx, plateX, plateY, plateW, plateH, '#ffd25a', 1);
        D.text(ctx, r.name, rx + rw / 2, plateY + 2, small ? 5 : 7, '#fff3c4', 'center', true);
        // 绿色安全出口灯 + 红色消防箱（间隔出现，照片里的标志物）
        if (r.idx % 3 === 0 && !small) {
          D.rect(ctx, rx + 4, ry + rh - 16, 12, 6, '#123c2c');
          D.text(ctx, 'EXIT', rx + 10, ry + rh - 15, 5, '#7fe0c8', 'center');
        }
        if (r.idx % 4 === 1 && !small) {
          D.rect(ctx, rx + rw - 10, ry + 34, 6, 8, '#c2453f');
          D.rect(ctx, rx + rw - 9, ry + 35, 4, 2, '#f4f1e4');
        }
        // 白色立柱把相邻房间分开（照片里每层都有）
        D.rect(ctx, rx + rw - 3, ry, 3, rh, cream);
        break;
      }
      case 'schoolFlower': {
        // 校园里成片的花草
        const tm = t.time || 0;
        D.rect(ctx, x - 2, y + h - 6, w + 4, 7, '#6b4a2f');
        D.rect(ctx, x, y + h - 8, w, 3, '#a9764a');
        for (let i = 0; i < Math.max(6, w / 6); i++) {
          const fx = x + 3 + i * 6, fy = y + h - 10 - (i % 3) * 3;
          D.rect(ctx, fx, fy, 2, 8, '#4caf7d');
          const cols = ['#e2564d', '#ffd25a', '#c05b86', '#f4f1e4', '#7fe0c8'];
          D.circle(ctx, fx + 1 + Math.sin(tm + i) * .5, fy - 1, 2.2, cols[i % cols.length]);
        }
        break;
      }
      case 'roomKit': {
        /* ================================================================
           房间内部重做：共用建筑细节 + 8 类专属家具，不再是白盒子
           画布 352×224；上墙一排窗、吊灯、挂钟、公告栏、地砖、绿植、
           门垫、垃圾桶是每间房都有的；家具按平面图房间用途逐类细化。
           ================================================================ */
        const rt = p.rt, nm = p.name || '';
        const W = w, H = h;
        const R = (a1, b1, c1, d1, col) => D.rect(ctx, x + a1, y + b1, c1, d1, col);
        const L = (a1, b1, c1, d1, col, k) => D.line(ctx, x + a1, y + b1, x + c1, y + d1, col, k || 1);
        const C = (a1, b1, r, col) => D.circle(ctx, x + a1, y + b1, r, col);
        const TX = (txt, a1, b1, sz, col, al) => D.text(ctx, txt, x + a1, y + b1, sz, col, al || 'left', true);
        const wood = '#8a6540', pale = '#c9a97e', cream = '#f0ece0', ink = '#3b3b8f';
        const metal = '#a9b8c4', dark = '#2b3348', glass = '#8fb8cf';
        const night = !!t.night, tm = t.time || 0;

        /* ---- 共用：地砖 ---- */
        R(0, 0, W, H, p.floor || '#ded6b8');
        for (let q = 16; q < W; q += 16) L(q, 0, q, H, 'rgba(120,116,150,.13)', 1);
        for (let q = 16; q < H; q += 16) L(0, q, W, q, 'rgba(120,116,150,.13)', 1);
        for (let i = 0; i < 12; i++) {
          const nx = 10 + U.noise2(i, 2, 7) * (W - 24), ny = 30 + U.noise2(i, 5, 9) * (H - 44);
          R(nx, ny, 3, 2, 'rgba(255,255,255,.22)');
        }
        /* ---- 共用：上墙墙裙 + 一排窗 ---- */
        R(0, 0, W, 30, '#c9c2ac'); R(0, 28, W, 3, '#e9e0cc');
        R(0, H - 8, W, 8, '#b9b2a0'); R(0, H - 9, W, 2, '#8f92b5');
        const winAt = [52, 146, 240];
        winAt.forEach(wx => {
          R(wx - 3, 3, 62, 24, '#e9e0cc');
          R(wx, 5, 56, 19, night ? '#3b4a6b' : '#8fb8cf');
          R(wx + 1, 6, 54, 17, night ? '#4a5b7d' : '#a9cfe0');
          L(wx + 28, 5, wx + 28, 24, '#e9e0cc', 2);
          L(wx, 14, wx + 56, 14, '#e9e0cc', 1);
          if (!night) { L(wx + 4, 8, wx + 16, 8, 'rgba(255,255,255,.6)', 1); L(wx + 32, 18, wx + 48, 18, 'rgba(255,255,255,.45)', 1); }
          // 半拉窗帘
          R(wx - 2, 2, 18, 21, 'rgba(233,224,204,.85)');
          R(wx + 40, 2, 18, 21, 'rgba(233,224,204,.85)');
          L(wx + 16, 2, wx + 16, 23, '#c9c6b4', 1);
          R(wx - 4, 24, 64, 3, '#d8cbb0');
        });
        /* ---- 共用：吊灯 / 挂钟 / 门垫 / 绿植 / 垃圾桶 ---- */
        [96, 256].forEach(lx => {
          R(lx - 1, 0, 2, 9, '#8f92b5');
          C(lx, 12, 5, night ? '#ffd25a' : '#f4f1e4');
          if (night) { C(lx, 12, 11, 'rgba(255,210,90,.16)'); C(lx, 12, 17, 'rgba(255,210,90,.08)'); }
        });
        C(320, 44, 9, '#e9e0cc'); C(320, 44, 7, '#f4f1e4');
        L(320, 44, 320, 39, '#3b2a2a', 1); L(320, 44, 324, 46, '#3b2a2a', 1);
        R(33, 108, 12, 26, '#8a6540'); R(307, 108, 12, 26, '#8a6540');
        const plant = (px, py, sc) => {
          R(px - 6 * sc, py + 8 * sc, 12 * sc, 10 * sc, '#6b4a2f');
          R(px - 5 * sc, py + 9 * sc, 10 * sc, 2 * sc, '#a9764a');
          C(px, py + 2 * sc, 9 * sc, '#3f8253'); C(px - 4 * sc, py + 4 * sc, 6 * sc, '#4caf7d');
          C(px + 4 * sc, py + 3 * sc, 6 * sc, '#4e7c52');
          C(px - 2 * sc, py, 2 * sc, '#e2564d');
        };
        plant(22, 182, 1); plant(330, 182, 1);
        R(302, 190, 12, 16, '#5b5c76'); R(304, 192, 8, 3, '#8f92b5');

        /* ---- 各类专属家具 ---- */
        if (rt === 'classroom') {
          // 前墙黑板 + 粉笔字 + 粉笔槽
          R(92, 34, 168, 40, '#6b4a2f'); R(95, 37, 162, 34, '#2c4a3c');
          TX('PASS ALL EXAM', 176, 42, 8, '#f4f1e4');
          L(104, 56, 246, 56, 'rgba(244,241,228,.55)', 1);
          L(108, 62, 210, 62, 'rgba(244,241,228,.35)', 1);
          TX('x + y = ?', 108, 50, 6, '#e9d9b8');
          R(92, 74, 168, 3, '#a9764a');
          for (let i = 0; i < 5; i++) R(100 + i * 9, 72, 5, 2, i % 2 ? '#f4f1e4' : '#ffd25a');
          // 讲台
          R(148, 80, 56, 16, wood); R(150, 82, 52, 3, pale);
          R(160, 76, 18, 6, '#f4f1e4'); R(182, 77, 8, 5, '#c05b86');
          C(196, 78, 2, '#e9e0cc');
          // 课桌 4 列 × 3 排
          for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
            const dx = 34 + col * 72, dy = 106 + row * 34;
            R(dx, dy, 56, 13, wood); R(dx + 2, dy + 2, 52, 9, pale);
            R(dx + 3, dy + 13, 4, 10, '#6b4a2f'); R(dx + 49, dy + 13, 4, 10, '#6b4a2f');
            // 书本 / 笔袋 / 作业本
            R(dx + 8, dy + 3, 14, 6, col % 2 ? '#4fb8a8' : '#c05b86');
            R(dx + 9, dy + 4, 12, 1, '#f4f1e4');
            R(dx + 30, dy + 4, 12, 5, '#f4f1e4');
            R(dx + 44, dy + 5, 8, 3, '#ffd25a');
            // 椅子
            R(dx + 18, dy + 24, 20, 5, '#6b4a2f'); R(dx + 18, dy + 17, 20, 7, '#a9764a');
            R(dx + 19, dy + 29, 3, 5, '#5b4a2f'); R(dx + 34, dy + 29, 3, 5, '#5b4a2f');
          }
          // 后墙板报 + 流动红旗 + 班规
          R(20, 36, 62, 38, '#3b3b8f'); R(22, 38, 58, 34, '#4a58a8');
          TX('学习园地', 51, 42, 7, '#fff3c4', 'center');
          for (let i = 0; i < 3; i++) R(26 + i * 18, 52, 14, 16, ['#e2564d', '#ffd25a', '#7fe0c8'][i]);
          R(270, 36, 40, 30, '#f4f1e4'); R(272, 38, 36, 26, '#e9e0cc');
          TX('班规', 290, 42, 6, ink, 'center'); L(276, 52, 304, 52, '#8f92b5', 1); L(276, 57, 300, 57, '#8f92b5', 1);
          R(310, 34, 8, 22, '#e2564d'); R(312, 36, 4, 12, '#ffd25a');
          // 扫帚 + 饮水机
          L(16, 150, 22, 186, '#a9764a', 2); R(14, 148, 9, 4, '#c9b89c');
          R(296, 150, 18, 34, '#c9c6b4'); R(299, 154, 12, 12, '#4b8fb5'); C(305, 172, 2, '#e2564d');
          TX(nm + ' · ' + '第 ' + (1 + (p.idx || 0) % 6) + ' 班', 176, 204, 6, ink, 'center');

        } else if (rt === 'office') {
          // 三张办公桌：显示器 / 键盘 / 文件堆 / 台灯 / 茶杯 / 电话
          for (let i = 0; i < 3; i++) {
            const dx = 22 + i * 106, dy = 92;
            R(dx, dy, 88, 32, wood); R(dx + 2, dy + 2, 84, 28, pale);
            R(dx + 4, dy + 32, 5, 12, '#6b4a2f'); R(dx + 79, dy + 32, 5, 12, '#6b4a2f');
            R(dx + 12, dy - 16, 32, 18, '#3b3b8f'); R(dx + 14, dy - 14, 28, 14, night ? '#5b4fb3' : '#4a4d68');
            R(dx + 20, dy + 2, 22, 3, '#5b5c76'); R(dx + 14, dy + 7, 34, 5, '#c9c6b4');
            R(dx + 52, dy - 8, 16, 10, '#f4f1e4'); R(dx + 54, dy - 6, 12, 2, '#8f92b5');
            R(dx + 70, dy + 4, 10, 8, '#e9e0cc'); C(dx + 75, dy + 8, 2, '#8a6540');
            R(dx + 56, dy + 16, 8, 8, '#c05b86');
            L(dx + 62, dy + 6, dx + 66, dy - 4, '#8f92b5', 1); C(dx + 66, dy - 5, 3, night ? '#ffd25a' : '#e9e0cc');
            // 椅子
            R(dx + 32, dy + 46, 24, 6, '#5b5c76'); R(dx + 32, dy + 36, 24, 11, '#7a8b9c');
            R(dx + 35, dy + 52, 3, 6, '#3b3b8f'); R(dx + 50, dy + 52, 3, 6, '#3b3b8f');
          }
          // 文件柜 / 书柜
          R(318, 38, 30, 110, '#5b5c76');
          for (let j = 0; j < 5; j++) {
            R(320, 40 + j * 21, 26, 19, '#8f92b5'); R(322, 42 + j * 21, 22, 15, night ? '#4a4d68' : '#a9b8c4');
            for (let k = 0; k < 4; k++) R(324 + k * 5, 44 + j * 21, 3, 11, ['#e2564d', '#4fb8a8', '#d99b1f', '#5b4fb3'][k]);
          }
          // 奖状 / 挂历 / 处室牌
          R(20, 38, 54, 34, '#f4f1e4'); R(22, 40, 50, 30, '#e9e0cc');
          TX(nm.slice(0, 6), 47, 44, 6, ink, 'center');
          R(28, 52, 38, 2, '#c9c6b4'); R(28, 57, 30, 2, '#c9c6b4'); C(47, 65, 4, '#c2453f');
          R(84, 38, 42, 30, '#d8cbb0'); TX('2026', 105, 42, 6, ink, 'center');
          for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) R(88 + j * 12, 50 + k * 4, 8, 2, '#a9a99e');
          // 沙发 + 茶几 + 饮水机
          R(16, 164, 74, 22, '#7a6a9c'); R(18, 158, 70, 10, '#8a7aae');
          R(100, 172, 46, 14, wood); R(104, 174, 38, 3, pale); C(112, 170, 4, '#4caf7d');
          R(292, 158, 18, 34, '#c9c6b4'); R(295, 162, 12, 12, '#4b8fb5');
          TX(nm + ' · 办公中', 176, 210, 6, ink, 'center');

        } else if (rt === 'lab') {
          const isComp = /电脑|语言|多媒|语音|信息/.test(nm);
          if (isComp) {
            // 机房 / 语言室：成排显示器 + 隔断 + 耳机
            for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
              const dx = 24 + col * 78, dy = 92 + row * 34;
              R(dx, dy, 64, 10, '#5b5c76'); R(dx + 2, dy + 2, 60, 6, '#8f92b5');
              R(dx + 8, dy - 18, 30, 18, '#3b3b8f'); R(dx + 10, dy - 16, 26, 14, night ? '#5b4fb3' : '#4a4d68');
              L(dx + 12, dy - 13, dx + 32, dy - 13, 'rgba(127,224,200,.55)', 1);
              R(dx + 42, dy + 2, 18, 5, '#c9c6b4'); R(dx + 20, dy + 10, 4, 8, '#5b5c76');
              R(dx + 46, dy - 8, 8, 10, '#4a4d68');
            }
            for (let col = 0; col < 5; col++) R(18 + col * 78, 86, 2, 108, 'rgba(233,224,204,.6)');
            R(20, 36, 80, 34, '#e9e0cc'); TX('机房守则', 60, 42, 7, ink, 'center');
            L(28, 54, 92, 54, '#8f92b5', 1); L(28, 60, 80, 60, '#8f92b5', 1);
            R(262, 36, 74, 34, '#f4f1e4'); TX('课程表 / LAB', 299, 42, 6, ink, 'center');
            for (let k = 0; k < 4; k++) R(268 + k * 17, 52, 13, 12, ['#4fb8a8', '#ffd25a', '#c05b86', '#5b4fb3'][k]);
          } else {
            // 理化生实验室：实验台 + 水槽 + 试剂 + 通风橱
            for (let i = 0; i < 4; i++) {
              const dx = 18 + i * 82, dy = 108;
              R(dx, dy, 72, 26, '#5b5c76'); R(dx + 2, dy + 2, 68, 22, metal);
              R(dx + 6, dy + 6, 18, 12, '#4b8fb5'); L(dx + 15, dy + 6, dx + 15, dy + 2, '#a9b8c4', 2);
              L(dx + 15, dy + 2, dx + 20, dy + 2, '#a9b8c4', 2);
              const cols = ['#e2564d', '#4fb8a8', '#ffd25a', '#5b4fb3'];
              for (let k = 0; k < 4; k++) {
                R(dx + 30 + k * 9, dy + 2 + (k % 2) * 3, 6, 10, cols[k]);
                R(dx + 31 + k * 9, dy, 4, 3, '#e9e0cc');
              }
              C(dx + 60, dy + 14, 5, '#3b2a2a'); C(dx + 60, dy + 14, 3, '#e2564d');
              R(dx + 4, dy + 26, 5, 12, '#5b5c76'); R(dx + 63, dy + 26, 5, 12, '#5b5c76');
              // 椅子
              R(dx + 28, dy + 40, 18, 5, '#6b4a2f'); R(dx + 28, dy + 32, 18, 8, '#a9764a');
            }
            // 通风橱
            R(18, 36, 96, 52, '#7a8b9c'); R(22, 40, 88, 44, night ? '#3b4a6b' : '#a9cfe0');
            R(22, 40, 88, 3, '#e9e0cc'); L(66, 40, 66, 84, '#e9e0cc', 2);
            R(30, 60, 14, 18, '#4fb8a8'); R(52, 56, 10, 22, '#e2564d');
            // 元素周期表 + 护目镜 + 灭火器
            R(132, 36, 108, 46, '#f4f1e4');
            for (let k = 0; k < 7; k++) for (let j = 0; j < 4; j++) R(136 + j * 26, 40 + k * 6, 22, 5, k % 2 ? '#c9d3d6' : '#d8e4e8');
            TX('元素周期表', 186, 76, 6, ink, 'center');
            R(258, 36, 60, 26, '#e9e0cc'); TX('护目镜', 288, 40, 6, ink, 'center');
            for (let k = 0; k < 3; k++) C(270 + k * 18, 54, 6, '#4b8fb5');
            R(320, 150, 12, 30, '#c2453f'); R(322, 152, 8, 8, '#f4f1e4');
          }
          TX(nm + ' · ' + (isComp ? '机房' : '实验台'), 176, 210, 6, ink, 'center');

        } else if (rt === 'canteen') {
          // 打饭窗口 + 菜牌 + 保温桶
          R(16, 36, 132, 48, '#7a8b9c'); R(18, 38, 128, 44, night ? '#3b4a6b' : '#a9cfe0');
          R(18, 60, 128, 4, '#c9c6b4');
          for (let k = 0; k < 3; k++) {
            R(24 + k * 42, 42, 34, 14, '#f4f1e4');
            TX(['荤 3.5', '素 2.0', '汤 1.0'][k], 41 + k * 42, 45, 6, ink, 'center');
          }
          for (let k = 0; k < 3; k++) C(36 + k * 42, 72, 7, '#c9c6b4');
          // 蒸箱 / 保温桶
          if (/蒸箱/.test(nm)) {
            for (let k = 0; k < 3; k++) {
              R(160 + k * 62, 36, 52, 46, '#8f92b5'); R(164 + k * 62, 40, 44, 38, metal);
              R(168 + k * 62, 44, 36, 3, '#e9e0cc'); C(186 + k * 62, 62, 4, '#5b5c76');
              for (let j = 0; j < 3; j++) C(174 + k * 62 + j * 12, 34 - Math.sin(tm + j + k) * 2, 2, 'rgba(244,241,228,.6)');
            }
          } else {
            for (let k = 0; k < 3; k++) { R(166 + k * 60, 42, 30, 34, '#c9c6b4'); R(170 + k * 60, 46, 22, 6, '#e9e0cc'); }
          }
          // 长餐桌 + 圆凳 + 托盘
          for (let row = 0; row < 3; row++) {
            const dy = 100 + row * 34;
            R(24, dy, 300, 12, wood); R(26, dy + 2, 296, 8, pale);
            R(36, dy + 12, 5, 12, '#6b4a2f'); R(307, dy + 12, 5, 12, '#6b4a2f');
            for (let k = 0; k < 5; k++) {
              C(52 + k * 60, dy + 28, 6, '#a9764a'); C(52 + k * 60, dy + 28, 3, '#c9a97e');
              R(40 + k * 60, dy + 3, 18, 6, '#e9e0cc');
              R(42 + k * 60, dy + 4, 6, 4, '#e2564d'); R(50 + k * 60, dy + 4, 6, 4, '#4caf7d');
            }
          }
          // 菜单板 / 光盘标语 / 泔水桶
          R(258, 36, 78, 34, '#2c4a3c'); TX('本周菜单', 297, 40, 7, '#f4f1e4', 'center');
          for (let k = 0; k < 3; k++) L(266, 50 + k * 7, 320, 50 + k * 7, 'rgba(244,241,228,.6)', 1);
          R(20, 84, 60, 12, '#c2453f'); TX('光盘行动', 50, 86, 6, '#fff3c4', 'center');
          R(318, 186, 16, 20, '#5b5c76'); R(320, 188, 12, 3, '#8f92b5');
          TX(nm + ' · 开饭了', 176, 212, 6, ink, 'center');

        } else if (rt === 'library') {
          // 三排高书架：彩色书脊 + 书立 + 编号
          [16, 92, 244].forEach((bx2, bi) => {
            R(bx2, 38, 68, 118, '#6b4a2f'); R(bx2 + 2, 40, 64, 114, '#c9b89c');
            for (let sh = 0; sh < 5; sh++) {
              const sy = 44 + sh * 23;
              R(bx2 + 2, sy + 19, 64, 3, '#8a6540');
              for (let k = 0; k < 9; k++) {
                const hh = 12 + (k * 3 + sh * 5 + bi) % 5;
                R(bx2 + 5 + k * 7, sy + 18 - hh, 5, hh,
                  ['#e2564d', '#4fb8a8', '#5b4fb3', '#d99b1f', '#3f6b8f', '#c05b86'][(k + sh + bi) % 6]);
              }
            }
            R(bx2 + 22, 156, 24, 7, '#e9e0cc'); TX(String(bi + 1) + ' 架', bx2 + 34, 157, 5, ink, 'center');
          });
          // 阅览长桌 + 台灯 + 摊开的书
          R(100, 168, 132, 16, wood); R(102, 170, 128, 12, pale);
          R(106, 186, 5, 12, '#6b4a2f'); R(221, 186, 5, 12, '#6b4a2f');
          for (let k = 0; k < 3; k++) {
            R(112 + k * 42, 164, 28, 8, '#f4f1e4'); L(126 + k * 42, 164, 126 + k * 42, 172, '#8f92b5', 1);
            C(126 + k * 42, 156, 4, night ? '#ffd25a' : '#e9e0cc');
            R(124 + k * 42, 158, 4, 8, '#8f92b5');
          }
          // 还书台 + 静字 + 开放时间 + 取书梯
          R(16, 166, 70, 22, '#8a6540'); R(18, 168, 66, 18, pale);
          R(24, 160, 22, 8, '#4a4d68'); R(50, 172, 20, 8, '#f4f1e4');
          R(176, 36, 56, 34, '#f4f1e4'); TX('静', 204, 40, 16, ink, 'center');
          R(240, 36, 96, 20, '#3b3b8f'); TX('OPEN 8:00 - 17:30', 288, 41, 6, '#fff3c4', 'center');
          L(324, 100, 324, 156, '#a9764a', 2); L(312, 100, 312, 156, '#a9764a', 2);
          for (let k = 0; k < 5; k++) L(312, 108 + k * 11, 324, 108 + k * 11, '#a9764a', 2);
          TX(nm + ' · 请保持安静', 176, 210, 6, ink, 'center');

        } else if (rt === 'arts') {
          // 木地板
          for (let q = 0; q < W; q += 22) L(q, 30, q, H - 8, 'rgba(138,101,64,.16)', 1);
          if (/礼堂/.test(nm)) {
            // 舞台 + 红幕 + 聚光灯 + 一排排座椅
            R(16, 34, 320, 62, '#5b4fb3'); R(20, 38, 312, 54, '#3b2a2a');
            for (let k = 0; k < 8; k++) { R(20 + k * 40, 38, 36, 16, '#8c1f2f'); L(38 + k * 40, 38, 38 + k * 40, 54, 'rgba(255,210,90,.35)', 1); }
            C(60, 32, 6, night ? '#ffd25a' : '#f4f1e4'); C(176, 32, 6, night ? '#ffd25a' : '#f4f1e4'); C(292, 32, 6, night ? '#ffd25a' : '#f4f1e4');
            for (let row = 0; row < 4; row++) for (let col = 0; col < 9; col++) {
              const sx = 22 + col * 35, sy = 108 + row * 24;
              R(sx, sy, 28, 12, '#7a6a9c'); R(sx + 2, sy - 6, 24, 7, '#8a7aae');
              R(sx + 3, sy + 12, 3, 6, '#5b4a7a'); R(sx + 23, sy + 12, 3, 6, '#5b4a7a');
            }
            TX(nm + ' · 舞台', 176, 210, 6, ink, 'center');
          } else if (/音乐|舞蹈|合唱/.test(nm)) {
            // 钢琴 + 琴凳 + 谱架 + 鼓 + 把杆 / 镜子
            R(24, 82, 128, 54, '#3b2a2a'); R(28, 86, 120, 30, '#f4f1e4');
            for (let k = 0; k < 16; k++) { R(30 + k * 7.4, 86, 1, 30, '#c9c6b4'); if (k % 7 !== 2 && k % 7 !== 6) R(30 + k * 7.4, 86, 4, 17, '#2b3348'); }
            R(24, 116, 128, 6, '#6b4a2f'); R(60, 140, 34, 8, '#5b4a7a');
            R(170, 96, 3, 44, '#8f92b5'); R(158, 88, 28, 20, '#f4f1e4');
            L(164, 92, 180, 92, ink, 1); L(164, 98, 176, 98, ink, 1);
            C(226, 122, 18, '#c05b86'); C(226, 122, 13, '#f4f1e4'); L(226, 122, 226, 106, '#8f92b5', 2);
            R(268, 36, 68, 62, '#c9d3d6'); R(270, 38, 64, 58, night ? '#3b4a6b' : '#a9cfe0');
            L(302, 38, 302, 96, '#e9e0cc', 1);
            L(24, 170, 320, 170, '#a9764a', 3); L(24, 178, 320, 178, '#a9764a', 2);
            TX(nm + ' · 练功房', 176, 210, 6, ink, 'center');
          } else if (/美术|画/.test(nm)) {
            // 三个画架 + 石膏像 + 颜料盘 + 静物台
            for (let k = 0; k < 3; k++) {
              const ax = 44 + k * 96;
              L(ax, 176, ax + 16, 92, wood, 3); L(ax + 32, 176, ax + 16, 92, wood, 3);
              L(ax + 4, 142, ax + 28, 142, wood, 2);
              R(ax - 2, 96, 36, 44, '#f4f1e4'); R(ax, 98, 32, 40, ['#e2564d', '#4fb8a8', '#ffd25a'][k]);
              L(ax + 4, 126, ax + 28, 108, '#f4f1e4', 2); C(ax + 24, 112, 4, '#fff3c4');
            }
            R(292, 100, 34, 52, '#c9c6b4'); C(309, 92, 12, '#e9e0cc'); C(309, 88, 8, '#f4f1e4');
            R(18, 36, 60, 24, '#e9e0cc'); TX('静物写生', 48, 42, 6, ink, 'center');
            R(250, 170, 56, 14, wood); C(266, 168, 6, '#e2564d'); C(280, 168, 6, '#4fb8a8'); C(294, 168, 6, '#ffd25a');
            TX(nm + ' · 画室', 176, 210, 6, ink, 'center');
          } else {
            // 团队室 / 化妆间：队旗、鼓号、带灯镜台
            R(24, 36, 8, 84, '#8f92b5'); R(32, 36, 76, 46, '#e2564d'); C(70, 58, 10, '#ffd25a');
            for (let k = 0; k < 3; k++) C(60 + k * 12, 58, 3, '#fff3c4');
            for (let k = 0; k < 3; k++) {
              R(130 + k * 62, 96, 44, 26, '#c9a97e'); C(152 + k * 62, 108, 12, '#e9e0cc');
              C(152 + k * 62, 108, 8, '#d99b1f');
            }
            R(244, 36, 92, 60, '#5b4fb3'); R(248, 40, 84, 52, night ? '#3b4a6b' : '#a9cfe0');
            for (let k = 0; k < 4; k++) C(254 + k * 22, 44, 3, night ? '#ffd25a' : '#f4f1e4');
            R(24, 146, 300, 8, wood); for (let k = 0; k < 6; k++) R(40 + k * 48, 154, 18, 12, '#c05b86');
            TX(nm, 176, 210, 6, ink, 'center');
          }

        } else if (rt === 'toilet') {
          // 瓷砖格
          for (let q = 16; q < W; q += 24) L(q, 30, q, H - 9, 'rgba(169,184,196,.5)', 1);
          for (let q = 40; q < H; q += 22) L(0, q, W, q, 'rgba(169,184,196,.5)', 1);
          // 四个隔间
          for (let k = 0; k < 4; k++) {
            const dx = 16 + k * 60;
            R(dx, 36, 54, 74, '#c9c6b4'); R(dx + 2, 38, 50, 70, '#a9b8c4');
            R(dx + 6, 44, 42, 58, k === 1 ? '#4fb8a8' : '#d8dce0');
            C(dx + 42, 74, 2, '#8f92b5'); R(dx + 18, 102, 18, 4, '#8f92b5');
            R(dx, 36, 54, 3, '#e9e0cc');
          }
          // 洗手台 + 镜子 + 龙头 + 皂液
          R(16, 130, 132, 22, '#8f92b5'); R(18, 132, 128, 18, '#e9e0cc');
          for (let k = 0; k < 2; k++) {
            C(48 + k * 68, 141, 9, '#c9d3d6'); C(48 + k * 68, 141, 6, '#a9b8c4');
            L(48 + k * 68, 128, 48 + k * 68, 134, '#a9b8c4', 2);
            L(48 + k * 68, 128, 54 + k * 68, 128, '#a9b8c4', 2);
          }
          R(16, 112, 132, 16, night ? '#3b4a6b' : '#a9cfe0'); L(82, 112, 82, 128, '#e9e0cc', 2);
          R(160, 132, 22, 18, '#c9c6b4'); R(164, 136, 14, 8, '#4b8fb5');
          R(190, 132, 18, 18, '#f4f1e4'); R(193, 136, 12, 6, '#e9e0cc');
          // 烘手机 / 拖把桶 / 节水牌 / 磨砂高窗
          R(240, 132, 34, 26, '#8f92b5'); R(244, 138, 26, 10, '#5b5c76');
          R(300, 150, 20, 24, '#5b5c76'); L(310, 150, 314, 128, '#a9764a', 2);
          R(268, 36, 68, 24, '#3b3b8f'); TX('节约用水', 302, 42, 7, '#fff3c4', 'center');
          for (let k = 0; k < 3; k++) R(20 + k * 30, 4, 24, 20, '#d8e4e8');
          TX(nm + ' · 请随手关门', 176, 210, 6, ink, 'center');

        } else {
          // hall：大厅 / 楼梯 / 出入口 / 阳台 / 体育 / 花园 / 天井
          // 楼层导向牌
          R(16, 36, 96, 42, '#3b3b8f'); TX(nm.slice(0, 6), 64, 41, 7, '#fff3c4', 'center');
          for (let k = 0; k < 3; k++) L(24, 54 + k * 7, 104, 54 + k * 7, 'rgba(255,243,196,.55)', 1);
          // 公告栏
          R(126, 36, 108, 42, '#6b4a2f'); R(129, 39, 102, 36, '#f4f1e4');
          for (let k = 0; k < 4; k++) R(133 + (k % 2) * 50, 42 + Math.floor(k / 2) * 17, 44, 14, ['#d8e4e8', '#e9d9b8', '#d8e4e8', '#e9d9b8'][k]);
          // 绿安全出口灯 + 红消防箱
          R(248, 36, 40, 13, '#123c2c'); TX('EXIT', 268, 39, 6, '#7fe0c8', 'center');
          R(300, 36, 24, 22, '#c2453f'); R(304, 40, 16, 5, '#f4f1e4');
          // 楼梯 / 栏杆
          if (/楼梯|出入口|大厅/.test(nm)) {
            for (let k = 0; k < 6; k++) {
              R(150 + k * 18, 96 + k * 12, 90 - k * 8, 8, k % 2 ? '#c9c6b4' : '#d8d2c2');
              R(150 + k * 18, 104 + k * 12, 90 - k * 8, 3, '#8f92b5');
            }
            L(148, 92, 148, 178, '#a9764a', 3); L(244, 92, 244, 178, '#a9764a', 3);
          } else if (/阳台/.test(nm)) {
            R(16, 150, 320, 6, '#e9e0cc');
            for (let q = 20; q < 336; q += 16) R(q, 156, 3, 30, '#8f92b5');
            R(16, 184, 320, 4, '#c9c6b4');
          } else if (/体育|排球|水池|花园|天井/.test(nm)) {
            R(24, 108, 70, 52, '#5b5c76');
            for (let k = 0; k < 3; k++) C(44 + k * 20, 128, 8, ['#e2564d', '#ffd25a', '#4fb8a8'][k]);
            R(250, 108, 72, 52, '#6b4a2f'); R(254, 112, 64, 44, '#c9b89c');
            R(260, 118, 20, 32, '#4fb8a8'); R(288, 118, 24, 32, '#c05b86');
          }
          // 长椅 / 饮水机 / 花盆
          for (let k = 0; k < 2; k++) {
            const bx2 = 30 + k * 240;
            R(bx2, 178, 66, 10, wood); R(bx2 + 2, 170, 62, 9, pale);
            R(bx2 + 4, 188, 4, 8, '#6b4a2f'); R(bx2 + 58, 188, 4, 8, '#6b4a2f');
          }
          R(160, 152, 16, 30, '#c9c6b4'); R(163, 156, 10, 10, '#4b8fb5');
          TX(nm + ' · 回廊', 176, 210, 6, ink, 'center');
        }
        break;
      }
      case 'roomPlate': {
        D.rect(ctx, x, y, w, h, '#3b2a2a'); D.frame(ctx, x, y, w, h, '#ffd25a', 1);
        D.text(ctx, p.name, x + w / 2, y + 5, 9, '#fff3c4', 'center', true);
        D.text(ctx, p.sub || '', x + w / 2, y + 20, 6, '#e9d9b8', 'center');
        break;
      }
      case 'roomDoor': {
        D.rect(ctx, x, y, w, h, '#3b2a2a');
        D.rect(ctx, x + 3, y + 3, w - 6, h - 6, p.open ? '#1c4a36' : '#8fb8cf');
        D.rect(ctx, x + w / 2 - 1, y + 3, 2, h - 6, '#2a2a5e');
        D.text(ctx, p.text, x + w / 2, y + h + 3, 6, p.col || '#fff3c4', 'center', true);
        if (p.open) { D.circle(ctx, x + w - 8, y + h / 2, 2, '#ffd25a'); }
        break;
      }
      case 'arrivalBoard':
        D.rect(ctx, x, y, w, 20, '#1b1c3a'); D.rect(ctx, x + 2, y + 2, w - 4, 16, '#0b1636');
        D.text(ctx, '列车到达 Arrival / Train', x + 5, y + 6, 7, '#7fe0c8');
        D.text(ctx, Math.floor((t.time || 0) * 1.2) % 2 ? '2 分钟  ●' : '2 分钟   ', x + w - 46, y + 6, 7, '#ffd25a', 'left', true);
        break;
      case 'routeMap':
        D.rect(ctx, x, y, w, 18, '#f4f1e4'); D.frame(ctx, x, y, w, 18, '#3b3b8f', 1);
        D.text(ctx, 'ACMA 机场联络线 · 轨交图', x + 4, y + 3, 6, '#3b3b8f');
        ['迂龙南路', '迂龙路', '龙川路', '迂龙北'].forEach((s, i) => {
          D.circle(ctx, x + 10 + i * (w - 20) / 3, y + 14, 2, i === 1 ? '#e2564d' : '#4fb8a8');
        });
        break;
      case 'hiring':
        D.rect(ctx, x, y, w, 18, '#f4f1e4'); D.frame(ctx, x, y, w, 18, '#e2564d', 2);
        D.text(ctx, 'We are hiring! 公司招人！', x + 4, y + 4, 7, '#e2564d', 'left', true);
        break;
      case 'tramSign':
        D.rect(ctx, x, y, w, 22, '#f4f1e4'); D.frame(ctx, x, y, w, 22, '#3b3b8f', 1);
        D.text(ctx, '下一站', x + 4, y + 3, 6, '#5b4fb3');
        D.text(ctx, '中华门 ZHONGHUA', x + 4, y + 12, 6, P.ink, 'left', true);
        break;
      case 'groundArrow':
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.fillRect(x + 12, y + 8, 8, h * T - 8);
        ctx.beginPath();
        ctx.moveTo(x + 16, y); ctx.lineTo(x, y + 22); ctx.lineTo(x + 32, y + 22); ctx.closePath(); ctx.fill();
        break;
      case 'metroStairY':
        for (let i = 0; i < 5; i++) D.line(ctx, x, y + i * 8, x + w, y + i * 8, '#8f92b5', 2);
        D.rect(ctx, x + w / 2 - 10, y - 14, 20, 14, '#3b3b8f');
        D.text(ctx, 'M', x + w / 2, y - 12, 10, '#fff', 'center', true);
        D.text(ctx, '〈迂龙路 地铁站〉', x + w / 2, y + 5 * 8 + 3, 8, P.ink, 'center', true);
        break;
      /* ================= 地铁站 / 列车 ================= */
      case 'metroHallSign':
        D.rect(ctx, x, y, w, h, '#1b1c3a'); D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#3b3b8f');
        D.text(ctx, '曙光路站  ⇄  迂龙路站', x + 6, y + 5, 11, '#ffd25a', 'left', true);
        D.text(ctx, 'SHUGUANG LU ST  /  YULONG ROAD  ·  ENTRANCE ①②', x + 6, y + 22, 7, '#c3bfff');
        break;
      case 'metroMap':
        D.rect(ctx, x, y, w, h, '#f4f1e4'); D.frame(ctx, x, y, w, h, '#3b3b8f', 2);
        D.text(ctx, '轨交图 / LINE MAP', x + 6, y + 5, 8, '#3b3b8f', 'left', true);
        ['#4fb8a8', '#5b4fb3', '#d99b1f', '#e2564d'].forEach((c, i) => {
          const yy = y + 22 + i * 15;
          D.rect(ctx, x + 8, yy, w - 16, 3, c);
          D.circle(ctx, x + 16 + i * 20, yy + 1, 3, '#fff');
          D.circle(ctx, x + w - 26, yy + 1, 3, c);
        });
        D.text(ctx, '迂龙南路 · 迂龙路 · 龙川路 · 迂龙北 · T1 / T2', x + 6, y + h - 14, 6, '#5b4fb3');
        break;
      case 'platformSign':
        D.rect(ctx, x, y, w, 18, '#2a2a5e'); D.rect(ctx, x + 2, y + 2, w - 4, 14, '#3b3b8f');
        D.text(ctx, '◀ 曙光路站 SHUGUANG LU    迂龙路站 YULONG ROAD ▶', x + w / 2, y + 4, 8, '#fff', 'center', true);
        break;
      case 'trainBody':
        D.rect(ctx, x, y + 4, w, h - 4, '#d8dce0');
        D.rect(ctx, x, y + 4, w, 5, '#4fb8a8');
        D.rect(ctx, x, y + h - 8, w, 6, '#3b3b46');
        for (let i = 0; i < 10; i++) {
          const wx = x + 10 + i * (w - 20) / 10;
          D.rect(ctx, wx, y + 12, (w - 30) / 12, 16, '#1b2c48');
          D.rect(ctx, wx + 2, y + 14, (w - 30) / 12 - 4, 12, 'rgba(160,220,255,.35)');
        }
        [[x + 30, '#7fe0c8'], [x + w / 2, '#ffd25a'], [x + w - 30, '#7fe0c8']].forEach(q =>
          D.circle(ctx, q[0], y + 8, Math.floor((t.time || 0) * 2) % 2 ? 3 : 2, q[1]));
        D.text(ctx, '1 号线  /  INFINITY LIVES  ⇄  下一站 中华门', x + w / 2, y + h - 4, 7, '#2a2a5e', 'center', true);
        break;
      case 'carWindow':
        D.rect(ctx, x, y, 5 * T, 3 * T, '#1b1c3a');
        D.rect(ctx, x + 3, y + 3, 5 * T - 6, 3 * T - 6, '#0b1636');
        const off = ((t.time || 0) * 90) % 48;
        for (let i = -1; i < 4; i++) {
          const lx = x + 6 + i * 24 + off;
          if (lx > x && lx < x + 5 * T - 8) D.rect(ctx, lx, y + 8, 8, 3, 'rgba(255,225,140,.75)');
        }
        D.rect(ctx, x + 3, y + 3 * T - 6, 5 * T - 6, 3, '#4fb8a8');
        break;
      case 'carSeat':
        D.rect(ctx, x, y, 5 * T, 16, '#4fb8a8');
        D.rect(ctx, x + 2, y + 2, 5 * T - 4, 12, '#6fc9bb');
        D.rect(ctx, x, y + 16, 5 * T, 4, '#2a2a5e');
        break;
      case 'carPole':
        D.rect(ctx, x, y, 3, 6 * T, '#c9c6b4');
        D.circle(ctx, x + 1, y + 6, 4, '#ffd25a');
        break;
      case 'carStrip':
        D.rect(ctx, x, y, w, 12, '#0b1636');
        const strip = '◆ 下一站　迂龙路 YULONG ROAD　◆　曙光路站 → 迂龙南路 → 迂龙路 → 中华门 ZHONGHUA　◆　';
        ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 2, w - 4, 9); ctx.clip();
        ctx.font = '7px "Courier New","WenQuanYi Micro Hei",monospace';
        const sw = Math.max(160, ctx.measureText(strip).width);
        const so = ((t.time || 0) * 26) % sw;
        D.text(ctx, strip, x + 4 - so, y + 3, 7, '#7fe0c8');
        D.text(ctx, strip, x + 4 - so + sw, y + 3, 7, '#7fe0c8');
        ctx.restore();
        break;
      case 'carMap':
        D.rect(ctx, x, y, w, 10, '#f4f1e4'); D.frame(ctx, x, y, w, 10, '#3b3b8f', 1);
        D.rect(ctx, x + 4, y + 4, w - 8, 2, '#4fb8a8');
        for (let i = 0; i < 5; i++) D.circle(ctx, x + 8 + i * (w - 16) / 4, y + 5, 2, i === 2 ? '#e2564d' : '#fff');
        break;
      case 'carDoor': {
        const tm = t.time || 0, open = t.arrived ? Math.min(1, (tm % 1) * 0 + 1) : 0;
        D.rect(ctx, x, y, w, 2 * T, '#3b3b46');
        const dw = (w / 2 - 3) * (1 - open * .82);
        D.rect(ctx, x + 2, y + 2, dw, 2 * T - 4, '#8fb8cf');
        D.rect(ctx, x + w - 2 - dw, y + 2, dw, 2 * T - 4, '#8fb8cf');
        if (open > .1) {
          D.rect(ctx, x + w / 2 - dw / 2, y + 2, dw, 2 * T - 4, '#0b1030');
          D.rect(ctx, x + w / 2 - dw / 2, y + 2 * T - 6, dw, 4, '#ffd25a');
        }
        D.rect(ctx, x, y, w, 3,
          t.arrived ? '#7fe0c8' : (Math.floor(tm * 1.5) % 2 ? '#7fe0c8' : '#ffd25a'));
        D.text(ctx, t.arrived ? '开门' : '下车', x + w / 2, y + 2 * T + 2, 6,
          t.arrived ? '#7fe0c8' : '#ffd25a', 'center');
        break;
      }
      /* ================= 地铁站 · 精细建模 ================= */
      case 'metroTiles':
        ctx.strokeStyle = 'rgba(120,140,190,.14)'; ctx.lineWidth = 1;
        for (let gx = 0; gx < w; gx += 24) { ctx.beginPath(); ctx.moveTo(x + gx + .5, y); ctx.lineTo(x + gx + .5, y + 10 * T); ctx.stroke(); }
        for (let gy = 0; gy < 10 * T; gy += 24) { ctx.beginPath(); ctx.moveTo(x, y + gy + .5); ctx.lineTo(x + w, y + gy + .5); ctx.stroke(); }
        D.rect(ctx, x, y + 10 * T - 4, w, 4, 'rgba(20,22,50,.3)');
        break;
      case 'ceilingLights':
        for (let i = 0; i < w; i += 64) {
          D.rect(ctx, x + i + 6, y + 4, 48, 5, '#eaf4ff');
          D.rect(ctx, x + i + 10, y + 9, 40, 2, 'rgba(234,244,255,.35)');
        }
        D.rect(ctx, x, y + 12, w, 2, 'rgba(59,59,143,.35)');
        break;
      case 'floorGuide':
        // 盲道条
        for (let i = 0; i < w; i += 16) D.rect(ctx, x + i + 3, y + 6, 10, 3, 'rgba(255,210,90,.55)');
        // 导向箭头
        for (let i = 0; i < 6; i++) {
          const ax = x + 60 + i * 110;
          ctx.fillStyle = 'rgba(127,224,200,.55)';
          ctx.beginPath(); ctx.moveTo(ax + 10, y + 18); ctx.lineTo(ax, y + 28); ctx.lineTo(ax + 20, y + 28); ctx.closePath(); ctx.fill();
          D.rect(ctx, ax + 7, y + 28, 6, 12, 'rgba(127,224,200,.55)');
        }
        D.text(ctx, '↑ 1号线站台 / PLATFORM', x + 12, y + 34, 6, 'rgba(200,220,255,.5)');
        break;
      case 'adLightbox': {
        const tm = t.time || 0;
        D.rect(ctx, x, y, w, h, '#10132f'); D.frame(ctx, x, y, w, h, '#5b57ad', 2);
        const ads = ['无限極人生 · 创造你的路', 'M-Coffee 麦妃咖啡 蓝草 7折', '迂龙大排档 三黄鸡 32元', 'INFINITY LIVES · 无限起程'];
        const a = ads[Math.floor(tm / 3) % ads.length];
        D.text(ctx, 'AD / 广告', x + 5, y + 4, 6, '#7f7bc0');
        D.text(ctx, a, x + w / 2, y + 14, 8, '#ffd25a', 'center', true);
        D.rect(ctx, x + 4, y + h - 6, (w - 8) * ((tm / 3) % 1), 2, '#4fb8a8');
        break;
      }
      case 'arrivalDisplay': {
        const tm = t.time || 0;
        D.rect(ctx, x, y, w, h, '#0b1024'); D.frame(ctx, x, y, w, h, '#4fb8a8', 1.5);
        D.text(ctx, 'NEXT / 下一班', x + 5, y + 3, 6, '#6f8fd0');
        const sec = 2 + Math.floor((tm * 1.1) % 4);
        D.text(ctx, sec + ' min', x + 5, y + 13, 9, '#ffd25a', 'left', true);
        D.text(ctx, Math.floor(tm * 1.4) % 2 ? '中华门 ZHONGHUA ▮' : '中华门 ZHONGHUA  ', x + w - 5, y + 14, 6, '#7fe0c8', 'right');
        break;
      }
      case 'securityGate':
        D.rect(ctx, x, y + 4, w, h - 4, '#4a4b62');
        D.rect(ctx, x + 2, y + 8, w - 4, 10, '#2a2a3a');
        for (let i = 0; i < w; i += 8) D.rect(ctx, x + i + 2, y + 8, 4, 10, 'rgba(143,146,181,.5)');
        D.rect(ctx, x, y, w, 5, '#5b4fb3');
        D.text(ctx, '安检 SECURITY', x + 2, y + h + 2, 6, '#c3bfff');
        break;
      case 'escalator':
        for (let i = 0; i < 7; i++) D.line(ctx, x + i * 10, y + h, x + i * 10 + 22, y, 'rgba(143,146,181,.7)', 2);
        D.line(ctx, x, y + h, x + w, y, '#ffd25a', 2);
        D.line(ctx, x + 3, y + h, x + w + 3, y, '#8f92b5', 1);
        D.text(ctx, '⬆ 出入口', x + 4, y + h + 3, 6, '#ffd25a');
        break;
      case 'pillarNum':
        D.rect(ctx, x, y, 10, 5 * T, '#b9becb');
        D.rect(ctx, x, y, 10, 4, '#8f92b5');
        D.rect(ctx, x + 1, y + 14, 8, 14, '#1b1c3a');
        D.text(ctx, String((p.num || 0) + 1), x + 5, y + 17, 8, '#ffd25a', 'center', true);
        break;
      case 'cctv':
        D.rect(ctx, x, y, 3, 10, '#8f92b5');
        D.rect(ctx, x + 3, y + 10, 14, 6, '#3b3b46');
        D.circle(ctx, x + 15, y + 13, 2, Math.floor((t.time || 0) * 2) % 2 ? '#e2564d' : '#5b4fb3');
        break;
      case 'stationBits':
        D.rect(ctx, x, y, 10, 18, '#e2564d');           // 消防栓
        D.rect(ctx, x + 2, y + 4, 6, 3, '#fff');
        D.rect(ctx, x + 16, y + 4, 12, 16, '#4a4b62');  // 垃圾桶
        D.rect(ctx, x + 17, y + 3, 10, 3, '#8f92b5');
        break;
      case 'tactileStrip':
        for (let i = 0; i < w; i += 9) for (let j = 0; j < h; j += 7) D.circle(ctx, x + i + 3, y + j + 3, 1.6, '#ffd25a');
        break;
      case 'platformBench':
        D.rect(ctx, x, y, w, 6, '#8a5b3b');
        D.rect(ctx, x, y - 10, w, 4, '#8a5b3b');
        D.rect(ctx, x + 3, y + 6, 3, 8, '#4a4b62');
        D.rect(ctx, x + w - 6, y + 6, 3, 8, '#4a4b62');
        D.text(ctx, '候车 SEATS', x + 4, y + 16, 6, 'rgba(200,210,235,.6)');
        break;
      case 'trackBed':
        D.rect(ctx, x, y, w, h, '#3b3b46');
        for (let i = 0; i < w; i += 12) D.rect(ctx, x + i + 2, y + 4, 8, h - 8, 'rgba(143,146,181,.35)');
        D.rect(ctx, x, y + 10, w, 3, '#b9becb');
        D.rect(ctx, x, y + h - 9, w, 3, '#b9becb');
        break;
      case 'platformDoors': {
        const tm = t.time || 0;
        const n = 7, dw = w / n;
        for (let i = 0; i < n; i++) {
          const dx = x + i * dw;
          D.rect(ctx, dx, y, dw - 2, h, 'rgba(143,180,207,.22)');
          D.rect(ctx, dx, y, 3, h, '#8f92b5');
          D.rect(ctx, dx + dw - 5, y, 3, h, '#8f92b5');
          D.rect(ctx, dx + 4, y + 3, dw - 12, h - 6, 'rgba(180,220,245,.18)');
          D.rect(ctx, dx + 4, y + 3, dw - 12, 2, 'rgba(255,255,255,.35)');
          D.text(ctx, String(i + 1).padStart(2, '0'), dx + dw / 2, y + 6, 6, '#ffd25a', 'center');
          // 门开合指示灯
          D.circle(ctx, dx + dw / 2, y + h - 8, 2, Math.floor(tm * .8 + i) % 5 ? '#4fb8a8' : '#ffd25a');
        }
        D.rect(ctx, x, y + h - 2, w, 2, '#ffd25a');
        break;
      }
      case 'tunnelMouth':
        D.rect(ctx, x, y, w, h, '#070b1c');
        ctx.strokeStyle = 'rgba(143,146,181,.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w, 0, Math.PI * 2); ctx.stroke();
        D.rect(ctx, x, y, w, 3, '#3b3b46');
        break;
      /* ================= 车厢 · 精细建模 ================= */
      case 'carCeiling':
        D.rect(ctx, x, y + 4, w, 6, '#d8dce0');
        for (let i = 0; i < w; i += 60) {
          D.rect(ctx, x + i + 8, y + 10, 42, 5, '#eaf4ff');
          D.rect(ctx, x + i + 12, y + 15, 34, 2, 'rgba(234,244,255,.4)');
        }
        for (let i = 0; i < w; i += 96) for (let j = 0; j < 4; j++) D.rect(ctx, x + i + 6, y + 18 + j * 3, 30, 1, 'rgba(59,59,143,.35)');
        break;
      case 'carFloor':
        D.rect(ctx, x, y, w, h, '#a9aebc');
        for (let i = 0; i < w; i += 24) D.line(ctx, x + i, y, x + i, y + h, 'rgba(59,59,143,.16)', 1);
        D.rect(ctx, x, y + 4, w, 3, '#ffd25a');
        D.rect(ctx, x, y + h - 5, w, 3, 'rgba(255,210,90,.55)');
        D.text(ctx, '← 车门 / DOOR →', x + w / 2, y + h - 14, 6, 'rgba(59,59,143,.6)', 'center');
        break;
      case 'carAd': {
        const tm = t.time || 0;
        D.rect(ctx, x, y, w, 3 * T, '#f4f1e4');
        D.frame(ctx, x, y, w, 3 * T, '#5b4fb3', 2);
        const a = ['麦芬文具 考试过！', 'M-Coffee 蓝草 7折', '齐阵 · 24H'][Math.floor(tm / 5) % 3];
        D.rect(ctx, x + 3, y + 3, w - 6, 16, '#e2564d');
        D.text(ctx, 'AD', x + 6, y + 6, 6, '#fff', 'left', true);
        D.text(ctx, a, x + w / 2, y + 24, 7, '#3b3b8f', 'center', true);
        D.text(ctx, 'INFINITY LIVES', x + w / 2, y + 36, 5, '#7f7bc0', 'center');
        break;
      }
      case 'carNumber':
        D.rect(ctx, x, y + 4, w, 12, '#1b1c3a');
        D.text(ctx, 'Y1 0' + (1 + ((PC.State.d().day || 1) % 6)), x + w / 2, y + 6, 7, '#7fe0c8', 'center', true);
        break;
      case 'prioritySeat':
        D.rect(ctx, x, y - 12, w, 4, '#ffd25a');
        D.text(ctx, '优先座 PRIORITY', x + 2, y - 24, 6, '#c2453f', 'left', true);
        break;
      case 'carRings': {
        const tm = t.time || 0;
        D.rect(ctx, x + 4, y, w - 8, 2, '#c9c6b4');
        for (let i = 0; i < 10; i++) {
          const rx = x + 14 + i * (w - 28) / 10;
          const sway = Math.sin(tm * 1.6 + i * .7) * 1.5;
          D.line(ctx, rx, y + 2, rx + sway, y + 10, '#c9c6b4', 1);
          ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.ellipse(rx + sway, y + 14, 4, 5, 0, 0, Math.PI * 2); ctx.stroke();
        }
        break;
      }
      case 'carBin':
        D.rect(ctx, x, y + 4, 12, 20, '#4a4b62');
        D.rect(ctx, x - 1, y + 2, 14, 3, '#8f92b5');
        D.text(ctx, '♻', x + 6, y + 10, 7, '#7fe0c8', 'center');
        break;
    }
  }

  /* ---------------- 碰撞 ---------------- */
  function boxAt(x, y) { return { x: x - 5, y: y - 5, w: 10, h: 5 }; }
  /* 找一个角色盒子完全不压到障碍的位置：先环形搜索，再全图兜底。
     麦芬文具等店内课桌较密，旧版 spawn 正踩在桌角上，导致「一进去就动不了」。*/
  function freeSpot(s, x, y) {
    if (!collide(s, boxAt(x, y))) return { x, y };
    for (let r = 4; r <= 192; r += 4) {
      for (let a = 0; a < 24; a++) {
        const nx = x + Math.round(Math.cos(a * Math.PI / 12) * r);
        const ny = y + Math.round(Math.sin(a * Math.PI / 12) * r);
        if (nx < 12 || ny < 16 || nx > s.w * T - 12 || ny > s.h * T - 12) continue;
        if (!collide(s, boxAt(nx, ny))) return { x: nx, y: ny };
      }
    }
    for (let ty = 1; ty < s.h - 1; ty++) for (let tx = 1; tx < s.w - 1; tx++) {
      const nx = tx * T + 8, ny = ty * T + 8;
      if (!s.solid[ty][tx] && !collide(s, boxAt(nx, ny))) return { x: nx, y: ny };
    }
    return { x, y };
  }
  function safeScene(s) {
    if (!s._safe) {
      s.spawn = freeSpot(s, s.spawn.x, s.spawn.y);
      // 交互点若落在障碍内，也挪到附近空地，避免「看得见却够不着」
      s.points.forEach(pt => {
        if (pt.type === 'exit' || pt.type === 'counter' || pt.type === 'jobs' || pt.type === 'door') {
          const f = freeSpot(s, pt.x, pt.y);
          if (U.dist(f.x, f.y, pt.x, pt.y) < 40) { pt.x = f.x; pt.y = f.y; }
        }
      });
      s._safe = true;
    }
    return s;
  }
  function collide(s, box) {
    const x0 = Math.floor(box.x / T), x1 = Math.floor((box.x + box.w - 1) / T);
    const y0 = Math.floor(box.y / T), y1 = Math.floor((box.y + box.h - 1) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (ty < 0 || tx < 0 || ty >= s.h || tx >= s.w) return true;
      if (s.solid[ty][tx]) return true;
    }
    return false;
  }
  function move(s, ent, dx, dy) {
    // 读到旧存档 / 被推进障碍里时，先自动脱困再移动
    if (collide(s, boxAt(ent.x, ent.y))) {
      const f = freeSpot(s, ent.x, ent.y);
      ent.x = f.x; ent.y = f.y;
    }
    if (dx && !collide(s, boxAt(ent.x + dx, ent.y))) ent.x += dx;
    if (dy && !collide(s, boxAt(ent.x, ent.y + dy))) ent.y += dy;
    ent.x = U.clamp(ent.x, 8, s.w * T - 8); ent.y = U.clamp(ent.y, 12, s.h * T - 8);
  }

  /* ---------------- 渲染 ---------------- */
  function render(ctx, s, cam, t) {
    activeFloor = s.floorColor || '#ded6b8';
    ctx.save();
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
    const x0 = Math.max(0, Math.floor(cam.x / T) - 1), y0 = Math.max(0, Math.floor(cam.y / T) - 1);
    const x1 = Math.min(s.w - 1, Math.ceil((cam.x + PC.CFG.VIEW_W) / T) + 1);
    const y1 = Math.min(s.h - 1, Math.ceil((cam.y + PC.CFG.VIEW_H) / T) + 1);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++)
      tile(ctx, s.ground[ty][tx], tx * T, ty * T, tx, ty, t);
    s.decos.forEach(d => { if (d.kind === 'zebra' || d.kind === 'lane' || d.kind === 'laneV' || d.kind === 'stairs') A.groundDeco(ctx, d, t); });
    s.screens.forEach(sc => {
      if (sc.kind === 'yulong' && A.groundScreenYulong) A.groundScreenYulong(ctx, sc, t);
      else A.groundScreen(ctx, sc, t);
    });
    s.buildings.forEach(b => A.building(ctx, b, b.shop, t));
    s.billboards.forEach(b => A.billboard(ctx, b, b.ads, t));
    s.props.forEach(p => prop(ctx, p, t));
    s.decos.forEach(d => { if (!(d.kind === 'zebra' || d.kind === 'lane' || d.kind === 'laneV' || d.kind === 'stairs')) A.deco(ctx, d, t); });
    // 交互点标记
    s.points.forEach((p, i) => {
      if (p.taken) return;
      const special = p.type === 'exit' || p.type === 'counter' || p.type === 'door' || p.type === 'jobs';
      const col = p.type === 'pickup' ? '#c9e8ff' : (special ? '#7fe0c8' : P.gold);
      const bob = Math.sin((t.time || 0) * 3 + i) * 1.5;
      if (p.type === 'pickup') {
        const it = PC.RECYCLE[p.item];
        D.circle(ctx, p.x, p.y - 2, 3, it ? it.color : '#fff');
        D.frame(ctx, p.x - 4, p.y - 6, 8, 8, 'rgba(255,255,255,.7)', 1);
      } else {
        D.circle(ctx, p.x, p.y - 6 + bob, 2, col);
        D.rect(ctx, p.x - 2, p.y - 12 + bob, 4, 4, col);
      }
    });
    ctx.restore();
  }

  const cache = {};
  function build(id, opts) {
    let s;
    if (id === 'street') s = cache.street || (cache.street = street());
    else if (id === 'yulong') s = cache.yulong || (cache.yulong = yulong());
    else if (id === 'underground') s = cache.underground || (cache.underground = underground());
    else if (id === 'yuanyu') s = cache.yuanyu || (cache.yuanyu = yuanyu());
    else if (id === 'park') s = cache.park || (cache.park = park());
    else if (id === 'metro') s = cache.metro || (cache.metro = metro());
    else if (id === 'campus') s = cache.campus || (cache.campus = campus());
    else if (id.indexOf('floor:') === 0) { const k = id; s = cache[k] || (cache[k] = schoolFloor(Number(id.slice(6)), opts)); }
    else if (id.indexOf('sroom:') === 0) {
      const q = id.slice(6).split(':'); const k = id;
      s = cache[k] || (cache[k] = schoolRoomScene(Number(q[0]), Number(q[1]), opts));
    }
    else if (id === 'home') s = home();   // 不缓存：换户型后重新生成
    else if (id.indexOf('villa:') === 0) {
      const k = id; s = cache[k] || (cache[k] = villa(id.slice(6)));
    }
    else if (id === 'train') {
      // 车厢按线路重建（不缓存），每次上车都是新车
      s = train(opts);
      return safeScene(s);
    }
    else if (id.indexOf('shop:') === 0) {
      const k = id; s = cache[k] || (cache[k] = interior(id.slice(5), opts));
    } else s = cache.street || (cache.street = street());
    return safeScene(s);
  }

  /* 买房 / 搬家后丢掉旧缓存，让公寓与别墅重新生成 */
  function refresh(id) {
    if (id === 'home' || id.indexOf('villa:') === 0) delete cache[id];
    else if (id === 'park') { delete cache.park; }
    return build(id);
  }

  PC.World = { build, refresh, render, move, collide, boxAt, freeSpot, safeScene, px, tile, prop, respawnPickups };
})();
