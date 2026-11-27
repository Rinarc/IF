/* main.js —— 初始化 / 瞬移入场 / 输入 / 主循环 / 场景切换 / 交互分发 */
(function () {
  const PC = window.PC = window.PC || {};
  const C = PC.CFG, U = PC.U, D = PC.Draw, W = PC.World, E = PC.Entities, St = PC.State, UI = PC.UI;
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let scene = null, player = null, cam = { x: 0, y: 0 }, started = false;
  let returnPos = { x: 7 * C.TILE, y: 18 * C.TILE }, currentTarget = null;
  let last = 0, saveTimer = 0, hudTimer = 0;
  const t = { time: 0, night: false };
  const keys = {};

  /* 入场状态：title → teleport（瞬移特效） → camera（镜头转到主角） → play */
  const intro = { phase: 'title', t: 0, from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, particles: [] };

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    // 高清低分辨率视口：横屏 640×360，竖屏 400×600，像素更细但不丢像素风
    const portrait = vw / vh < .8;
    const baseW = portrait ? 320 : 480;
    C.VIEW_W = portrait ? 400 : 640;
    C.VIEW_H = portrait ? 600 : 360;
    C.TEXT_SCALE = C.VIEW_W / baseW;
    if (canvas.width !== C.VIEW_W || canvas.height !== C.VIEW_H) {
      canvas.width = C.VIEW_W; canvas.height = C.VIEW_H;
    }
    ctx.imageSmoothingEnabled = false;
    const ar = C.VIEW_W / C.VIEW_H;
    let w = vw, h = vw / ar;
    if (h > vh) { h = vh; w = vh * ar; }
    const app = $('app');
    app.style.width = w + 'px'; app.style.height = h + 'px';
    app.style.left = (vw - w) / 2 + 'px'; app.style.top = (vh - h) / 2 + 'px';
    // HTML 层 UI 以旧基准宽度计算，分辨率提高后按钮与 HUD 大小不变
    app.style.fontSize = Math.min(w / baseW * 16, 16).toFixed(2) + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  function followCam() {
    const z = (scene && scene.zoom) || 1;
    const vw = C.VIEW_W / z, vh = C.VIEW_H / z;
    const maxX = scene.w * C.TILE - vw, maxY = scene.h * C.TILE - vh;
    return {
      x: maxX > 0 ? U.clamp(player.x - vw / 2, 0, maxX) : maxX / 2,
      y: maxY > 0 ? U.clamp(player.y - vh / 2, 0, maxY) : maxY / 2
    };
  }

  function musicKey(id) {
    return (id.indexOf('floor:') === 0 || id.indexOf('sroom:') === 0) ? 'campus' : id;
  }
  /* 黑屏转场：淡出 → 切场景 → 淡入（靠近教学楼门洞进楼内用） */
  const fade = { a: 0, dir: 0, t: 0, cb: null };
  function fadeTo(fn) {
    if (fade.dir) return;
    fade.dir = 1; fade.t = 0; fade.a = 0; fade.cb = fn;
  }
  /* ================================================================
     汾阳中学作息人潮
       07:40 前后：一大群学生从校门涌进来，沿前庭走向教学楼
       18:00 前后：放学，学生从教学楼往校门走、回家
     按游戏时间（St.d().minute）动态往当前场景的 npcs 里注入 / 移除，
     场景缓存共用，所以切换场景时以 (场景, 时段) 为 key 重建一次。
     ================================================================ */
  let rushKey = '';
  const RUSH_COLORS = ['#4caf7d', '#c05b86', '#d99b1f', '#4fb8a8', '#5b4fb3', '#ffb347', '#e2564d', '#7fe0c8', '#3f6b8f'];
  function schoolPhase() {
    const m = St.d().minute;
    if (m >= 7 * 60 + 30 && m < 8 * 60 + 20) return 'morning';
    if (m >= 17 * 60 + 50 && m < 18 * 60 + 40) return 'evening';
    return 'none';
  }
  function syncSchoolRush() {
    const ph = schoolPhase(), key = scene.id + ':' + ph;
    const inSchool = scene.id === 'campus';
    const inStreet = scene.id === 'street';
    if (key !== rushKey) {
      rushKey = key;
      scene.npcs = scene.npcs.filter(n => !(n.id && n.id.indexOf('rush_') === 0));
      if (ph !== 'none' && (inSchool || inStreet)) {
        const morning = ph === 'morning';
        const name = morning ? '上学赶路的同学' : '放学回家的同学';
        const N = inSchool ? 20 : 6;
        let gx = 28 * C.TILE, gy = 33 * C.TILE, tx = 28 * C.TILE, ty = 15 * C.TILE;
        if (inStreet) {
          const sb = scene.buildings.find(b => b.shop && b.shop.type === 'school');
          if (sb) { gx = (sb.x + sb.w / 2) * C.TILE; gy = (sb.y + sb.h + 2) * C.TILE; tx = gx; ty = (sb.y + sb.h - 1) * C.TILE; }
        }
        for (let i = 0; i < N; i++) {
          const dx = ((i * 7) % 13 - 6) * 9, off = (i % 5) * 9;
          const gate = { x: gx + dx, y: gy - (i % 3) * 12 };
          // 人潮铺满校门到教学楼之间这段前庭，但不全挤在门口
          const door = { x: tx + dx - 18, y: inSchool ? 20 * C.TILE + off : ty + off };
          const mid = { x: gx + dx, y: inSchool ? 26 * C.TILE : (gy + ty) / 2 };
          const path = morning
            ? [gate, mid, door, { x: door.x - 26, y: door.y + 10 }, gate]
            : [door, mid, gate, { x: gate.x + 12, y: gate.y + 14 }, door];
          // 错开起点：一部分已走到前庭中段 / 教学楼门口，人潮铺满整条主轴
          const pi0 = i % path.length;
          const start = path[pi0];
          scene.npcs.push({
            name, color: RUSH_COLORS[i % RUSH_COLORS.length], x: start.x, y: start.y,
            path, pi: pi0, wait: (i % 4) * .2, dir: morning ? 0 : 3, frame: 0,
            id: 'rush_' + ph + '_' + i
          });
        }
        if (inSchool) {
          UI.toast(morning ? '🕖 7:40 · 早读前，一大群学生涌进校门' : '🕕 18:00 · 放学，学生们都往校门走、回家了');
          St.logMsg(morning ? '7:40 上学潮：学生涌入汾阳中学' : '18:00 放学：学生离开汾阳中学');
        }
      }
    }
    const d = St.d();
    t.clock = { minute: d.minute, h: Math.floor(d.minute / 60) % 24, m: d.minute % 60, str: St.timeStr(), phase: ph };
  }

  let districtFrom = 'street';   // 当前所属街区：从店铺 / 地铁站出来该回哪
  function goDistrict(id, pos) {
    id = id || 'street';
    scene = W.build(id);
    player = E.createPlayer(scene);
    if (pos) { player.x = pos.x; player.y = pos.y; }
    districtFrom = id;
    t.night = St.isNight();
    savePos();
    PC.Music.update(musicKey(id), t.night, St.weather().id);
  }
  function goStreet(pos) { goDistrict('street', pos); }
  function savePos() {
    St.d().pos = { scene: scene.id, x: Math.round(player.x), y: Math.round(player.y) };
  }
  function setScene(id, opts) {
    returnPos = { x: player.x, y: player.y };
    scene = W.build(id, opts);
    player = E.createPlayer(scene);
    if (opts && opts.spawn) { player.x = opts.spawn.x; player.y = opts.spawn.y; }
    t.night = St.isNight();
    // 进店是叮咚门铃，去地铁 / 校园 / 公园是转场音
    PC.Audio.sfx(id.indexOf('shop:') === 0 ? 'doorBell' : 'scene');
    savePos();
    PC.Music.update(musicKey(scene.id), t.night, St.weather().id);
  }
  function enterShop(shopId) {
    const shop = PC.SHOP_BY_ID[shopId];
    if (shopId === 'metro') { enterMetro(); return; }
    if (shop && shop.type === 'school') {
      setScene('campus');
      St.d().stats.shops++;
      if (PC.Play) { PC.Play.mark('shops'); PC.Play.mark('shop', shopId); }
      St.logMsg('走进 渊迂市汾阳中学 · 新修好的一整栋楼正门');
      UI.toast('渊迂市汾阳中学 · 就这一整栋楼，从正门进');
      St.save();
      return;
    }
    setScene('shop:' + shopId);
    St.d().stats.shops++;
    if (PC.Play) { PC.Play.mark('shops'); PC.Play.mark('shop', shopId); }
    St.logMsg('推门进了 ' + (shop ? shop.name : '店里'));
    UI.toast(shop ? '进店：' + shop.name + ' · 走到柜台按 A 打开货架' : '');
    St.save();
  }
  /* ---------------- 真正的地铁：进站 → 买票 → 选线 → 坐车 → 到站 ---------------- */
  let rideFrom = 'street', arriveAt = 0, rideSecs = 3.2, arriveHinted = false;
  const STATION_EXIT = {
    street: { x: 7 * C.TILE, y: 18 * C.TILE },
    yulong: { x: 12 * C.TILE, y: 47 * C.TILE }
  };
  function enterMetro() {
    rideFrom = (scene.id === 'street' || scene.id === 'yulong') ? scene.id : districtFrom;
    setScene('metro');
    UI.toast(rideFrom === 'street' ? '走下曙光路站的楼梯 · 去站台按 A 上车' : '走下迂龙路地铁站的楼梯 · 去站台按 A 上车');
    St.logMsg('进入 ' + (rideFrom === 'street' ? '曙光路站' : '迂龙路站') + ' · 1号线站台');
  }
  function ticketDialog() {
    const d = St.d();
    UI.showDialog({
      title: '🎫 自动售票机 · 票价 2 元',
      text: '设计稿右上角写着「票价 2元」。\nAB 1号线 / 2号线、S1 谷园方向、S2 中华门方向，还有迂龙有轨电车 1 号线。\n现金 ' + U.money(d.money) + (d.flags.metroTicket ? '　✓ 已购票' : ''),
      options: [
        { label: '买一张单程票 ¥2', onPick: () => {
          if (d.money < 2) return '零钱不够，机器亮了一下又灭了。';
          d.money -= 2; d.flags.metroTicket = true; St.save();
          PC.Audio.sfx('coin'); UI.updateHUD();
          return '「咔哒」吐出一张薄薄的单程票。上车时不再扣钱。';
        } },
        { label: '看看轨交图', onPick: () => {
          St.change('knowledge', 2);
          return '迂龙南路 → 迂龙路 → 龙川路 → 迂龙北 → T1 / T2 航站楼。学识 +2';
        } },
        { label: '查余额', onPick: () => '现金 ' + U.money(d.money) + '，账户 ' + U.money(d.bank || 0) + '。' }
      ]
    });
  }
  function chooseLine() {
    const to = rideFrom === 'street' ? 'yulong' : 'street';
    const lines = PC.METRO_LINES || [];
    const opts = lines.map(L => ({
      label: L.name + '　' + L.mins + '分钟 · ¥2',
      onPick: () => { board(L, to); }
    }));
    opts.push({ label: '先不上车，再逛会儿站', onPick: () => null });
    UI.showDialog({
      title: '🚇 1号线站台 · 请选择线路',
      text: '当前站：' + (rideFrom === 'street' ? '曙光路站' : '迂龙路站') + '　→　目的地：' + (to === 'yulong' ? '迂龙路' : '曙光路') + '\n' +
        '站台广播：「道路千万条，安全第一条，请先下后上。」\n票价 2 元，进站后可刷票或现金。',
      options: opts
    });
  }
  function board(L, to) {
    if (PC.Play) PC.Play.mark('ride');
    const d = St.d();
    if (!d.flags.metroTicket) {
      if (d.money < 2) { UI.toast('票价 ¥2，口袋里不够，先去自动售票机或街口打份零工'); PC.Audio.sfx('error'); return; }
      d.money -= 2;
      UI.toast('刷了 ¥2 单程票 · 上车');
    } else {
      d.flags.metroTicket = false;
      UI.toast('刷了刚买的单程票 · 上车');
    }
    d.minute += L.mins;                       // 车程按游戏时间推进
    while (d.minute >= 1440) St.newDay();
    St.change('mood', 2);
    St.logMsg('搭乘 ' + L.name + '　' + L.note + '　→ ' + (to === 'yulong' ? '迂龙路' : '曙光路'));
    PC.Audio.sfx('doorBell');
    UI.closeDialog();
    setScene('train', { name: L.name, en: L.en, car: L.car, to, mins: L.mins, note: L.note });
    districtFrom = to;                        // 到站后属于另一个街区
    rideSecs = L.id === 'tram' ? 4.6 : L.id === 's1' ? 2.6 : 3.4;
    arriveAt = performance.now() + rideSecs * 1000;
    arriveHinted = false;
    UI.updateHUD(); St.save();
  }
  function forceArrive() { arriveAt = 0; }
  function alight() {
    const left = arriveAt - performance.now();
    if (left > 0) { UI.toast('列车还在隧道里，再等 ' + Math.ceil(left / 1000) + ' 秒就到站'); PC.Audio.sfx('error'); return; }
    const to = (scene.ride && scene.ride.to) || 'yulong';
    const spawn = STATION_EXIT[to] || STATION_EXIT.street;
    goDistrict(to, spawn);
    const d = St.d();
    d.flags.rodeMetro = true;
    St.change('knowledge', 1);
    St.logMsg('列车到站：' + (to === 'yulong' ? '迂龙路 · YULONG ROAD' : '曙光路 · SHUGUANG LU'));
    PC.Audio.sfx('scene');
    UI.toast(to === 'yulong' ? '🚉 迂龙路到了 · 17°C 晴，比曙光路暖 8 度' : '🚉 曙光路站到了 · 9°C 的风还在');
    St.save(); UI.updateHUD();
  }
  function screenYDialog(pt) {
    const d = St.d(), w = St.weather();
    UI.showDialog({
      title: '🪧 921 路站牌 · 长矩形途径站 + 右下角小屏',
      text: '【长矩形站牌】921 路　曙光路 ⇆ 景迂路　SAFE LINE\n' +
        '◇ 曙光路　◇ 迂龙路　◇ 为疾路　◇ 景迂路（四个菱形竖排站名）\n\n' +
        '【右下角一小块】迂龙路 ☀' + St.tempAt('yulong') + '°C\n' +
        '下一班车：3min / 13min / 20min（倒计时在走）\n' +
        '天气' + (w.id === 'cold' || w.id === 'rain' ? '降温' : w.name) + '，记得保暖添衣 ≪\n' +
        '路：921 路 · 曙光路 ⇆ 迂龙路 ⇆ 为疾路 ⇆ 景迂路\n\n' +
        'D' + d.day + ' ' + St.timeStr() + ' · 这块不是大 LED，是手绘格纸上的蓝墨站牌。',
      options: [
        { label: '拍下这块站牌', onPick: () => { St.addItem('postcard'); St.change('mood', 2); return '明信片 +1，心情 +2'; } },
        { label: '等下一班车', onPick: () => { d.minute += 3; St.change('mood', 2); return '站了一会儿，游戏时间 +3 分钟，心情 +2'; } },
        { label: '抄下四个途径站', onPick: () => { St.change('knowledge', 3); return '曙光路 / 迂龙路 / 为疾路 / 景迂路。学识 +3'; } }
      ]
    });
  }
  /* ---------------- 林景园小区 · 房产与设施 ---------------- */
  function estateDialog() {
    PC.Audio.sfx('click');
    UI.openEstate();
  }
  function estateGymDialog() {
    const d = St.d();
    const used = d.flags.estateGymDay === d.day ? (d.flags.estateGymCount || 0) : 0;
    if (used >= 3) { UI.toast('今天已经练满三回了，明天再来'); PC.Audio.sfx('error'); return; }
    UI.showDialog({
      title: '🏋 林景园 · 健身区',
      text: '单杠、漫步机、扭腰器、仰卧板，都是小区配套的。\n' +
        '今天已练 ' + used + '/3 回。练一次体魄 +6、心情 +3，体力 -8。',
      options: [
        { label: '练一组 →', onPick: () => {
          d.flags.estateGymDay = d.day; d.flags.estateGymCount = used + 1;
          St.applyEff({ fitness: 6, mood: 3, stamina: -8 });
          St.logMsg('在林景园健身区练了一组');
          PC.Audio.sfx('use'); UI.updateHUD();
          return '出了一身汗。体魄 +6，心情 +3，体力 -8。';
        } },
        { label: '看看器材说明', onPick: () => { St.change('knowledge', 2); return '「免费使用，请勿霸占单杠。」学识 +2'; } },
        { label: '先不练', onPick: () => null }
      ]
    });
  }
  function estatePondDialog() {
    const d = St.d();
    UI.showDialog({
      title: '⛲ 林景园 · 中央水池',
      text: '喷水池立在小区中轴上，一条木栈道从水面穿过去。\n' +
        '睡莲、锦鲤、水波都在动。设计稿上没画这个，但小区得有个能发呆的地方。',
      options: [
        { label: '买包鱼食喂锦鲤（¥6）', onPick: () => {
          if (d.money < 6) return '差六块钱，锦鲤看了你一眼就游走了。';
          d.money -= 6; St.applyEff({ mood: 6, knowledge: 1 });
          St.logMsg('在林景园水池喂了锦鲤'); PC.Audio.sfx('coin'); UI.updateHUD();
          return '一撒下去全涌过来了。心情 +6，学识 +1。';
        } },
        { label: '往喷泉里许个愿', onPick: () => {
          St.applyEff({ mood: 5 });
          const lucky = Math.random() < .18;
          if (lucky) { St.change('money', 12); PC.Audio.sfx('coin'); }
          return lucky ? '硬币落进水里，回头摸到口袋里多了 ¥12。心情 +5' : '硬币落进水里，什么也没发生，但心里松了一点。心情 +5';
        } },
        { label: '拍张水池照', onPick: () => { St.addItem('postcard'); St.change('mood', 2); return '明信片 +1，心情 +2'; } }
      ]
    });
  }
  function aptDoorDialog(pt) {
    const E2 = PC.Estate, u = E2.get(pt.unit) || { name: '这栋楼' }, d = St.d();
    const owned = E2.owned(pt.unit), isHome = E2.isHome(pt.unit);
    UI.showDialog({
      title: '🏢 林景园 · ' + (pt.unit === 'apt3' ? '1 栋' : '5 栋') + ' 单元门',
      text: '门禁上贴着一张户型图：' + u.name + '。\n' +
        (owned ? (isHome ? '这里就是你现在住的地方。' : '这套在你名下，可以搬回来住，也能挂出去出租。')
          : '还没买下。售楼处就在小区东边，按 A 能看全部在售房源。'),
      options: [
        { label: owned ? (isHome ? '推门回家 →' : '搬回这套 →') : '去看看在售户型 →', onPick: () => {
          if (owned) {
            if (isHome) goHome();
            else { const r = E2.setHome(pt.unit); UI.toast(r.msg); if (PC.World.refresh) PC.World.refresh('park'); UI.updateHUD(); }
          } else UI.openEstate();
          return null;
        } },
        { label: '敲门问问邻居', onPick: () => { PC.Events.trigger('estate_neighbor'); return '__keep'; } },
        { label: '看看信箱', onPick: () => { St.addItem('newsPaper'); St.change('knowledge', 1); return '顺了一份街区早报。学识 +1'; } }
      ]
    });
  }
  function villaDoorDialog(pt) {
    const E2 = PC.Estate, u = E2.get(pt.unit) || { name: '别墅', no: '' }, owned = E2.owned(pt.unit);
    UI.showDialog({
      title: '🏡 林景园 · ' + u.no + ' 别墅',
      text: u.desc + '\n\n' + (owned
        ? '门牌旁边亮着一颗小绿灯：这套是你的。里面客厅、壁炉、书房、车库、泳池都能用。'
        : '门牌旁边贴着「在售」。售价 ' + U.money(u.price) + '，买下后可以直接搬进来住。'),
      options: [
        { label: owned ? '推门进去 →' : '看在售房源 / 买下 →', onPick: () => {
          if (owned) setScene('villa:' + pt.unit);
          else UI.openEstate();
          return null;
        } },
        { label: '绕着花园看一圈', onPick: () => { St.change('mood', 3); St.change('knowledge', 2); return '蔷薇修得真好。心情 +3，学识 +2'; } },
        { label: '拍张门牌', onPick: () => { St.addItem('postcard'); return '明信片 +1'; } }
      ]
    });
  }
  function tramGateDialog() {
    UI.showDialog({
      title: '🚋 有轨电车 · 进站口（房顶信息屏）',
      text: '尖顶小房子的房顶是块会滚的屏：\n' +
        'LINE 1 / AIR L1　◆　票价 2元　◆　晴 17°C SUNNY　◆　下一站 中华门 ZHONGHUA　◆　ENTRANCE ↑\n\n' +
        '房身里列着 景迂路 / 中华门 / 癸年路 / 爱民路 / 沁公园，\n底下是「迂龙有轨 YLoong AIR」和三个 ✓ 下一站 中华门。',
      options: [
        { label: '顺着 ENTRANCE 走到站台', onPick: () => { teleport(78 * C.TILE, 39 * C.TILE); return '沿着轨道边的雨棚走到了站台。'; } },
        { label: '拍下房顶信息屏', onPick: () => { St.addItem('postcard'); St.change('mood', 2); return '明信片 +1，心情 +2'; } },
        { label: '看清线路再走', onPick: () => { St.change('knowledge', 2); return 'LINE 1 / AIR L1，别和 S1、S2 搞混。学识 +2'; } }
      ]
    });
  }
  function tramPlatformDialog() {
    const d = St.d();
    UI.showDialog({
      title: '🚉 有轨电车 · 站台',
      text: '两条钢轨竖着穿过街区，夹在游趣和法院中间。\n' +
        '站台有雨棚、长椅、黄线和站牌，轨道尽头是 XXXXX 的道口护栏。\n' +
        '下一站 中华门 ZHONGHUA　·　票价 2 元。',
      options: [
        { label: '买票坐一圈（¥2）', onPick: () => {
          if (d.money < 2) return '差两块钱，车已经叮当开过去了。';
          d.money -= 2; d.minute += 11;
          St.change('mood', 8); St.change('knowledge', 2);
          St.addItem('yTramTicket'); St.logMsg('坐了一圈迂龙有轨电车 1号线');
          PC.Audio.sfx('coin'); UI.updateHUD();
          return '沿着轨道慢慢走了一圈，一路都是街景。心情 +8，学识 +2，电车票 +1';
        } },
        { label: '看看钢轨和枕木', onPick: () => { St.change('knowledge', 2); return '是真的有轨，不是画着玩的。学识 +2'; } },
        { label: '去道口拍张照', onPick: () => { St.addItem('postcard'); St.change('mood', 3); return '明信片 +1，心情 +3'; } }
      ]
    });
  }
  function underpassTeleport() {
    if (scene.id !== 'yulong') return;
    const to = player.x < 48 * C.TILE ? 90 * C.TILE : 5 * C.TILE;
    player.x = to; savePos();
    PC.Audio.sfx('scene');
    UI.toast('穿过迂龙地下通道，一下到了街对面');
  }

  /* ---------------- 林景园 · 家（公寓 / 别墅按名下房产切换） ---------------- */
  let homeFrom = 'street';
  function goHome() {
    if (intro.phase !== 'play') { UI.toast('先点「开始游戏」瞬移进街区'); return; }
    if (scene.id === 'home' || scene.id.indexOf('villa:') === 0) { UI.toast('已经在家了，床在左边，冰箱在右下'); return; }
    const E2 = PC.Estate, unit = E2.homeUnit();
    homeFrom = (scene.id === 'street' || scene.id === 'park' || scene.id === 'yulong') ? scene.id : districtFrom;
    const back = (scene.id === 'street' || scene.id === 'park' || scene.id === 'yulong')
      ? { x: player.x, y: player.y }
      : (STATION_EXIT[districtFrom] || { x: 47 * C.TILE + 8, y: 34 * C.TILE + 8 });
    setScene(E2.homeScene());
    returnPos = back;
    St.d().flags.home = true;
    if (PC.Play) PC.Play.mark('home');
    St.logMsg('回到 林景园 · ' + unit.name);
    UI.toast('🏠 林景园 · ' + unit.name + ' · 到家了');
    St.save();
  }
  function leaveHome() {
    // 家在林景园小区里，出门一律回到小区内对应的楼门 / 别墅门口
    const E2 = PC.Estate, unit = E2.homeUnit();
    scene = W.build('park'); player = E.createPlayer(scene);
    let p = null;
    if (unit.kind === 'villa') p = scene.points.find(q => q.id === 'villaDoor_' + unit.id);
    else if (unit.id === 'apt2') p = scene.points.find(q => q.id === 'apt5Door');
    else if (unit.id === 'apt3') p = scene.points.find(q => q.id === 'apt1Door');
    else p = scene.points.find(q => q.id === 'apt3Door');
    if (p) { player.x = p.x; player.y = p.y + 14; }
    t.night = St.isNight(); savePos();
    PC.Audio.sfx('exit');
    PC.Music.update('park', t.night, St.weather().id);
    UI.toast('出了家门，回到林景园小区');
    St.save();
  }
  function homeAction(pt) {
    const d = St.d();
    if (pt.act === 'phone') { PC.Phone.open('feed'); return; }
    if (pt.act === 'estate') { estateDialog(); return; }
    if (pt.act === 'study') {
      St.applyEff({ knowledge: pt.id === 'vStudy' ? 6 : 4, stamina: -2 });
      PC.Audio.sfx('use'); UI.toast('📚 翻了半本书 · 学识 +' + (pt.id === 'vStudy' ? 6 : 4));
      UI.updateHUD(); return;
    }
    if (pt.act === 'terrace') {
      St.applyEff({ mood: 8, knowledge: 2 });
      PC.Audio.sfx('scene'); UI.toast('🌇 露台上能看见整条曙光路 · 心情 +8 学识 +2');
      UI.updateHUD(); return;
    }
    if (pt.act === 'fire') {
      St.applyEff({ mood: 10, stamina: 3 });
      PC.Audio.sfx('use'); UI.toast('🔥 壁炉噼啪响 · 心情 +10 体力 +3');
      UI.updateHUD(); return;
    }
    if (pt.act === 'garage') {
      St.applyEff({ fame: 3, fitness: 2, stamina: -3 });
      PC.Audio.sfx('use'); UI.toast('🚗 把车擦得能照见人 · 声望 +3 体魄 +2');
      UI.updateHUD(); return;
    }
    if (pt.act === 'pool') {
      St.applyEff({ fitness: 5, mood: 6, stamina: -8 });
      PC.Audio.sfx('use'); UI.toast('🏊 游了两圈 · 体魄 +5 心情 +6 体力 -8');
      UI.updateHUD(); return;
    }
    if (pt.act === 'party') {
      if (d.money < 120) { UI.toast('办聚会要 ¥120，先去赚点'); PC.Audio.sfx('error'); return; }
      d.money -= 120; St.applyEff({ mood: 20, fame: 8, stamina: -5 });
      St.logMsg('在林景园别墅办了一场聚会');
      PC.Audio.sfx('coin'); UI.updateHUD();
      UI.toast('🎉 一屋子人聊到半夜 · 心情 +20 声望 +8'); return;
    }
    if (pt.act === 'sleep') {
      UI.showDialog({
        title: '🛏 林景园 · 睡一觉',
        text: '床单是洗过的，窗外能听见林景园的喷泉。\n睡到第二天 07:00，体力回满、心情 +18，跨天照常结算日息与分红。',
        options: [
          { label: '躺下睡到明早 →', onPick: () => {
            const r = St.sleepAtHome();
            PC.Audio.sfx('scene'); UI.updateHUD();
            return '睡了 ' + r.hours + ' 小时。现在是 D' + r.day + ' 07:00，体力 100，心情 +18。';
          } },
          { label: '再坐一会儿', onPick: () => null }
        ]
      });
      return;
    }
    if (pt.act === 'fridge') {
      const used = d.flags.homeFridgeDay === d.day;
      if (used) { UI.toast('冰箱今天已经被翻过一遍了，明天再来'); PC.Audio.sfx('error'); return; }
      d.flags.homeFridgeDay = d.day;
      St.applyEff({ stamina: 12, mood: 3 });
      St.logMsg('在家吃了点冰箱里的东西');
      PC.Audio.sfx('use'); UI.toast('🧊 吃到半盒饭团和一瓶水 · 体力 +12 心情 +3');
      UI.updateHUD(); return;
    }
    if (pt.act === 'piggy') {
      UI.showDialog({
        title: '🐷 林景园 · 存钱罐',
        text: '现金 ' + U.money(d.money) + '　罐里 ' + U.money(d.bank || 0) + '（与沁银行共用账户，过夜有 1.5% 日息）',
        options: [
          { label: '塞 ¥50 进去', onPick: () => {
            if (d.money < 50) return '现金不够，罐子晃了晃，空的。';
            d.money -= 50; d.bank = (d.bank || 0) + 50; St.save();
            PC.Audio.sfx('coin'); UI.updateHUD();
            return '存进 ¥50。罐子里累计 ' + U.money(d.bank) + '。';
          } },
          { label: '倒出 ¥50', onPick: () => {
            if ((d.bank || 0) < 50) return '罐子里还没有这么多。';
            d.bank -= 50; d.money += 50; St.save();
            PC.Audio.sfx('coin'); UI.updateHUD();
            return '倒出 ¥50，手里又厚了一点。';
          } },
          { label: '抱起来摇一摇', onPick: () => { St.change('mood', 2); return '哗啦哗啦。心情 +2'; } }
        ]
      });
      return;
    }
    if (pt.act === 'album') {
      const s = d.stats || {};
      UI.showDialog({
        title: '📷 林景园 · 相册与成就',
        text: 'D' + d.day + '　' + St.timeStr() + '\n' +
          '进店 ' + (s.shops || 0) + ' 次　买过 ' + (s.bought || 0) + ' 件　走过 ' + Math.round(s.steps || 0) + ' 步\n' +
          '累计赚 ' + U.money(d.earnedTotal || 0) + '　声望 ' + Math.round(d.fame) + '　学识 ' + Math.round(d.knowledge) + '\n' +
          '手机刷帖 ' + ((d.phone && d.phone.seen) || []).length + ' 条　外卖 ' + ((d.phone && d.phone.orders) || []).length + ' 单\n' +
          '小地图已探索 ' + PC.Minimap.exploredPct(scene) + '%（当前场景）',
        options: [
          { label: '把今天拍下来收好', onPick: () => { St.addItem('postcard'); St.change('mood', 2); return '明信片 +1，心情 +2'; } },
          { label: '合上相册', onPick: () => null }
        ]
      });
      return;
    }
  }
  function exitScene() {
    const was = scene.id;
    if (was.indexOf('floor:') === 0) {
      fadeTo(() => { setScene('campus', { spawn: { x: 28 * C.TILE, y: 13 * C.TILE } }); UI.toast('出了教学楼，回到校园前庭'); });
      return;
    }
    if (was.indexOf('sroom:') === 0) {
      const fl = Number(was.slice(6).split(':')[0]);
      fadeTo(() => { setScene('floor:' + fl); UI.toast('回到 ' + fl + 'F 过道'); });
      return;
    }
    if (was === 'home' || was.indexOf('villa:') === 0) { leaveHome(); return; }
    if (was === 'train') { alight(); return; }
    if (was === 'metro') {
      goDistrict(rideFrom, STATION_EXIT[rideFrom] || returnPos);
      UI.toast('上楼出站，回到' + (rideFrom === 'yulong' ? '迂龙路' : '曙光路'));
      PC.Audio.sfx('exit'); St.save(); return;
    }
    if (was === 'park') {
      goDistrict('street', { x: 80 * C.TILE, y: 55 * C.TILE + 10 });
      UI.toast('出了林景园小区大门，回到曙光路');
      PC.Audio.sfx('exit'); St.save(); return;
    }
    const back = was === 'campus' ? 'street' : districtFrom;
    goDistrict(back, returnPos);
    const msg = was === 'campus' ? '出了校门，回到曙光路'
      : was === 'underground' ? '⬆ 上楼回到 迂龙路 · 地下小吃街入口'
      : was === 'yuanyu' ? '出了 渊迂市渊迂中学 校门，回到迂龙路'
      : '回到' + (back === 'yulong' ? '迂龙路' : '曙光路');
    UI.toast(msg);
    PC.Audio.sfx('exit');
    St.save();
  }
  function teleport(x, y) {
    if (scene.id !== districtFrom) goDistrict(districtFrom, returnPos);
    player.x = x; player.y = y;
    savePos(); St.save();
  }

  /* ---------------- 交互分发 ---------------- */
  function dialogFor(title, text, extra) {
    UI.showDialog({ title, text, options: (extra || []).concat([{ label: '走开', onPick: () => null }]) });
  }
  function readAd(key) {
    const a = PC.ADS[key]; if (!a) return;
    const opts = [];
    opts.push({
      label: '记下这块牌子', onPick: () => {
        St.change('mood', 2);
        if (a.coupon) { St.applyEff({ addCoupon: a.coupon }); St.logMsg('记下了 ' + a.t + ' 的折扣'); return '获得「' + a.t + '」8 折券 ×1。下次结账自动抵用。'; }
        return '把「' + a.t + '」记进了街区地图册。心情 +2';
      }
    });
    if (a.event) opts.push({ label: '去挑战一局 →', onPick: () => { PC.Events.trigger(a.event); return '__keep'; } });
    opts.push({ label: '撕下一角带走', onPick: () => { PC.Events.trigger(); return '__keep'; } });
    dialogFor('📰 ' + a.t + ' / ' + a.en, a.body + '\n\n〔' + a.tag + '〕', opts);
  }
  function readBoard(key) {
    const b = PC.BOARDS[key]; if (!b) return;
    const map = { L1: 'jishe', L2: 'rent', L3: 'travel', L4: 'estate', L5: 'gym', R1: 'lock', R2: 'myworld', R3: 'rent', R4: 'bbq', R5: 'mart', POND: 'park' };
    dialogFor('📌 ' + b.t, b.body, [
      {
        label: '抄下折扣 / 电话', onPick: () => {
          St.change('knowledge', 2);
          const sid = map[key];
          if (sid && sid !== 'park' && U.chance(.45)) {
            St.applyEff({ addCoupon: sid });
            return '学识 +2，还摸到一张「' + (PC.SHOP_BY_ID[sid] ? PC.SHOP_BY_ID[sid].name : sid) + '」8 折券。';
          }
          return '把这几行字抄进了地图册。学识 +2';
        }
      },
      { label: '对着牌子发会儿呆', onPick: () => { St.change('mood', 4); return '格纸、蓝墨、被描了三遍的字。心情 +4'; } }
    ]);
  }
  /* 地面显示屏：读实时日期 / 天气 / 导航 / 轮播广告 */
  function screenDialog(pt) {
    const key = pt.board, d = St.d(), wth = St.weather();
    const idx = Math.floor(t.time / 4) % PC.SCREEN_ADS.length;
    const liveAd = PC.ADS[PC.SCREEN_ADS[idx]];
    let body = '📺 GROUND LED · 实时画面\n' +
      '日期　D' + d.day + '  ' + St.timeStr() + '\n' +
      '天气　' + wth.name + '  ' + d.temp + '°C\n' +
      '导航　' + PC.SCREEN_NAV.join(' / ') + '\n' +
      '轮播　' + liveAd.t + '〔' + liveAd.tag + '〕';
    if (key === 'DATE') body += '\n\n屏幕左上角的时间跟着游戏一起走，1 现实秒 = 4 游戏分钟。';
    else if (key === 'WEATHER') body += '\n\n天气会随机切换；下雨时整条街和这块屏幕一起变蓝。';
    else if (key === 'NAV') body += '\n\n箭头在滚动，路不会变。顺着「汾阳中学 · 新校门 50m」走，学校就在右上角。';
    else {
      const a = PC.ADS[key];
      if (a) body += '\n\n〔' + a.tag + '〕' + a.t + ' / ' + a.en + '\n' + a.body;
    }
    const opts = [
      { label: '把当前画面拍下来', onPick: () => { St.addItem('postcard'); St.change('mood', 2); return '明信片 +1，心情 +2'; } },
      { label: '等下一轮广告', onPick: () => { const nx = PC.ADS[PC.SCREEN_ADS[(idx + 1) % PC.SCREEN_ADS.length]]; St.change('mood', 3); return '轮到「' + nx.t + '」了。心情 +3'; } }
    ];
    const ad = PC.ADS[key];
    if (ad && ad.coupon) opts.push({
      label: '记下这条折扣', onPick: () => {
        St.applyEff({ addCoupon: ad.coupon });
        St.logMsg('记下地面屏折扣：' + ad.t);
        return '获得「' + ad.t + '」8 折券 ×1，下次结账自动抵用。';
      }
    });
    opts.push({ label: '离开屏幕', onPick: () => null });
    UI.showDialog({ title: '📺 ' + pt.label, text: body, options: opts });
  }
  function atmDialog() {
    UI.showDialog({
      title: '🏧 沁银行 ATM · 100m', text: '机器贴着「曙光路·寺口」的旧标签。设计稿说这里有 100m，其实走两步就到。',
      options: [
        { label: '存 ¥50', onPick: () => { const d = St.d(); if (d.money < 50) return '余额不足，机器吐出一张凭条。'; d.money -= 50; d.bank = (d.bank || 0) + 50; St.logMsg('在 ATM 存了 50 元'); St.save(); return '存入 ¥50。账户累计 ' + U.money(d.bank) + '。'; } },
        { label: '取 ¥50', onPick: () => { const d = St.d(); if ((d.bank || 0) < 50) return '账户里还没有这么多。'; d.bank -= 50; d.money += 50; St.logMsg('在 ATM 取了 50 元'); St.save(); return '取出 ¥50，手里又厚了一点。'; } },
        { label: '查余额', onPick: () => '现金 ' + U.money(St.d().money) + '，账户 ' + U.money(St.d().bank || 0) + '。' }
      ]
    });
  }
  function npcDialog(n) {
    const lines = PC.NPC_LINES[n.name] || ['「今天这条街挺热闹。」', '「慢慢逛，不着急。」'];
    const bond = PC.Play ? PC.Play.bondInfo(n.name) : { lv: 0, next: 10, max: false };
    UI.showDialog({
      title: '💬 ' + n.name + '　·　好感 Lv.' + bond.lv,
      text: U.pick(lines) + '\n\n【好感】' + (bond.max ? '已经满级了' : '再聊 ' + bond.next + ' 点升级') + '，升级会给现金 / 券 / 声望。',
      options: [
        { label: '再聊两句（好感 +2）', onPick: () => {
          St.change('mood', 4);
          const r = PC.Play ? PC.Play.bondTalk(n.name) : { line: '' };
          return '多站了一会儿。心情 +4　' + r.line;
        } },
        { label: '送份小礼物（¥15 · 好感 +8）', onPick: () => {
          const r = PC.Play ? PC.Play.bondGift(n.name) : { msg: '' };
          PC.Audio.sfx(r.ok ? 'coin' : 'error'); return r.msg;
        } },
        { label: '问问路', onPick: () => { St.change('knowledge', 3); return '「顺着蓝格子走，看到 5G 塔就拐弯。」学识 +3'; } },
        { label: '塞给对方一张传单', onPick: () => { PC.Events.trigger(); return '__keep'; } }
      ]
    });
  }
  function dispatch(pt) {
    PC.Audio.sfx('click');
    // 手上委托：走到对应地点按交互键即交付
    const gd = St.d();
    if (gd.gigActive && pt.id === gd.gigActive.target) {
      const res = PC.JobSystem.deliver(pt.id);
      if (res) {
        UI.showDialog({ title: '📋 委托交付', text: res, options: [{ label: '收下工钱 →', onPick: () => null }] });
        UI.updateHUD();
        return;
      }
    }
    switch (pt.type) {
      /* ---- 汾阳中学：黑屏进楼 / 六层 / 每一间都能进 ---- */
      case 'schoolBell': {
        const jump = (mi, label) => {
          St.d().minute = mi; t.night = St.isNight(); rushKey = '';
          St.save(); UI.toast(label);
          return '时间跳到 ' + St.timeStr() + '，抬头看看校门口的人。';
        };
        dialogFor('🕖 作息钟 · 汾阳中学',
          '早上 7:40 会有一大群学生从校门涌进来，沿前庭走向教学楼；\n下午 18:00 放学，学生们都从教学楼往校门走、回家。\n门口这块钟可以直接把时间跳过去看人潮。',
          [{ label: '跳到 7:40 看上学潮', onPick: () => jump(7 * 60 + 40, '🕖 7:40 · 上学潮开始') },
           { label: '跳到 18:00 看放学', onPick: () => jump(18 * 60, '🕕 18:00 · 放学回家') },
           { label: '回到上课时间', onPick: () => jump(10 * 60 + 20, '🔔 上课中 · 校园安静了') }]);
        break;
      }
      case 'schoolEnter':
        fadeTo(() => { setScene('floor:1'); UI.toast('🏫 走进教学行政楼 · 1F 中心花园 · 平面图 0010'); });
        break;
      case 'floorStairs':
        fadeTo(() => { setScene('floor:' + pt.to); UI.toast('🪜 ' + pt.to + 'F · ' + (pt.to === 6 ? '天台排球场' : '本层平面图')); PC.Audio.sfx('scene'); });
        break;
      case 'floorExit':
        fadeTo(() => { setScene('campus', { spawn: pt.campus || { x: 28 * C.TILE, y: 13 * C.TILE } }); UI.toast('出了教学楼，回到校园前庭'); });
        break;
      case 'schoolRoom':
        fadeTo(() => { setScene('sroom:' + pt.floor + ':' + pt.idx); UI.toast('🚪 ' + pt.label.replace('（按 A 进入）', '') + ' · 右门可从另一边出去'); PC.Audio.sfx('doorBell'); });
        break;
      case 'roomBack':
      case 'roomThrough':
        fadeTo(() => { setScene('floor:' + pt.floor, { spawn: pt.dest }); UI.toast(pt.type === 'roomThrough' ? '从房间另一边出来，回到过道' : '回到 ' + pt.floor + 'F 过道'); });
        break;
      case 'schoolNote':
        dialogFor('🗺 ' + (pt.label || '楼层导览').slice(0, 22), pt.text || '一层层逛过去，每间房都能进。',
          [{ label: '记进地图册', onPick: () => { St.change('knowledge', 2); return '学识 +2，这层楼记下了。'; } }]);
        break;
      case 'door': enterShop(pt.shop); break;
      case 'counter': UI.openShop(scene.shop ? scene.shop.id : 'mart'); break;
      case 'exit': exitScene(); break;
      case 'metro': enterMetro(); break;
      case 'ticket': ticketDialog(); break;
      case 'ride': chooseLine(); break;
      case 'alight': alight(); break;
      case 'carPhone': PC.Phone.open('feed'); break;
      case 'underpass': underpassTeleport(); break;
      case 'estate': estateDialog(); break;
      /* ---- 玩法系统 ---- */
      case 'questboard': if (PC.Play) PC.Play.open(); break;
      case 'gacha': {
        const r = PC.Play.gacha(); UI.toast(r.msg); PC.Audio.sfx(r.ok ? 'coin' : 'error'); break;
      }
      case 'arcadeGame': if (PC.Play) { UI.openPlay(); PC.Play.startGame('coins'); } break;
      case 'fishGame': if (PC.Play) { UI.openPlay(); PC.Play.startGame('fish'); } break;
      case 'photo': {
        const r = PC.Play.photo(pt.spot); UI.toast(r.msg); PC.Audio.sfx(r.ok ? 'use' : 'error'); break;
      }
      case 'estateGym': estateGymDialog(); break;
      case 'estatePond': estatePondDialog(); break;
      case 'aptDoor': aptDoorDialog(pt); break;
      case 'villaDoor': villaDoorDialog(pt); break;
      case 'park': setScene('park'); UI.toast('🏛 林景园 · LINJING GARDEN 小区'); break;
      case 'underground': setScene('underground'); UI.toast('⬇ 顺着斜线楼梯走下去，来到了地下小吃一条街'); break;
      case 'yuanyu': setScene('yuanyu'); UI.toast('🏫 顺着地上的大箭头，走进 渊迂市渊迂中学'); break;
      case 'tramGate': tramGateDialog(); break;
      case 'tramPlatform': tramPlatformDialog(); break;
      case 'screenY': screenYDialog(pt); break;
      case 'home': goHome(); break;
      case 'homeAction': homeAction(pt); break;
      case 'train': PC.Events.trigger('bus'); break;
      case 'vending': UI.openShop('vending'); break;
      case 'bus': PC.Events.trigger('bus'); break;
      case 'atm': atmDialog(); break;
      case 'sign': {
        const s = PC.SIGNS[pt.id];
        dialogFor('🪧 ' + (s ? s.t : pt.label), s ? s.body : '一块被蓝笔描过边的路牌。',
          [{ label: '拍下来收好', onPick: () => { St.addItem('postcard'); St.change('mood', 2); return '明信片 +1，心情 +2'; } },
          { label: '顺着箭头走', onPick: () => { PC.Events.trigger(); return '__keep'; } }]);
        break;
      }
      case 'screen': screenDialog(pt); break;
      case 'ad': readAd(pt.board); break;
      case 'board': readBoard(pt.board); break;
      case 'npc': npcDialog(pt.data); break;
      /* ---- 赚钱渠道 ---- */
      case 'jobs': UI.openJobs(pt.ctx, scene.label); break;
      case 'gigboard': UI.openGigBoard(); break;
      case 'earn': UI.openEarn(); break;
      case 'recycle': UI.openRecycle(); break;
      case 'stall': UI.openStall(); break;
      case 'pickup': {
        const r = PC.JobSystem.pickup(pt.item);
        UI.toast(r.msg);
        pt.taken = true;
        const i = scene.points.indexOf(pt); if (i >= 0) scene.points.splice(i, 1);
        const j = (scene.pickups || []).indexOf(pt); if (j >= 0) scene.pickups.splice(j, 1);
        currentTarget = null;
        break;
      }
      default: UI.toast('这里暂时什么也没有');
    }
  }
  function interact() {
    if (!started || UI.isOpen()) return;
    const pt = currentTarget || E.nearest(scene, player, C.INTERACT_R);
    if (!pt) { UI.toast('附近没有能交互的东西，走近发光的小标记'); PC.Audio.sfx('error'); return; }
    dispatch(pt);
  }

  /* ---------------- 瞬移入场 ---------------- */
  function beginIntro() {
    PC.Audio.init();
    // 首次点击后解锁音频，随后按场景自动接管配乐（未配置音源时保持静默）
    PC.Music.init(); PC.Music.unlock();
    PC.Music.update('street', St.isNight(), St.weather().id);
    $('help').classList.add('hidden');
    intro.phase = 'teleport'; intro.t = 0;
    intro.particles = [];
    for (let i = 0; i < 90; i++) intro.particles.push({
      a: U.rand(0, Math.PI * 2), r: U.rand(70, 300), s: U.randInt(2, 5),
      c: U.pick(['#ffd25a', '#7fe0c8', '#ffffff', '#a9b6ff', '#5b4fb3']), d: U.rand(0, .3)
    });
    [330, 440, 554, 659, 880, 1170].forEach((f, i) => setTimeout(() => PC.Audio.beep(f, .1, 'square', .035), i * 95));
  }
  function updateIntro(dt) {
    if (intro.phase === 'title' || intro.phase === 'play') return;
    intro.t += dt;
    if (intro.phase === 'teleport' && intro.t >= 1.35) {
      intro.phase = 'camera'; intro.t = 0;
      const f = followCam();
      intro.to = f;
      // 镜头从右上角「渊迂市汾阳中学」方向飞回主角
      const maxX = Math.max(0, scene.w * C.TILE - C.VIEW_W);
      intro.from = { x: U.clamp(scene.w * C.TILE - C.VIEW_W, 0, maxX), y: 0 };
      PC.Audio.sfx('ok');
    } else if (intro.phase === 'camera' && intro.t >= 1.7) {
      intro.phase = 'play'; intro.t = 0; started = true;
      $('app').classList.remove('intro-hide');
      if (St.d().firstPlay) {
        St.d().firstPlay = false;
        St.logMsg('第一天 · ' + (scene.id === 'yulong' ? '迂龙路 17°C 晴' : '曙光路 9°C 晴') + '，口袋里有 ' + U.money(St.d().money));
        UI.toast('瞬移完成！摇杆移动 · A 交互 · C 看两张蓝图');
      } else St.logMsg('又回到' + (scene.id === 'yulong' ? '迂龙路' : '曙光路') + '了。');
      St.save();
      UI.updateHUD();
    }
  }
  function drawIntroFx() {
    const VW = C.VIEW_W, VH = C.VIEW_H, k = C.TEXT_SCALE || 1;
    if (intro.phase === 'teleport') {
      const p = U.clamp(intro.t / 1.35, 0, 1);
      const px = player.x - cam.x, py = player.y - cam.y;
      // 暗场 → 白闪 → 淡出
      ctx.fillStyle = 'rgba(8,10,30,' + (.55 * (1 - p)).toFixed(3) + ')'; ctx.fillRect(0, 0, VW, VH);
      let f = 0;
      if (p < .16) f = p / .16 * .72;
      else if (p < .46) f = .72;
      else f = Math.max(0, 1 - (p - .46) / .42) * .72;
      ctx.fillStyle = 'rgba(238,250,255,' + f.toFixed(3) + ')'; ctx.fillRect(0, 0, VW, VH);
      // 传送网格
      ctx.strokeStyle = 'rgba(70,120,200,' + (.35 * (1 - p * .6)).toFixed(3) + ')'; ctx.lineWidth = 1;
      const gs = 16 + p * 18;
      for (let gx = (t.time * 30) % gs; gx < VW; gx += gs) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, VH); ctx.stroke(); }
      for (let gy = (t.time * 20) % gs; gy < VH; gy += gs) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(VW, gy); ctx.stroke(); }
      // 像素粒子向主角收拢
      intro.particles.forEach(q => {
        const k = U.clamp((p - q.d) / (1 - q.d), 0, 1), e = 1 - Math.pow(1 - k, 3);
        const r = q.r * (1 - e);
        D.rect(ctx, px + Math.cos(q.a) * r, py + Math.sin(q.a) * r * .6, q.s, q.s, q.c);
      });
      // 光柱与落地环
      if (p > .28) {
        const a = U.clamp((p - .28) / .3, 0, 1) * .8;
        ctx.fillStyle = 'rgba(255,245,190,' + (a * .35).toFixed(3) + ')';
        ctx.fillRect(px - 9, py - 74, 18, 74);
        D.rect(ctx, px - 5, py - 70, 10, 66, 'rgba(255,255,255,' + a.toFixed(3) + ')');
        ctx.strokeStyle = 'rgba(255,210,90,' + a.toFixed(3) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(px, py, 10 + p * 40, 4 + p * 14, 0, 0, Math.PI * 2); ctx.stroke();
      }
      D.shadowText(ctx, '无限極人生  /  INFINITY LIVES', VW / 2, 16 * k, 9 * k, '#2a2a5e', 'center');
      D.shadowText(ctx, p < .5 ? '瞬 移 中 …' : '坐标锁定 · 曙光路', VW / 2, VH - 34 * k, 10 * k, '#2a2a5e', 'center');
    } else if (intro.phase === 'camera') {
      const p = U.clamp(intro.t / 1.7, 0, 1);
      ctx.fillStyle = 'rgba(150,225,255,' + ((1 - p) * .18).toFixed(3) + ')'; ctx.fillRect(0, 0, VW, VH);
      const px = VW / 2, py = VH / 2;
      ctx.strokeStyle = 'rgba(255,210,90,' + ((1 - p) * .75).toFixed(3) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 12 + p * 150, 0, Math.PI * 2); ctx.stroke();
      // 取景框四角
      const s = 26 + (1 - p) * 40, col = 'rgba(255,210,90,' + (.4 + .5 * p).toFixed(3) + ')';
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(q => {
        const cx = px + q[0] * s, cy = py + q[1] * s;
        D.rect(ctx, cx - (q[0] > 0 ? 8 : 0), cy - (q[1] > 0 ? 1 : 0), 8, 1, col);
        D.rect(ctx, cx - (q[0] > 0 ? 1 : 0), cy - (q[1] > 0 ? 8 : 0), 1, 8, col);
      });
      D.shadowText(ctx, '◉ 镜头锁定 · 主角', VW / 2, 16 * k, 9 * k, '#fff3c4', 'center');
      D.shadowText(ctx, '从 渊迂市汾阳中学 → 曙光路 · 中心街', VW / 2, VH - 30 * k, 8 * k, '#fff3c4', 'center');
    }
  }

  /* ---------------- 输入 ---------------- */
  const MOVE = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', w: 'u', s: 'd', a: 'l', d: 'r', W: 'u', S: 'd', A: 'l', D: 'r' };
  window.addEventListener('keydown', e => {
    if (intro.phase !== 'play') return;
    if (MOVE[e.key]) { keys[MOVE[e.key]] = true; e.preventDefault(); }
    if (e.key === 'Shift') keys.run = true;
    if (e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'j' || e.key === 'J') { e.preventDefault(); interact(); }
    if (e.key === 'i' || e.key === 'I' || e.key === 'b' || e.key === 'B') { e.preventDefault(); UI.toggleBag(); }
    if (e.key === 'm' || e.key === 'M' || e.key === 'c' || e.key === 'C') { e.preventDefault(); UI.toggleBlueprint(); }
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); UI.toggleMusic(); }
    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); UI.togglePhone(); }
    if (e.key === 't' || e.key === 'T') { e.preventDefault(); UI.togglePlay(); }
    if (e.key === 'D') UI.openLog();
  });
  window.addEventListener('keyup', e => {
    if (MOVE[e.key]) keys[MOVE[e.key]] = false;
    if (e.key === 'Shift') keys.run = false;
  });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  function getInput() {
    let dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + UI.joy.dx;
    let dy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0) + UI.joy.dy;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    return { dx, dy, run: !!keys.run || UI.joy.run };
  }

  /* ---------------- 天气 / 光照 ---------------- */
  function overlay() {
    const w = St.weather();
    if (St.isNight()) { ctx.fillStyle = 'rgba(11,16,48,.46)'; ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H); }
    if (w.tint) { ctx.fillStyle = w.tint; ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H); }
    if (St.isRain()) {
      ctx.strokeStyle = 'rgba(190,215,255,.42)'; ctx.lineWidth = 1;
      for (let i = 0; i < 46; i++) {
        const x = (U.noise2(i, 1, 3) * C.VIEW_W + t.time * 130) % C.VIEW_W;
        const y = (U.noise2(i, 2, 4) * C.VIEW_H + t.time * 260) % C.VIEW_H;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 9); ctx.stroke();
      }
    }
    if (w.id === 'cold') {
      ctx.fillStyle = 'rgba(235,245,255,.55)';
      for (let i = 0; i < 34; i++) {
        const x = (U.noise2(i, 5, 6) * C.VIEW_W + t.time * 18) % C.VIEW_W;
        const y = (U.noise2(i, 7, 8) * C.VIEW_H + t.time * 28) % C.VIEW_H;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // 暗角
    const g = ctx.createLinearGradient(0, 0, 0, C.VIEW_H);
    g.addColorStop(0, 'rgba(10,11,35,.16)'); g.addColorStop(.25, 'rgba(10,11,35,0)');
    g.addColorStop(.82, 'rgba(10,11,35,0)'); g.addColorStop(1, 'rgba(10,11,35,.18)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  }

  /* ---------------- 主循环 ---------------- */
  function frame(ts) {
    const dt = Math.min((ts - last) / 1000 || .016, .05);
    last = ts; t.time += dt;
    updateIntro(dt);

    if (started) {
      /* 列车进站：自动播报一次，车门灯转绿，玩家走到车门按 A 下车 */
      t.arrived = scene.id === 'train' && !!arriveAt && performance.now() >= arriveAt;
      if (t.arrived && !arriveHinted) {
        arriveHinted = true;
        const to = (scene.ride && scene.ride.to) === 'yulong' ? '迂龙路' : '曙光路站';
        UI.toast('🚉 ' + to + ' 到了 · 车门已开，走到车门按 A 下车');
        PC.Audio.sfx('ok');
        St.logMsg('列车进站：' + to + ' · 请先下后上');
      }
      const open = UI.isOpen();
      if (!open) {
        const input = getInput();
        E.updatePlayer(player, input, dt, scene);
        E.updateNPCs(scene, dt, t);
        if (player.moving) St.d().stats.steps += dt * (player.run ? 2 : 1);
        if (player.moving && PC.Play) PC.Play.steps(dt * (player.run ? 2 : 1));
        PC.Events.update(dt, player.moving, open, scene.id);
      }
      St.tick(dt, player.run && player.moving);
      syncSchoolRush();                      // 7:40 上学潮 / 18:00 放学潮
      PC.Phone.tick();                       // 外卖按游戏时间送达
      PC.Minimap.tick(scene, player, t);     // 揭开迷雾 + 重绘小地图
      currentTarget = E.nearest(scene, player, C.INTERACT_R);
      t.targetId = currentTarget ? currentTarget.id : null;
      saveTimer += dt; hudTimer += dt;
      if (saveTimer > 5) { saveTimer = 0; savePos(); St.save(); }
      if (hudTimer > .2) {
        hudTimer = 0; UI.updateHUD(); t.night = St.isNight();
        // 白天↔夜晚、晴↔雨都会让 resolve 换槽位，Music.update 负责淡入淡出
        PC.Music.update(musicKey(scene.id), t.night, St.weather().id);
      }
    }

    // 镜头：入场时从右上角学校方向缓动飞回主角
    if (intro.phase === 'camera') {
      const p = U.clamp(intro.t / 1.7, 0, 1), e = 1 - Math.pow(1 - p, 3);
      cam.x = U.lerp(intro.from.x, intro.to.x, e);
      cam.y = U.lerp(intro.from.y, intro.to.y, e);
    } else {
      const f = followCam(); cam.x = f.x; cam.y = f.y;
    }

    // 绘制
    ctx.clearRect(0, 0, C.VIEW_W, C.VIEW_H);
    t.night = St.isNight();
    // 进校园 / 进楼内后镜头拉近，学校显得更大
    const z = (scene && scene.zoom) || 1;
    ctx.save();
    if (z !== 1) ctx.scale(z, z);
    W.render(ctx, scene, cam, t);
    ctx.save();
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
    E.draw(ctx, scene, player, t);
    ctx.restore();
    if (started && !UI.isOpen() && currentTarget) E.drawHint(ctx, player, currentTarget, t, cam, C.VIEW_W / z);
    ctx.restore();
    overlay();
    if (intro.phase === 'teleport' || intro.phase === 'camera') drawIntroFx();
    // 黑屏转场
    if (fade.dir === 1) {
      fade.t += dt; fade.a = U.clamp(fade.t / .26, 0, 1);
      if (fade.a >= 1) { fade.dir = 2; fade.t = 0; const cb = fade.cb; fade.cb = null; if (cb) cb(); }
    } else if (fade.dir === 2) {
      fade.t += dt; fade.a = 1 - U.clamp(fade.t / .34, 0, 1);
      if (fade.a <= 0) { fade.a = 0; fade.dir = 0; }
    }
    if (fade.a > 0) { ctx.fillStyle = 'rgba(6,8,20,' + fade.a.toFixed(3) + ')'; ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H); }
    requestAnimationFrame(frame);
  }

  /* ---------------- 启动 ---------------- */
  St.init();
  const saved = St.d().pos;
  const E0 = PC.Estate; E0.ensure(St.d());
  let startId = 'street';
  if (saved && saved.scene) {
    const sid = saved.scene;
    if (['street', 'yulong', 'park', 'home', 'campus', 'metro', 'underground', 'yuanyu'].indexOf(sid) >= 0) startId = sid;
    else if (sid.indexOf('floor:') === 0 || sid.indexOf('sroom:') === 0) startId = sid;
    else if (sid.indexOf('villa:') === 0 && E0.owned(sid.slice(6))) startId = sid;
  }
  scene = W.build(startId);
  player = E.createPlayer(scene);
  districtFrom = startId === 'yulong' ? 'yulong' : 'street';
  homeFrom = 'park';
  if (saved && saved.scene === startId && saved.x && saved.y) { player.x = saved.x; player.y = saved.y; }
  const f0 = followCam(); cam.x = f0.x; cam.y = f0.y;
  UI.setTicker('');

  UI.init({
    start: beginIntro,
    interact,
    hasTarget: () => !!currentTarget
  });

  PC.Main = {
    get scene() { return scene; }, get player() { return player; },
    teleport, goStreet, goDistrict, setScene, enterShop, exitScene, interact, goHome, leaveHome,
    enterMetro, chooseLine, board, alight, forceArrive, ticketDialog, underpassTeleport,
    tramGateDialog, tramPlatformDialog, screenYDialog,
    estateDialog, estateGymDialog, estatePondDialog, aptDoorDialog, villaDoorDialog,
    get districtFrom() { return districtFrom; }, get rideFrom() { return rideFrom; },
    get started() { return started; }, get intro() { return intro; }, fadeTo, syncSchoolRush, schoolPhase
  };
  requestAnimationFrame(frame);
})();
