/* phone.js —— 无限極人生 OS：一台真的手机
 * 桌面 + 12 个 App（街区 / 外卖 / 相机 / 音乐 / 相册 / 家 / 目标 / 游戏 / 背包 / 赚钱 / 房产 / 设置）
 * 按 P 或点 HUD 右上 📱 打开。所有数据存进 St.d().phone，随自动存档走。
 *
 * 🎵 音乐 App 会接管游戏自动配乐（见 music-player.js）：
 *    选歌后换场景不打断，点「关掉音乐 / 恢复游戏配乐」立刻回到原本按场景播放的那首。
 */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U, St = PC.State;
  const $ = id => document.getElementById(id);

  /* ---------------- 街区社区帖子池 ---------------- */
  const POSTS = [
    { id: 'p01', u: '曙光路观察员', a: '🚌', tag: '街区', txt: '92 路今天又停在过街通道口，司机说「就等一小会儿」，已经二十分钟了。' },
    { id: 'p02', u: '蓝草咖啡中毒者', a: '☕', tag: '麦妃咖啡', txt: 'M-Coffee 蓝草咖啡 7 折是真的，我连喝三天了，老板已经认识我了。' },
    { id: 'p03', u: '汾阳中学值日生', a: '📚', tag: '学校', txt: 'PASS ALL EXAM! 麦芬文具的模拟卷五本装，做完感觉自己能考上任何东西。' },
    { id: 'p04', u: '住在林景园', a: '🏠', tag: '生活', txt: '林景园旁边那排小屋真安静，晚上能听见喷泉的水声，就是外卖不太好找门牌。' },
    { id: 'p05', u: '齐阵夜班', a: '🏪', tag: '齐阵', txt: '24H 关东煮今天汤底换了新的，¥7 饭团还是永远的神。' },
    { id: 'p06', u: '地面屏维修工', a: '📺', tag: '地面屏', txt: '中间那块屏今天又滚了一遍「渊迂市汾阳中学 50m」，其实走过去要 80m，别问我怎么知道的。' },
    { id: 'p07', u: '电玩厅常客', a: '🕹️', tag: '无限起程', txt: 'INFINITY LIVES 的霓虹修好了，闪起来像整条街都在续命。' },
    { id: 'p08', u: '找房的第 37 天', a: '🏘️', tag: '户连房产', txt: '290 万 / 330 万 / 470 万，看了三遍沙盘，最后还是回林景园睡了一觉。' },
    { id: 'p09', u: '沁银行排队中', a: '🏧', tag: '银行', txt: 'ATM 上贴着「100m」，可它就在我面前。1.5% 日息我存了五十块试试。' },
    { id: 'p10', u: '遛狗的上班族', a: '🐕', tag: '林景园', txt: '公园水池边捡到三个瓶子，回收箱那边今天价格不错，狗也挺开心。' },
    { id: 'p11', u: '旺铺招租本人', a: '📌', tag: '招租', txt: '12347769，卷帘门只拉了一半，纸箱还在，分红是真的（认真脸）。' },
    { id: 'p12', u: '9°C 穿短袖', a: '🌦️', tag: '天气', txt: '曙光路今天 9°C 晴，地面屏说会下雨，我赌它不会。' },
    { id: 'p13', u: '地下街赶车人', a: '🚇', tag: '地铁', txt: 'ENTRANCE ①② 的灯又闪了，列车进站那一下莫名很治愈。' },
    { id: 'p14', u: '消遣书屋店员', a: '📖', tag: '书屋', txt: '有人把「街区地图册」买回去当枕头，我不评价，但确实挺厚。' },
    { id: 'p15', u: '刚下班', a: '🍢', tag: '蒸汽烤肉', txt: '9AM–3AM 不是写着玩的，凌晨那轮真的有折扣，别问我为什么知道。' },
    { id: 'p16', u: '新搬来的', a: '📱', tag: '生活', txt: '刚发现手机能直接叫外卖送到林景园门口，这条街比我想的方便多了。' },
    { id: 'p17', u: '迂龙路观察员', a: '🚇', tag: '地铁', txt: '曙光路站现在真的能坐车了。1 号线两站到迂龙路，票价 2 元，车厢里还能刷手机。' },
    { id: 'p18', u: '大排档掌勺的', a: '🍗', tag: '迂龙路', txt: '今日爆款还是迂龙三黄鸡，32 元一份。别问为什么每天都「今日」，招牌就这么写的。' },
    { id: 'p19', u: '等 921 路的人', a: '🚌', tag: '站牌', txt: '屏上写下一班车 3min / 13min / 20min，我每次都刚好赶上 20 那班。天气降温，记得保暖添衣。' },
    { id: 'p20', u: '法院门口的法警', a: '⚖️', tag: '迂龙路', txt: '立案 Register 在左窗口，判决查询 Judgement 在右窗口。为人民服务。' },
    { id: 'p21', u: '星降电信营业员', a: '📶', tag: '迂龙路', txt: '办手机号、换电话卡、网络办理都在 1L 那间。顺带一提，这边 17°C，比曙光路暖。' },
    { id: 'p22', u: '举着牌子的骑手', a: '🪧', tag: '迂龙路', txt: 'We are hiring! 我举了一上午，S2 线中华门方向的列车过去八趟了。' },
    { id: 'p23', u: '赶车的上班族', a: '🚉', tag: '地铁', txt: '「道路千万条，安全第一条」写在站台墙上，请先下后上。到迂龙路记得走地下通道过街。' },
    { id: 'p24', u: '地下街摊主', a: '🍢', tag: '地下街', txt: '左上角那串斜线不是装饰，是往下去的楼梯。地口圆牌底下就是我们小吃一条街，蒸笼一天没停过。' },
    { id: 'p25', u: '渊迂中学值日生', a: '🏫', tag: '学校', txt: '地上那支空心大箭头指向的是渊迂市渊迂中学，不是曙光路那所汾阳中学。已经有人走错三次了。' },
    { id: 'p26', u: '有轨电车司机', a: '🚋', tag: '轨道', txt: '我们真的有轨，两条钢轨竖着夹在游趣和法院中间，旁边就是站台。进站口房顶那块屏会滚「下一站 中华门」。' },
    { id: 'p27', u: '霍尔德比店员', a: '👗', tag: '商店', txt: '我们和星辰网吧旁边那两格是同一家，一楼门面、二楼整排礼服。UPSTAIRS HONOR! 箭头别看成两家店。' },
    { id: 'p28', u: '林景园物业', a: '🏛', tag: '小区', txt: '小区大门换成西洋风了：罗马柱、三角山花、铁艺门、门卫亭。1/3/5 栋是居民楼，A/B/C 座是别墅，公寓和别墅都能买。' },
    { id: 'p29', u: '住在 3 栋 502', a: '🏠', tag: '生活', txt: '我家就在这栋楼的五楼。下楼是中央水池和栈道，往西是健身区，往东是售楼处，出门右拐才是曙光路。' },
    { id: 'p30', u: '刚买了 B 座', a: '🏡', tag: '房产', txt: '别墅里壁炉、书房、车库、泳池全能用，办场聚会还能涨声望。多余的房子挂出去出租，每天跨天自动收租。' }
  ];
  PC.PHONE_POSTS = POSTS;

  const RIDERS = ['小齐', '阿阵', '92 路顺路骑手', '麦妃跑腿', '林景园老李', '无限起程夜班'];
  const QUOTES = [
    '「慢慢逛，不着急。」', '「今天这条街挺热闹。」', '「1 实秒 = 4 分钟，别赶。」',
    '「曙光路 9°C，迂龙路 17°C。」', '「路是走出来的，不是看出来的。」',
    '「回家睡一觉，明天又是新的一天。」', '「无限極人生 · INFINITY LIVES」'
  ];
  const FILTERS = [
    { name: '原色', css: 'none' },
    { name: '暖阳', css: 'sepia(.45) saturate(1.35) brightness(1.05)' },
    { name: '夜色', css: 'brightness(.78) hue-rotate(195deg) saturate(1.2)' },
    { name: '黑白', css: 'grayscale(1) contrast(1.22)' }
  ];
  const PHOTO_ICONS = ['🌇', '🚉', '🏛', '⛲', '🚋', '🍢', '🚌', '🌃', '📮', '🌉'];

  /* ---------------- 桌面 App 表 ---------------- */
  const APPS = [
    { id: 'feed',     icon: '📰', name: '街区',   color: '#e2564d', desc: '刷帖 · 30 条' },
    { id: 'delivery', icon: '🛵', name: '外卖',   color: '#ffb347', desc: '送到你所在的地方' },
    { id: 'camera',   icon: '📷', name: '相机',   color: '#4fb8a8', desc: '取景 / 滤镜 / 打卡' },
    { id: 'music',    icon: '🎵', name: '音乐',   color: '#c05b86', desc: '全曲库 · 接管配乐' },
    { id: 'album',    icon: '🖼️', name: '相册',   color: '#5b4fb3', desc: '拍过的都在这' },
    { id: 'home',     icon: '🏠', name: '家',     color: '#7fe0c8', desc: '一键回林景园' },
    { id: 'goals',    icon: '🎯', name: '目标',   color: '#ffd25a', desc: '等级 / 挑战 / 图鉴' },
    { id: 'games',    icon: '🎮', name: '游戏',   color: '#8fb8ff', desc: '抢金币 / 捞锦鲤' },
    { id: 'bag',      icon: '🎒', name: '背包',   color: '#d99b1f', desc: '东西都在这儿' },
    { id: 'earn',     icon: '💰', name: '赚钱',   color: '#4caf7d', desc: '九条路子' },
    { id: 'estate',   icon: '🏛', name: '房产',   color: '#9a6b4f', desc: '买 / 搬家 / 收租' },
    { id: 'settings', icon: '⚙️', name: '设置',   color: '#8f92b5', desc: '声音 / 壁纸' }
  ];
  const DOCK = ['feed', 'delivery', 'music', 'camera'];
  const APP_BY_ID = Object.create(null); APPS.forEach(a => APP_BY_ID[a.id] = a);

  /* ---------------- 手机存档 ---------------- */
  function P() {
    const d = St.d();
    if (!d.phone) d.phone = { feed: [], seen: [], likes: 0, comments: 0, shares: 0, orders: [], pending: null };
    const p = d.phone;
    if (!Array.isArray(p.feed)) p.feed = [];
    if (!Array.isArray(p.seen)) p.seen = [];
    if (!Array.isArray(p.orders)) p.orders = [];
    if (!Array.isArray(p.album)) p.album = [];
    if (!Array.isArray(p.fav)) p.fav = [];
    if (typeof p.wall !== 'number') p.wall = 0;
    return p;
  }

  function rollFeed() {
    const p = P();
    const ids = U.shuffle(POSTS.map(q => q.id)).slice(0, 5);
    p.feed = ids;
    p.seen = p.seen.concat(ids.filter(i => p.seen.indexOf(i) < 0)).slice(-80);
    St.save();
    return ids;
  }
  function byId(id) { return POSTS.find(q => q.id === id); }
  function menu() {
    const out = [];
    Object.keys(PC.ITEMS).forEach(id => {
      const it = PC.ITEMS[id];
      if (!it || it.tag !== 'food' || it.price > 60) return;
      const shop = (PC.SHOPS || []).find(s => (s.items || []).indexOf(id) >= 0);
      out.push({ id, it, shop: shop ? shop.name : '街区小店', shopId: shop ? shop.id : '' });
    });
    return out;
  }
  function absMin() { const d = St.d(); return d.day * 1440 + d.minute; }
  function fmt(s) {
    s = Math.max(0, Math.floor(s));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  /* ---------------- 屏幕状态 ---------------- */
  let screen = 'desk';        // 'desk' 或某个 App id
  let camFilter = 0;
  let gameKind = 'coins';
  let musicQuery = '';
  let tickCount = 0;
  let camFlashPending = false;

  function open(which) {
    screen = (which && APP_BY_ID[which]) ? which : 'desk';
    PC.Audio.sfx('bag');
    draw();
  }
  function toggle() {
    const UI = PC.UI;
    if (UI.panelOpen && $('panelTitle').textContent.indexOf('📱') >= 0) { UI.closePanel(); return; }
    open('desk');
  }
  function go(id) {
    if (screen === 'games' && PC.Play) PC.Play.stopGame();
    screen = APP_BY_ID[id] ? id : 'desk';
    PC.Audio.sfx('click');
    draw();
  }

  /* ---------------- 外壳 ---------------- */
  function statusBar() {
    const d = St.d(), M = PC.Music;
    const batt = Math.max(18, 96 - (Math.floor(absMin() / 40) % 62));
    const manual = M && M.isManual && M.isManual();
    return '<div class="ph-status"><span id="phClock">' + St.timeStr() +
      '</span><span>' + (manual ? '🎵 ' : '') + '5G ▮▮▮　🔋 ' + batt + '%</span></div>' +
      '<div class="ph-wallet">📱 无限極人生 OS · 钱包 <b>' + U.money(d.money) +
      '</b>　体力 ' + Math.round(d.stamina) + '</div>';
  }
  function appBar(a) {
    return '<div class="ph-appbar"><button class="mini" data-ph="desk">← 桌面</button>' +
      '<b>' + a.icon + ' ' + U.escape(a.name) + '</b><span>' + U.escape(a.desc) + '</span></div>';
  }
  function homeBar() {
    return '<button class="ph-homebar" data-ph="desk">⌂　回桌面</button>';
  }
  function dockHTML() {
    return '<div class="ph-dock">' + DOCK.map(id => {
      const a = APP_BY_ID[id];
      return '<button class="ph-dock-app' + (screen === id ? ' on' : '') + '" data-ph="app:' + id + '">' +
        a.icon + '<small>' + a.name + '</small></button>';
    }).join('') + '</div>';
  }

  /* ---------------- 🏠 桌面 ---------------- */
  function badge(id) {
    const p = P(), d = St.d();
    if (id === 'delivery' && p.pending) return '1';
    if (id === 'feed') {
      if (!p.feed.length) return '新';
      return '';
    }
    if (id === 'goals' && PC.Play) {
      const q = PC.Play.ensure(d), n = q.challenges.filter(c =>
        !q.claimed.includes(c) && PC.Play.progress(d, PC.Play.CHALLENGES.find(x => x.id === c) || { goal: 1, stat: 'shops' }) >=
        (PC.Play.CHALLENGES.find(x => x.id === c) || { goal: 1 }).goal).length;
      return n ? String(n) : '';
    }
    if (id === 'music' && PC.Music && PC.Music.isManual && PC.Music.isManual()) return '♫';
    if (id === 'album' && p.album.length) return String(Math.min(9, p.album.length));
    return '';
  }
  function deskHTML() {
    const p = P(), d = St.d(), night = St.isNight();
    const scene = (PC.Main && PC.Main.scene) ? PC.Main.scene.label : '曙光路';
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.day % 7];
    const q = QUOTES[(d.day * 3 + Math.floor(d.minute / 180)) % QUOTES.length];
    let h = '<div class="ph-wall wall' + (p.wall % 4) + (night ? ' night' : '') + '">' +
      '<div class="ph-wall-date">D' + d.day + ' · 周' + week + '</div>' +
      '<div class="ph-wall-big">INFINITY LIVES</div>' +
      '<div class="ph-wall-sub">' + U.escape(scene) + '　' + St.weather().name + ' ' + St.tempAt() + '°C</div>' +
      '<div class="ph-wall-quote">' + U.escape(q) + '</div></div>';

    // 通知卡
    let notices = '';
    if (p.pending) {
      notices += '<button class="ph-notify" data-ph="app:delivery">🛵 <b>外卖在路上</b> · ' +
        U.escape(PC.ITEMS[p.pending.item].name) + '　约 ' + Math.max(0, Math.ceil(p.pending.at - absMin())) + ' 分钟后到 ›</button>';
    }
    if (PC.Music && PC.Music.isManual && PC.Music.isManual()) {
      const np = PC.Music.nowPlaying();
      notices += '<button class="ph-notify music" data-ph="app:music">🎵 <b>正在播放 · ' + U.escape(np.name) +
        '</b>　手动接管中，点「关掉音乐」可恢复游戏配乐 ›</button>';
    }
    if (PC.Play) {
      const q2 = PC.Play.ensure(d);
      const can = q2.challenges.filter(c => {
        const ch = PC.Play.CHALLENGES.find(x => x.id === c);
        return ch && !q2.claimed.includes(c) && PC.Play.progress(d, ch) >= ch.goal;
      }).length;
      if (can) notices += '<button class="ph-notify" data-ph="app:goals">🎯 <b>' + can + ' 条今日挑战可领奖</b> ›</button>';
    }
    if (notices) h += '<div class="ph-notices">' + notices + '</div>';

    h += '<div class="ph-grid">' + APPS.map(a => {
      const b = badge(a.id);
      return '<button class="ph-app" data-ph="app:' + a.id + '" style="--appc:' + a.color + '">' +
        (b ? '<span class="ph-badge">' + b + '</span>' : '') +
        '<span class="ph-app-ic">' + a.icon + '</span>' +
        '<span class="ph-app-nm">' + U.escape(a.name) + '</span></button>';
    }).join('') + '</div>';
    return h;
  }

  /* ---------------- 原有的三个 App 内容 ---------------- */
  function feedHTML() {
    const p = P();
    if (!p.feed.length) rollFeed();
    let h = '<div class="ph-hint">下拉到底点「刷一波新的」，每条都能点赞 / 评论 / 转发。</div>';
    p.feed.forEach(id => {
      const q = byId(id); if (!q) return;
      const liked = p['like_' + id] ? ' ♥' : '';
      h += '<div class="ph-post">' +
        '<div class="ph-user"><span class="ph-av">' + q.a + '</span><b>' + U.escape(q.u) + '</b>' +
        '<span class="ph-tag">' + U.escape(q.tag) + '</span></div>' +
        '<div class="ph-text">' + U.escape(q.txt) + '</div>' +
        '<div class="ph-ops">' +
        '<button class="mini" data-ph="like:' + id + '">👍 赞' + liked + '</button>' +
        '<button class="mini" data-ph="comment:' + id + '">💬 评</button>' +
        '<button class="mini" data-ph="share:' + id + '">↗ 转</button>' +
        '</div></div>';
    });
    h += '<button class="mini ph-refresh" data-ph="refresh">⟳ 刷一波新的 <small>耗时 3 分钟</small></button>';
    h += '<div class="ph-stat">已读 ' + p.seen.length + ' 条　赞 ' + p.likes + '　评 ' + p.comments + '　转 ' + p.shares + '</div>';
    return h;
  }
  function deliveryHTML() {
    const p = P(), d = St.d();
    let h = '';
    if (p.pending) {
      const o = p.pending, total = Math.max(1, o.at - o.from), done = U.clamp((absMin() - o.from) / total, 0, 1);
      h += '<div class="ph-order"><div class="ph-order-t">🛵 配送中 · ' + U.escape(PC.ITEMS[o.item].name) + '</div>' +
        '<div class="ph-desc">来自 ' + U.escape(o.shop) + '　骑手 ' + U.escape(o.rider) + '　实付 ' + U.money(o.price) + '</div>' +
        '<div class="ph-bar"><i style="width:' + Math.round(done * 100) + '%"></i></div>' +
        '<div class="ph-desc">预计 ' + Math.max(0, Math.ceil((o.at - absMin()))) + ' 游戏分钟后送达 · ' + Math.round(done * 100) + '%</div>' +
        '<div class="ph-ops"><button class="mini" data-ph="urge">📞 催一下单</button><button class="mini" data-ph="cancel">✕ 取消订单</button></div></div>';
    } else {
      h += '<div class="ph-hint">从下面挑一份，骑手会送到你当前所在的地方（含林景园）。配送费 ¥4。</div>';
    }
    h += '<div class="section-t">🍱 今日可送</div>';
    menu().forEach(m => {
      const price = m.it.price + 4;
      h += '<div class="row"><div><span class="name">' + U.escape(m.it.name) + '</span>' +
        '<span class="desc">' + U.escape(m.shop) + ' · ' + U.escape(m.it.desc) + '</span></div>' +
        '<div style="text-align:right"><span class="price">' + U.money(price) + '</span><br>' +
        '<button class="mini" data-ph="order:' + m.id + '"' + (p.pending || d.money < price ? ' disabled' : '') + '>' +
        (p.pending ? '配送中' : (d.money < price ? '钱不够' : '下单')) + '</button></div></div>';
    });
    if (p.orders.length) {
      h += '<div class="section-t">🧾 历史订单 · ' + p.orders.length + ' 单</div>';
      p.orders.slice(-5).reverse().forEach(o => {
        h += '<div class="logline"><span>' + o.t + '</span>' + U.escape(o.name) + ' · ' + U.money(o.price) + ' · ' + o.state + '</div>';
      });
    }
    return h;
  }
  function homeHTML() {
    const d = St.d(), p = P();
    let h = '<div class="ph-home">🏠<div><b>林景园 · 我的家</b><div class="ph-desc">小区 3 栋 502 的一室一厅，床、书桌、冰箱、存钱罐和一只不怎么理人的猫。换大户型或买别墅后这里也会跟着变。</div></div></div>';
    h += '<div class="ph-hint">回家可以睡觉回满体力、吃冰箱里的东西、往存钱罐存钱，也能直接看手机。</div>';
    h += '<button class="mini ph-big" data-ph="gohome">🏠 现在回家（回林景园名下的房子）</button>';
    h += '<div class="section-t">今日概览</div>';
    h += '<div class="stat-grid">' +
      '<div class="stat">现金<b>' + U.money(d.money) + '</b></div>' +
      '<div class="stat">今日赚<b>' + U.money(d.earnedToday || 0) + '</b></div>' +
      '<div class="stat">外卖<b>' + p.orders.length + ' 单</b></div></div>';
    h += '<div class="ph-desc">D' + d.day + ' ' + St.timeStr() + ' · ' + St.weather().name + ' ' + St.tempAt() + '°C · ' +
      (d.flags.home ? '已解锁「有家可回」' : '还没回过家') + ' · ' + (PC.Estate ? PC.Estate.summary() : '') + '</div>';
    return h;
  }

  /* ---------------- 📷 相机 ---------------- */
  function nearbySpot() {
    const M = PC.Main;
    if (!M || !M.scene || !M.player) return null;
    let best = 1e9, found = null;
    (M.scene.points || []).forEach(pt => {
      if (pt.type !== 'photo') return;
      const dist = Math.hypot(M.player.x - pt.x, M.player.y - pt.y);
      if (dist < best) { best = dist; found = pt; }
    });
    return found && best < 160 ? found : null;
  }
  function cameraHTML() {
    const spot = nearbySpot(), p = P();
    let h = '<div class="ph-cam ' + FILTERS[camFilter].name + '">' +
      '<canvas id="phCam" width="240" height="135"></canvas>' +
      '<div class="ph-cam-hud">REC ●　D' + St.d().day + ' ' + St.timeStr() + '　' + U.escape(St.weather().name) + '</div>' +
      '<div class="ph-cam-corner tl"></div><div class="ph-cam-corner tr"></div>' +
      '<div class="ph-cam-corner bl"></div><div class="ph-cam-corner br"></div>' +
      '<div class="ph-flash" id="phFlash"></div></div>';
    h += '<div class="ph-filters">' + FILTERS.map((f, i) =>
      '<button class="mini' + (camFilter === i ? ' on' : '') + '" data-ph="camfilter:' + i + '">' + f.name + '</button>').join('') + '</div>';
    h += '<div class="ph-hint">' + (spot ?
      '📍 附近就是打卡点 <b>' + U.escape(spot.label.replace('📸 打卡 · ', '')) + '</b>，按快门会收进街区相册并掉明信片。' :
      '取景框里是<b>此刻真实的游戏画面</b>。走近街上发亮的 📸 标记再拍，就是一次打卡；不然算随手拍。') + '</div>';
    h += '<button class="mini ph-big ph-shutter" data-ph="shoot">📸 按快门　<small>随手拍 +心情 2 · 打卡 +明信片</small></button>';
    h += '<div class="ph-ops"><button class="mini" data-ph="app:album">🖼️ 看相册（' + p.album.length + '）</button>' +
      '<button class="mini" data-ph="camselfie">🤳 自拍一张</button></div>';
    return h;
  }
  function renderCamera() {
    const c = $('phCam'); if (!c) return;
    const g = $('game'); if (!g) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    // 按目标比例裁剪源画面中间区域，竖屏也不变形
    const ratio = c.width / c.height, gr = g.width / g.height;
    let sw = g.width, sh = g.height;
    if (gr > ratio) sw = g.height * ratio; else sh = g.width / ratio;
    try {
      ctx.filter = FILTERS[camFilter].css;
      ctx.drawImage(g, (g.width - sw) / 2, (g.height - sh) / 2, sw, sh, 0, 0, c.width, c.height);
      ctx.filter = 'none';
    } catch (e) { ctx.filter = 'none'; }
    // 扫描线 + 暗角，像老数码相机
    for (let y = 0; y < c.height; y += 3) { ctx.fillStyle = 'rgba(10,12,30,.10)'; ctx.fillRect(0, y, c.width, 1); }
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
  }
  function flash() {
    const f = $('phFlash'); if (!f) return;
    f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  }
  function addPhoto(entry) {
    const p = P();
    p.album.push(entry);
    if (p.album.length > 30) p.album.shift();
    St.save();
  }
  function shoot(selfie) {
    const p = P(), d = St.d(), M = PC.Main;
    const scene = M && M.scene ? M.scene.label : '街区';
    const filter = FILTERS[camFilter].name;
    const t = 'D' + d.day + ' ' + St.timeStr();
    camFlashPending = true;
    PC.Audio.sfx('use');
    d.minute += 2;
    if (!selfie) {
      const spot = nearbySpot();
      if (spot && PC.Play) {
        const r = PC.Play.photo(spot.spot);
        if (r.ok) {
          addPhoto({ icon: U.pick(PHOTO_ICONS), name: spot.label.replace('📸 打卡 · ', ''),
            scene, filter, t, spot: spot.spot, kind: '打卡' });
          PC.UI.toast('📸 ' + r.msg);
          PC.Audio.sfx('ach'); St.save(); draw(); return;
        }
        PC.UI.toast('这处已经拍过了，就当重拍一张吧');
      }
    }
    St.change('mood', 2); St.change('knowledge', 1);
    if (PC.Play) PC.Play.xpAdd(4, '拍照');
    const name = selfie ? '🤳 在' + scene.slice(0, 8) + '的自拍' : '随手拍 · ' + scene.slice(0, 10);
    addPhoto({ icon: selfie ? '🤳' : U.pick(PHOTO_ICONS), name, scene, filter, t, spot: '', kind: selfie ? '自拍' : '随手拍' });
    PC.UI.toast('📸 ' + name + '　心情 +2 · 学识 +1 · 已存进相册');
    draw();
  }
  function albumHTML() {
    const p = P(), spots = PC.Play ? PC.Play.PHOTO_SPOTS : {};
    const taken = PC.Play ? PC.Play.ensure(St.d()).col.photos : [];
    let h = '<div class="ph-hint">相机拍的、打卡拍的都存这里（最多 30 张）。打卡相册按街区收集，集齐 7 处有奖励。</div>';
    h += '<div class="section-t">📍 街区打卡 ' + taken.length + ' / ' + Object.keys(spots).length + '</div>';
    h += '<div class="ph-chips">' + Object.keys(spots).map(k =>
      '<span class="ph-chip' + (taken.indexOf(k) >= 0 ? ' got' : '') + '">' +
      (taken.indexOf(k) >= 0 ? '✓ ' : '○ ') + U.escape(spots[k]) + '</span>').join('') + '</div>';
    h += '<div class="section-t">🖼️ 我的胶卷 · ' + p.album.length + ' 张</div>';
    if (!p.album.length) h += '<div class="ph-empty">胶卷还是空的，去 📷 相机按一张。</div>';
    else h += '<div class="ph-album">' + p.album.slice().reverse().map((a, i) => {
      const idx = p.album.length - 1 - i;
      return '<div class="ph-photo"><span class="ph-photo-ic">' + U.escape(a.icon || '🌇') + '</span>' +
        '<div><b>' + U.escape(a.name) + '</b><div class="ph-desc">' + U.escape(a.scene) + ' · ' +
        U.escape(a.filter) + ' · ' + U.escape(a.kind || '') + '</div><small>' + U.escape(a.t) + '</small></div>' +
        '<button class="mini" data-ph="albumdel:' + idx + '">✕</button></div>';
    }).join('') + '</div>';
    h += '<div class="ph-ops"><button class="mini" data-ph="app:camera">📷 去拍照</button>' +
      (p.album.length ? '<button class="mini" data-ph="albumclear">🗑 清空胶卷</button>' : '') + '</div>';
    return h;
  }

  /* ---------------- 🎵 音乐 ---------------- */
  function musicHTML() {
    const M = PC.Music;
    if (!M) return '<div class="ph-empty">配乐模块没加载。</div>';
    const np = M.nowPlaying();
    const configured = M.slots.filter(s => M.srcFor(s.key)).length;
    let h = '<div class="ph-now"><div class="ph-disc' + (np.playing ? ' spin' : '') + '" id="phDisc">💿</div>' +
      '<div class="ph-now-info"><b id="phNowName">' + U.escape(np.name) + '</b>' +
      '<div class="ph-desc" id="phNowSub">' + U.escape(np.group) + ' · ' +
      (np.manual ? '<span style="color:#ffd25a">手动接管中</span>' : '游戏自动配乐') + '</div>' +
      '<div class="ph-mbar"><i id="phMBar"></i></div>' +
      '<div class="ph-desc"><span id="phMTime">0:00</span> / <span id="phMDur">0:00</span>　' +
      (np.playing ? '▶ 播放中' : '⏸ 未播放') + '</div></div></div>';
    h += '<div class="ph-ops ph-controls">' +
      '<button class="mini" data-ph="mstep:-1">⏮</button>' +
      '<button class="mini" data-ph="mrand">🔀 随机</button>' +
      '<button class="mini" data-ph="mstep:1">⏭</button></div>';
    h += '<button class="mini ph-big ph-stop" data-ph="mstop">⏹ 关掉音乐 · 恢复游戏配乐</button>';
    h += '<div class="ph-hint">在下面点任意一首就<b>占用</b>游戏自动配乐：进店、坐地铁、昼夜天气变化都不会打断它。' +
      '点上面的「关掉音乐」，或到 ⚙️ 设置里全局关掉声音，马上回到原本按场景播放的那首（进度续播照常生效）。</div>';

    h += '<div class="section-t">🎧 全部曲库 · ' + configured + ' / ' + M.slots.length + ' 已配置</div>';
    h += '<input id="phSearch" class="ph-input" placeholder="🔍 搜曲库 / 场景 / 店铺" value="' + U.escape(musicQuery) + '">';
    const groups = [];
    M.slots.forEach(s => { if (!groups.includes(s.group)) groups.push(s.group); });
    groups.forEach(g => {
      h += '<div class="ph-group" data-group="' + U.escape(g) + '">▸ ' + U.escape(g) + '</div>';
      M.slots.filter(s => s.group === g).forEach(s => {
        const src = M.srcFor(s.key), cur = np.key === s.key;
        h += '<div class="ph-song' + (cur ? ' cur' : '') + '" data-key="' + U.escape(s.key) +
          '" data-name="' + U.escape(s.name + ' ' + s.key + ' ' + (s.hint || '')) + '">' +
          '<button class="mini ph-play" data-ph="mplay:' + U.escape(s.key) + '">' + (cur && np.manual ? '♫' : '▶') + '</button>' +
          '<div class="ph-song-t"><b>' + U.escape(s.name) + '</b><small>' + U.escape(s.hint || s.key) + '</small></div>' +
          (src ? '<span class="ph-tag ok">有音源</span>' :
            '<button class="mini" data-ph="mfill:' + U.escape(s.key) + '">+ 填链接</button>') + '</div>';
      });
    });

    h += '<div class="section-t">➕ 给空槽位配乐（存本机，立即生效）</div>';
    h += '<select id="phSrcSlot" class="ph-input">' + M.slots.map(s =>
      '<option value="' + U.escape(s.key) + '"' + (np.key === s.key ? ' selected' : '') + '>' +
      U.escape(s.group + ' · ' + s.name) + (M.srcFor(s.key) ? ' ✓' : '（空）') + '</option>').join('') + '</select>';
    h += '<input id="phSrcInput" class="ph-input" placeholder="music/xxx.mp3 或 https://…/xxx.mp3">';
    h += '<div class="ph-ops"><button class="mini" data-ph="msetsrc">💾 保存并播放</button>' +
      '<button class="mini" data-ph="mclearsrc">✕ 清空该槽位</button></div>';
    h += '<div class="section-t">🔊 音量</div>';
    h += '<input id="phVol" class="ph-vol" type="range" min="0" max="100" value="' + Math.round(np.volume * 100) + '">' +
      '<div class="ph-desc">当前 ' + Math.round(np.volume * 100) + '%　·　全局声音：' +
      (np.enabled ? '开' : '关') + '　<button class="mini" data-ph="mtoggle">' + (np.enabled ? '🔇 关掉声音' : '🔈 打开声音') + '</button></div>';
    return h;
  }
  function updateMusicUI() {
    if (screen !== 'music' || !PC.UI.panelOpen) return;
    const M = PC.Music; if (!M || !M.nowPlaying) return;
    const np = M.nowPlaying();
    const bar = $('phMBar'), tm = $('phMTime'), du = $('phMDur'), nm = $('phNowName'), sub = $('phNowSub'), disc = $('phDisc');
    if (bar) bar.style.width = (np.duration ? Math.min(100, np.time / np.duration * 100) : 0) + '%';
    if (tm) tm.textContent = fmt(np.time);
    if (du) du.textContent = np.duration ? fmt(np.duration) : '∞ 循环';
    if (nm) nm.textContent = np.name;
    if (sub) sub.innerHTML = U.escape(np.group) + ' · ' + (np.manual ?
      '<span style="color:#ffd25a">手动接管中</span>' : '游戏自动配乐');
    if (disc) disc.classList.toggle('spin', !!np.playing);
  }

  /* ---------------- 🎯 目标 / 🎮 游戏 / 其它 App ---------------- */
  function goalsHTML() {
    if (!PC.Play) return '<div class="ph-empty">目标模块没加载。</div>';
    const d = St.d(), P2 = PC.Play, L = P2.levelInfo(), q = P2.ensure(d);
    let h = '<div class="lv-card"><span class="lv-rank">' + U.escape(L.rank) + '</span> ' +
      '<span class="lv-title">' + U.escape(L.title) + '</span>' +
      '<div class="lv-xpbar"><i style="width:' + Math.round(L.pct * 100) + '%"></i></div>' +
      '<div class="ph-desc">经验 ' + L.xp + (L.max ? ' · 已达顶级' : ' / ' + L.nextXp) + '　购物 ' +
      Math.round((1 - P2.passive('discount')) * 100) + '% OFF</div></div>';
    h += '<div class="section-t">🎯 今日挑战 · D' + d.day + '</div>';
    q.challenges.forEach(cid => {
      const c = P2.CHALLENGES.find(x => x.id === cid); if (!c) return;
      const cur = P2.progress(d, c), done = cur >= c.goal, got = q.claimed.includes(cid);
      h += '<div class="ch-row ' + (got ? 'claimed' : done ? 'done' : '') + '">' +
        '<span class="name">' + U.escape(c.title) + '</span> ' +
        (got ? '<span class="tag">已领</span>' : done ? '<span class="tag vip">可领</span>' : '') +
        '<div class="ch-bar"><i style="width:' + Math.round(Math.min(1, cur / c.goal) * 100) + '%"></i></div>' +
        '<div class="ph-desc">' + Math.min(cur, c.goal) + ' / ' + c.goal + '　' + U.escape(c.tip) + '</div></div>';
    });
    h += '<div class="section-t">📖 图鉴进度</div>';
    h += '<div class="ph-chips">' + P2.collection().map(r =>
      '<span class="ph-chip' + (r.done ? ' got' : '') + '">' + U.escape(r.name.split(' ')[1] || r.name) +
      ' ' + r.have + '/' + r.total + '</span>').join('') + '</div>';
    h += '<button class="mini ph-big" data-go="play">🎯 打开完整目标板 · 领奖 / 看图鉴</button>';
    return h;
  }
  function gamesHTML() {
    let h = '<div class="ph-hint">小游戏就在手机屏幕里跑，分数按人生等级换钱。</div>';
    h += '<div class="ph-ops"><button class="mini" data-ph="game:coins">🕹 抢金币</button>' +
      '<button class="mini" data-ph="game:fish">🎣 捞锦鲤</button>' +
      '<button class="mini" data-ph="gachaPhone">🎰 扭蛋 ¥20</button></div>';
    h += '<div id="phGame" class="ph-game"></div>';
    return h;
  }
  function startPhoneGame() {
    const host = $('phGame');
    if (host && PC.Play) PC.Play.startGame(gameKind, host);
  }
  function simpleApp(id) {
    const a = APP_BY_ID[id];
    const go = { bag: 'bag', earn: 'earn', estate: 'estate' }[id];
    return '<div class="ph-empty">' + a.icon + ' <b>' + U.escape(a.name) + '</b><br>' +
      U.escape(a.desc) + '</div>' +
      '<div class="ph-hint">点下面会用游戏里那块完整面板打开，按 P 随时回到手机桌面。</div>' +
      '<button class="mini ph-big" data-go="' + go + '">打开 ' + a.icon + ' ' + U.escape(a.name) + ' →</button>';
  }
  function settingsHTML() {
    const M = PC.Music, np = M ? M.nowPlaying() : { enabled: true, volume: .55, manual: false };
    let h = '<div class="section-t">🔊 声音</div>';
    h += '<div class="ph-ops"><button class="mini" data-ph="mtoggle">' + (np.enabled ? '🔇 关掉声音' : '🔈 打开声音') + '</button>' +
      '<button class="mini" data-ph="mstop">⏹ 恢复游戏自动配乐</button></div>';
    h += '<div class="ph-hint">全局关掉声音也会结束 🎵 音乐 App 的手动接管，再打开时自动回到按场景播放的那首。</div>';
    h += '<div class="section-t">🖼️ 桌面</div>';
    h += '<div class="ph-ops"><button class="mini" data-ph="wall">🎨 换一张壁纸</button>' +
      '<button class="mini" data-ph="albumclear">🗑 清空相册</button></div>';
    h += '<div class="ph-desc">当前壁纸 #' + (P().wall % 4 + 1) + '　·　相册 ' + P().album.length + ' 张</div>';
    h += '<div class="section-t">⌨️ 操作速记</div>';
    h += '<div class="ph-desc">WASD / 摇杆 移动　A/E 交互　B 背包　C 蓝图　N 配乐　P 手机　T 目标　Esc 关闭面板</div>';
    h += '<div class="ph-desc" style="margin-top:.5em">无限極人生 OS v2.0 · ' + PC.Title.VER.v + '　·　本地存档，刷新不丢</div>';
    return h;
  }

  function appHTML(id) {
    switch (id) {
      case 'feed': return feedHTML();
      case 'delivery': return deliveryHTML();
      case 'home': return homeHTML();
      case 'camera': return cameraHTML();
      case 'album': return albumHTML();
      case 'music': return musicHTML();
      case 'goals': return goalsHTML();
      case 'games': return gamesHTML();
      case 'settings': return settingsHTML();
      case 'bag': case 'earn': case 'estate': return simpleApp(id);
      default: return deskHTML();
    }
  }

  function draw() {
    const a = APP_BY_ID[screen];
    const night = St.isNight();
    const body = '<div class="phone-shell' + (night ? ' ph-night' : '') + '">' + statusBar() +
      (a ? appBar(a) + '<div class="ph-body ph-screen">' + appHTML(screen) + '</div>' + homeBar()
         : '<div class="ph-body ph-desk">' + deskHTML() + '</div>' + dockHTML()) +
      '</div>';
    PC.UI.openPanel(a ? '📱 ' + a.name + ' · 无限極人生 OS' : '📱 无限極人生 OS · 桌面', body,
      '<span>P / ESC 关闭</span><span>' + (a ? '← 桌面' : St.timeStr() + ' · D' + St.d().day) + '</span>');
    if (screen === 'camera') { renderCamera(); if (camFlashPending) { flash(); camFlashPending = false; } }
    else if (screen === 'games') startPhoneGame();
    else if (screen === 'music') { filterSongs(); updateMusicUI(); }
  }

  function filterSongs() {
    const q = musicQuery.trim().toLowerCase();
    document.querySelectorAll('#panelBody .ph-song').forEach(el => {
      el.style.display = (!q || (el.dataset.name || '').toLowerCase().includes(q)) ? '' : 'none';
    });
    document.querySelectorAll('#panelBody .ph-group').forEach(g => {
      const next = g.nextElementSibling;
      if (!next || !next.classList.contains('ph-song')) return;
      let n = next, any = false;
      while (n && n.classList.contains('ph-song')) {
        if (n.style.display !== 'none') any = true;
        n = n.nextElementSibling;
      }
      g.style.display = any ? '' : 'none';
    });
  }

  /* ---------------- 外卖逻辑（沿用） ---------------- */
  function order(itemId) {
    const p = P(), d = St.d(), it = PC.ITEMS[itemId];
    if (!it || p.pending) return;
    const m = menu().find(q => q.id === itemId);
    const price = it.price + 4;
    if (d.money < price) { PC.UI.toast('钱不够，还差 ' + U.money(price - d.money)); PC.Audio.sfx('error'); return; }
    d.money -= price;
    p.pending = {
      item: itemId, shop: m ? m.shop : '街区小店', price, rider: U.pick(RIDERS),
      from: absMin(), at: absMin() + 14, t: 'D' + d.day + ' ' + St.timeStr()
    };
    p.orders.push({ t: p.pending.t, name: it.name, price, state: '配送中' });
    St.logMsg('手机下单：' + it.name + ' ' + U.money(price) + '，' + p.pending.rider + ' 接单');
    PC.Audio.sfx('cash'); St.save();
    PC.UI.toast('🛵 已下单！' + p.pending.rider + ' 正在赶来');
  }
  function deliver() {
    const p = P(), o = p.pending;
    if (!o) return;
    St.addItem(o.item, 1);
    const last = p.orders[p.orders.length - 1];
    if (last && last.state === '配送中') last.state = '已送达';
    p.pending = null;
    St.logMsg('外卖到了：' + PC.ITEMS[o.item].name + ' 已放进背包（按 B 食用）');
    PC.Audio.sfx('doorBell');
    PC.UI.toast('🛵 外卖到了！' + PC.ITEMS[o.item].name + ' 放进背包，按 B 食用');
    St.save();
    if (PC.UI.panelOpen && screen === 'delivery') draw();
    PC.UI.updateHUD();
  }

  /* 主循环调用：按游戏时间推进配送 + 手机屏幕上的实时元素 */
  function tick() {
    const p = P();
    if (p.pending && absMin() >= p.pending.at) deliver();
    if (!PC.UI.panelOpen || $('panelTitle').textContent.indexOf('📱') < 0) return;
    tickCount++;
    const clock = $('phClock'); if (clock) clock.textContent = St.timeStr();
    if (screen === 'music') updateMusicUI();
    if (screen === 'camera' && tickCount % 12 === 0) renderCamera();
    if (screen === 'delivery' && p.pending && tickCount % 30 === 0) {
      const bar = document.querySelector('#panelBody .ph-bar i');
      if (bar) {
        const o = p.pending, total = Math.max(1, o.at - o.from);
        bar.style.width = Math.round(U.clamp((absMin() - o.from) / total, 0, 1) * 100) + '%';
      }
    }
  }

  /* ---------------- 交互 ---------------- */
  function musicDo(act) {
    const M = PC.Music;
    if (!M) return;
    let r = null;
    if (act.indexOf('mplay:') === 0) r = M.request(act.slice(6));
    else if (act === 'mstop') r = M.release();
    else if (act === 'mstep:1') r = M.step(1);
    else if (act === 'mstep:-1') r = M.step(-1);
    else if (act === 'mrand') {
      M.init();
      const list = M.slots.filter(s => M.srcFor(s.key));
      r = list.length ? M.request(U.pick(list).key) : { ok: false, msg: '曲库还是空的，先填个链接' };
    } else if (act === 'mtoggle') {
      M.setEnabled(!M.enabled);
      r = { ok: true, msg: M.enabled ? '🔈 声音已打开，恢复游戏自动配乐' : '🔇 声音已关掉' };
    } else if (act === 'msetsrc') {
      const sel = $('phSrcSlot'), inp = $('phSrcInput');
      if (!sel || !inp || !inp.value.trim()) { PC.UI.toast('先选槽位、再粘贴一个链接或相对路径'); return; }
      M.setSrc(sel.value, inp.value.trim());
      r = M.request(sel.value);
    } else if (act === 'mclearsrc') {
      const sel = $('phSrcSlot'); if (!sel) return;
      const key = sel.value, name = (M.slot(key) || { name: key }).name;
      const wasPlaying = M.isManual() && M.manualKey() === key;
      M.clearSrc(key);
      if (wasPlaying) M.release();
      r = { ok: true, msg: '已清空「' + name + '」的音源' + (wasPlaying ? '，并恢复游戏配乐' : '') };
    }
    if (r) { PC.UI.toast(r.msg); PC.Audio.sfx(r.ok ? 'ok' : 'error'); }
    draw();
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('button[data-ph]'); if (!b) return;
    if (!$('panelBody') || !$('panelBody').contains(b)) return;
    PC.Audio.init();
    const act = b.dataset.ph, p = P(), d = St.d();

    if (act === 'desk') { go('desk'); return; }
    if (act.indexOf('app:') === 0) { go(act.slice(4)); return; }
    if (act.indexOf('tab:') === 0) { go(act.slice(4)); return; }   // 兼容旧调用
    if (act.indexOf('mplay:') === 0 || act === 'mstop' || act.indexOf('mstep:') === 0 ||
        act === 'mrand' || act === 'mtoggle' || act === 'msetsrc' || act === 'mclearsrc') { musicDo(act); return; }
    if (act.indexOf('mfill:') === 0) {
      const sel = $('phSrcSlot'); if (sel) { sel.value = act.slice(6); const inp = $('phSrcInput'); if (inp) inp.focus(); }
      PC.UI.toast('已选中该槽位，在下面粘贴链接再点「保存并播放」'); return;
    }
    if (act.indexOf('game:') === 0) {
      gameKind = act.slice(5);
      PC.Play.stopGame(); draw(); return;
    }
    if (act === 'gachaPhone') {
      const r = PC.Play.gacha(); PC.UI.toast(r.msg); PC.Audio.sfx(r.ok ? 'coin' : 'error');
      PC.UI.updateHUD(); return;
    }
    if (act.indexOf('camfilter:') === 0) { camFilter = Number(act.slice(10)) || 0; PC.Audio.sfx('click'); renderCamera(); draw(); return; }
    if (act === 'shoot') { shoot(false); return; }
    if (act === 'camselfie') { shoot(true); return; }
    if (act.indexOf('albumdel:') === 0) { p.album.splice(Number(act.slice(9)), 1); St.save(); draw(); return; }
    if (act === 'albumclear') { p.album = []; St.save(); PC.UI.toast('胶卷清空了'); PC.Audio.sfx('error'); draw(); return; }
    if (act === 'wall') { p.wall = (p.wall + 1) % 4; St.save(); PC.Audio.sfx('click'); draw(); return; }

    if (act === 'refresh') {
      d.minute += 3; rollFeed(); PC.Audio.sfx('screen');
      PC.UI.toast('刷到 5 条新帖子 · 游戏时间 +3 分钟'); draw(); return;
    }
    if (act.indexOf('like:') === 0) {
      const id = act.slice(5); p['like_' + id] = true; p.likes++;
      St.change('mood', 1);
      let msg = '点了个赞，心情 +1';
      if (U.chance(.14)) {
        const sid = U.pick(Object.keys(PC.SHOP_BY_ID));
        St.applyEff({ addCoupon: sid });
        msg += '，还捡到一张「' + PC.SHOP_BY_ID[sid].name + '」8 折券';
      }
      PC.Audio.sfx('ok'); PC.UI.toast(msg); St.save(); draw(); return;
    }
    if (act.indexOf('comment:') === 0) {
      p.comments++; St.change('mood', 2); St.change('knowledge', 1);
      PC.Audio.sfx('click'); PC.UI.toast('留了句「这条街真不错」。心情 +2 学识 +1');
      St.save(); draw(); return;
    }
    if (act.indexOf('share:') === 0) {
      p.shares++; St.change('mood', 1);
      const gain = U.chance(.25);
      if (gain) St.change('fame', 1);
      PC.Audio.sfx('screen'); PC.UI.toast(gain ? '转发火了，心情 +1 声望 +1' : '转发成功，心情 +1');
      St.save(); draw(); return;
    }
    if (act.indexOf('order:') === 0) { order(act.slice(6)); draw(); return; }
    if (act === 'urge') {
      if (!p.pending) return;
      if (U.chance(.35)) { p.pending.at -= 6; PC.UI.toast('骑手说「马上马上」，真的快了 6 分钟'); PC.Audio.sfx('ok'); }
      else { St.change('mood', -2); PC.UI.toast('骑手回了个「…」，心情 -2'); PC.Audio.sfx('error'); }
      St.save(); draw(); return;
    }
    if (act === 'cancel') {
      if (!p.pending) return;
      const back = Math.round(p.pending.price * .8);
      St.change('money', back);
      const last = p.orders[p.orders.length - 1]; if (last) last.state = '已取消';
      p.pending = null;
      PC.UI.toast('订单取消，退回 ' + U.money(back) + '（跑了腿，扣 20%）');
      PC.Audio.sfx('error'); St.save(); draw(); PC.UI.updateHUD(); return;
    }
    if (act === 'gohome') {
      PC.UI.closePanel();
      if (PC.Main && PC.Main.goHome) PC.Main.goHome();
      else PC.UI.toast('先把瞬移入场走完再回家');
      return;
    }
  });

  /* 输入框 / 滑块（不重绘，避免丢焦点） */
  document.addEventListener('input', e => {
    const t = e.target;
    if (!$('panelBody') || !$('panelBody').contains(t)) return;
    if (t.id === 'phVol' && PC.Music) {
      PC.Music.setVolume(Number(t.value) / 100);
      const lab = t.nextElementSibling;
      if (lab) lab.innerHTML = lab.innerHTML.replace(/当前 \d+%/, '当前 ' + t.value + '%');
    }
    if (t.id === 'phSearch') { musicQuery = t.value; filterSongs(); }
  });

  /* 挂到 UI 上，方便 HUD 按钮 / 键盘调用 */
  PC.Phone = {
    open, toggle, tick, deliver, rollFeed, menu, POSTS, APPS,
    get screen() { return screen; },
    get tab() { return screen; }, set tab(v) { screen = APP_BY_ID[v] ? v : 'desk'; },
    go, draw
  };
  if (PC.UI) {
    PC.UI.openPhone = open;
    PC.UI.togglePhone = toggle;
  }
})();
