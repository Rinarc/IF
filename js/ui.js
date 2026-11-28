/* ui.js —— HUD / 虚拟摇杆 / 对话框 / 商店 / 背包 / 蓝图界面 */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U, St = PC.State;
  const $ = id => document.getElementById(id);

  const UI = PC.UI = {
    joy: { dx: 0, dy: 0, run: false },
    dialogOpen: false, panelOpen: false, bpOpen: false, handlers: {},

    init(handlers) {
      this.handlers = handlers || {};
      // 开场
      $('btnStart').addEventListener('click', () => {
        $('help').classList.add('hidden');
        PC.Audio.init(); PC.Audio.sfx('ok');
        if (this.handlers.start) this.handlers.start();
      });
      // 按钮
      $('btnA').addEventListener('click', () => { PC.Audio.init(); if (this.handlers.interact) this.handlers.interact(); });
      $('btnB').addEventListener('click', () => this.toggleBag());
      $('btnC').addEventListener('click', () => this.toggleBlueprint());
      $('btnD').addEventListener('click', () => this.openLog());
      $('btnMusic').addEventListener('click', () => { PC.Audio.init(); this.toggleMusic(); });
      $('btnPhone').addEventListener('click', () => { PC.Audio.init(); this.togglePhone(); });
      $('btnPlay').addEventListener('click', () => { PC.Audio.init(); this.togglePlay(); });
      $('panelClose').addEventListener('click', () => this.closePanel());
      $('blueprint').addEventListener('click', () => this.closeBlueprint());
      $('bpSwitch').addEventListener('click', e => { e.stopPropagation(); PC.Audio.init(); this.switchBlueprint(); });
      // 配乐面板里的音量滑块（document 级委托，面板重绘也不会重复绑定）
      document.addEventListener('input', e => {
        if (e.target && e.target.id === 'musicVol' && PC.Music) PC.Music.setVolume(Number(e.target.value) / 100);
      });
      // 面板事件委托
      $('panelBody').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        PC.Audio.init();
        if (b.dataset.play !== undefined) {
          const a = b.dataset.play;
          if (a === 'panel') this.openPlay();
          else if (a.indexOf('game:') === 0) PC.Play.startGame(a.slice(5));
          else if (a === 'gacha') {
            const r = PC.Play.gacha(); this.toast(r.msg); PC.Audio.sfx(r.ok ? 'coin' : 'error');
            this.openPlay(); this.updateHUD();
          } else if (a.indexOf('claim:') === 0) {
            const r = PC.Play.claim(a.slice(6)); this.toast(r.msg); PC.Audio.sfx(r.ok ? 'coin' : 'error');
            this.openPlay(); this.updateHUD();
          } else if (a.indexOf('col:') === 0) {
            const r = PC.Play.claimCol(a.slice(4)); this.toast(r.msg); PC.Audio.sfx(r.ok ? 'ach' : 'error');
            this.openPlay(); this.updateHUD();
          } else if (a.indexOf('gift:') === 0) {
            const r = PC.Play.bondGift(a.slice(5)); this.toast(r.msg); PC.Audio.sfx(r.ok ? 'coin' : 'error');
            this.openPlay(); this.updateHUD();
          }
        } else if (b.dataset.buy !== undefined) {
          const r = St.buy(b.dataset.shop, b.dataset.buy);
          this.toast(r.msg); if (!r.ok) PC.Audio.sfx('error'); // 成功音由 St.buy 的收银机音效负责
          this.openShop(b.dataset.shop); this.updateHUD();
        } else if (b.dataset.use !== undefined) {
          const r = St.useItem(b.dataset.use);
          this.toast(r.msg); this.openBag(); this.updateHUD();
        } else if (b.dataset.ev !== undefined) {
          this.closePanel(); PC.Events.trigger(b.dataset.ev);
        } else if (b.dataset.job !== undefined) {
          this.startJob(b.dataset.ctx, b.dataset.job);
        } else if (b.dataset.gig !== undefined) {
          const r = PC.JobSystem.takeGig(b.dataset.gig);
          this.toast(r.msg); PC.Audio.sfx(r.ok ? 'ok' : 'error');
          this.openGigBoard(); this.updateHUD();
        } else if (b.dataset.rec !== undefined) {
          const r = PC.JobSystem.recycleAll();
          this.toast(r.msg); PC.Audio.sfx(r.ok ? 'coin' : 'error');
          this.openRecycle(); this.updateHUD();
        } else if (b.dataset.stall !== undefined) {
          const r = PC.JobSystem.stall();
          this.toast(r.msg); PC.Audio.sfx(r.ok ? 'coin' : 'error');
          this.openStall(); this.updateHUD();
        } else if (b.dataset.ach !== undefined) {
          const r = PC.JobSystem.claim(b.dataset.ach);
          this.toast(r.msg); PC.Audio.sfx(r.ok ? 'coin' : 'error');
          this.openEarn(); this.updateHUD();
        } else if (b.dataset.estbuy !== undefined) {
          const r = PC.Estate.buy(b.dataset.estbuy);
          this.toast(r.msg); PC.Audio.sfx(r.ok ? 'coin' : 'error');
          if (r.ok && PC.World && PC.World.refresh) { PC.World.refresh('home'); PC.World.refresh('park'); }
          this.openEstate(); this.updateHUD();
        } else if (b.dataset.esthome !== undefined) {
          const r = PC.Estate.setHome(b.dataset.esthome);
          this.toast(r.msg); PC.Audio.sfx(r.ok ? 'ok' : 'error');
          if (r.ok && PC.World && PC.World.refresh) PC.World.refresh('park');
          this.openEstate(); this.updateHUD();
        } else if (b.dataset.estrent !== undefined) {
          const r = PC.Estate.toggleRent(b.dataset.estrent);
          this.toast(r.msg); PC.Audio.sfx(r.ok ? 'ok' : 'error');
          this.openEstate(); this.updateHUD();
        } else if (b.dataset.bank !== undefined) {
          const d = St.d(), v = Number(b.dataset.bank);
          if (v > 0) { if (d.money < v) { this.toast('现金不够存'); PC.Audio.sfx('error'); } else { d.money -= v; d.bank += v; St.logMsg('往沁银行存了 ' + U.money(v)); this.toast('存入 ' + U.money(v) + '，每日 1.5% 日息'); PC.Audio.sfx('coin'); } }
          else { const q = -v; if (d.bank < q) { this.toast('账户里没这么多'); PC.Audio.sfx('error'); } else { d.bank -= q; d.money += q; St.logMsg('从沁银行取了 ' + U.money(q)); this.toast('取出 ' + U.money(q)); PC.Audio.sfx('coin'); } }
          St.save(); this.openEarn(); this.updateHUD();
        } else if (b.dataset.go !== undefined) {
          const go = b.dataset.go;
          if (go === 'earn') this.openEarn();
          else if (go === 'gigs') this.openGigBoard();
          else if (go === 'recycle') this.openRecycle();
          else if (go === 'stall') this.openStall();
          else if (go === 'bag') this.openBag();
          else if (go.startsWith('jobs:')) this.openJobs(go.slice(5), '当前场景');
          else if (go === 'music') this.openMusic();
          else if (go === 'phone') this.openPhone();
          else if (go === 'estate') this.openEstate();
          else if (go === 'play') this.openPlay();
        } else if (b.dataset.mtoggle !== undefined) {
          PC.Music.setEnabled(!PC.Music.enabled);
          PC.Audio.sfx('screen');
          this.openMusic(); this.refreshMusicBtn();
        } else if (b.dataset.msave !== undefined) {
          const key = b.dataset.msave, inp = document.getElementById('msrc_' + key);
          const src = inp ? inp.value.trim() : '';
          PC.Music.setSrc(key, src);
          this.toast(src ? '🎵 已保存并切换：' + (PC.Music.slot(key) ? PC.Music.slot(key).name : key) : '🎵 已清空该槽位');
          PC.Audio.sfx('screen'); this.openMusic();
        } else if (b.dataset.mclear !== undefined) {
          PC.Music.clearSrc(b.dataset.mclear);
          this.toast('🎵 已清空：' + b.dataset.mclear);
          PC.Audio.sfx('screen'); this.openMusic();
        } else if (b.dataset.mtest !== undefined) {
          const inp = document.getElementById('msrc_' + b.dataset.mtest);
          const src = inp ? inp.value.trim() : '';
          if (!src) { this.toast('先填一个链接或文件路径'); PC.Audio.sfx('error'); }
          else { PC.Music.preview(src); this.toast('试听中（不会写入配置）'); }
        }
      });
      // 摇杆
      const base = $('stickBase'), knob = $('stickKnob');
      let active = false, pid = null;
      const set = (e) => {
        const r = base.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        let dx = (e.clientX - cx) / (r.width * .38), dy = (e.clientY - cy) / (r.height * .38);
        const len = Math.hypot(dx, dy);
        if (len > 1) { dx /= len; dy /= len; }
        this.joy.dx = dx; this.joy.dy = dy; this.joy.run = Math.hypot(dx, dy) > .86;
        knob.style.transform = 'translate(' + (dx * r.width * .3) + 'px,' + (dy * r.height * .3) + 'px)';
      };
      base.addEventListener('pointerdown', e => { active = true; pid = e.pointerId; base.setPointerCapture(pid); PC.Audio.init(); set(e); e.preventDefault(); });
      base.addEventListener('pointermove', e => { if (active && e.pointerId === pid) set(e); });
      const end = e => { if (!active) return; active = false; this.joy.dx = 0; this.joy.dy = 0; this.joy.run = false; knob.style.transform = ''; };
      base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end); base.addEventListener('lostpointercapture', end);
      // 键盘关闭
      window.addEventListener('keydown', e => {
        if (e.key === 'Escape') { if (this.bpOpen) this.closeBlueprint(); else if (this.dialogOpen) this.closeDialog(); else if (this.panelOpen) this.closePanel(); }
      });
      this.updateHUD();
    },

    isOpen() { return this.dialogOpen || this.panelOpen || this.bpOpen || !$('help').classList.contains('hidden'); },

    /* ---- HUD ---- */
    updateHUD() {
      const d = St.d(), w = St.weather();
      $('hudMoney').textContent = Math.round(d.money).toLocaleString('zh-CN');
      $('hudTime').textContent = St.timeStr();
      $('hudDay').textContent = 'D' + d.day;
      $('hudWeather').textContent = w.icon + ' ' + St.tempAt() + '°C';
      $('hudPlace').textContent = St.placeLabel();
      const sta = $('barSta'), mood = $('barMood');
      sta.style.width = U.clamp(d.stamina, 0, 100) + '%'; sta.className = d.stamina < 25 ? 'low' : '';
      mood.style.width = U.clamp(d.mood, 0, 100) + '%'; mood.className = d.mood < 25 ? 'low' : '';
      const btnA = $('btnA');
      if (this.handlers.hasTarget && this.handlers.hasTarget()) btnA.classList.add('ready'); else btnA.classList.remove('ready');
      this.refreshMusicBtn();
      this.refreshPhoneBtn();
      this.renderTicker();
    },
    refreshPhoneBtn() {
      const b = $('btnPhone'); if (!b) return;
      const p = St.d().phone;
      b.textContent = p && p.pending ? '🛵' : '📱';
      b.title = p && p.pending ? '手机 · 外卖配送中' : '手机 · 刷帖 / 叫外卖 / 回家（P）';
      b.classList.toggle('ringing', !!(p && p.pending));
    },
    toast(msg) {
      const el = $('toast'); el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    },
    setTicker(msg) { this._tickerGreet = msg || ''; this.renderTicker(); },
    renderTicker() {
      const w = St.weather(), s = PC.Main && PC.Main.scene, isY = St.isYulong();
      let place = '曙光路';
      if (s) {
        if (s.id === 'street') place = '曙光路 · 中心街';
        else if (s.id === 'yulong') place = '迂龙路 · YULONG ROAD';
        else if (s.id === 'metro') place = '地铁站 · 1号线站台';
        else if (s.id === 'train') place = (s.ride ? s.ride.name : '列车') + ' · 行驶中';
        else place = s.label;
      }
      const route = isY ? '921 路 / S1 · S2 线经停' : '92 路经停 · 1号线 ⇄ 迂龙路';
      const text = place + '　·　无限極人生 INFINITY LIVES　·　' +
        w.name + ' ' + St.tempAt() + '°C　·　' + route +
        (this._tickerGreet ? '　·　' + this._tickerGreet : '');
      const el = $('tickerText');
      if (el && el.textContent !== text) el.textContent = text;   // 不变则不打断 CSS 滚动
    },

    /* ---- 对话框 ---- */
    showDialog(cfg) {
      this.closePanel();
      this.dialogOpen = true; $('dialog').classList.remove('hidden');
      $('dlgTitle').textContent = cfg.title || '对话';
      $('dlgText').textContent = cfg.text || '';
      const box = $('dlgOpts'); box.innerHTML = '';
      (cfg.options || [{ label: '好' }]).forEach(o => {
        const b = document.createElement('button'); b.className = 'opt';
        b.innerHTML = U.escape(o.label) + (o.cost ? '<span class="cost">' + U.escape(o.cost) + '</span>' : '');
        b.addEventListener('click', () => {
          PC.Audio.sfx('click');
          const res = o.onPick ? o.onPick() : null;
          if (typeof res === 'string' && res !== '__close' && res !== '__keep') this.showResult(cfg.title, res);
          else if (res !== '__keep') this.closeDialog();
        });
        box.appendChild(b);
      });
    },
    showResult(title, text) {
      this.dialogOpen = true; $('dialog').classList.remove('hidden');
      $('dlgTitle').textContent = title + ' · 结果';
      $('dlgText').textContent = text;
      const box = $('dlgOpts'); box.innerHTML = '';
      const b = document.createElement('button'); b.className = 'opt'; b.textContent = '好，继续逛 →';
      b.addEventListener('click', () => { PC.Audio.sfx('click'); this.closeDialog(); });
      box.appendChild(b);
    },
    closeDialog() { this.dialogOpen = false; $('dialog').classList.add('hidden'); },

    /* ---- 通用面板 ---- */
    openPanel(title, body, foot) {
      $('panel').classList.toggle('phone-mode', String(title).indexOf('📱') >= 0);
      this.dialogOpen = false; $('dialog').classList.add('hidden');
      this.panelOpen = true; $('panel').classList.remove('hidden');
      $('panelTitle').textContent = title;
      $('panelBody').innerHTML = body;
      $('panelFoot').innerHTML = foot || '';
      $('panelBody').scrollTop = 0;
    },
    closePanel() { if (PC.Play) PC.Play.stopGame(); this.panelOpen = false; $('panel').classList.add('hidden'); },

    /* ---- 商店 ---- */
    openShop(shopId) {
      const shop = PC.SHOP_BY_ID[shopId] || PC.SHOP_BY_ID.vending;
      const d = St.d();
      let h = '<div class="section-t">店内 · ' + U.escape(shop.en) + '</div>';
      h += '<p style="margin:.2em 0 .6em">' + U.escape(shop.blurb) + '</p>';
      if (shop.counter) h += '<p style="color:#8b87c0;font-size:.85em">店员：' + U.escape(shop.counter) + '</p>';
      const extra = [];
      if (d.members.indexOf('FAMILY GO') >= 0 && shopId === 'familygo') extra.push('<span class="tag vip">会员 7 折生效</span>');
      if (d.coupons[shopId] > 0) extra.push('<span class="tag sale">8 折券 ×' + d.coupons[shopId] + '</span>');
      if (extra.length) h += '<p>' + extra.join(' ') + '</p>';
      h += '<div class="section-t">货架</div>';
      (shop.items || []).forEach(id => {
        const it = PC.ITEMS[id]; if (!it) return;
        const p = St.price(id, shopId), afford = d.money >= p;
        const tag = it.tag === 'food' ? '食用' : it.tag === 'read' ? '阅读' : it.tag === 'card' ? '凭证' : it.tag === 'luxury' ? '大额' : it.tag === 'game' ? '游戏' : '道具';
        h += '<div class="row"><div><span class="name">' + U.escape(it.name) + '</span> <span class="tag">' + tag + '</span>' +
          '<span class="desc">' + U.escape(it.desc) + '</span></div>' +
          '<div style="text-align:right"><span class="price">' + U.money(p) + (p < it.price ? ' <s style="color:#9a97bd;font-size:.75em">' + U.money(it.price) + '</s>' : '') + '</span><br>' +
          '<button class="mini" data-buy="' + id + '" data-shop="' + shopId + '"' + (afford ? '' : ' disabled') + '>' + (afford ? '买下' : '钱不够') + '</button></div></div>';
      });
      h += '<p style="margin-top:.6em"><button class="mini" data-go="jobs:' + shopId + '">💼 本店兼职 →</button> ' +
        '<button class="mini" data-go="earn">💰 赚钱总览 →</button></p>';
      const foot = '<span>余额 <b>' + U.money(d.money) + '</b></span><span>ESC 关闭 · 买完按 B 用</span>';
      this.openPanel('🏪 ' + shop.name, h, foot);
    },

    /* ---- 背包 ---- */
    toggleBag() {
      if (this.panelOpen && $('panelTitle').textContent.indexOf('背包') >= 0) this.closePanel();
      else { PC.Audio.sfx('bag'); this.openBag(); }
    },
    openBag() {
      const d = St.d();
      let h = '<div class="stat-grid">';
      [['金钱', U.money(d.money)], ['体力', Math.round(d.stamina)], ['心情', Math.round(d.mood)],
      ['学识', Math.round(d.knowledge)], ['体魄', Math.round(d.fitness)], ['声望', Math.round(d.fame)]]
        .forEach(s => h += '<div class="stat"><b>' + s[1] + '</b>' + s[0] + '</div>');
      h += '</div>';
      h += '<div class="section-t">持有 · 点击使用</div>';
      const keys = Object.keys(d.bag).filter(k => d.bag[k] > 0);
      if (!keys.length) h += '<p style="color:#8b87c0">空空的。去店里买点什么吧。</p>';
      keys.forEach(id => {
        const it = PC.ITEMS[id]; if (!it) return;
        h += '<div class="row"><div><span class="name">' + U.escape(it.name) + ' ×' + d.bag[id] + '</span>' +
          '<span class="desc">' + U.escape(it.desc) + '</span></div>' +
          '<button class="mini" data-use="' + id + '">使用</button></div>';
      });
      h += '<div class="section-t">已激活</div>';
      const owned = d.owned.slice();
      Object.keys(d.flags).forEach(f => { const map = { shopOwner: '旺铺业主（每日分红）', home: '二室一厅业主', umbrella: '折叠伞', buscard: '92路公交卡', gym: '健身月卡', key: '备用钥匙', ticket: '周末游抽奖券' }; if (map[f]) owned.push(map[f]); });
      d.members.forEach(m => owned.push(m + ' 会员卡'));
      Object.keys(d.coupons).forEach(c => { if (d.coupons[c] > 0) owned.push((PC.SHOP_BY_ID[c] ? PC.SHOP_BY_ID[c].name : c) + ' 8折券 ×' + d.coupons[c]); });
      h += owned.length ? owned.map(o => '<span class="tag own">' + U.escape(o) + '</span>').join(' ') : '<p style="color:#8b87c0">暂无。</p>';
      h += '<div class="section-t">街区</div><p style="font-size:.85em">D' + d.day + ' · ' + St.timeStr() + ' · ' + St.weather().icon + ' ' + St.tempAt() + '°C ' + St.weather().name +
        '<br>买过 ' + d.stats.bought + ' 件 · 事件 ' + d.stats.events + ' 次 · 进店 ' + d.stats.shops + ' 次</p>';
      h += '<div class="section-t">钱包</div><p style="font-size:.9em">今日赚了 <b>' + U.money(d.earnedToday || 0) + '</b>　累计 <b>' + U.money(d.earnedTotal || 0) + '</b>' +
        '<br>沁银行账户 ' + U.money(d.bank || 0) + '（每日 1.5% 日息）</p>';
      h += '<button class="mini" style="width:100%;padding:.45em;margin-top:.3em" data-go="earn">💰 打开赚钱渠道总览 →</button>';
      h += '<button class="mini" style="width:100%;padding:.35em;margin-top:.25em" data-go="music">🎵 配乐区 · 给各场景放音乐 →</button>';
      h += '<button class="mini" style="width:100%;padding:.35em;margin-top:.25em" data-go="phone">📱 手机 · 刷帖 / 叫外卖 / 回家 →</button>';
      this.openPanel('🎒 背包 / 状态', h, '<span>B / I / ESC 关闭</span><span>自动存档已开启</span>');
    },

    /* ================= 赚钱系统面板 ================= */
    /* 岗位小问答 */
    startJob(ctx, jobId) {
      const list = PC.JOBS[ctx] || [];
      const job = list.find(j => j.id === jobId); if (!job) return;
      const d = St.d();
      const err = PC.JobSystem.canWork(d, job.stamina);
      if (err) { this.toast(err); PC.Audio.sfx('error'); return; }
      const times = PC.JobSystem.timesToday(d, ctx, jobId);
      this.closePanel();
      this.showDialog({
        title: '💼 ' + job.title,
        text: job.desc + '\n\n工钱 ' + U.money(job.pay[0]) + '–' + U.money(job.pay[1]) +
          '　体力 ' + job.stamina + '　用时 ' + job.minutes + ' 分钟' +
          (times >= 3 ? '\n⚠ 今天这活干太多次了，工钱降至四成' : '') +
          '\n\n【老板的小考】' + job.quiz.q,
        options: job.quiz.opts.map((o, i) => ({
          label: o,
          onPick: () => {
            const r = PC.JobSystem.doJob(ctx, jobId, i);
            if (!r.ok) { this.toast(r.msg); PC.Audio.sfx('error'); return '__close'; }
            if (PC.Play) PC.Play.mark('jobs');
            this.updateHUD();
            this.showResult('💼 ' + job.title, r.msg);
            return '__keep';
          }
        }))
      });
    },
    openJobs(ctx, title) {
      const d = St.d(); PC.JobSystem.ensure(d);
      const list = PC.JOBS[ctx] || [];
      const name = (PC.SHOP_BY_ID[ctx] ? PC.SHOP_BY_ID[ctx].name : null) ||
        ({ metro: '曙光路站', campus: '渊迂市汾阳中学', park: '林景园', street: '曙光路街口' }[ctx] || title || '这里');
      let h = '<div class="section-t">' + U.escape(name) + ' · 可打的工</div>';
      h += '<p style="font-size:.85em">每家店的活都不一样：答对老板的小考工钱 ×1.25，答错打五五折。同一岗位一天做满 3 次后工钱降为四成，换一家更划算。</p>';
      if (!list.length) h += '<p style="color:#8b87c0">这里暂时没有空缺。</p>';
      list.forEach(j => {
        const times = PC.JobSystem.timesToday(d, ctx, j.id);
        h += '<div class="row"><div><span class="name">' + U.escape(j.title) + '</span>' +
          (times ? ' <span class="tag sale">今日 ' + times + ' 次</span>' : '') +
          '<span class="desc">' + U.escape(j.desc) + '</span>' +
          '<span class="desc">💰 ' + U.money(j.pay[0]) + '–' + U.money(j.pay[1]) + '　⚡ ' + j.stamina + '　⏱ ' + j.minutes + '分</span></div>' +
          '<button class="mini" data-job="' + j.id + '" data-ctx="' + ctx + '">上工</button></div>';
      });
      h += '<p style="margin-top:.6em"><button class="mini" data-go="earn">💰 全部赚钱渠道 →</button></p>';
      this.openPanel('💼 ' + name + ' · 兼职', h,
        '<span>今日收入 ' + U.money(d.earnedToday || 0) + '</span><span>体力 ' + Math.round(d.stamina) + '/100</span>');
    },
    /* 委托板 */
    openGigBoard() {
      const d = St.d(); PC.JobSystem.ensure(d);
      if (!d.gigs || !d.gigs.length) PC.JobSystem.refreshGigs(d);
      let h = '<div class="section-t">📋 今日委托 · 接单送到指定地点</div>';
      if (d.gigActive) {
        h += '<div class="row" style="background:rgba(255,210,90,.22)"><div><span class="name">🔖 手上的单：' + U.escape(d.gigActive.title) + '</span>' +
          '<span class="desc">' + U.escape(d.gigActive.desc) + '</span></div><div class="price">' + U.money(d.gigActive.pay) + '</div></div>';
        h += '<p style="font-size:.85em">走到对应地点，靠近发光标记按 A / E 交差即可。同时只能接一单。</p>';
      }
      if (!d.gigs.length) h += '<p style="color:#8b87c0">今天的单都被接走了，明天再来（或去 ATM 存钱推进时间）。</p>';
      d.gigs.forEach(g => {
        h += '<div class="row"><div><span class="name">' + U.escape(g.title) + '</span>' +
          '<span class="desc">来自 ' + U.escape(g.from) + ' · ' + U.escape(g.desc) + '</span></div>' +
          '<div style="text-align:right"><span class="price">' + U.money(g.pay) + '</span><br>' +
          '<button class="mini" data-gig="' + g.id + '"' + (d.gigActive ? ' disabled' : '') + '>接单</button></div></div>';
      });
      h += '<p style="font-size:.85em;margin-top:.5em">交付时如果声望 ≥10，报酬额外 +20%。</p>';
      h += '<p><button class="mini" data-go="earn">💰 全部赚钱渠道 →</button></p>';
      this.openPanel('📋 零工委托板', h, '<span>已完成 ' + (d.gigDone || 0) + ' 单</span><span>D' + d.day + ' 刷新</span>');
    },
    /* 回收箱 */
    openRecycle() {
      const d = St.d(); PC.JobSystem.ensure(d);
      const v = PC.JobSystem.recycleValue(d);
      let h = '<div class="section-t">♻ 齐阵回收箱 · 街上随手捡</div>';
      h += '<p style="font-size:.85em">曙光路地面上会随机刷新易拉罐、水瓶、纸箱、旧海报。走近按 A 捡起来，攒着到这里换钱；声望越高，回收价越好。</p>';
      const keys = Object.keys(d.recycleBag).filter(k => d.recycleBag[k] > 0);
      if (!keys.length) h += '<p style="color:#8b87c0">回收袋是空的，去街上转一圈。</p>';
      keys.forEach(k => {
        const it = PC.RECYCLE[k];
        h += '<div class="row"><div><span class="name">' + U.escape(it.name) + ' ×' + d.recycleBag[k] + '</span>' +
          '<span class="desc">单价 ' + U.money(it.value) + '</span></div><div class="price">' + U.money(it.value * d.recycleBag[k]) + '</div></div>';
      });
      h += '<div class="row"><div><span class="name">合计 ' + v.n + ' 件</span><span class="desc">含声望加成</span></div><div class="price">' + U.money(v.sum) + '</div></div>';
      h += '<button class="mini" style="width:100%;padding:.45em;margin-top:.4em" data-rec="1"' + (v.n ? '' : ' disabled') + '>♻ 全部卖掉 →</button>';
      h += '<p style="margin-top:.5em"><button class="mini" data-go="earn">💰 全部赚钱渠道 →</button></p>';
      this.openPanel('♻ 回收站', h, '<span>今日收入 ' + U.money(d.earnedToday || 0) + '</span><span>声望 ' + Math.round(d.fame) + '</span>');
    },
    /* 街头摆摊 */
    openStall() {
      const d = St.d(); PC.JobSystem.ensure(d);
      const v = PC.JobSystem.stallValue(d);
      let h = '<div class="section-t">⛺ 广场空地 · 摆个小摊</div>';
      h += '<p style="font-size:.85em">把背包里用不上的零碎按六五折出手（凭证和大额物品保留）。耗时 40 分钟，声望 +2，体力 -6。</p>';
      const keys = Object.keys(d.bag).filter(k => d.bag[k] > 0);
      const sellable = keys.filter(k => { const it = PC.ITEMS[k]; return it && it.tag !== 'card' && it.tag !== 'luxury'; });
      if (!sellable.length) h += '<p style="color:#8b87c0">背包里没有能摆出来卖的东西。</p>';
      sellable.forEach(k => {
        const it = PC.ITEMS[k];
        h += '<div class="row"><div><span class="name">' + U.escape(it.name) + ' ×' + d.bag[k] + '</span>' +
          '<span class="desc">原价 ' + U.money(it.price) + ' → 摆摊价 ' + U.money(Math.max(2, Math.round(it.price * .65))) + '</span></div></div>';
      });
      h += '<div class="row"><div><span class="name">预计收入</span></div><div class="price">' + U.money(v.sum) + '</div></div>';
      h += '<button class="mini" style="width:100%;padding:.45em;margin-top:.4em" data-stall="1"' + (v.n ? '' : ' disabled') + '>⛺ 开摊收工 →</button>';
      h += '<p style="margin-top:.5em"><button class="mini" data-go="earn">💰 全部赚钱渠道 →</button></p>';
      this.openPanel('⛺ 街头摆摊', h, '<span>体力 ' + Math.round(d.stamina) + '/100</span><span>声望 ' + Math.round(d.fame) + '</span>');
    },
    /* 赚钱渠道总览 */
    /* ---- 🎯 人生目标板 ---- */
    togglePlay() { if (this.panelOpen && $('panelTitle').textContent.indexOf('人生') >= 0) this.closePanel(); else this.openPlay(); },
    openPlay() {
      if (PC.Play) PC.Play.stopGame();
      const d = St.d(), P = PC.Play, L = P.levelInfo(), p = P.ensure(d);
      PC.Audio.sfx('screen');
      let h = '<div class="section-t">⭐ 人生等级 · RANK ' + U.escape(L.rank) + '</div>';
      h += '<div class="lv-card"><span class="lv-rank">' + U.escape(L.rank) + '</span> ' +
        '<span class="lv-title">' + U.escape(L.title) + '</span>' +
        '<div class="lv-xpbar"><i style="width:' + Math.round(L.pct * 100) + '%"></i></div>' +
        '<div style="font-size:.78em;color:#8b87c0">' + (L.max ? '已达顶级 · ∞' :
          '经验 ' + L.xp + ' / ' + L.nextXp + '　还差 ' + (L.nextXp - L.xp)) + '</div>' +
        '<div style="font-size:.76em;color:#7fe0c8;margin-top:.3em">被动：' +
        (L.lv >= 8 ? '体力 -18% · ' : L.lv >= 1 ? '体力 -8% · ' : '') +
        (L.lv >= 6 ? '全场 88 折 · ' : L.lv >= 3 ? '全场 95 折 · ' : '') +
        (L.lv >= 5 ? '挑战奖励 +' + Math.round((P.passive('challenge') - 1) * 100) + '%' : '升级解锁折扣') +
        '</div></div>';

      h += '<div class="section-t">🎯 今日挑战 · D' + d.day + '</div>';
      (p.challenges.length ? p.challenges : P.CHALLENGES.slice(0, 3).map(c => c.id)).forEach(cid => {
        const c = P.CHALLENGES.find(q => q.id === cid); if (!c) return;
        const cur = P.progress(d, c), done = cur >= c.goal, got = p.claimed.indexOf(cid) >= 0;
        h += '<div class="ch-row ' + (got ? 'claimed' : done ? 'done' : '') + '">' +
          '<span class="name">' + U.escape(c.title) + '</span> ' +
          (got ? '<span class="tag">已领</span>' : done ? '<span class="tag vip">可领奖</span>' : '') +
          '<span class="desc">' + U.escape(c.tip) + '</span>' +
          '<div class="ch-bar"><i style="width:' + Math.round(Math.min(1, cur / c.goal) * 100) + '%"></i></div>' +
          '<div style="font-size:.76em;color:#8b87c0">' + Math.min(cur, c.goal) + ' / ' + c.goal +
          '　奖励 ' + U.money(Math.round(c.money * P.passive('challenge'))) + ' + 经验 ' + c.xp + '</div>' +
          (done && !got ? '<button class="mini" data-play="claim:' + cid + '">领取奖励 →</button>' : '') +
          '</div>';
      });
      h += '<p style="font-size:.76em;color:#8b87c0">每天跨天自动换 3 条；进店、买东西、走路、赚钱、打工、坐地铁、拍照、玩小游戏都算进度。</p>';

      h += '<div class="section-t">📖 收集图鉴</div>';
      P.collection().forEach(r => {
        h += '<div class="col-row"><span class="name">' + U.escape(r.name) + '</span> ' +
          (r.done ? '<span class="tag vip">已集齐</span>' : '') +
          '<span class="desc">' + U.escape(r.tip) + ' · ' + r.have + ' / ' + r.total + '</span>' +
          '<div class="col-bar"><i style="width:' + Math.round(r.pct * 100) + '%"></i></div>' +
          (r.done && !r.claimed ? '<button class="mini" data-play="col:' + r.key + '">领集齐奖励 →</button>' :
            r.claimed ? '<span class="tag">奖励已领</span>' : '') + '</div>';
      });

      h += '<div class="section-t">🎮 玩点什么</div>';
      h += '<p style="margin:.2em 0 .5em"><button class="mini" data-play="game:coins">🕹 街机 · 抢金币</button> ' +
        '<button class="mini" data-play="game:fish">🎣 捞锦鲤</button> ' +
        '<button class="mini" data-play="gacha">🎰 扭蛋 ¥20</button></p>';
      h += '<p style="font-size:.76em;color:#8b87c0">抢金币 ' + (p.best.coins || 0) + ' 分 · 捞锦鲤 ' + (p.best.fish || 0) +
        ' 分 · 已抽 ' + (p.gachaCount || 0) + ' 次扭蛋。分数按等级加成换钱。</p>';

      h += '<div class="section-t">💬 街坊好感</div>';
      const names = Object.keys(PC.NPC_LINES || {}).filter(n => (p.npc[n] && p.npc[n].pts > 0) || true).slice(0, 12);
      h += '<div class="bond-list">' + names.map(n => {
        const b = P.bondInfo(n);
        return '<span class="bond-chip">' + U.escape(n) + ' Lv.' + b.lv + '</span>';
      }).join('') + '</div>';
      h += '<p style="font-size:.76em;color:#8b87c0">走到 NPC 旁边按 A 聊天涨好感，Lv.3 送券、每级给现金；也可以花 ¥15 送份小礼物。</p>';
      h += '<p style="margin-top:.6em"><button class="mini" data-go="earn">💰 赚钱总览 →</button> ' +
        '<button class="mini" data-go="estate">🏛 房产 →</button> ' +
        '<button class="mini" data-go="bag">🎒 背包 →</button></p>';
      this.openPanel('🎯 人生目标 · 无限極人生', h,
        '<span>T / ESC 关闭</span><span>经验 ' + L.xp + ' · RANK ' + U.escape(L.rank) + '</span>');
    },

    /* ---- 林景园 · 售楼处 / 房产手册 ---- */
    openEstate() {
      const d = St.d(), E2 = PC.Estate, e = E2.ensure(d);
      let h = '<div class="section-t">🏛 林景园 · 售楼处</div>';
      h += '<p style="margin:.2em 0 .5em">西洋风小区，1 / 3 / 5 栋是居民楼，A / B / C 座是别墅。' +
        '主角的家在 <b>3 栋 502</b>。公寓能换大户型，别墅能买来住；多余的房子可挂出去收租。</p>';
      h += '<p style="color:#8b87c0;font-size:.85em">设计稿海报：二室一厅 290万 / 好景三室 330万 / 在林景园 470万。' +
        '游戏内按街区币结算，下面才是能掏得起的价。</p>';
      h += '<div class="section-t">名下 ' + e.owned.length + ' 套 · 出租中 ' + e.rented.length + ' 套 · 累计租金 ' + U.money(e.rentEarned || 0) + '</div>';
      [['apt', '🏢 公寓 · 居民楼'], ['villa', '🏡 别墅 · A / B / C 座']].forEach(([kind, title]) => {
        h += '<div class="section-t">' + title + '</div>';
        E2.units.filter(u => u.kind === kind).forEach(u => {
          const owned = e.owned.indexOf(u.id) >= 0, home = e.home === u.id, rented = e.rented.indexOf(u.id) >= 0;
          const state = home ? '<span class="tag vip">现在的家</span>' : rented ? '<span class="tag sale">出租中</span>'
            : owned ? '<span class="tag">已购</span>' : '<span class="tag">在售</span>';
          h += '<div class="row"><div><span class="name">' + U.escape(u.name) + '</span> ' + state +
            '<span class="desc">' + U.escape(u.desc) + '</span>' +
            '<span class="desc">日租 ' + (u.rent ? U.money(u.rent) : '—') + ' · ' + U.escape(u.en) + '</span></div>' +
            '<div style="text-align:right"><span class="price">' + (u.price ? U.money(u.price) : '已持有') + '</span><br>';
          if (!owned) h += '<button class="mini" data-estbuy="' + u.id + '"' + (d.money >= u.price ? '' : ' disabled') + '>' +
            (d.money >= u.price ? '买下' : '钱不够') + '</button>';
          else {
            if (!home) h += '<button class="mini" data-esthome="' + u.id + '">设为家</button> ';
            if (!home && u.rent) h += '<button class="mini" data-estrent="' + u.id + '">' + (rented ? '收回' : '出租') + '</button>';
            if (home) h += '<button class="mini" disabled>住着呢</button>';
          }
          h += '</div></div>';
        });
      });
      h += '<p style="margin-top:.6em"><button class="mini" data-go="earn">💰 赚钱总览 →</button> ' +
        '<button class="mini" data-go="bag">🎒 背包 →</button></p>';
      h += '<p style="color:#8b87c0;font-size:.82em">买下后会自动搬进去；出门再回家就能看到新家。' +
        '换公寓时旧房折 60% 抵房款。每天跨天结算租金，存进现金。</p>';
      this.openPanel('🏛 林景园 · 房产 / 搬家 / 出租', h,
        '<span>现金 <b>' + U.money(d.money) + '</b></span><span>ESC 关闭 · ' + U.escape(E2.summary()) + '</span>');
    },
    openEarn() {
      const d = St.d(); PC.JobSystem.ensure(d);
      const rec = PC.JobSystem.recycleValue(d);
      const stall = PC.JobSystem.stallValue(d);
      let h = '<div class="stat-grid">';
      [['现金', U.money(d.money)], ['今日赚', U.money(d.earnedToday || 0)], ['累计赚', U.money(d.earnedTotal || 0)],
      ['银行', U.money(d.bank || 0)], ['回收袋', rec.n + ' 件'], ['可摆摊', stall.n + ' 件']]
        .forEach(s => h += '<div class="stat"><b>' + s[1] + '</b>' + s[0] + '</div>');
      h += '</div>';
      h += '<div class="section-t">八条赚钱渠道</div>';
      const chans = [
        ['💼 店铺兼职', '19 家店各有 2 个专属岗位，带设计稿小考；答对加薪。走进店里找 💼 标记。', null],
        ['🏫 场景零工', '地铁站引导、学校值日 / 抄笔记、公园遛狗、街口派传单 / 卖艺。', null],
        ['📋 零工委托', '接单 → 走到指定地点按 A 交差。每天刷新 3 单，声望高有加成。', 'gigs'],
        ['♻ 拾荒回收', '街上捡易拉罐 / 纸箱 / 旧海报，去回收箱换钱。', 'recycle'],
        ['⛺ 街头摆摊', '把背包零碎按六五折出手，顺带涨声望。', 'stall'],
        ['🏧 银行利息', '存款每日 1.5% 日息，过夜自动到账。', null],
        ['🏬 旺铺分红', '租下「旺铺招租」（¥8800）后每天分红 ¥180 + 声望×2。', null],
        ['🏆 成就奖金', '赚钱 / 进店 / 学识 / 体魄 / 声望达标即领，最高 ¥300。', null]
      ];
      chans.forEach(c => {
        h += '<div class="row"><div><span class="name">' + c[0] + '</span><span class="desc">' + U.escape(c[1]) + '</span></div>' +
          (c[2] ? '<button class="mini" data-go="' + c[2] + '">打开</button>' : '<span class="tag">场景中</span>') + '</div>';
      });
      // 银行快捷存取
      h += '<div class="section-t">🏧 沁银行 · 快捷存取</div>';
      h += '<p style="font-size:.85em">当前账户 ' + U.money(d.bank || 0) + '，明日预计日息 ' + U.money(Math.max(1, Math.floor((d.bank || 0) * .015))) + '。ATM 也可办。</p>';
      h += '<button class="mini" style="margin:.2em" data-bank="100">存 ¥100</button>' +
        '<button class="mini" style="margin:.2em" data-bank="500">存 ¥500</button>' +
        '<button class="mini" style="margin:.2em" data-bank="-100">取 ¥100</button>' +
        '<button class="mini" style="margin:.2em" data-bank="-100000">全部取出</button>';
      // 成就
      h += '<div class="section-t">🏆 成就奖金</div>';
      PC.ACHIEVEMENTS.forEach(a => {
        const got = !!d.achClaimed[a.id], ok = a.cond(d);
        h += '<div class="row"><div><span class="name">' + (got ? '✅ ' : ok ? '🎁 ' : '🔒 ') + U.escape(a.title) + '</span>' +
          '<span class="desc">' + U.escape(a.desc) + '　奖金 ' + U.money(a.bonus) + '</span></div>' +
          (got ? '<span class="tag own">已领</span>' : ok ? '<button class="mini" data-ach="' + a.id + '">领取</button>' : '<span class="tag">未达成</span>') + '</div>';
      });
      // 打工记录
      h += '<div class="section-t">最近工钱</div>';
      if (!(d.jobLog || []).length) h += '<p style="color:#8b87c0">还没上过工。</p>';
      (d.jobLog || []).slice(0, 8).forEach(l => h += '<div class="logline"><span>' + U.escape(l.t) + '</span>' + U.escape(l.text) + '</div>');
      this.openPanel('💰 赚钱渠道 · 无限極人生', h,
        '<span>D' + d.day + ' · 体力 ' + Math.round(d.stamina) + '</span><span>ESC 关闭 · 进度自动保存</span>');
    },

    /* ================= 🎵 配乐区 ================= */
    refreshMusicBtn() {
      const b = $('btnMusic');
      if (!b || !PC.Music) return;
      b.classList.toggle('off', !PC.Music.enabled);
      b.textContent = PC.Music.enabled ? '🎵' : '🔇';
    },
    toggleMusic() {
      if (this.panelOpen && $('panelTitle').textContent.indexOf('配乐') >= 0) this.closePanel();
      else { this.openMusic(); PC.Audio.sfx('screen'); }
    },
    openMusic() {
      const M = PC.Music; M.init();
      const st = M.status();
      let h = '<div class="section-t">🎵 配乐区 · 不同场景不同音乐</div>';
      h += '<p style="font-size:.85em">已填好 <code>src</code> 的槽位会自动播放，<b>未填的槽位＝静默</b>，不报错。把 mp3/ogg 放进项目里的 <code>music/</code> 目录后填 <code>music/school.mp3</code>，或直接粘贴 <code>https://…</code> 链接；保存后立即生效并自动存本机。<br>进店、出店、昼夜交替、下雨都会自动淡出淡入切换。</p>';
      h += '<div class="row"><div><span class="name">' + (M.enabled ? '🔊 配乐已开启' : '🔇 配乐已静音') + '</span>' +
        '<span class="desc">当前槽位：' + U.escape(st.name || '—') + (st.playing ? ' · 播放中' : (st.key ? ' · 未配置音源' : '')) + '</span></div>' +
        '<button class="mini" data-mtoggle="1">' + (M.enabled ? '静音' : '开启') + '</button></div>';
      h += '<div class="row"><div><span class="name">总音量</span><span class="desc">' + Math.round(M.volume * 100) + '%</span></div>' +
        '<input id="musicVol" type="range" min="0" max="100" value="' + Math.round(M.volume * 100) + '" style="width:10em;max-width:55%"></div>';
      h += '<div class="row" style="background:rgba(255,210,90,.18)"><div><span class="name">已配置 ' + st.configured + ' / ' + st.total + ' 个槽位</span>' +
        '<span class="desc">也可以直接编辑 <code>js/music.js</code> 顶部的 SLOTS，把 src 写死在代码里。</span></div></div>';
      ['街区', '场景', '店铺'].forEach(g => {
        const list = M.slots.filter(s => s.group === g);
        h += '<div class="section-t">' + g + ' · ' + list.length + ' 个槽位</div>';
        list.forEach(s => {
          const src = M.srcFor(s.key);
          h += '<div class="row" style="flex-wrap:wrap;align-items:flex-start">' +
            '<div style="flex:1;min-width:8em"><span class="name">' + (src ? '🎶 ' : '○ ') + U.escape(s.name) + '</span>' +
            '<span class="desc">' + U.escape(s.hint) + '　<code>' + s.key + '</code></span></div>' +
            '<div style="display:flex;gap:.25em;align-items:center;flex-wrap:wrap;margin-top:.2em">' +
            '<input id="msrc_' + s.key + '" class="music-src" value="' + U.escape(src) + '" placeholder="music/xxx.mp3 或 https://…" ' +
            'style="width:11em;max-width:100%;font-size:.8em;padding:.2em;border:2px solid #5b57ad">' +
            '<button class="mini" data-msave="' + s.key + '">保存</button>' +
            '<button class="mini" data-mtest="' + s.key + '">试听</button>' +
            (src ? '<button class="mini" data-mclear="' + s.key + '">清空</button>' : '') +
            '</div></div>';
        });
      });
      h += '<p style="font-size:.82em;margin-top:.7em">提示：浏览器要求先有一次点击才允许播放，所以请先进游戏。填的是本地文件时，用 <code>python3 -m http.server</code> 起服务会更稳。</p>';
      this.openPanel('🎵 配乐区 · 场景音乐', h, '<span>N / ESC 关闭</span><span>配置存在本机，刷新不丢</span>');
    },

    /* ---- 日志 ---- */
    openLog() {
      const d = St.d();
      let h = '<div class="section-t">街区日志（最近 ' + d.log.length + ' 条）</div>';
      if (!d.log.length) h += '<p style="color:#8b87c0">还没有故事。走走看。</p>';
      d.log.forEach(l => h += '<div class="logline"><span>' + U.escape(l.t) + '</span>' + U.escape(l.text) + '</div>');
      h += '<div class="section-t">随手触发</div><p style="font-size:.85em">街上每隔一阵就会遇到点事。也可以主动来一个：</p>';
      ['musician', 'cat', 'arcade', 'vending', 'flea'].forEach(id => {
        const e = PC.Events.byId(id);
        h += '<button class="mini" style="margin:.2em" data-ev="' + id + '">✦ ' + (e ? e.title : id) + '</button>';
      });
      this.openPanel('📓 街区日志', h, '<span>D 键 / ESC 关闭</span>');
    },

    /* ---- 蓝图：两张手绘设计稿，按钮切换 ---- */
    bpPage: null,
    toggleBlueprint() { if (this.bpOpen) this.closeBlueprint(); else this.openBlueprint(); },
    openBlueprint(page) {
      this.closeDialog(); this.closePanel();
      if (page) this.bpPage = page;
      if (!this.bpPage) this.bpPage = (PC.Main && PC.Main.scene && PC.Main.scene.id === 'yulong') ? 'yulong' : 'street';
      this.bpOpen = true; $('blueprint').classList.remove('hidden');
      PC.Blueprint.render($('bpCanvas'), St, PC.Main && PC.Main.scene, PC.Main && PC.Main.player, this.bpPage);
      const sw = $('bpSwitch');
      if (sw) sw.textContent = this.bpPage === 'yulong' ? '⇄ 曙光路稿' : '⇄ 迂龙路稿';
      PC.Audio.sfx('ok');
    },
    switchBlueprint() {
      this.openBlueprint(this.bpPage === 'yulong' ? 'street' : 'yulong');
    },
    closeBlueprint() { this.bpOpen = false; $('blueprint').classList.add('hidden'); }
  };
})();
