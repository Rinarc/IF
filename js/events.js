/* events.js —— 街区随机事件库与调度 */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U, St = PC.State;
  const api = {
    change: (k, v) => St.change(k, v),
    addItem: (id, n) => St.addItem(id, n),
    eff: e => St.applyEff(e),
    log: t => St.logMsg(t),
    sfx: n => PC.Audio.sfx(n),
    chance: p => U.chance(p),
    rand: (a, b) => U.randInt(a, b),
    d: () => St.d()
  };

  const E = [];
  const ev = (o) => { E.push(o); return o; };
  const opt = (label, run) => ({ label, run });

  ev({
    id: 'musician', title: '街头艺人', weight: 3, where: ['street', 'park'],
    text: '地铁出口旁的空地上，有人用一把走音的吉他弹《曙光路》。琴盒里躺着几枚硬币。',
    options: [
      opt('打赏 ¥5', () => { if (St.d().money < 5) return '摸了摸口袋，只有空气。艺人朝你点了点头。'; api.change('money', -5); api.change('mood', 9); api.sfx('coin'); api.log('给街头艺人打赏了 5 元'); return '他换了一首更欢的曲子，你跟着哼了一路。心情 +9'; }),
      opt('站着听完', () => { api.change('stamina', -3); api.change('mood', 5); return '三分钟，走音了七次，但最后一个和弦意外地准。心情 +5，体力 -3'; }),
      opt('绕开走', () => '你从琴盒外侧绕了过去，什么也没发生。')
    ]
  });

  ev({
    id: 'coupon', title: '一张被风吹来的纸', weight: 3, where: ['street', 'park'],
    text: '格纸一样黄的小票贴在鞋底，上面印着「SNACK² 会员特优」，还盖了个歪掉的章。',
    options: [
      opt('捡起来收好', () => { api.eff({ addCoupon: 'snack2' }); api.sfx('ok'); api.log('捡到一张食趣优惠券'); return '获得「食趣 SNACK²」8 折券 ×1，下次结账自动使用。'; }),
      opt('叠成纸飞机', () => { api.change('mood', 4); return '纸飞机飞了三米，落在施工围挡上。心情 +4'; }),
      opt('踢到一边', () => '风又把它带走了。')
    ]
  });

  ev({
    id: 'promoter', title: '试饮摊', weight: 3, where: ['street'],
    text: '有人举着托盘：「M-Coffee 麦妃咖啡 春季特优，蓝草咖啡试饮！」杯子上贴着 7 折的贴纸。',
    options: [
      opt('喝一杯', () => { api.change('stamina', 8); api.change('mood', 4); return '有点苦，回甘很长。体力 +8，心情 +4'; }),
      opt('顺手买一杯（¥12）', () => { const r = St.buy('mloffe', 'blueCoffee'); return r.ok ? '蓝草咖啡已放进背包。' + r.msg : r.msg; }),
      opt('摇头快走', () => '「哦——」托盘又转向了下一个人。')
    ]
  });

  ev({
    id: 'detour', title: '地铁施工 · 请通行', weight: 3, where: ['street'],
    text: '围挡上「请通行 ↑」的箭头指向一条只有半米宽的缝，旁边写着「曙光路站」。',
    options: [
      opt('老实绕路', () => { api.change('stamina', -5); return '多走了 120 米，正好路过 M-Coffee 麦妃咖啡 的 120m 距离标。体力 -5'; }),
      opt('侧身挤过去', () => { if (api.chance(.35)) { api.change('stamina', -8); api.change('mood', -4); return '书包被钉子勾了一下。体力 -8，心情 -4'; } api.change('mood', 6); return '成功了，像完成一次小小的越狱。心情 +6'; }),
      opt('在围挡上画个箭头', () => { api.addItem('pen'); api.change('mood', 5); return '你用蓝笔补了一支箭头，还获得一支钢笔。心情 +5'; })
    ]
  });

  ev({
    id: 'classmate', title: '渊迂市汾阳中学门口', weight: 2, where: ['street'],
    text: '「哎，你也在这条街？」背书包的同学拎着一张 PASS ALL EXAM 的传单，说新校门那一整栋红砖楼挺气派。',
    options: [
      opt('聊两句', () => { api.change('mood', 8); api.change('knowledge', 2); return '聊了半小时，从校门聊到刺客信条新作。心情 +8，学识 +2'; }),
      opt('请他喝咖啡（¥12）', () => { const r = St.buy('mloffe', 'latte'); if (!r.ok) return r.msg; api.change('fame', 3); return '他说明天带模拟卷给你。声望 +3'; }),
      opt('装没看见', () => '你盯着 5G 信号塔看了三秒，人已经走远了。')
    ]
  });

  ev({
    id: 'rain', title: '说下就下', weight: 2, where: ['street', 'park'], cond: () => St.isRain(),
    text: '雨点砸在格纸一样的人行道上，9°C 的晴天突然翻脸。齐阵的伞在最后一个货架。',
    options: [
      opt('有伞，撑开', () => { api.change('mood', 6); return '伞面是蓝紫格子的，和设计稿同一支笔的颜色。心情 +6'; }),
      opt('冲进齐阵买伞（¥35）', () => { const r = St.buy('mart', 'umbrella'); return r.ok ? '伞已激活，以后下雨都不慌。' + r.msg : r.msg; }),
      opt('淋着走', () => { api.change('stamina', -7); api.change('mood', -5); if (api.chance(.3)) { api.addItem('water'); return '淋透了，但捡到一瓶没人要的矿泉水。体力 -7，心情 -5'; } return '衣服能拧出水。体力 -7，心情 -5'; })
    ]
  });

  ev({
    id: 'wallet', title: '长椅上的钱包', weight: 2, where: ['street', 'park'],
    text: '林景园方向的长椅上落着一只旧钱包，里面有一张 92 路车票和几张纸币。四下没人。',
    options: [
      opt('送到锁匠店等失主', () => { api.change('fame', 9); api.change('mood', 7); api.log('归还了遗失的钱包'); return '失主是买菜回来的阿姨，硬塞给你一颗糖。声望 +9，心情 +7'; }),
      opt('拿走里面的钱', () => { const g = api.rand(20, 60); api.change('money', g); api.change('fame', -6); api.change('mood', -4); return '多了 ' + U.money(g) + '，但接下来的路口你都低着头。声望 -6，心情 -4'; }),
      opt('不碰，转身', () => '钱包还在那儿，风把车票翻了一面。')
    ]
  });

  ev({
    id: 'cat', title: '猫挡在斑马线中间', weight: 3, where: ['street', 'park'],
    text: '一只三花坐在立体过街通道的台阶上，尾巴一摆一摆，完全不打算让路。',
    options: [
      opt('蹲下来摸摸', () => { api.change('mood', 11); api.change('stamina', -2); if (api.chance(.25)) api.addItem('keyring'); return '它允许你摸了七秒，好像还掉了一枚钥匙扣。心情 +11'; }),
      opt('用钥匙扣逗它', () => { api.addItem('keyring'); api.change('mood', 6); return '钥匙扣响了一路，猫跟到了齐阵门口。心情 +6'; }),
      opt('从旁边绕', () => '猫眯着眼看你绕了过去。')
    ]
  });

  ev({
    id: 'flash', title: '限时快闪摊', weight: 2, where: ['street'],
    text: '「FREE SALE!」的牌子斜插在纸箱上，摊主说这一箱只剩最后三份，不拆不退。',
    options: [
      opt('赌一箱（¥18）', () => {
        if (St.d().money < 18) return '钱不够，摊主把牌子扶正了。';
        api.change('money', -18);
        if (api.chance(.45)) { api.addItem('snackMystery', 2); api.change('mood', 9); return '两份神秘新品 + 一张没写字的优惠券。赚了。'; }
        api.addItem('chips'); api.change('mood', -3); return '一包薯片，还是临期的。心情 -3';
      }),
      opt('只看看', () => '摊主说：「看看也行，牌子别碰倒。」')
    ]
  });

  ev({
    id: 'exam', title: 'PASS ALL EXAM!', weight: 2, where: ['street'],
    text: '荧光粉的传单塞进手里：「麦芬文具 MY WORLD · 考试过！」背面是五道没答案的模拟题。',
    options: [
      opt('认真做一遍', () => { api.change('knowledge', 7); api.change('stamina', -5); return '对了三道，错了两道，但记住了出题人的笔迹。学识 +7，体力 -5'; }),
      opt('买本模拟卷（¥25）', () => { const r = St.buy('myworld', 'mockPaper'); return r.ok ? '已放进背包，记得用。' + r.msg : r.msg; }),
      opt('折成书签', () => { api.change('mood', 3); return '夹进地图册，正好是 92 路那一页。心情 +3'; })
    ]
  });

  ev({
    id: 'bbq', title: '凌晨的烤肉味', weight: 2, where: ['street'], cond: () => St.hour() >= 21 || St.hour() < 4,
    text: '蒸汽烤肉还没打烊，排烟机把香味吹过整条曙光路。招牌写着 9AM–3AM。',
    options: [
      opt('来两串（¥12）', () => { const r = St.buy('bbq', 'skewer'); return r.ok ? '烫，但是值得。' + r.msg : r.msg; }),
      opt('只要套餐的折扣券（¥10）', () => { const r = St.buy('bbq', 'nightCoupon'); return r.ok ? r.msg : r.msg; }),
      opt('闻闻就算了', () => { api.change('mood', 4); api.change('stamina', -2); return '香味也算半个夜宵。心情 +4'; })
    ]
  });

  ev({
    id: 'estate', title: '户型图递到面前', weight: 2, where: ['street'],
    text: '「二室一厅 290 万，好景三室 330 万，林景园那套 470 万。」中介把三张纸摊开。',
    options: [
      opt('认真听十分钟', () => { api.change('knowledge', 5); api.addItem('floorplan'); return '你记住了朝向和公摊，还拿走一张户型图。学识 +5'; }),
      opt('问能不能只要户型图', () => { api.addItem('floorplan'); api.change('mood', 3); return '「拿去吧。」他说。'; }),
      opt('「我赶时间」', () => '他在你身后喊：「470 万那套朝向不好！」')
    ]
  });

  ev({
    id: 'coach', title: '资深教练 · 一次包会', weight: 2, where: ['street', 'park'],
    text: '「游泳健身了解一下？月卡 50，年卡 550，资深教练一次包会。」传单角落写着「学得失信」。',
    options: [
      opt('试一节课（¥50）', () => { const r = St.buy('gym', 'monthCard'); return r.ok ? '月卡已激活，体魄 +10。' + r.msg : r.msg; }),
      opt('跟着跑两圈', () => { api.change('fitness', 6); api.change('stamina', -9); return '教练说你节奏不错，然后就没影了。体魄 +6，体力 -9'; }),
      opt('「我刚跑完」', () => '「那更该办年卡。」')
    ]
  });

  ev({
    id: 'phone', title: '手机 1% 电量', weight: 2, where: ['street'],
    text: '5G 满格，电量 1%。地图上「沁银行 100m」的标记正好停在屏幕中央。',
    options: [
      opt('去齐阵买电池（¥8）', () => { api.change('money', -8); api.change('mood', 3); return '其实买的是一瓶能量饮，但人清醒了。心情 +3'; }),
      opt('记住路，靠自己走', () => { api.change('knowledge', 6); api.change('mood', 4); return '你靠路牌和蓝格子走对了方向。学识 +6，心情 +4'; }),
      opt('让它关机', () => { api.change('mood', 7); return '世界安静了，街反而清楚了。心情 +7'; })
    ]
  });

  ev({
    id: 'keyLost', title: '钥匙不见了', weight: 2, where: ['street'],
    text: '摸遍四个口袋，只有一张自助售卖机的小票。曙光锁匠的灯箱还亮着「24H 自助」。',
    options: [
      opt('去配一把（¥15）', () => { const r = St.buy('lock', 'key'); return r.ok ? '新钥匙已激活，还带一个猫铃扣的位置。' + r.msg : r.msg; }),
      opt('买开锁服务券备用（¥40）', () => { const r = St.buy('lock', 'unlock'); return r.ok ? r.msg : r.msg; }),
      opt('翻遍长椅底下', () => { if (api.chance(.5)) { api.change('mood', 9); return '找到了，压在落叶底下。心情 +9'; } api.change('mood', -5); return '只找到一枚游戏币。心情 -5'; })
    ]
  });

  ev({
    id: 'arcade', title: '无限起程 · INFINITY LIVES', weight: 2, where: ['street'],
    text: '街机屏幕闪着「猜正反，赢了翻倍，输了还有下一条命」。老板说命很多，随便花。',
    options: [
      opt('投 ¥10 猜正面', () => {
        if (St.d().money < 10) return '连一枚币都投不起，老板送你一颗糖。';
        api.change('money', -10);
        if (api.chance(.5)) { api.change('money', 22); api.sfx('coin'); api.log('街机猜正反赢了'); return '正面！赢了 ¥22，老板说「果然命多」。'; }
        api.change('mood', 3); return '反面。屏幕弹出 INFINITY LIVES，再来一局？心情 +3';
      }),
      opt('买一枚游戏币（¥5）', () => { const r = St.buy('arcade', 'arcadeToken'); return r.ok ? r.msg : r.msg; }),
      opt('只看标题画面', () => { api.change('mood', 4); return '标题画面的像素云做得挺好。心情 +4'; })
    ]
  });

  ev({
    id: 'travel', title: '春季旅行推荐', weight: 2, where: ['street'],
    text: '环球旅行社门口摆着抽奖箱：「一元环旅行 · 到春游行推荐」，海报上的海有点褪色。',
    options: [
      opt('抽一张（¥6）', () => {
        if (St.d().money < 6) return '箱子上贴着「下次再来」。';
        api.change('money', -6);
        if (api.chance(.3)) { api.addItem('ticket'); api.change('mood', 10); api.sfx('coin'); return '周末游抽奖券！心情 +10'; }
        api.addItem('postcard'); return '明信片一张，海还是褪色的。';
      }),
      opt('拿本手册翻翻', () => { api.addItem('travelBook'); api.change('knowledge', 4); return '手册已放进背包，学识 +4'; }),
      opt('「我先在这条街走走」', () => '店员笑了一下：「这条街也挺长的。」')
    ]
  });

  ev({
    id: 'vip', title: '会员特优推销', weight: 2, where: ['street'],
    text: '「FAMILY GO 会员享 7 折，今天办最划算。」胸牌上写着 VIP GET!',
    options: [
      opt('办一张（¥30）', () => { const r = St.buy('familygo', 'fgMember'); return r.ok ? '会员已激活，以后全场 7 折。' + r.msg : r.msg; }),
      opt('「我已经是了」', () => { api.change('mood', 3); return '对方愣了半秒，你去查了查背包。心情 +3'; }),
      opt('接过传单', () => { api.addItem('newsPaper'); return '传单背面是街区早报。'; })
    ]
  });

  ev({
    id: 'flea', title: '二手摊', weight: 2, where: ['street', 'park'],
    text: '一块布上摊着旧漫画、钢笔和一台没电的游戏机，价格全用手写，字被描了三遍。',
    options: [
      opt('淘一本（¥10）', () => { if (St.d().money < 10) return '摊主说：「先看也行。」'; api.change('money', -10); api.addItem(api.chance(.5) ? 'comic' : 'atlas'); return '买到了，封面有点卷边。'; }),
      opt('讲价到 ¥6', () => { if (St.d().money < 6) return '摊主摆摆手。'; api.change('money', -6); if (api.chance(.6)) { api.addItem('pen'); api.change('mood', 5); return '成交，一支蓝墨钢笔。心情 +5'; } api.change('mood', -2); return '没讲下来，但聊了十分钟。心情 -2'; }),
      opt('蹲着看会儿', () => { api.change('mood', 4); return '阳光斜着落在旧书脊上。心情 +4'; })
    ]
  });

  ev({
    id: 'survey', title: '街区问卷', weight: 2, where: ['street', 'park'],
    text: '「曙光路改造意见征集，两分钟就好。」表格最后一栏是「你最想保留哪家店」。',
    options: [
      opt('认真填', () => { api.change('knowledge', 4); api.change('fame', 3); return '你写了「自助售卖机旁边的长椅」。学识 +4，声望 +3'; }),
      opt('全勾「保留」', () => { api.change('mood', 3); return '工作人员说这份最好统计。心情 +3'; }),
      opt('「我赶着去坐 92 路」', () => '「哦，那车刚走。」')
    ]
  });

  ev({
    id: 'bus', title: '92 路进站', weight: 2, where: ['street'],
    text: '92 路喘着气靠站，车门开着。牌子上写着「曙光路 → 过街 → 曙光路」。',
    options: [
      opt('刷卡上车（去下一站）', () => {
        if (!St.d().flags.buscard && St.d().money < 2) return '翻遍口袋，只找到一张售卖机小票。';
        if (!St.d().flags.buscard) api.change('money', -2);
        api.change('stamina', 6); api.change('mood', 5);
        const spots = [[12 * 16, 52 * 16], [62 * 16, 52 * 16], [78 * 16, 60 * 16]];
        const s = U.pick(spots);
        if (PC.Main && PC.Main.teleport) PC.Main.teleport(s[0], s[1]);
        api.log('坐 92 路绕了一圈'); return '坐了两站又回到曙光路，腿歇过来了。体力 +6，心情 +5';
      }),
      opt('拍张站牌', () => { api.addItem('postcard'); api.change('mood', 3); return '站牌被夕阳照得发蓝。'; }),
      opt('等下一班', () => { api.change('stamina', -3); return '下一班 12 分钟后，你数了 9 辆车。体力 -3'; })
    ]
  });

  ev({
    id: 'vending', title: '自助售卖机 · 请勿踢', weight: 2, where: ['street', 'metro'],
    text: '机器嗡嗡响，贴纸上「请勿踢」被人用蓝笔圈了起来。可乐 4 元，能量饮 8 元。',
    options: [
      opt('买罐可乐（¥4）', () => { const r = St.buy('vending', 'cola'); return r.ok ? r.msg : r.msg; }),
      opt('按一下退币口', () => { if (api.chance(.35)) { api.change('money', 3); api.sfx('coin'); return '掉出三枚硬币，不知道是谁的。'; } api.change('mood', -2); return '只掉出一张小票，写着谢谢惠顾。心情 -2'; }),
      opt('轻轻拍一下（不是踢）', () => { api.change('mood', 4); return '机器亮了一下，什么也没吐。心情 +4'; })
    ]
  });

  ev({
    id: 'pigeon', title: '广场鸽', weight: 2, where: ['street', 'park'],
    text: '一群鸽子在广告牌前的广场上踱步，其中一只盯着你手里的东西。',
    options: [
      opt('撒点薯片', () => { api.change('mood', 6); return '呼啦一下全围过来，像一小片会动的云。心情 +6'; }),
      opt('追两步', () => { api.change('fitness', 3); api.change('stamina', -4); return '没追上，但活动了一下。体魄 +3'; }),
      opt('站着不动', () => '有只鸽子站到了你鞋上，又飞走了。')
    ]
  });

  ev({
    id: 'night', title: '9°C 的夜', weight: 2, where: ['street', 'park'], cond: () => St.isNight(),
    text: '路灯亮了，招牌的窗户一格格发黄。「9°C SUNNY」那块广告牌在夜里显得有点固执。',
    options: [
      opt('买杯热的（¥9）', () => { const r = St.buy('mloffe', 'americano'); return r.ok ? '纸杯烫手，正好暖。' + r.msg : r.msg; }),
      opt('绕公园走一圈', () => { api.change('mood', 8); api.change('stamina', -8); return '林景园一圈刚好一公里。心情 +8，体力 -8'; }),
      opt('回家（回地铁站口）', () => { if (PC.Main && PC.Main.teleport) PC.Main.teleport(7 * 16, 18 * 16); return '你在入口站了会儿，又折回街上。'; })
    ]
  });

  /* ---------------- 第二张设计稿 · 迂龙路专属随机事件 ---------------- */
  ev({
    id: 'y_bus', title: '921 路进站', weight: 4, where: ['yulong'],
    text: '「曙光路 ⇆ 景迂路」的 921 路晃着进站，地上那条 SAFE LINE 被踩得发白。\n站牌屏写着下一班车 3min / 13min / 20min。',
    options: [
      opt('上车坐一站（¥2）', () => {
        if (St.d().money < 2) return '摸了摸口袋，只有一张过期的优惠券。';
        api.change('money', -2); api.change('mood', 7); api.change('knowledge', 1);
        api.log('坐了一站 921 路'); api.sfx('coin');
        return '车窗外的迂龙南路一晃而过。心情 +7，学识 +1';
      }),
      opt('退到安全线后面', () => { api.change('mood', 3); return '「请先下后上」——你念了一遍广播词。心情 +3'; }),
      opt('帮老人看站牌', () => { api.change('fame', 3); api.change('mood', 4); return '「下一站是景迂路，四站。」声望 +3，心情 +4'; })
    ]
  });
  ev({
    id: 'y_warm', title: '天气降温，记得保暖添衣 ≪', weight: 4, where: ['yulong'],
    text: '站牌屏跳出「天气降温」，风却比曙光路软。有人抱着一沓保暖贴在小声吆喝。',
    options: [
      opt('买一张贴上（¥6）', () => {
        if (St.d().money < 6) return '钱不够，对方塞给你一张传单。';
        api.change('money', -6); api.change('stamina', 12); api.change('mood', 5);
        api.addItem('yJobAd'); api.sfx('coin');
        return '后背慢慢热起来。体力 +12，心情 +5，还顺了一张招人传单。';
      }),
      opt('把外套拉链拉上', () => { api.change('mood', 2); return '其实 17°C，没那么冷。心情 +2'; }),
      opt('去大排档喝碗热汤', () => { const r = St.buy('y_dapaidang', 'yNoodle'); return r.ok ? '一碗炒面下肚。' + r.msg : r.msg; })
    ]
  });
  ev({
    id: 'y_chicken', title: '今日爆款：迂龙三黄鸡', weight: 4, where: ['yulong'],
    text: '大排档的炒锅冒起白烟，掌勺的举着勺子喊：「三黄鸡 32，今日爆款！」\n塑料凳还空着几张。',
    options: [
      opt('来一份（¥32）', () => { const r = St.buy('y_dapaidang', 'yChicken'); return r.ok ? '油亮亮的一盘端上来。' + r.msg : r.msg; }),
      opt('帮着收半小时桌子', () => {
        const pay = api.rand(26, 38);
        api.change('money', pay); api.change('stamina', -7); api.change('mood', 4);
        api.log('在大排档帮着收桌'); api.sfx('coin');
        return '收了十一张桌，掌勺的塞给你 ¥' + pay + '。体力 -7，心情 +4';
      }),
      opt('只闻闻香味', () => { api.change('mood', 4); return '锅气确实很足。心情 +4'; })
    ]
  });
  ev({
    id: 'y_hire', title: 'We are hiring!', weight: 3, where: ['yulong'],
    text: '举牌子的人已经站了一上午，纸板上写着「公司招人！」和一行小字「<广告招租>」。',
    options: [
      opt('接下传单看看', () => { api.addItem('yJobAd'); api.change('knowledge', 2); return '日结、不限经验、地点在中华门。学识 +2，报名表 +1'; }),
      opt('帮他举十分钟（¥14）', () => {
        api.change('money', 14); api.change('stamina', -5); api.change('fame', 2);
        api.log('替人举了十分钟招聘牌'); api.sfx('coin');
        return '牌子比看上去沉。¥14 到手，体力 -5，声望 +2';
      }),
      opt('指指 S2 线的方向', () => { api.change('mood', 3); return '「中华门往那边。」他道了声谢。心情 +3'; })
    ]
  });
  ev({
    id: 'y_court', title: '为人民服务', weight: 3, where: ['yulong'],
    text: '渊迂市高级人民法院的台阶很高，门厅里挂着「为人民服务」。\n左边窗口写 Register，右边写 Judgement。',
    options: [
      opt('帮人填立案登记表', () => { api.change('knowledge', 5); api.change('fame', 2); api.addItem('yRegForm'); return '格式比想象中讲究。学识 +5，声望 +2'; }),
      opt('在台阶上坐一会儿', () => { api.change('stamina', 6); api.change('mood', 3); return '石阶凉，但安静。体力 +6，心情 +3'; }),
      opt('拍下那五个字', () => { api.addItem('postcard'); api.change('mood', 3); return '明信片 +1，心情 +3'; })
    ]
  });
  ev({
    id: 'y_tram', title: '迂龙有轨电车 1 号线', weight: 3, where: ['yulong'],
    text: '地面线叮当开过，车头屏上「下一站 中华门 ZHONGHUA」。\n它不进地铁站，就沿着街边慢慢走。',
    options: [
      opt('买张票坐一圈（¥2）', () => {
        if (St.d().money < 2) return '差两块钱，车已经开走了。';
        api.change('money', -2); api.change('mood', 8); api.change('knowledge', 2);
        api.addItem('yTramTicket'); api.sfx('coin');
        return '一路看过去全是街景，比隧道亮。心情 +8，学识 +2';
      }),
      opt('给带小孩的乘客让个座', () => { api.change('fame', 4); api.change('mood', 5); return '「谢谢啊。」声望 +4，心情 +5'; }),
      opt('看清方向再上车', () => { api.change('knowledge', 2); return 'S1 谷园、S2 中华门，别坐反。学识 +2'; })
    ]
  });
  ev({
    id: 'y_under', title: '迂龙地下通道', weight: 3, where: ['yulong'],
    text: '左上角那一串斜线是通往地下小吃街的楼梯，旁边还留着过街通道。墙上有人用蓝笔写了「别逆行」。',
    options: [
      opt('穿到街对面', () => { api.change('stamina', -3); api.change('mood', 3); return '凉丝丝的，一下就到了对面。体力 -3，心情 +3'; }),
      opt('低头捡起地上的东西', () => {
        if (api.chance(.5)) { api.addItem('yAtlas'); api.change('knowledge', 3); return '捡到一张皱巴巴的《迂龙路轨交图》。学识 +3'; }
        api.addItem('newsPaper'); return '是一份街区早报，头版全是招租广告。';
      }),
      opt('在墙上补一支箭头', () => { api.addItem('pen'); api.change('mood', 4); return '箭头朝上，通向地面。心情 +4，蓝墨钢笔 +1'; })
    ]
  });

  ev({
    id: 'u_steam', title: '地下街的蒸笼', weight: 4, where: ['underground'],
    text: '下沉楼梯尽头，一排小吃摊的蒸笼同时冒了白气，吊顶灯把水汽照成一团一团的。',
    options: [
      opt('买串烤的（¥9）', () => { const r = St.buy('y_snackstreet', 'ySkewer'); return r.ok ? '热乎的。' + r.msg : r.msg; }),
      opt('帮摊主看十分钟摊', () => {
        const pay = api.rand(20, 32);
        api.change('money', pay); api.change('stamina', -5); api.change('mood', 4);
        api.log('在地下小吃街帮着看摊'); api.sfx('coin');
        return '收了 ¥' + pay + '，还被塞了半碗汤。体力 -5，心情 +4';
      }),
      opt('抬头看看地面那束光', () => { api.change('mood', 4); return '斜线楼梯上头是 17°C 的街。心情 +4'; })
    ]
  });
  ev({
    id: 'u_lamp', title: '地口圆牌', weight: 3, where: ['underground'],
    text: '楼梯口那个圆圈里写着「地口」，被人用蓝笔描了两遍。旁边贴着一张手写的今日推荐。',
    options: [
      opt('抄下今日推荐', () => { api.change('knowledge', 3); api.addItem('newsPaper'); return '学识 +3，顺走一份街区早报'; }),
      opt('把圆牌擦干净', () => { api.change('fame', 2); api.change('mood', 3); return '声望 +2，心情 +3'; })
    ]
  });
  ev({
    id: 'yy_arrow', title: '地上的大箭头', weight: 4, where: ['yuanyu'],
    text: '校门口回头看，那支空心大箭头还印在车道上，正正指向这里。\n括号里的小字是「市交巡体中心往南中」。',
    options: [
      opt('顺着箭头再走一遍', () => { api.change('fitness', 3); api.change('mood', 3); return '体魄 +3，心情 +3'; }),
      opt('把箭头拍进相册', () => { api.addItem('postcard'); api.change('mood', 2); return '明信片 +1，心情 +2'; }),
      opt('回教室背两个单词', () => { api.change('knowledge', 4); api.change('stamina', -3); return '学识 +4，体力 -3'; })
    ]
  });
  ev({
    id: 'yy_duty', title: '值日生', weight: 3, where: ['yuanyu'],
    text: '旗杆边站着值日生，手里一把扫帚和一本被翻卷了角的笔记本。',
    options: [
      opt('帮忙扫操场', () => { api.change('money', 18); api.change('stamina', -6); api.change('fame', 2); api.sfx('coin'); return '¥18 到手，体力 -6，声望 +2'; }),
      opt('问一句汾阳中学怎么走', () => { api.change('knowledge', 3); return '「那是曙光路那所，坐 1 号线回去。」学识 +3'; }),
      opt('在跑道跑一圈', () => { api.change('fitness', 6); api.change('stamina', -8); api.change('mood', 5); return '体魄 +6，体力 -8，心情 +5'; })
    ]
  });

  ev({
    id: 'estate_neighbor', title: '邻居家的门', weight: 2, where: ['park'],
    text: '单元门开了一条缝，里头飘出炖汤的味道。门上贴着一张手写便签：「3 栋 502 的，快递放我这儿了。」',
    options: [
      opt('敲门取快递', () => { api.addItem('postcard'); api.change('mood', 4); api.change('knowledge', 1); return '邻居顺手塞给你一张明信片。心情 +4，学识 +1'; }),
      opt('顺便帮着把垃圾带下楼', () => { api.change('money', 12); api.change('fame', 2); api.sfx('coin'); return '硬塞了 ¥12 当谢礼。声望 +2'; }),
      opt('不打扰了', () => '你轻手轻脚退回了楼道。')
    ]
  });
  ev({
    id: 'estate_fountain', title: '水池边的许愿', weight: 4, where: ['park'],
    text: '中央喷泉水柱一高一低，木栈道上有人蹲着看锦鲤。旁边立着块小牌：「林景园中轴 · 请勿投币（但还是有人投）」。',
    options: [
      opt('投一枚硬币许愿', () => {
        api.change('money', -1); api.change('mood', 6); api.sfx('coin');
        return api.chance(.2) ? '硬币落进水里，转身在长椅缝里摸到 ¥10。心情 +6' : '水花一溅，硬币不见了。心情 +6';
      }),
      opt('沿栈道走一圈', () => { api.change('stamina', -5); api.change('mood', 7); api.change('fitness', 2); return '一圈下来刚好一公里。心情 +7，体魄 +2，体力 -5'; }),
      opt('拍张喷泉照', () => { api.addItem('postcard'); api.change('mood', 2); return '明信片 +1，心情 +2'; })
    ]
  });
  ev({
    id: 'estate_gym', title: '健身区的常客', weight: 3, where: ['park'],
    text: '单杠边一位大爷正倒挂着看报纸，漫步机吱呀吱呀响。告示牌写着「免费使用，请勿霸占单杠」。',
    options: [
      opt('跟着练一组', () => { api.eff({ fitness: 5, mood: 3, stamina: -8 }); return '体魄 +5，心情 +3，体力 -8'; }),
      opt('请教动作', () => { api.change('knowledge', 4); api.change('mood', 2); return '「慢一点，别跟机器较劲。」学识 +4，心情 +2'; }),
      opt('坐长椅上看会儿', () => { api.change('mood', 5); api.change('stamina', 4); return '心情 +5，体力 +4'; })
    ]
  });
  ev({
    id: 'estate_sale', title: '售楼处的沙盘', weight: 3, where: ['park'],
    text: '沙盘上 1/3/5 栋和 A/B/C 座都插着小旗，玻璃上映着门口那两根罗马柱。销售把户型图推过来。',
    options: [
      opt('翻开在售房源', () => { if (PC.UI) PC.UI.openEstate(); return '__keep'; }),
      opt('问问 3 栋 502', () => { api.change('knowledge', 3); return '「那间是主角家，不卖。」学识 +3'; }),
      opt('拿一张户型图', () => { api.addItem('newsPaper'); api.change('knowledge', 2); return '街区早报 +1，学识 +2'; })
    ]
  });
  ev({
    id: 'estate_rent', title: '出租中的房子', weight: 2, where: ['park'],
    text: '物业拎着一串钥匙从别墅区过来：「你挂出去那套今天有人看房，要不要顺路去看看？」',
    options: [
      opt('去看看', () => { if (PC.UI) PC.UI.openEstate(); return '__keep'; }),
      opt('让物业全权处理', () => { api.change('mood', 3); return '「放心，租金每天到账。」心情 +3'; })
    ]
  });
  ev({
    id: 'home_balcony', title: '阳台上的曙光路', weight: 3, where: ['home'],
    text: '推开阳台门，能看见小区中轴的喷水池，再远一点是曙光路的灯。楼下有人遛狗。',
    options: [
      opt('趴栏杆上发会儿呆', () => { api.change('mood', 7); api.change('stamina', 3); return '心情 +7，体力 +3'; }),
      opt('朝楼下喊一声', () => { api.change('fame', 2); api.change('mood', 3); return '有人抬头挥了挥手。声望 +2，心情 +3'; }),
      opt('关上门回屋', () => '屋里还亮着灯，猫占着沙发。')
    ]
  });

  const EV = PC.Events = {
    list: E,
    byId(id) { return E.find(e => e.id === id); },
    roll(sceneId) {
      const pool = E.filter(e => (!e.where || e.where.some(w => sceneId.indexOf(w) === 0)) && (!e.cond || e.cond()));
      if (!pool.length) return null;
      let total = pool.reduce((s, e) => s + (e.weight || 1), 0), r = Math.random() * total;
      for (const e of pool) { r -= (e.weight || 1); if (r <= 0) return e; }
      return pool[pool.length - 1];
    },
    trigger(forceId) {
      const sceneId = (PC.Main && PC.Main.scene && PC.Main.scene.id) || 'street';
      const e = forceId ? this.byId(forceId) : this.roll(sceneId);
      if (!e || !PC.UI) return;
      St.d().stats.events++;
      if (PC.Play) { PC.Play.mark('events'); PC.Play.mark('event', e.id); }
      PC.Audio.sfx('event');
      PC.UI.showDialog({
        title: '✦ 随机事件 · ' + e.title,
        text: e.text,
        options: e.options.map(o => ({
          label: o.label,
          onPick: () => {
            let res = '';
            try { res = o.run() || ''; } catch (err) { res = '……好像什么也没发生。'; }
            St.logMsg('事件「' + e.title + '」：' + o.label);
            St.save();
            PC.Audio.sfx('ok');
            return res;
          }
        }))
      });
    },
    timer: 14,
    update(dt, moving, uiOpen, sceneId) {
      if (uiOpen || sceneId.indexOf('interior') === 0 || sceneId === 'metro' || sceneId === 'train' ||
        sceneId === 'home' || sceneId.indexOf('villa:') === 0) return;
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = U.rand(20, 38);
        if (moving && U.chance(.82)) this.trigger();
      }
    }
  };
})();
