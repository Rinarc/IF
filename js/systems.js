/* systems.js —— 角色状态 / 经济 / 背包 / 时间天气 / 存档 */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U, C = PC.CFG;

  function defaults() {
    return {
      money: C.START_MONEY, stamina: 82, mood: 76, knowledge: 4, fitness: 5, fame: 0,
      day: 1, minute: 8 * 60, weatherIdx: 0, temp: 9, nextWeatherAt: 8 * 60 + 180,
      bag: {}, owned: [], members: [], coupons: {}, flags: {},
      pos: { scene: 'street', x: 47 * C.TILE + 8, y: 34 * C.TILE + 8 },
      log: [], stats: { bought: 0, events: 0, shops: 0, steps: 0 },
      lastTick: 0, firstPlay: true,
      /* 赚钱系统 */
      earnedToday: 0, earnedTotal: 0, jobCount: {}, jobLog: [],
      gigs: [], gigActive: null, gigDone: 0,
      recycleBag: {}, achClaimed: {}, bank: 0,
      /* 林景园房产：名下 / 自住 / 出租 */
      estate: { owned: ['apt1'], home: 'apt1', rented: [], rentEarned: 0 },
      /* 手机：社区帖子 / 外卖订单 / 配送中 */
      phone: { feed: [], seen: [], likes: 0, comments: 0, shares: 0, orders: [], pending: null }
    };
  }

  const S = PC.State = {
    data: defaults(),
    init() {
      const def = defaults();
      const raw = localStorage.getItem(C.SAVE_KEY);
      if (raw) {
        try {
          const d = JSON.parse(raw);
          this.data = Object.assign(def, d);
          this.data.pos = Object.assign(def.pos, d.pos || {});
          this.data.stats = Object.assign(def.stats, d.stats || {});
          this.data.flags = Object.assign(def.flags, d.flags || {});
          this.data.bag = Object.assign({}, d.bag || {});
          this.data.jobCount = Object.assign({}, d.jobCount || {});
          this.data.recycleBag = Object.assign({}, d.recycleBag || {});
          this.data.achClaimed = Object.assign({}, d.achClaimed || {});
          this.data.coupons = Object.assign({}, d.coupons || {});
          this.data.phone = Object.assign({}, def.phone, d.phone || {});
          this.data.log = (d.log || []).slice(0, 60);
        } catch (e) { this.data = defaults(); }
      }
      this.data.estate = Object.assign({}, def.estate, this.data.estate || {});
      if (PC.Estate) PC.Estate.ensure(this.data);
      if (PC.JobSystem) {
        PC.JobSystem.ensure(this.data);
        if (!this.data.gigs || !this.data.gigs.length) PC.JobSystem.refreshGigs(this.data);
      }
      return this.data;
    },
    save() {
      try { localStorage.setItem(C.SAVE_KEY, JSON.stringify(this.data)); } catch (e) { }
    },
    reset() { this.data = defaults(); this.save(); },
    d() { return this.data; },
    logMsg(text) {
      const d = this.data, hh = U.pad2(Math.floor(d.minute / 60) % 24), mm = U.pad2(Math.floor(d.minute % 60));
      d.log.unshift({ t: 'D' + d.day + ' ' + hh + ':' + mm, text });
      if (d.log.length > 60) d.log.length = 60;
      if (PC.UI && PC.UI.setTicker) PC.UI.setTicker(text);
    },
    change(key, delta) {
      const d = this.data;
      if (!(key in d) || typeof d[key] !== 'number') return;
      d[key] = Math.max(key === 'money' ? 0 : 0, d[key] + delta);
      if (key === 'stamina' || key === 'mood') d[key] = U.clamp(d[key], 0, 100);
      if (key === 'knowledge' || key === 'fitness' || key === 'fame') d[key] = Math.max(0, d[key]);
    },
    applyEff(eff) {
      if (!eff) return;
      ['money', 'stamina', 'mood', 'knowledge', 'fitness', 'fame'].forEach(k => {
        if (eff[k]) this.change(k, eff[k]);
      });
      const d = this.data;
      if (eff.addFlag) { d.flags[eff.addFlag] = true; }
      if (eff.addMember && d.members.indexOf(eff.addMember) < 0) d.members.push(eff.addMember);
      if (eff.addCoupon) d.coupons[eff.addCoupon] = (d.coupons[eff.addCoupon] || 0) + 1;
      this.save();
    },
    price(itemId, shopId) {
      const it = PC.ITEMS[itemId]; if (!it) return 0;
      const d = this.data;
      let p = it.price;
      if (shopId === 'familygo' && d.members.indexOf('FAMILY GO') >= 0) p *= .7;
      if (shopId && d.coupons[shopId] > 0) p *= .8;
      if (shopId === 'snack2' && d.flags.snackVip) p *= .85;
      if (PC.Play) p *= PC.Play.passive('discount');
      return Math.max(1, Math.round(p));
    },
    buy(shopId, itemId) {
      const it = PC.ITEMS[itemId]; if (!it) return { ok: false, msg: '没有这件商品' };
      const d = this.data, price = this.price(itemId, shopId);
      if (d.money < price) { PC.Audio.sfx('error'); return { ok: false, msg: '钱不够，还差 ' + U.money(price - d.money) }; }
      d.money -= price;
      if (shopId && d.coupons[shopId] > 0) d.coupons[shopId]--;
      d.stats.bought++;
      const auto = it.eff && (it.eff.addFlag || it.eff.addMember || it.eff.addCoupon);
      if (auto) {
        this.applyEff(it.eff);
        if (d.owned.indexOf(itemId) < 0) d.owned.push(itemId);
        this.logMsg('买下并激活「' + it.name + '」 ' + U.money(price));
      } else {
        d.bag[itemId] = (d.bag[itemId] || 0) + 1;
        this.logMsg('买了「' + it.name + '」 ' + U.money(price) + '，已放进背包');
      }
      PC.Audio.sfx('cash');
      if (PC.Play) { PC.Play.mark('bought'); PC.Play.mark('item', itemId); }
      this.save();
      return { ok: true, msg: auto ? '已激活 ' + it.name : '获得 ' + it.name + ' ×1（背包 B / I 使用）', price };
    },
    useItem(itemId) {
      const d = this.data, it = PC.ITEMS[itemId];
      if (!it || !(d.bag[itemId] > 0)) return { ok: false, msg: '背包里没有这个' };
      d.bag[itemId]--;
      if (d.bag[itemId] <= 0) delete d.bag[itemId];
      this.applyEff(it.eff);
      this.logMsg('使用了「' + it.name + '」');
      PC.Audio.sfx('use');
      return { ok: true, msg: '使用 ' + it.name + ' · ' + it.desc };
    },
    addItem(itemId, n) {
      const d = this.data; d.bag[itemId] = (d.bag[itemId] || 0) + (n || 1); this.save();
    },
    timeStr() { const d = this.data; return U.pad2(Math.floor(d.minute / 60) % 24) + ':' + U.pad2(Math.floor(d.minute % 60)); },
    hour() { return Math.floor(this.data.minute / 60) % 24; },
    weather() { return PC.WEATHERS[this.data.weatherIdx] || PC.WEATHERS[0]; },
    isNight() { const h = this.hour(); return h >= 19 || h < 6; },
    isRain() { return this.weather().id === 'rain'; },
    placeLabel() { return (PC.Main && PC.Main.scene && PC.Main.scene.label) || '曙光路'; },
    /* 迂龙路比曙光路暖 8 度（第二张设计稿：17°C vs 9°C）；车厢按目的地算 */
    isYulong(sceneId) {
      const s = sceneId || (PC.Main && PC.Main.scene && PC.Main.scene.id) || 'street';
      if (s === 'yulong') return true;
      if (s === 'train' && PC.Main && PC.Main.scene && PC.Main.scene.ride) return PC.Main.scene.ride.to === 'yulong';
      return false;
    },
    tempAt(sceneId) { return this.data.temp + (this.isYulong(sceneId) ? 8 : 0); },
    /* 跨天结算：分红 / 日息 / 委托刷新 / 拾荒刷新（打工跳时也会调用） */
    newDay() {
      const d = this.data;
      d.minute -= 1440; d.day++;
      d.earnedToday = 0;
      if (d.flags.shopOwner) {
        const v = 180 + d.fame * 2;
        d.money += v; d.earnedToday += v; d.earnedTotal += v;
        this.logMsg('旺铺分红到账 ' + U.money(v));
      }
      if (PC.Estate) {
        const rent = PC.Estate.dailyRent(d);
        if (rent) this.logMsg('林景园房租到账 ' + U.money(rent));
      }
      if (PC.JobSystem) {
        const it = PC.JobSystem.dailyInterest(d);
        if (it) this.logMsg('沁银行日息到账 ' + U.money(it) + '（账户 ' + U.money(d.bank) + '）');
        PC.JobSystem.refreshGigs(d);
        if (PC.World && PC.World.respawnPickups) PC.World.respawnPickups();
      }
      if (d.flags.home) d.mood = U.clamp(d.mood + 6, 0, 100);
      if (PC.Play) PC.Play.newDay(d);
      this.logMsg('第 ' + d.day + ' 天，曙光路又亮了一次灯。委托板与街面回收物已刷新。');
      this.save();
    },
    /* 在家睡到第二天 07:00；跨天照常结算分红 / 日息 / 委托刷新 */
    sleepAtHome() {
      const d = this.data;
      let delta = 7 * 60 - d.minute;
      if (delta <= 0) delta += 1440;
      d.minute += delta;
      while (d.minute >= 1440) this.newDay();
      d.stamina = 100;
      d.mood = U.clamp(d.mood + 18, 0, 100);
      d.flags.home = true;
      d.flags.warnedTired = false;
      this.logMsg('在林景园睡了一觉，醒来是 D' + d.day + ' 07:00，体力回满');
      this.save();
      return { day: d.day, hours: Math.round(delta / 60) };
    },
    tick(dt, running) {
      const d = this.data;
      d.minute += dt * 4;
      if (d.minute >= 1440) this.newDay();
      if (d.minute >= d.nextWeatherAt) {
        const old = this.weather().name;
        d.weatherIdx = U.randInt(0, PC.WEATHERS.length - 1);
        d.temp = this.weather().temp + U.randInt(-2, 2);
        d.nextWeatherAt = d.minute + U.rand(150, 340);
        this.logMsg('天气变了：' + old + ' → ' + this.weather().name + '，' + d.temp + '°C');
        this.save();
      }
      // 缓慢消耗
      d._decay = (d._decay || 0) + dt;
      if (d._decay > 2.4) {
        d._decay = 0;
        const drain = (running ? 1.1 : .5) * (PC.Play ? PC.Play.passive('stamina') : 1);
        d.stamina = U.clamp(d.stamina - drain, 0, 100);
        d.mood = U.clamp(d.mood - .25, 0, 100);
        if (d.stamina < 12 && !d.flags.warnedTired) {
          d.flags.warnedTired = true; this.logMsg('有点走不动了，找个店坐下吃点东西吧。');
        }
        if (d.stamina > 40) d.flags.warnedTired = false;
      }
    },
    summary() {
      const d = this.data;
      return '¥' + d.money + '　体力 ' + Math.round(d.stamina) + '　心情 ' + Math.round(d.mood) +
        '　学识 ' + Math.round(d.knowledge) + '　体魄 ' + Math.round(d.fitness) + '　声望 ' + Math.round(d.fame);
    }
  };
})();
