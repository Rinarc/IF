/* estate.js —— 林景园房产系统
 * 主角的家在「林景园」小区 3 栋 502；公寓可换大户型，别墅可买可入住。
 * 多余的房子能出租，每天跨天结算租金（另一条赚钱渠道）。
 */
(function () {
  const PC = window.PC = window.PC || {};

  /* 价格按游戏内经济量级设定；设计稿上的「290万 / 470万」是广告文案，保留在售楼处海报里 */
  const UNITS = [
    { id: 'apt1', kind: 'apt', no: '3 栋 502', name: '3 栋 502 · 一室一厅', en: 'BLK 3 / 502', price: 0, rent: 0,
      desc: '主角一开始住的地方。一室一厅，床、书桌、冰箱、存钱罐和一只不怎么理人的猫。', tag: '现有住宅' },
    { id: 'apt2', kind: 'apt', no: '5 栋 1102', name: '5 栋 1102 · 两室一厅', en: 'BLK 5 / 1102', price: 3600, rent: 46,
      desc: '朝南，多一间书房，阳台正对喷水池。买下后可设为家，室内会换成两室一厅。', tag: '公寓 · 可买' },
    { id: 'apt3', kind: 'apt', no: '1 栋 1801', name: '1 栋 1801 · 顶层复式', en: 'BLK 1 / PENTHOUSE', price: 8800, rent: 118,
      desc: '顶层复式，带大落地窗和露台，能看见整条曙光路。公寓里的天花板。', tag: '公寓 · 可买' },
    { id: 'villaA', kind: 'villa', no: 'A 座', name: '水岸别墅 A · 临池', en: 'VILLA A / LAKESIDE', price: 18000, rent: 260,
      desc: '推开落地窗就是林景园的水池。客厅带壁炉、书房、车库和一处小泳池。', tag: '别墅 · 可买' },
    { id: 'villaB', kind: 'villa', no: 'B 座', name: '花园别墅 B · 蔷薇院', en: 'VILLA B / ROSE', price: 32000, rent: 430,
      desc: '带一整圈蔷薇花架和玻璃暖房，客厅挑高两层，屋顶有西洋风老虎窗。', tag: '别墅 · 可买' },
    { id: 'villaC', kind: 'villa', no: 'C 座', name: '林荫别墅 C · 双车库', en: 'VILLA C / GROVE', price: 56000, rent: 720,
      desc: '小区最里面的一栋，双车库、私人健身房、露天露台与独立喷泉。全街区最贵。', tag: '别墅 · 可买' }
  ];
  const BY_ID = Object.create(null);
  UNITS.forEach(u => BY_ID[u.id] = u);

  function ensure(d) {
    if (!d.estate || typeof d.estate !== 'object') d.estate = { owned: ['apt1'], home: 'apt1', rented: [], rentEarned: 0 };
    const e = d.estate;
    if (!Array.isArray(e.owned) || !e.owned.length) e.owned = ['apt1'];
    if (e.owned.indexOf('apt1') < 0) e.owned.unshift('apt1');
    if (!BY_ID[e.home] || e.owned.indexOf(e.home) < 0) e.home = 'apt1';
    if (!Array.isArray(e.rented)) e.rented = [];
    e.rented = e.rented.filter(id => BY_ID[id] && e.owned.indexOf(id) >= 0 && id !== e.home);
    if (typeof e.rentEarned !== 'number') e.rentEarned = 0;
    return e;
  }

  const E = PC.Estate = {
    units: UNITS,
    byId: BY_ID,
    ensure,
    d() { return ensure(PC.State.d()); },
    get(id) { return BY_ID[id] || null; },
    owned(id) { return this.d().owned.indexOf(id) >= 0; },
    isHome(id) { return this.d().home === id; },
    isRented(id) { return this.d().rented.indexOf(id) >= 0; },
    homeUnit() { return BY_ID[this.d().home] || BY_ID.apt1; },
    homeScene() {
      const u = this.homeUnit();
      return u.kind === 'villa' ? 'villa:' + u.id : 'home';
    },
    sceneOf(id) { const u = BY_ID[id]; return !u ? 'home' : (u.kind === 'villa' ? 'villa:' + id : 'home'); },
    /* 买：一次付清；旧的自住房自动「以旧换新」折 60% 抵掉 */
    buy(id) {
      const u = BY_ID[id], d = PC.State.d(), e = ensure(d);
      if (!u) return { ok: false, msg: '没有这套房。' };
      if (e.owned.indexOf(id) >= 0) return { ok: false, msg: '这套已经是你的了。' };
      const tradeIn = e.home !== 'apt1' && u.kind === 'apt' ? Math.round((BY_ID[e.home].price || 0) * .6) : 0;
      const need = Math.max(0, u.price - tradeIn);
      if (d.money < need) return { ok: false, msg: '还差 ' + PC.U.money(need - d.money) + '，先去街上转转。' };
      d.money -= need;
      e.owned.push(id);
      e.home = id;
      e.rented = e.rented.filter(r => r !== id);
      d.earnedTotal = (d.earnedTotal || 0);   // 买房不算收入
      if (PC.Play) PC.Play.mark('estate', id);
      PC.State.logMsg('在林景园买下 ' + u.name + '（' + PC.U.money(u.price) + '）');
      PC.State.save();
      if (PC.Audio) PC.Audio.sfx('coin');
      if (PC.World && PC.World.refresh) { PC.World.refresh('home'); PC.World.refresh('park'); }
      return { ok: true, msg: '成交！' + u.name + ' 现在是你的家了' + (tradeIn ? '（旧房折了 ' + PC.U.money(tradeIn) + '）' : '') + '。出门再回来就能看到新家。' };
    },
    /* 把已拥有的某套设为家 */
    setHome(id) {
      const d = PC.State.d(), e = ensure(d), u = BY_ID[id];
      if (!u || e.owned.indexOf(id) < 0) return { ok: false, msg: '还没买下这套。' };
      if (e.home === id) return { ok: false, msg: '本来就是这里。' };
      e.home = id;
      e.rented = e.rented.filter(r => r !== id);
      PC.State.logMsg('把家搬到了 林景园 ' + u.name);
      PC.State.save();
      if (PC.World && PC.World.refresh) { PC.World.refresh('home'); PC.World.refresh('park'); }
      return { ok: true, msg: '搬家完成，家现在是「' + u.name + '」。按手机里的「现在回家」就能回去。' };
    },
    /* 多余房产出租 / 退租 */
    toggleRent(id) {
      const d = PC.State.d(), e = ensure(d), u = BY_ID[id];
      if (!u || e.owned.indexOf(id) < 0) return { ok: false, msg: '还没买下这套。' };
      if (e.home === id) return { ok: false, msg: '自己住着的那套不能出租。' };
      const i = e.rented.indexOf(id);
      if (i >= 0) { e.rented.splice(i, 1); PC.State.save(); return { ok: true, msg: u.name + ' 已收回自住，不再收租。' }; }
      e.rented.push(id); PC.State.logMsg('把 林景园 ' + u.name + ' 挂出去出租'); PC.State.save();
      return { ok: true, msg: u.name + ' 挂租成功，每天跨天收 ' + PC.U.money(u.rent) + '。' };
    },
    /* 跨天结算租金，由 systems.js 的 newDay() 调用 */
    dailyRent(d) {
      const e = ensure(d);
      if (!e.rented.length) return 0;
      let sum = 0;
      e.rented.forEach(id => { sum += BY_ID[id].rent || 0; });
      d.money += sum;
      d.earnedToday = (d.earnedToday || 0) + sum;
      d.earnedTotal = (d.earnedTotal || 0) + sum;
      e.rentEarned = (e.rentEarned || 0) + sum;
      PC.State.logMsg('林景园房租到账 ' + PC.U.money(sum) + '（' + e.rented.length + ' 套出租中）');
      return sum;
    },
    /* 房产总览的一行小字 */
    summary() {
      const e = this.d();
      return e.owned.length + ' 套在名下 · ' + e.rented.length + ' 套出租中 · 累计租金 ' + PC.U.money(e.rentEarned || 0);
    }
  };
})();
