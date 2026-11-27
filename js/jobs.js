/* jobs.js —— 无限極人生 · 多元赚钱系统
   渠道：店铺兼职 / 场景零工 / 委托板 / 拾荒回收 / 街头摆摊 / 银行利息 / 旺铺分红 / 成就奖金
*/
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U;

  const J = (id, title, desc, pay, sta, min, quiz, extra) =>
    ({ id, title, desc, pay, stamina: sta, minutes: min, quiz, extra: extra || {} });
  const Q = (q, opts, ok) => ({ q, opts, ok });

  /* ---------------- 店铺专属兼职（文案全部取自手绘设计稿） ---------------- */
  PC.JOBS = {
    mloffe: [
      J('barista', '咖啡师 · 一小时轮班', '「蓝草今天折后 12，别记错价。」', [30, 44], -7, 45,
        Q('客人要「春季特优的蓝草咖啡，7 折」，折后该收多少？', ['¥12', '¥9', '¥15'], 0), { mood: 4 }),
      J('deliver', '外送 · 蓝草咖啡到施工围挡', '顺着「↓120m」的箭头走，别走反。', [24, 36], -9, 40,
        Q('设计稿上那个蓝笔画的「↓120m」指向哪家店？', ['M-Coffee 麦妃咖啡', '沁银行', '渊迂市汾阳中学'], 0), { fitness: 2 })
    ],
    mart: [
      J('stock', '齐阵 · 夜班理货', '伞在最下面那层，别放错。', [26, 38], -6, 40,
        Q('齐阵便利店的招牌上写着哪两个字？', ['齐阵', '旺铺', '食趣'], 0), { knowledge: 1 }),
      J('register', '齐阵 · 收银替班', '24H 灯箱亮着，门铃一响抬一下头。', [32, 46], -5, 45,
        Q('设计稿上这家店标的是？', ['SALE · 24H', '9AM–3AM', '7 折'], 0), { mood: 2 })
    ],
    jishe: [
      J('film', '贴膜学徒', '「贴膜吗？今天 5%。」', [38, 54], -6, 50,
        Q('柜台里那台样机打了几折？', ['30%OFF', '7 折', '-60% OFF'], 0), { knowledge: 2 }),
      J('demo', '15 PRO 演示员', '把检测牌摆正，别让顾客摸走样机。', [34, 48], -5, 45,
        Q('公告板「检测 15 PRO」旁边手写的数字是？', ['5%', '50%', '500%'], 0), { mood: 3 })
    ],
    familygo: [
      J('fold', '冰原新款 · 叠衣', '一整面墙的冰原系列，模特没有头。', [28, 40], -6, 40,
        Q('会员在这家店享几折？', ['7 折', '8 折', '5 折'], 0), { fitness: 1 }),
      J('vip', '会员卡推广', '「办会员卡吗？全场 7 折。」', [36, 52], -8, 45,
        Q('冰原新款 ON SALE 打几折？', ['8 折', '7 折', '6 折'], 0), { fame: 2, mood: 2 })
    ],
    snack2: [
      J('promo', 'FREE SALE 举牌', '广播循环播放，牌子别举反。', [22, 34], -7, 35,
        Q('新品标的是？', ['-60% OFF', '-6% OFF', '买一送一'], 0), { mood: 3 }),
      J('pack', '神秘新品分装', '包装上只写了 SNACK²，别偷看。', [30, 44], -8, 45,
        Q('「会员特优」旁边那句英文是？', ['VIP GET!', 'BUY NOW!', 'PASS ALL EXAM!'], 0), { knowledge: 1 })
    ],
    hardware: [
      J('dumbbell', '哑铃归位', '按重量从矮到高排好。', [28, 42], -10, 40,
        Q('这家店招牌上写的是？', ['硬件 / 运动', '游泳健身', '24H 自助'], 0), { fitness: 5 }),
      J('coachAssist', '陪练半小时', '「先试举，再谈价。」', [40, 58], -12, 50,
        Q('店里最重的东西通常是？', ['哑铃', '咖啡杯', '明信片'], 0), { fitness: 6, stamina: -3 })
    ],
    book: [
      J('shelf', '消遣书屋 · 整理书架', '纸页味很重，角落有张没人坐的椅子。', [22, 34], -5, 40,
        Q('店员说地图册在哪一排？', ['蓝格子那排', '最下面那层', '收银台后面'], 0), { knowledge: 3 }),
      J('read', '替人看店 · 顺便读完一本', '椅子空着，正好。', [26, 38], -4, 55,
        Q('这家店的设计稿店名是？', ['消遣书学', '麦芬文具', '环球旅行'], 0), { knowledge: 4, mood: 3 })
    ],
    travel: [
      J('flyer', '春季旅行推荐 · 发单', '墙上贴满褪色的海边照片。', [24, 36], -7, 40,
        Q('旅行社门口海报上是什么季节？', ['春季', '冬季', '雨季'], 0), { mood: 2 }),
      J('plan', '抄路线手册', '一元环旅行，到春游行推荐。', [34, 48], -5, 50,
        Q('这家店在设计稿左栏第几行？', ['第三行 · 环球旅行', '第一行', '最后一行'], 0), { knowledge: 4 })
    ],
    estate: [
      J('copy', '抄户型图', '三张纸并排，价格一个比一个镇定。', [32, 46], -5, 45,
        Q('设计稿上「普通二室一厅」标价多少？', ['290万', '330万', '470万'], 0), { knowledge: 3 }),
      J('guide', '带看 · 林景园方向', '「看看不收钱。」', [46, 66], -11, 60,
        Q('在林景园那套标多少？', ['470万', '290万', '50万'], 0), { fame: 2, fitness: 2 })
    ],
    gym: [
      J('front', '游泳健身 · 前台', '月卡 50，年卡 550，别念反。', [30, 44], -6, 45,
        Q('设计稿上「月卡」多少钱？', ['50 元/月', '550 元/月', '5 元/月'], 0), { fitness: 2 }),
      J('lifeguard', '池边看场', '「资深教练 一次包会 学得失信」。', [42, 60], -10, 55,
        Q('年卡是多少钱？', ['550 元/年', '50 元/年', '290 元/年'], 0), { fitness: 5, mood: 2 })
    ],
    lock: [
      J('keys', '24H 自助 · 配钥匙', '机器比人会配。', [34, 48], -6, 45,
        Q('灯箱上写的是？', ['24H HOUR SELF', '9AM–3AM', 'ON SALE'], 0), { knowledge: 2 }),
      J('night', '半夜开锁值班', '曙光路这会儿很安静。', [48, 68], -9, 60,
        Q('这家店在设计稿右栏第几行？', ['第一行 · 曙光锁匠', '第三行', '最后一行'], 0), { mood: 4 })
    ],
    myworld: [
      J('grade', '批模拟卷', '「模拟卷五本装，稳。」', [30, 44], -6, 50,
        Q('整面墙的荧光标语写的是？', ['考试过！PASS ALL EXAM!', 'BUY NOW!', 'INFINITY LIVES'], 0), { knowledge: 5 }),
      J('notes', '誊写备考笔记', 'MY WORLD，写完据说能过。', [28, 42], -5, 45,
        Q('这家店英文招牌是？', ['MY WORLD', 'MY LIFE', 'MY COFFEE'], 0), { knowledge: 4 })
    ],
    bbq: [
      J('skewer', '蒸汽烤肉 · 穿串', '排烟机很吵，香味盖过一切。', [36, 52], -9, 50,
        Q('招牌上的营业时间是？', ['9AM–3AM', '24H', '9AM–5PM'], 0), { mood: 4 }),
      J('nightshift', '凌晨班 · 收摊', '营业到凌晨三点，折扣只给没回家的人。', [58, 82], -13, 75,
        Q('凌晨的折扣给谁？', ['还没回家的人', '早起的人', '店员自己'], 0), { mood: 6, stamina: -4 })
    ],
    arcade: [
      J('token', '无限起程 · 代币台', '「一枚币，一条命，或者很多条。」', [26, 40], -4, 35,
        Q('屏幕上停着哪行字？', ['INFINITY LIVES', 'PASS ALL EXAM!', 'ON SALE!'], 0), { mood: 4 }),
      J('challenge', '街机擂主 · 守榜', '命很多，随便花。', [40, 70], -8, 45,
        Q('设计稿把这个电玩厅叫？', ['无限起程', '像素电玩', '环球旅行'], 0), { mood: 5, fame: 2 })
    ],
    pixelgame: [
      J('preorder', '预购登记', '海报上写着「现在预购！BUY NOW!」。', [32, 46], -5, 45,
        Q('哪款游戏写着「现在预购」？', ['使命召唤 CALL OF DUTY', '刺客信条', '无限起程'], 0), { knowledge: 2 }),
      J('poster', '贴 UBISOFT 海报', '双一赠一 / -20% / -30%，别贴歪。', [28, 42], -6, 40,
        Q('刺客信条海报上写的折扣是？', ['-20%', '-60% OFF', '7 折'], 0), { mood: 3 })
    ],
    rent: [
      J('clean', '空铺清扫', '卷帘门半拉着，里面空得能听见回声。', [20, 30], -8, 40,
        Q('招租告示上的联系电话是？', ['12347769', '0577-00286', '92'], 0), { fitness: 2 }),
      J('agent', '帮中介贴招租', '「旺气铺 招租」，字被描了三遍。', [26, 38], -7, 40,
        Q('左栏那张旺铺招租写的电话是？', ['0577-00286', '12347769', '100m'], 0), { knowledge: 2 })
    ],
    vending: [
      J('refill', '自助售卖机 · 补货', '机器上贴着「请勿踢」。', [18, 28], -5, 30,
        Q('贴纸上用蓝笔圈起来的是？', ['请勿踢', '欢迎光临', '9°C'], 0), { fitness: 1 })
    ],
    /* 非店铺场景 */
    metro: [
      J('guide', '站台引导员', '「ENTRANCE ①② 在这边，92 路往前。」', [30, 44], -6, 45,
        Q('设计稿上站名是？', ['〈曙光路站〉SHUGUANG LU ST', '汾阳中学站', '林景园站'], 0), { fame: 2 }),
      J('cleanM', '地下通道清扫', '灯箱亮着 INFINITY LIVES。', [24, 36], -7, 40,
        Q('地下街那台机器上写着？', ['Auto Tied Vending', 'PASS ALL EXAM', 'ON SALE'], 0), { fitness: 2 })
    ],
    campus: [
      J('duty', '值日 · 擦黑板', '新校门修好了，值日表倒是照常。', [22, 34], -6, 40,
        Q('这所学校的全名是？', ['渊迂市汾阳中学', '曙光路中学', '林景园中学'], 0), { knowledge: 2 }),
      J('notes2', '代抄课堂笔记', '「PASS ALL EXAM!」隔壁班都在传。', [30, 46], -5, 50,
        Q('设计稿路牌写「汾阳中学」多少米？', ['50m', '100m', '120m'], 0), { knowledge: 5 }),
      J('trackJob', '操场 · 陪跑计时', '绕一圈刚好一公里。', [34, 50], -11, 45,
        Q('操场中间那块是什么颜色？', ['绿地', '水池', '沙坑'], 0), { fitness: 5, stamina: -3 })
    ],
    park: [
      J('walkdog', '林景园 · 代遛狗', '「狗比我会认路。」', [26, 40], -8, 40,
        Q('公园水池中间设计稿没画出来的是？', ['一条栈道', '一座桥', '一艘船'], 0), { fitness: 3, mood: 3 }),
      J('bottle', '绕园捡瓶', '一圈刚好一公里，顺手的事。', [18, 30], -7, 35,
        Q('林景园英文标注是？', ['Neighbourhood', 'INFINITY LIVES', 'ENTRANCE'], 0), { fitness: 2 })
    ],
    street: [
      J('flyer', '街口派传单', '「拿一张吧，不买也没关系。」', [16, 26], -6, 30,
        Q('9°C 晴天那块广告牌上写的是？', ['☀ 9°C SUNNY', 'ON SALE!', '30%OFF'], 0), { fame: 1 }),
      J('busker', '街头卖艺 · 弹一段', '琴盒里躺着几枚硬币。', [20, 44], -8, 40,
        Q('地铁施工围挡上写着？', ['请通行 ↑', '请勿踢', 'BUY NOW!'], 0), { mood: 6, fame: 2 }),
      J('surveyJob', '街区问卷回访', '「你最想保留哪家店」。', [24, 36], -5, 40,
        Q('沁银行路牌标多少米？', ['100m', '50m', '120m'], 0), { knowledge: 3 })
    ]
  };

  /* ---------------- 委托板：接单 → 走到交付点 → 收钱 ---------------- */
  /* ---------------- 第二张设计稿 · 迂龙路岗位 ---------------- */
  Object.assign(PC.JOBS, {
    y_snackstreet: [
      J('yGrill', '地下街 · 看烤炉', '下沉入口下面十几家摊子，别把别家的串拿错了。', [26, 38], -8, 40,
        Q('稿子左上角那排斜线是什么？', ['地下小吃街的下沉楼梯', '高架桥', '河'], 0), { mood: 3 }),
      J('ySteam', '蒸笼值守', '白气把招牌熏得发黄。', [22, 32], -6, 35,
        Q('这条街叫什么？', ['小吃一条街', '曙光路', '景迂路'], 0), { fitness: 1 })
    ],
    y_netbar: [
      J('yNet', '星晨网吧 · 开机引导', '「开机按左边那个键，别按电源。」', [28, 42], -5, 45,
        Q('门口贴的年龄限制是？', ['未满18禁止上网', '未满16', '不限'], 0), { knowledge: 3 }),
      J('yVip', 'VIP 80% 推广', '那张被框起来的卡。', [30, 44], -6, 40,
        Q('稿子上 VIP 旁边写的是？', ['80%', '8折', '600FF'], 0), { mood: 2 })
    ],
    y_wardrobe: [
      J('yFold', '华服整理', '衣架上一排礼服，箭头指向楼上。', [30, 44], -6, 45,
        Q('稿子上那个指向楼上的英文是？', ['UPSTAIRS HONOR!', 'PAY NOW!', 'SAFE LINE'], 0), { mood: 3 }),
      J('yFit', '试衣间引导', '「楼上还有一排，慢慢看。」', [24, 36], -5, 40,
        Q('这家店英文名是？', ['HONER WARDROBE', 'MN SALE', 'ACMA'], 0), { fame: 1 })
    ],
    y_mn: [
      J('ySale', 'SALE 举牌', '大红贴纸贴满玻璃。', [24, 36], -7, 35,
        Q('稿子上的价签写的是？', ['600FF', '¥32', '2元'], 0), { mood: 3 }),
      J('yCash', 'PAY NOW 收银', '「不议价。」', [28, 42], -5, 40,
        Q('旁边那个箭头写着？', ['EMPIRE →', 'ENTRANCE ↑', 'SAFE LINE'], 0), { knowledge: 1 })
    ],
    y_paynow: [
      J('yToken', '游趣 · 游戏币清点', '投币口亮着，屏幕停在标题画面。', [24, 36], -5, 35,
        Q('这家店招牌上写着？', ['PAY NOW!', 'BUY LATER', 'FREE SALE'], 0), { mood: 2 })
    ],
    y_traffic: [
      J('yTicket', '迂龙交通 · 售票', '票价 2 元，别找错零。', [30, 44], -5, 40,
        Q('设计稿右上角写的票价是？', ['2元', '12元', '32元'], 0), { knowledge: 2, fame: 1 }),
      J('yGuide', '1号线 引导员', '「去曙光路就坐 1 号线，两站。」', [26, 38], -6, 40,
        Q('这条线稿上标的是？', ['AB 1号线', 'S2线', '92路'], 0), { fame: 2 })
    ],
    y_court: [
      J('yReg', '立案窗口 · 整理表格', '「材料带齐了吗？表格在左边。」', [34, 48], -5, 45,
        Q('稿子上「立案」旁边的英文是？', ['Register', 'Judgement', 'Arrival'], 0), { knowledge: 4 }),
      J('yJudge', '判决查询 · 打印', '为人民服务。', [30, 44], -4, 40,
        Q('台阶上写着哪五个字？', ['为人民服务', '道路千万条', 'PASS ALL EXAM'], 0), { knowledge: 3, fame: 1 })
    ],
    y_arrival: [
      J('yArrival', '到站屏值守', '屏上一直跳着「2 分钟」。', [24, 36], -5, 35,
        Q('稿子左下写的是「列车到站」几分钟？', ['2分钟', '3分钟', '20分钟'], 0), { mood: 2 })
    ],
    y_metrooffice: [
      J('yLease', '地铁旺铺 · 带看', '「总部在中华门，网站也行。」', [38, 54], -8, 50,
        Q('稿子上那行网址开头是？', ['letsgomlq', 'infinitylives', 'acma'], 0), { fame: 2 }),
      J('yCopy', '招租单抄写', '玻璃门里只有一张桌子和一台饮水机。', [22, 32], -4, 35,
        Q('这间铺子叫什么？', ['地铁旺铺', '小吃一条街', '保安亭'], 0), { knowledge: 2 })
    ],
    y_dapaidang: [
      J('yChicken', '三黄鸡 · 帮厨', '「三黄鸡 32，今天刚出的。」', [36, 52], -10, 50,
        Q('今日爆款标价多少？', ['32元/份', '2元', '600FF'], 0), { fitness: 3, mood: 3 }),
      J('yTable', '大排档 · 收桌', '塑料凳、圆桌，收得快就有小费。', [26, 38], -8, 40,
        Q('招牌上写的是「客栈____」？', ['里边请', '欢迎光临', '打烊了'], 0), { mood: 2 })
    ],
    y_telecom: [
      J('ySim', '星降电信 · 办卡', '办手机号 / 换卡 / 网络办理。', [32, 46], -5, 45,
        Q('这家店在稿子上标的是几「L」？', ['1L', '2L', '5G'], 0), { knowledge: 3 }),
      J('ySwap', '更换电话卡', '旧卡当场剪掉。', [24, 36], -4, 35,
        Q('店名是？', ['星降电信', '极设数码', '沁银行'], 0), { mood: 2 })
    ],
    y_airport: [
      J('yRoute', 'ACMA · 抄轨交图', '迂龙南路 / 迂龙路 / 龙川路 / 迂龙北。', [30, 44], -5, 45,
        Q('稿子上航站楼写的是？', ['T1 / T2', 'A1 / A2', '1号线'], 0), { knowledge: 5 }),
      J('yBoard', '列车进站引导', '「去机场坐这趟，别上反方向。」', [28, 40], -6, 40,
        Q('机场联络线英文缩写是？', ['ACMA', 'SI', 'YLoong'], 0), { fame: 2 })
    ],
    y_sline: [
      J('yS1', 'S1 线 · 举方向牌', '谷园方向列车。', [26, 38], -6, 40,
        Q('S1 线往哪个方向？', ['谷园', '中华门', '曙光路'], 0), { mood: 2 }),
      J('yS2', 'S2 线 · 站台巡视', '中华门方向，别坐反。', [26, 38], -6, 40,
        Q('S2 线往哪个方向？', ['中华门', '谷园', '林景园'], 0), { knowledge: 2 })
    ],
    y_hiring: [
      J('yHire', 'We are hiring! 举牌', '「今天就能上工，日结。」', [24, 36], -8, 35,
        Q('稿子上那句英文是？', ['We are hiring!', 'PAY NOW!', 'SAFE LINE'], 0), { fame: 2, mood: 2 })
    ],
    y_police: [
      J('yAsk', '保安亭 · 指路', '「问路先敲门。」', [22, 34], -4, 35,
        Q('亭子窗上贴的是？', ['为人民服务', 'POLICE 保安亭', '票价2元'], 0), { fame: 2 })
    ],
    estate: [
      J('esClean', '小区 · 中轴保洁', '从南门一路扫到喷水池，落叶别扫进水里。', [28, 42], -8, 40,
        Q('小区大门是哪一种样式？', ['西洋风罗马柱 + 三角山花', '中式牌坊', '玻璃旋转门'], 0), { fame: 2 }),
      J('esParcel', '代收快递', '1/3/5 栋的信箱旁堆了一小车包裹，按楼栋分好。', [30, 46], -7, 45,
        Q('主角的家在几栋几零几？', ['3 栋 502', '1 栋 1801', '5 栋 1102'], 0), { knowledge: 2, fame: 1 }),
      J('esGarden', '别墅区 · 园艺帮工', 'B 座那圈蔷薇要修，C 座的喷泉得捞叶子。', [38, 56], -11, 55,
        Q('小区里一共有几座别墅？', ['A / B / C 三座', '两座', '五座'], 0), { fitness: 3, mood: 2 }),
      J('esCoach', '健身区 · 临时教练', '教新来的住户用漫步机，别让人倒挂在单杠上。', [36, 52], -12, 50,
        Q('健身区告示牌上写的是？', ['免费使用，请勿霸占单杠', '月卡 50 元', '仅限业主'], 0), { fitness: 5, fame: 2 })
    ],
    yuanyu: [
      J('yyDuty', '渊迂中学 · 值日', '顺着地上那支大空心箭头走进来的校门，扫地归你。', [26, 38], -7, 40,
        Q('地上大箭头指向哪所学校？', ['渊迂市渊迂中学', '渊迂市汾阳中学', '曙光路小学'], 0), { knowledge: 2, fame: 1 }),
      J('yyNotes', '代抄笔记', '「市交巡体中心往南中」，这句也抄进笔记本里。', [24, 36], -5, 45,
        Q('校门口小字括号里写的是？', ['市交巡体中心往南中', '汾阳中学 50m', 'PASS ALL EXAM'], 0), { knowledge: 4 }),
      J('yyRun', '操场 · 陪跑计时', '红色跑道绕一圈，计时表在手。', [30, 44], -10, 45,
        Q('这所学校的英文是？', ['YUANYU HIGH SCHOOL', 'FENYANG M.S.', 'SHUGUANG LU ST'], 0), { fitness: 5, mood: 2 })
    ],
    yulong: [
      J('yFlyer', '921 路 · 站台发单', '曙光路 ⇆ 景迂路，站在 SAFE LINE 后面。', [24, 36], -7, 40,
        Q('站牌上那句英文是？', ['SAFE LINE', 'PAY NOW', 'ENTRANCE'], 0), { mood: 2 }),
      J('yWarm', '降温提醒 · 发保暖贴', '「天气降温，记得保暖添衣。」', [22, 34], -6, 35,
        Q('稿子上迂龙路标的是多少度？', ['17°C', '9°C', '0°C'], 0), { fame: 2, mood: 2 }),
      J('yTram', '有轨电车 · 站台引导', '下一站 中华门 ZHONGHUA。', [28, 42], -7, 45,
        Q('有轨电车是几号线？', ['1号线', '2号线', 'S2线'], 0), { knowledge: 2 }),
      J('yUnder', '地下通道 · 维持秩序', '别在斜线那儿逆行。', [20, 30], -6, 30,
        Q('稿子左上角写的是？', ['迂龙地下通道', '立体过街通道', '地铁施工'], 0), { fitness: 2 })
    ]
  });

  PC.GIGS = [
    { id: 'g1', title: '送蓝草咖啡到施工围挡', desc: 'M-Coffee 麦妃咖啡的外送，别洒了。', pay: 34, sta: -6, target: 'construction', from: '麦妃咖啡' },
    { id: 'g2', title: '给汾阳中学送模拟卷', desc: '麦芬文具五本装，交给值日生就行。', pay: 38, sta: -8, target: 'schoolSign', from: '麦芬文具' },
    { id: 'g3', title: '把户型图送到沁银行', desc: '户连房产的三张纸，别折角。', pay: 30, sta: -5, target: 'bankSign', from: '户连房产' },
    { id: 'g4', title: '去林景园贴旅行海报', desc: '春季旅行推荐，贴公园门口。', pay: 36, sta: -9, target: 'parkIn', from: '环球旅行' },
    { id: 'g5', title: '帮齐阵补货到自助售卖机', desc: '一箱苏打，机器在路口。', pay: 28, sta: -6, target: 'vending', from: '齐阵' },
    { id: 'g6', title: '92 路站牌拍照', desc: '「曙光路 → 过街 → 曙光路」。', pay: 24, sta: -4, target: 'bus', from: '街区早报' },
    { id: 'g7', title: '给蒸汽烤肉送夜宵券', desc: '凌晨折扣只给还没回家的人。', pay: 42, sta: -7, target: 'crosswalk', from: '蒸汽烤肉' },
    { id: 'g8', title: '去地面屏抄今日导航', desc: '抄完顺便看一轮广告。', pay: 26, sta: -3, target: 'scNav', from: '街区管理处' }
  ];

  /* ---------------- 可回收物（街上随机刷新） ---------------- */
  PC.RECYCLE = {
    can: { name: '空易拉罐', value: 3, color: '#c9c6b4' },
    bottle: { name: '空矿泉水瓶', value: 2, color: '#8fb8cf' },
    box: { name: '压扁的纸箱', value: 5, color: '#b99a6b' },
    poster: { name: '撕下的旧海报', value: 4, color: '#e8c86a' },
    cap: { name: '瓶盖', value: 1, color: '#e2564d' }
  };

  /* ---------------- 成就奖金 ---------------- */
  PC.ACHIEVEMENTS = [
    { id: 'a1', title: '第一桶金', desc: '累计赚到 ¥100', bonus: 30, cond: d => d.earnedTotal >= 100 },
    { id: 'a2', title: '街区熟客', desc: '累计赚到 ¥500', bonus: 80, cond: d => d.earnedTotal >= 500 },
    { id: 'a3', title: '曙光路富翁', desc: '累计赚到 ¥2000', bonus: 260, cond: d => d.earnedTotal >= 2000 },
    { id: 'a4', title: '走遍全街', desc: '进店 8 次', bonus: 60, cond: d => d.stats.shops >= 8 },
    { id: 'a5', title: '故事收集者', desc: '触发 10 次随机事件', bonus: 70, cond: d => d.stats.events >= 10 },
    { id: 'a6', title: '读书人', desc: '学识达到 30', bonus: 90, cond: d => d.knowledge >= 30 },
    { id: 'a7', title: '体魄强健', desc: '体魄达到 30', bonus: 90, cond: d => d.fitness >= 30 },
    { id: 'a8', title: '街区名人', desc: '声望达到 20', bonus: 120, cond: d => d.fame >= 20 },
    { id: 'a9', title: '收藏家', desc: '买过 12 件东西', bonus: 100, cond: d => d.stats.bought >= 12 },
    { id: 'a10', title: '业主', desc: '租下旺铺或买下二室一厅', bonus: 300, cond: d => d.flags.shopOwner || d.flags.home }
  ];

  /* ---------------- 系统 ---------------- */
  const JS = PC.JobSystem = {
    ensure(d) {
      d.earnedToday = d.earnedToday || 0;
      d.earnedTotal = d.earnedTotal || 0;
      d.jobCount = d.jobCount || {};
      d.gigs = d.gigs || [];
      d.gigActive = d.gigActive || null;
      d.gigDone = d.gigDone || 0;
      d.recycleBag = d.recycleBag || {};
      d.achClaimed = d.achClaimed || {};
      d.bank = d.bank || 0;
      d.jobLog = d.jobLog || [];
    },
    key(ctx, jobId) { return ctx + '/' + jobId; },
    timesToday(d, ctx, jobId) {
      const k = 'D' + d.day + '|' + this.key(ctx, jobId);
      return d.jobCount[k] || 0;
    },
    /* 体力门槛 */
    canWork(d, sta) {
      if (d.stamina < Math.abs(sta) + 4) return '体力不够了，先去吃点东西（B 背包 / 进店买）';
      return null;
    },
    /* 执行岗位：answerIdx 为小问答选项 */
    doJob(ctx, jobId, answerIdx) {
      const St = PC.State, d = St.d(); this.ensure(d);
      const list = PC.JOBS[ctx] || [];
      const job = list.find(j => j.id === jobId);
      if (!job) return { ok: false, msg: '没有这个岗位' };
      const err = this.canWork(d, job.stamina);
      if (err) return { ok: false, msg: err };
      const times = this.timesToday(d, ctx, jobId);
      const right = answerIdx === job.quiz.ok;
      let pay = U.randInt(job.pay[0], job.pay[1]);
      if (right) pay = Math.round(pay * 1.25); else pay = Math.round(pay * .55);
      if (times >= 3) pay = Math.round(pay * .4); // 同一岗位每天做多了会累
      // 先推进时间（跨天结算会清零「今日收入」，必须排在记账之前）
      d.minute += job.minutes;
      if (d.minute >= 1440) St.newDay();
      // 再结算这一笔
      d.money += pay; d.earnedToday += pay; d.earnedTotal += pay;
      d.stamina = U.clamp(d.stamina + job.stamina, 0, 100);
      Object.keys(job.extra || {}).forEach(k => { if (k === 'stamina') d.stamina = U.clamp(d.stamina + job.extra[k], 0, 100); else St.change(k, job.extra[k]); });
      const k = 'D' + d.day + '|' + this.key(ctx, jobId);
      d.jobCount[k] = (d.jobCount[k] || 0) + 1;
      d.jobLog.unshift({ t: 'D' + d.day + ' ' + St.timeStr(), text: job.title + ' +' + U.money(pay) });
      if (d.jobLog.length > 40) d.jobLog.length = 40;
      St.logMsg('打工「' + job.title + '」赚了 ' + U.money(pay));
      St.save();
      PC.Audio.sfx(right ? 'job' : 'ok');
      return {
        ok: true, pay, right, times,
        msg: (right ? '答对了，老板多给了一点。' : '答错了，工钱打了折，但活干完了。') +
          '\n收入 ' + U.money(pay) + '　体力 ' + job.stamina + '　用时 ' + job.minutes + ' 分钟' +
          (times >= 3 ? '\n（今天这活干太多次了，工钱降到四成，换一家试试）' : '')
      };
    },
    /* 委托板：每天刷 3 单 */
    refreshGigs(d) {
      this.ensure(d);
      const pool = U.shuffle(PC.GIGS.slice());
      d.gigs = pool.slice(0, 3).map(g => Object.assign({}, g));
    },
    takeGig(id) {
      const St = PC.State, d = St.d(); this.ensure(d);
      if (d.gigActive) return { ok: false, msg: '手上还有一单没交：' + d.gigActive.title };
      const g = d.gigs.find(x => x.id === id);
      if (!g) return { ok: false, msg: '这单已经被别人接走了' };
      d.gigActive = Object.assign({}, g);
      d.gigs = d.gigs.filter(x => x.id !== id);
      St.logMsg('接了委托：' + g.title);
      St.save();
      PC.Audio.sfx('ok');
      return { ok: true, msg: '接单成功！' + g.desc + '\n走到对应地点按 A 交差，报酬 ' + U.money(g.pay) };
    },
    /* 交付：target 是街区交互点 id */
    deliver(pointId) {
      const St = PC.State, d = St.d(); this.ensure(d);
      const g = d.gigActive;
      if (!g) return null;
      if (g.target !== pointId) return null;
      const pay = g.pay + (d.fame >= 10 ? Math.round(g.pay * .2) : 0);
      d.money += pay; d.earnedToday += pay; d.earnedTotal += pay;
      d.stamina = U.clamp(d.stamina + g.sta, 0, 100);
      d.gigDone++; d.gigActive = null;
      St.logMsg('交付委托「' + g.title + '」 +' + U.money(pay));
      St.save(); PC.Audio.sfx('coin');
      return '委托完成：' + g.title + '\n收到 ' + U.money(pay) + (d.fame >= 10 ? '（含声望加成）' : '') + '　体力 ' + g.sta;
    },
    /* 拾荒 */
    pickup(itemId) {
      const St = PC.State, d = St.d(); this.ensure(d);
      const it = PC.RECYCLE[itemId]; if (!it) return { ok: false, msg: '这不是能回收的东西' };
      d.recycleBag[itemId] = (d.recycleBag[itemId] || 0) + 1;
      St.logMsg('捡到 ' + it.name);
      St.save(); PC.Audio.sfx('pickup');
      return { ok: true, msg: '捡到「' + it.name + '」×1，攒着去齐阵 / 回收箱换钱' };
    },
    recycleValue(d) {
      this.ensure(d);
      let n = 0, sum = 0;
      Object.keys(d.recycleBag).forEach(k => {
        const it = PC.RECYCLE[k]; if (!it) return;
        n += d.recycleBag[k]; sum += d.recycleBag[k] * it.value;
      });
      return { n, sum: Math.round(sum * (1 + Math.min(d.fame, 30) / 100)) };
    },
    recycleAll() {
      const St = PC.State, d = St.d(); this.ensure(d);
      const r = this.recycleValue(d);
      if (r.n <= 0) return { ok: false, msg: '回收袋是空的，街上多逛逛' };
      d.money += r.sum; d.earnedToday += r.sum; d.earnedTotal += r.sum;
      d.recycleBag = {};
      St.change('fame', 1);
      St.logMsg('卖掉 ' + r.n + ' 件可回收物，赚了 ' + U.money(r.sum));
      St.save(); PC.Audio.sfx('coin');
      return { ok: true, msg: '回收 ' + r.n + ' 件 → ' + U.money(r.sum) + '（声望越高价越好）' };
    },
    /* 街头摆摊：把背包里非凭证道具加价出手 */
    stallValue(d) {
      let sum = 0, n = 0;
      Object.keys(d.bag || {}).forEach(k => {
        const it = PC.ITEMS[k]; if (!it) return;
        if (it.tag === 'card' || it.tag === 'luxury') return;
        const q = d.bag[k];
        sum += Math.max(2, Math.round(it.price * .65)) * q; n += q;
      });
      return { n, sum };
    },
    stall() {
      const St = PC.State, d = St.d(); this.ensure(d);
      const v = this.stallValue(d);
      if (v.n <= 0) return { ok: false, msg: '背包里没有能摆出来卖的东西，先去店里买点' };
      // 只清掉可卖的，保留凭证/大额
      Object.keys(d.bag).forEach(k => {
        const it = PC.ITEMS[k]; if (!it) return;
        if (it.tag === 'card' || it.tag === 'luxury') return;
        delete d.bag[k];
      });
      d.minute += 40;
      if (d.minute >= 1440) St.newDay();
      d.money += v.sum; d.earnedToday += v.sum; d.earnedTotal += v.sum;
      d.stamina = U.clamp(d.stamina - 6, 0, 100);
      St.change('fame', 2);
      St.logMsg('街头摆摊卖掉 ' + v.n + ' 件，赚了 ' + U.money(v.sum));
      St.save(); PC.Audio.sfx('coin');
      return { ok: true, msg: '摆摊收工：卖出 ' + v.n + ' 件 → ' + U.money(v.sum) + '　声望 +2　体力 -6' };
    },
    /* 银行存款日息：每天由 systems.tick 调用 */
    dailyInterest(d) {
      this.ensure(d);
      if (!d.bank || d.bank <= 0) return 0;
      const v = Math.max(1, Math.floor(d.bank * .015));
      d.bank += v;
      d.earnedToday += v; d.earnedTotal += v;
      return v;
    },
    /* 成就 */
    claim(id) {
      const St = PC.State, d = St.d(); this.ensure(d);
      const a = PC.ACHIEVEMENTS.find(x => x.id === id);
      if (!a) return { ok: false, msg: '没有这个成就' };
      if (d.achClaimed[id]) return { ok: false, msg: '已经领过了' };
      if (!a.cond(d)) return { ok: false, msg: '还没达成：' + a.desc };
      d.achClaimed[id] = true;
      d.money += a.bonus; d.earnedToday += a.bonus; d.earnedTotal += a.bonus;
      St.logMsg('领取成就「' + a.title + '」奖金 ' + U.money(a.bonus));
      St.save(); PC.Audio.sfx('ach');
      return { ok: true, msg: '成就「' + a.title + '」达成！奖金 ' + U.money(a.bonus) };
    },
    readyAchievements(d) {
      this.ensure(d);
      return PC.ACHIEVEMENTS.filter(a => !d.achClaimed[a.id] && a.cond(d));
    }
  };
})();
