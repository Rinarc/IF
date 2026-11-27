/* data.js —— 街区布局 / 店铺 / 商品 / 广告文案（全部取自手绘设计稿） */
(function () {
  const PC = window.PC = window.PC || {};

  PC.CFG = {
    /* 低分辨率画布：比早期版本提高到 640×360（横）/ 400×600（竖），
       像素颗粒更细、画面更清晰；TEXT_SCALE 让招牌文字保持原来的视觉大小。 */
    TILE: 16, VIEW_W: 640, VIEW_H: 360, TEXT_SCALE: 1.333,
    BASE_W: 480, MAP_W: 96, MAP_H: 64,
    SAVE_KEY: 'shuguanglu-pixel-city-v1', START_MONEY: 268,
    WALK: 74, RUN: 132, INTERACT_R: 30, GAME_TITLE: '无限極人生'
  };

  PC.PAL = {
    ink: '#2a2a5e', blue: '#3b3b8f', violet: '#5b4fb3', paper: '#f4f1e4',
    gold: '#ffd25a', red: '#e2564d', green: '#4caf7d', teal: '#4fb8a8',
    road: '#4a4b62', roadLine: '#d8d4b0', pave: '#c9c6b4', paveDark: '#a9a79a',
    grass: '#6f9e63', grassDark: '#4e7c4c', water: '#4b8fb5', night: '#0b1030'
  };

  /* ---------------- 商品字典 ---------------- */
  const I = PC.ITEMS = {
    blueCoffee: { name: '蓝草咖啡', price: 12, desc: 'M-LOFFE 春季特优 · 原稿「7折」', eff: { stamina: 16, mood: 7 }, tag: 'food' },
    latte: { name: '拿铁', price: 15, desc: '奶泡厚得像被子', eff: { stamina: 12, mood: 9 }, tag: 'food' },
    americano: { name: '美式', price: 9, desc: '清醒，且便宜', eff: { stamina: 18, mood: 2 }, tag: 'food' },
    cake: { name: '春季蛋糕', price: 22, desc: '限定，售完即止', eff: { stamina: 10, mood: 16 }, tag: 'food' },
    phoneCase: { name: '15 PRO 手机壳', price: 28, desc: '检测 15 PRO · 5% 优惠', eff: { mood: 4 }, tag: 'gear' },
    screenFilm: { name: '防窥贴膜', price: 18, desc: '30% OFF 那批货', eff: { mood: 2 }, tag: 'gear' },
    earphone: { name: '无线耳机', price: 129, desc: '通勤降噪神器', eff: { mood: 14, knowledge: 2 }, tag: 'gear' },
    phone15: { name: '15 PRO 本体', price: 3999, desc: '设计稿上打了 30%OFF', eff: { mood: 40, fame: 6 }, tag: 'luxury' },
    iceJacket: { name: '冰原新款外套', price: 168, desc: 'FAMILY GO · ON SALE 8折', eff: { fitness: 3, mood: 12 }, tag: 'clothes' },
    hoodie: { name: '齐率卫衣', price: 89, desc: '街区同款', eff: { mood: 8 }, tag: 'clothes' },
    sneaker: { name: '跑步鞋', price: 139, desc: '走路快一点点', eff: { fitness: 8, stamina: 5 }, tag: 'clothes' },
    fgMember: { name: 'FAMILY GO 会员卡', price: 30, desc: '会员享 7 折 · 永久', eff: { addMember: 'FAMILY GO' }, tag: 'card' },
    chips: { name: '食趣薯片', price: 8, desc: '会员特优 VIP GET!', eff: { stamina: 8, mood: 4 }, tag: 'food' },
    onigiri: { name: '饭团', price: 7, desc: 'FREE SALE 时段抢的', eff: { stamina: 14 }, tag: 'food' },
    chicken: { name: '炸鸡桶', price: 26, desc: '新品 -60% OFF', eff: { stamina: 25, mood: 10 }, tag: 'food' },
    snackMystery: { name: '神秘新品', price: 13, desc: '包装上只写了 SNACK²', eff: { stamina: 12, mood: 12, knowledge: 1 }, tag: 'food' },
    dumbbell: { name: '硬件哑铃', price: 66, desc: '买回去大概率当摆件', eff: { fitness: 12 }, tag: 'sport' },
    wristBand: { name: '运动护腕', price: 24, desc: '配色很 90 年代', eff: { fitness: 4, mood: 3 }, tag: 'sport' },
    water: { name: '矿泉水', price: 3, desc: '便利店基础款', eff: { stamina: 9 }, tag: 'food' },
    umbrella: { name: '折叠伞', price: 35, desc: '雨天会感谢自己', eff: { mood: 3, addFlag: 'umbrella' }, tag: 'gear' },
    newsPaper: { name: '街区早报', price: 5, desc: '上面全是招租广告', eff: { knowledge: 5 }, tag: 'read' },
    busCard: { name: '92路公交卡', price: 20, desc: '刷卡上车，随机去一站', eff: { addFlag: 'buscard', knowledge: 2 }, tag: 'card' },
    comic: { name: '消遣漫画', price: 16, desc: '消遣书屋畅销', eff: { mood: 12, knowledge: 2 }, tag: 'read' },
    examBook: { name: '备考全书', price: 42, desc: 'PASS ALL EXAM!', eff: { knowledge: 14, stamina: -5 }, tag: 'read' },
    atlas: { name: '曙光路地图册', price: 19, desc: '手绘格纸复刻版', eff: { knowledge: 8, mood: 3 }, tag: 'read' },
    pen: { name: '蓝墨钢笔', price: 27, desc: '和设计稿同一支笔', eff: { knowledge: 4, mood: 6 }, tag: 'read' },
    key: { name: '配一把钥匙', price: 15, desc: '曙光锁匠 · 24H 自助', eff: { addFlag: 'key', mood: 2 }, tag: 'service' },
    unlock: { name: '开锁服务券', price: 40, desc: '但愿用不上', eff: { addFlag: 'unlock', mood: 2 }, tag: 'service' },
    keyring: { name: '猫铃钥匙扣', price: 11, desc: '会响', eff: { mood: 7 }, tag: 'gear' },
    stationery: { name: 'MY WORLD 文具', price: 18, desc: '考试过！同款', eff: { knowledge: 6 }, tag: 'read' },
    mockPaper: { name: '模拟卷 ×5', price: 25, desc: '写完据说能过', eff: { knowledge: 11, stamina: -6 }, tag: 'read' },
    charm: { name: '逢考必过符', price: 9, desc: '玄学，但便宜', eff: { mood: 9 }, tag: 'gear' },
    skewer: { name: '蒸汽烤肉串', price: 12, desc: '9AM–3AM 供应', eff: { stamina: 18, mood: 9 }, tag: 'food' },
    bbqSet: { name: '夜宵双人套餐', price: 58, desc: '营业到凌晨三点', eff: { stamina: 30, mood: 20 }, tag: 'food' },
    beer: { name: '冰镇啤酒', price: 14, desc: '成年人选项', eff: { mood: 11, stamina: -3 }, tag: 'food' },
    nightCoupon: { name: '凌晨折扣券', price: 10, desc: '夜猫子专属', eff: { addCoupon: 'bbq' }, tag: 'card' },
    postcard: { name: '环球明信片', price: 6, desc: '春季旅行推荐', eff: { mood: 5, knowledge: 2 }, tag: 'read' },
    travelBook: { name: '旅行手册', price: 32, desc: '环球旅行 AGENCY', eff: { knowledge: 9, mood: 8 }, tag: 'read' },
    ticket: { name: '周末游抽奖券', price: 45, desc: '可能中，也可能不中', eff: { addFlag: 'ticket', mood: 6 }, tag: 'card' },
    floorplan: { name: '二室一厅户型图', price: 20, desc: '290万 / 330万 / 470万', eff: { knowledge: 4 }, tag: 'read' },
    apt290: { name: '二室一厅 · 290万', price: 2900000, desc: '原稿价，攒钱目标之一', eff: { addFlag: 'home', fame: 40, mood: 50 }, tag: 'luxury' },
    monthCard: { name: '游泳健身月卡', price: 50, desc: '原稿：50 元/月', eff: { fitness: 10, addFlag: 'gym' }, tag: 'card' },
    yearCard: { name: '健身年卡', price: 550, desc: '原稿：550 元/年', eff: { fitness: 40, stamina: 20 }, tag: 'card' },
    coach: { name: '资深教练 · 一次包会', price: 120, desc: '「学得失信」警告', eff: { fitness: 22, mood: -3 }, tag: 'service' },
    lease: { name: '租下旺铺', price: 8800, desc: '联系电话 12347769 · 每天产生分红', eff: { addFlag: 'shopOwner', fame: 30 }, tag: 'luxury' },
    cola: { name: '自助售卖机 · 可乐', price: 4, desc: 'Auto Tied Vending', eff: { stamina: 10, mood: 4 }, tag: 'food' },
    soda: { name: '自助售卖机 · 苏打', price: 5, desc: '冰得手疼', eff: { stamina: 12 }, tag: 'food' },
    energy: { name: '自助售卖机 · 能量饮', price: 8, desc: '5G 一样快', eff: { stamina: 25, mood: 3 }, tag: 'food' },
    gameMW: { name: 'CALL OF DUTY: MW', price: 198, desc: '现在预购！BUY NOW!', eff: { mood: 25, knowledge: 3 }, tag: 'game' },
    gameAC: { name: '刺客信条 · UBISOFT', price: 158, desc: '双一赠一 / -20%', eff: { mood: 22, knowledge: 5 }, tag: 'game' },
    arcadeToken: { name: '无限起程 游戏币', price: 5, desc: 'INFINITY LIVES', eff: { mood: 6, addFlag: 'token' }, tag: 'game' }
  };

  /* ---------------- 店铺 ---------------- */
  const S = PC.SHOPS = [
    { id: 'metro', name: '曙光路站', en: 'SHUGUANG LU ST', type: 'metro', color: '#3b3b8f', icon: 'metro', door: 'bottom', sign: 'ENTRANCE ①② · 1号线 → 迂龙路', blurb: '真正的地铁站：站厅买票、闸机进站、站台选线路上车，坐两站到迂龙路。票价 2 元。' },
    { id: 'jishe', name: '极设数码', en: '15 PRO', type: 'tech', color: '#4fb8a8', icon: 'phone', door: 'bottom', sign: '检测 15 PRO · 30%OFF', blurb: '柜台里摆着一台被打折的样机。', counter: '「贴膜吗？今天 5%。」', items: ['phoneCase', 'screenFilm', 'earphone', 'phone15'] },
    { id: 'mloffe', name: 'M-Coffee 麦妃咖啡', en: 'M-COFFEE', type: 'cafe', color: '#8a5b3b', icon: 'coffee', door: 'bottom', sign: 'M-Coffee 春季特优！蓝草咖啡 7折', blurb: '暖气混着烘焙味，店里只有两盏吊灯。招牌上「M-Coffee」和「麦妃咖啡」并排。', counter: '「蓝草今天折后 12。」', items: ['blueCoffee', 'latte', 'americano', 'cake'] },
    { id: 'familygo', name: 'FAMILY GO 齐率', en: 'FAMILY GO', type: 'clothes', color: '#e2564d', icon: 'shirt', door: 'bottom', sign: '冰原新款！ON SALE 8折 · 会员7折', blurb: '一整面墙的冰原系列，模特没有头。', counter: '「办会员卡吗？全场 7 折。」', items: ['iceJacket', 'hoodie', 'sneaker', 'fgMember'] },
    { id: 'snack2', name: '食趣 SNACK²', en: 'SNACK SNACK', type: 'snack', color: '#d99b1f', icon: 'burger', door: 'bottom', sign: '会员特优 VIP GET! 新品 -60% OFF', blurb: '广播循环播放「FREE SALE」。', counter: '「新品不介绍，买了才知道。」', items: ['chips', 'onigiri', 'chicken', 'snackMystery'] },
    { id: 'hardware', name: '硬件运动', en: 'HARDWARE SPORT', type: 'sport', color: '#4caf7d', icon: 'dumbbell', door: 'bottom', sign: '硬件 / 运动', blurb: '哑铃按重量从矮到高排好。', counter: '「先试举，再谈价。」', items: ['dumbbell', 'wristBand', 'sneaker'] },
    { id: 'mart', name: '齐阵', en: 'QIZHEN MART', type: 'mart', color: '#5b4fb3', icon: 'bag', door: 'bottom', sign: '齐阵 · SALE · 24H', blurb: '门铃一响，店员抬头看了半秒。招牌只写两个字：齐阵。', counter: '「伞在最下面那层。」', items: ['water', 'onigiri', 'umbrella', 'newsPaper', 'busCard'] },
    { id: 'book', name: '消遣书屋', en: 'LEISURE BOOKS', type: 'book', color: '#7a6a9c', icon: 'book', door: 'bottom', sign: '消遣 · 书学', blurb: '纸页味很重，角落有张没人坐的椅子。', counter: '「地图册在蓝格子那排。」', items: ['comic', 'examBook', 'atlas', 'pen'] },
    { id: 'school', name: '渊迂市汾阳中学', en: 'FENYANG M.S. / YUANYU', type: 'school', color: '#3f6b8f', icon: 'book', door: 'bottom', sign: '渊迂市汾阳中学 · 新校门 / 正门通行', blurb: '照片里是一整栋连续的凹形红砖楼，样子不变；校园里铁栅栏围住整片学校，左后侧操场、左前侧 2×2 四宫格篮球场、花草很多。校门离教学楼门口还有一段前庭林荫道。走近教学楼门洞会黑屏进入楼内：六层平面图全做出来了，1F 中心花园、6F 天台排球场，每间标注的房间都能进。校徽是特意改的深蓝金边真校徽，不变。', counter: '', items: [] },
    { id: 'travel', name: '环球旅行', en: 'TRAVEL AGENCY', type: 'travel', color: '#4b8fb5', icon: 'plane', door: 'right', sign: '春季旅行推荐', blurb: '墙上贴满褪色的海边照片。', counter: '「春季路线，今天还能报名。」', items: ['postcard', 'travelBook', 'ticket', 'atlas'] },
    { id: 'estate', name: '户连房产', en: 'ESTATE', type: 'estate', color: '#9a6b4f', icon: 'house', door: 'right', sign: '二室一厅 290万 / 330万 / 470万', blurb: '三张户型图并排贴着，价格一个比一个镇定。', counter: '「看看不收钱。」', items: ['floorplan', 'apt290', 'pen'] },
    { id: 'gym', name: '游泳健身', en: 'SWIM & FIT', type: 'gym', color: '#3d9a94', icon: 'dumbbell', door: 'right', sign: '月卡50 / 年卡550 · 一次包会', blurb: '前台贴着「资深教练 一次包会 学得失信」。', counter: '「年卡最划算，真的。」', items: ['monthCard', 'yearCard', 'coach', 'water'] },
    { id: 'lock', name: '曙光锁匠', en: '24H HOUR SELF', type: 'lock', color: '#6b6f8c', icon: 'key', door: 'left', sign: '曙光锁匠 24H 自助', blurb: '自助配钥匙机嗡嗡响。', counter: '「机器比我会配。」', items: ['key', 'unlock', 'keyring'] },
    { id: 'myworld', name: '麦芬文具', en: 'MY WORLD', type: 'study', color: '#c05b86', icon: 'book', door: 'left', sign: '考试过！PASS ALL EXAM!', blurb: '整面墙的荧光标语，写着考试过。', counter: '「模拟卷五本装，稳。」', items: ['stationery', 'mockPaper', 'charm', 'pen'] },
    { id: 'bbq', name: '蒸汽烤肉', en: "LET'S BARBECUE", type: 'bbq', color: '#b5503c', icon: 'meat', door: 'left', sign: '营业 9AM–3AM', blurb: '排烟机很吵，但香味盖过一切。', counter: '「凌晨来，有折扣。」', items: ['skewer', 'bbqSet', 'beer', 'nightCoupon'] },
    { id: 'arcade', name: '无限起程电玩', en: 'INFINITY LIVES', type: 'arcade', color: '#5b4fb3', icon: 'gamepad', door: 'bottom', sign: '无限起程 INFINITY LUOS', blurb: '一排屏幕，全部停在标题画面。', counter: '「一枚币，一条命，或者很多条。」', items: ['arcadeToken', 'gameAC', 'chips'] },
    { id: 'pixelgame', name: '像素电玩', en: 'BUY NOW!', type: 'game', color: '#3b3b8f', icon: 'gamepad', door: 'bottom', sign: '使命召唤 预购 / UBISOFT -20%', blurb: '海报上写着「现在预购！」。', counter: '「两款都预购，送海报。」', items: ['gameMW', 'gameAC', 'postcard'] },
    { id: 'rent', name: '旺铺招租', en: 'ON SALE!', type: 'rent', color: '#a08a5b', icon: 'house', door: 'bottom', sign: '旺铺招租 联系电话 12347769', blurb: '卷帘门半拉着，里面空得能听见回声。', counter: '「租下来，这条街就有一格是你的。」', items: ['lease', 'floorplan'] },
    { id: 'vending', name: '自助售卖机', en: 'AUTO VENDING', type: 'vending', color: '#4fb8a8', icon: 'can', door: 'none', sign: '自助售卖机 Auto Tied Vending', blurb: '机器上贴着一张手写「请勿踢」。', counter: '', items: ['cola', 'soda', 'energy'] }
  ];
  PC.SHOP_BY_ID = {}; S.forEach(s => PC.SHOP_BY_ID[s.id] = s);

  /* ---------------- 地图布局（tile 单位） ---------------- */
  PC.LAYOUT = {
    roads: [
      { x: 0, y: 22, w: 96, h: 6 }, { x: 44, y: 0, w: 6, h: 64 },
      { x: 70, y: 0, w: 6, h: 64 }, { x: 0, y: 50, w: 96, h: 5 },
      { x: 16, y: 15, w: 3, h: 7 }, { x: 66, y: 28, w: 4, h: 22 }
    ],
    plazas: [{ x: 0, y: 15, w: 96, h: 7 }, { x: 0, y: 28, w: 96, h: 1 }, { x: 0, y: 41, w: 96, h: 2 }],
    grass: [{ x: 78, y: 55, w: 18, h: 9 }, { x: 2, y: 56, w: 14, h: 8 }, { x: 52, y: 56, w: 12, h: 8 }],
    water: [{ x: 84, y: 58, w: 9, h: 4 }],
    buildings: [
      { shop: 'metro', x: 2, y: 3, w: 10, h: 11 },
      { shop: 'jishe', x: 13, y: 3, w: 9, h: 11 },
      { shop: 'mloffe', x: 23, y: 3, w: 10, h: 11 },
      { shop: 'familygo', x: 34, y: 3, w: 10, h: 11 },
      { shop: 'snack2', x: 50, y: 3, w: 9, h: 11 },
      { shop: 'hardware', x: 60, y: 3, w: 9, h: 11 },
      { shop: 'mart', x: 76, y: 3, w: 9, h: 11 },
      { shop: 'school', x: 86, y: 3, w: 9, h: 11 },
      { shop: 'travel', x: 2, y: 30, w: 9, h: 6 },
      { shop: 'estate', x: 2, y: 37, w: 9, h: 6 },
      { shop: 'gym', x: 2, y: 44, w: 9, h: 6 },
      { shop: 'lock', x: 87, y: 30, w: 9, h: 6 },
      { shop: 'myworld', x: 87, y: 37, w: 9, h: 6 },
      { shop: 'bbq', x: 87, y: 44, w: 9, h: 5 },
      { shop: 'arcade', x: 18, y: 43, w: 9, h: 6 },
      { shop: 'pixelgame', x: 28, y: 43, w: 9, h: 6 },
      { shop: 'book', x: 37, y: 43, w: 7, h: 6 },
      { shop: 'rent', x: 54, y: 43, w: 9, h: 6 }
    ],
    /* 中央整块：铺在地面的 LED 显示屏（不阻挡，可走上去） */
    screens: [{ x: 26, y: 29, w: 38, h: 12 }],
    /* 交互点：tx/ty 为 tile 坐标 */
    points: [
      { id: 'metroIn', type: 'metro', tx: 7, ty: 15, label: '进入 曙光路站 地下街' },
      { id: 'vending', type: 'vending', tx: 82, ty: 43, label: '自助售卖机 · 买饮料' },
      { id: 'bus', type: 'bus', tx: 77, ty: 26, label: '92 路公交站 · 上车' },
      { id: 'atm', type: 'atm', tx: 68, ty: 26, label: '沁银行 ATM · 100m' },
      { id: 'parkIn', type: 'park', tx: 79, ty: 55, label: '🏛 进入 林景园小区 · 西洋风大门' },
      { id: 'homeIn', type: 'home', tx: 74, ty: 56, label: '🏠 一键回家 · 林景园 3 栋 502' },
      { id: 'schoolSign', type: 'sign', tx: 53, ty: 21, label: '路牌：汾阳中学 · 新校门 50m' },
      { id: 'bankSign', type: 'sign', tx: 62, ty: 21, label: '路牌：沁银行 100m' },
      { id: 'distSign', type: 'sign', tx: 22, ty: 42, label: '距离标：120m' },
      { id: 'tower5g', type: 'sign', tx: 65, ty: 27, label: '5G 信号塔' },
      { id: 'construction', type: 'sign', tx: 55, ty: 19, label: '地铁施工围挡 · 请通行' },
      { id: 'crosswalk', type: 'sign', tx: 47, ty: 49, label: '立体过街通道 / 斑马线' },
      { id: 'boardL1', type: 'board', tx: 13, ty: 30, label: '公告板：检测 15 PRO', board: 'L1' },
      { id: 'boardL2', type: 'board', tx: 13, ty: 34, label: '公告板：旺铺招租', board: 'L2' },
      { id: 'boardL3', type: 'board', tx: 13, ty: 38, label: '公告板：环球旅行', board: 'L3' },
      { id: 'boardL4', type: 'board', tx: 13, ty: 43, label: '公告板：户连房产', board: 'L4' },
      { id: 'boardL5', type: 'board', tx: 13, ty: 47, label: '公告板：游泳健身', board: 'L5' },
      { id: 'boardR1', type: 'board', tx: 83, ty: 30, label: '公告板：曙光锁匠 24H', board: 'R1' },
      { id: 'boardR2', type: 'board', tx: 83, ty: 34, label: '公告板：麦芬文具 PASS ALL EXAM', board: 'R2' },
      { id: 'boardR3', type: 'board', tx: 83, ty: 38, label: '公告板：旺铺招租', board: 'R3' },
      { id: 'boardR4', type: 'board', tx: 83, ty: 43, label: '公告板：蒸汽烤肉', board: 'R4' },
      { id: 'boardR5', type: 'board', tx: 83, ty: 47, label: '公告板：92路 / 售卖机', board: 'R5' },
      { id: 'scDate', type: 'screen', tx: 30, ty: 31, label: '地面屏 · 日期 / 时间', board: 'DATE' },
      { id: 'scWeather', type: 'screen', tx: 39, ty: 31, label: '地面屏 · 实时天气', board: 'WEATHER' },
      { id: 'scNav', type: 'screen', tx: 48, ty: 31, label: '地面屏 · 街区导航', board: 'NAV' },
      { id: 'scAd1', type: 'screen', tx: 30, ty: 38, label: '地面屏 · 街区告示', board: 'AD1' },
      { id: 'scAd3', type: 'screen', tx: 39, ty: 38, label: '地面屏 · FAMILY GO', board: 'AD3' },
      { id: 'scAd5', type: 'screen', tx: 57, ty: 31, label: '地面屏 · 食趣 SNACK²', board: 'AD5' },
      { id: 'scAd7', type: 'screen', tx: 57, ty: 38, label: '地面屏 · 麦妃咖啡', board: 'AD7' },
      /* 赚钱渠道 */
      { id: 'gigBoard', type: 'gigboard', tx: 48, ty: 44, label: '零工委托板 · 接单赚钱' },
      { id: 'gigBoard2', type: 'gigboard', tx: 72, ty: 33, label: '零工委托板 · 接单赚钱' },
      { id: 'ledger', type: 'earn', tx: 48, ty: 47, label: '街区账本 · 赚钱总览' },
      { id: 'recycle1', type: 'recycle', tx: 51, ty: 44, label: '齐阵回收箱 · 卖可回收物' },
      { id: 'recycle2', type: 'recycle', tx: 68, ty: 47, label: '路边回收箱 · 卖可回收物' },
      { id: 'stall', type: 'stall', tx: 22, ty: 33, label: '广场空地 · 摆个摊' }
    ],
    /* 街面拾荒：可刷新区域（tile 坐标），生成时会自动避开墙和建筑 */
    pickupZones: [
      { x: 14, y: 29, w: 10, h: 3 }, { x: 66, y: 29, w: 20, h: 3 },
      { x: 14, y: 43, w: 54, h: 5 }, { x: 14, y: 52, w: 60, h: 3 },
      { x: 2, y: 55, w: 14, h: 3 }, { x: 78, y: 56, w: 17, h: 6 }
    ],
    /* 装饰物：tx/ty tile，kind 决定画法，solid 会阻挡 */
    decos: [
      { kind: 'zebra', tx: 44, ty: 22, w: 6, h: 6 }, { kind: 'zebra', tx: 44, ty: 50, w: 6, h: 5 },
      { kind: 'zebra', tx: 70, ty: 22, w: 6, h: 6 }, { kind: 'zebra', tx: 16, ty: 22, w: 3, h: 6 },
      { kind: 'lane', tx: 0, ty: 24, w: 96, h: 1 }, { kind: 'laneV', tx: 46, ty: 0, w: 1, h: 22 },
      { kind: 'noHorn', tx: 78, ty: 18 }, { kind: 'warn', tx: 78, ty: 24 }, { kind: 'arrowUp', tx: 78, ty: 30 },
      { kind: 'tree', tx: 1, ty: 21, solid: 1 }, { kind: 'tree', tx: 21, ty: 21, solid: 1 },
      { kind: 'tree', tx: 41, ty: 21, solid: 1 }, { kind: 'tree', tx: 51, ty: 21, solid: 1 },
      { kind: 'tree', tx: 68, ty: 21, solid: 1 }, { kind: 'tree', tx: 93, ty: 21, solid: 1 },
      { kind: 'tree', tx: 1, ty: 42 }, { kind: 'tree', tx: 41, ty: 42 }, { kind: 'tree', tx: 50, ty: 42 },
      { kind: 'tree', tx: 68, ty: 42 }, { kind: 'tree', tx: 76, ty: 42 },
      { kind: 'tree', tx: 80, ty: 56 }, { kind: 'tree', tx: 94, ty: 56 }, { kind: 'tree', tx: 3, ty: 57 },
      { kind: 'tree', tx: 13, ty: 57 }, { kind: 'tree', tx: 54, ty: 57 }, { kind: 'tree', tx: 62, ty: 57 },
      { kind: 'lamp', tx: 12, ty: 21 }, { kind: 'lamp', tx: 43, ty: 21 }, { kind: 'lamp', tx: 69, ty: 21 },
      { kind: 'lamp', tx: 85, ty: 21 }, { kind: 'lamp', tx: 12, ty: 42 }, { kind: 'lamp', tx: 43, ty: 42 },
      { kind: 'lamp', tx: 69, ty: 42 }, { kind: 'lamp', tx: 85, ty: 42 },
      { kind: 'bench', tx: 21, ty: 29 }, { kind: 'bench', tx: 65, ty: 29 }, { kind: 'bench', tx: 40, ty: 55 },
      { kind: 'bench', tx: 58, ty: 55 }, { kind: 'bench', tx: 81, ty: 62 },
      { kind: 'car', tx: 6, ty: 23 }, { kind: 'car', tx: 34, ty: 25 }, { kind: 'car', tx: 72, ty: 34 },
      { kind: 'car', tx: 23, ty: 51 }, { kind: 'car', tx: 71, ty: 51 },
      { kind: 'fence', tx: 56, ty: 17, w: 9, h: 4 }, { kind: 'tower5g', tx: 65, ty: 27 },
      { kind: 'busStop', tx: 76, ty: 25 }, { kind: 'vending', tx: 82, ty: 42, solid: 1 },
      { kind: 'atm', tx: 68, ty: 25, solid: 1 }, { kind: 'stairs', tx: 45, ty: 46 },
      { kind: 'signpost', tx: 53, ty: 20 }, { kind: 'signpost', tx: 62, ty: 20 },
      { kind: 'parkGate', tx: 79, ty: 55 }, { kind: 'flower', tx: 84, ty: 56 }, { kind: 'flower', tx: 92, ty: 62 },
      { kind: 'board', tx: 13, ty: 30 }, { kind: 'board', tx: 13, ty: 34 }, { kind: 'board', tx: 13, ty: 38 },
      { kind: 'board', tx: 13, ty: 43 }, { kind: 'board', tx: 13, ty: 47 },
      { kind: 'board', tx: 83, ty: 30 }, { kind: 'board', tx: 83, ty: 34 }, { kind: 'board', tx: 83, ty: 38 },
      { kind: 'board', tx: 83, ty: 43 }, { kind: 'board', tx: 83, ty: 47 }
    ],
    npcs: [
      { tx: 25, ty: 19, path: [[25, 19], [38, 19], [38, 17], [25, 17]], name: '遛狗的上班族', color: '#e2564d' },
      { tx: 57, ty: 19, path: [[57, 19], [68, 19], [68, 17], [57, 17]], name: '发传单的人', color: '#d99b1f' },
      { tx: 47, ty: 33, path: [[47, 33], [47, 45], [47, 48]], name: '背书包的同学', color: '#4caf7d' },
      { tx: 12, ty: 52, path: [[12, 52], [30, 52], [30, 55], [12, 55]], name: '买菜回来的阿姨', color: '#c05b86' },
      { tx: 78, ty: 60, path: [[78, 60], [92, 60], [92, 62], [78, 62]], name: '公园里的跑者', color: '#4fb8a8' }
    ]
  };

  /* ---------------- 广告 / 公告文案（还原手绘稿） ---------------- */
  PC.ADS = {
    AD1: { t: '欢迎来到 曙光路', en: 'INFINITY LIVES', body: '☀ 9°C SUNNY　曙光路·中心街\n无限極人生：一块格子纸，一条街，和一整天的自由。', tag: '街区告示' },
    AD2: { t: '9°C SUNNY', en: '5G', body: '今日晴，9 度。汾阳中学 · 新校门 50m，沁银行 100m。\n信号满格，适合出门乱走。', tag: '天气 / 距离' },
    AD3: { t: 'FAMILY GO 齐率', en: '冰原新款！ON SALE', body: '8 折！会员享 7 折！\n看到这块牌子的人，今天买外套都算会员价。', tag: '服饰', coupon: 'familygo' },
    AD4: { t: '无限起程', en: 'INFINITY LUOS', body: '无限起程 · INFINITY LIVES\n「命很多，随便花。」街机厅老板留。\n※ 本作：无限極人生', tag: '电玩', event: 'arcade' },
    AD5: { t: '食趣 SNACK²!', en: 'VIP GET! FREE SALE!', body: '会员特优 / 新品 -60% OFF\n「FREE SALE」到底免不免费，问店员。', tag: '零食', coupon: 'snack2' },
    AD6: { t: '使命召唤', en: 'CALL OF DUTY: MODERN WARFARE', body: '米默旅行中！现在预购！BUY NOW!\n海报边角被人用蓝笔涂了一道。', tag: '游戏' },
    AD7: { t: 'M-Coffee 麦妃咖啡 春季特优！', en: 'M-COFFEE · 蓝草咖啡 7折', body: '蓝草咖啡 · 7 折　↓120m\n顺着箭头走，别走反。', tag: '咖啡', coupon: 'mloffe' },
    AD8: { t: '刺客信条', en: "ASSASSIN'S CREED / UBISOFT", body: '买双一赠一 / UBISOFT -20% / -30%\n幻景 NEXT 系列，预购送海报。', tag: '游戏' }
  };
  /* 地面显示屏 · 轮播顺序与导航条目 */
  PC.SCREEN_ADS = ['AD1', 'AD2', 'AD3', 'AD4', 'AD5', 'AD6', 'AD7', 'AD8'];
  PC.SCREEN_NAV = [
    '↑ 曙光路站 ENTRANCE ①②',
    '→ 汾阳中学 · 新校门 50m',
    '→ 沁银行 ATM 100m',
    '→ M-Coffee 麦妃咖啡 120m',
    '→ 林景园小区 3 栋 502 我家'
  ];
  PC.BOARDS = {
    L1: { t: '检测 15 PRO', body: '15 PRO 检测 · 5%\n↓ 30%OFF（手写划掉了又重写）' },
    L2: { t: '旺铺招租 ON SALE', body: '联系电话：0577-00286\n「旺气铺 招租」，字被描了三遍。' },
    L3: { t: '环球旅行 TRAVEL AGENCY', body: '春季旅行推荐\n一元环旅行行·到春游行推荐' },
    L4: { t: '户连房产', body: '普通二室一厅 290万\n好景三室 330万 / 在林景园 470万\n（小区售楼处按街区币结算，能真的买）' },
    L5: { t: '游泳健身', body: '月卡 50 元/月　年卡 550 元/年\n资深教练 一次包会 学得失信' },
    R1: { t: '曙光锁匠 24H', body: '24H 自助 HOUR SELF\n半夜也能配钥匙。' },
    R2: { t: '麦芬文具 MY WORLD', body: '考试过！PASS ALL EXAM!\n荧光笔写的，隔着两米都看得见。' },
    R3: { t: '旺铺招租 ON SALE!', body: '联系电话：12347769\n右边这间比左边那间贵一点。' },
    R4: { t: "蒸汽烤肉 LET'S BARBECUE", body: '营业时间 9AM–3AM / 6MM~3AM\n凌晨的折扣只给还没回家的人。' },
    R5: { t: '92 路 · 自助售卖机', body: '曙光路 → 过街 → 曙光路\nAuto Tied Vending（请勿踢）' }
  };

  PC.SIGNS = {
    schoolSign: { t: '汾阳中学 · 新校门 50m', body: '路牌上多了一支手画的箭头。往东 50 米，右上那一整栋圆角红砖楼就是；2026 年重修完工，深绿电动门、黑铁栅栏、石柱门墩都换了新的，正门能走。' },
    bankSign: { t: '沁银行 100m', body: '旁边就是 ATM。设计稿把它标成 100m，实际走两步就到。' },
    distSign: { t: '↓ 120m', body: '蓝笔画的菱形标记，指向 M-Coffee 麦妃咖啡。' },
    tower5g: { t: '5G 信号塔', body: '塔底贴着一张「无限起程」的小贴纸。信号满格。' },
    construction: { t: '地铁施工 · 请通行', body: '围挡上写着「请通行 ↑」，但通道只留了半米。' },
    crosswalk: { t: '立体过街通道', body: '斑马线连着一段楼梯，通向南侧街区。' },
    pond: { t: '林景园 · 中央水池', body: '小区中轴上的大喷泉水池，一条木栈道从水面穿过去。睡莲、锦鲤、水波都在动，绕一圈刚好一公里。' },
    estateGateSign: { t: '林景园 · LINJING GARDEN', body: '两根罗马柱托着三角山花，金匾上是「林 景 园」，铁艺大门两边各一间门卫亭，门前还有一小座会喷水的池子。\n进去是 1 / 3 / 5 栋居民楼、A / B / C 座别墅、健身区和售楼处。' },
    fountainPt: { t: '喷水池 · 林景园中轴', body: '从南门一路走到北端花坛，正中间就是这座喷泉。设计稿只写了「林景园 Neighbourhood」，小区是照着那四个字长出来的。' },
    notice: { t: '渊迂市汾阳中学 · 校园 / 六层楼内', body: '作息：早上 7:40 一大群学生从校门涌进来，往教学楼走；下午 18:00 放学，学生们都往校门走、回家。门口有作息钟，按 A 可以直接跳到这两个时刻看人潮。\n铁栅栏围住整片校园，操场、2×2 四宫格篮球场、花园都在栅栏里。校门在南、教学楼在北，中间一大段前庭林荫道，进校后镜头会拉近。\n教学楼就是沿街那一整栋红砖楼，样子没变；门前只加了一小段浅色门廊与门牌，走近按 A 才黑屏进楼内，没有用黑块代替楼体。\n楼内总共六层，按 0010 / 0100 平面图复原：一层层回字形外廊围着中庭，米色墙、红砖腰线、白立柱、成排深色门窗、绿色安全出口灯和红色消防箱，房间一间间紧挨着，不再是一个个白盒子。1F 中间是中心花园，靠花园一侧是开放式柱廊；2~5F 是挑空天井；6F 是天台排球场，四周高隔离网防止球飞走。每一层只有左下角一组厕所：左边女厕所、右边男厕所（二楼原来漏了男厕所，现在补上），别处不再放厕所；右侧没有「出入口」这种房间，只有二楼有一条横着连通两边的花园通道，其他楼层右侧都敞开。六楼天台上面一侧是屋顶花园、下面一侧只有一个排球场。每一间标注过的房间都能进去，室内按用途重画过（黑板课桌 / 办公桌电脑 / 实验台 / 餐桌 / 书架 / 钢琴画架 / 隔间洗手台……），两扇门，左边教室从右边出门、其他同理。楼里还能遇到袁雪、张雨京、洪果、严继国、严啸鸣、李徐、惠影湖、秦章、戴欣星九位老师。平面图右侧就是大门方向。\n沿街这栋楼本体仍是 2026 年重修完工的那一整栋：就这一整栋楼，左右两翼、中央连廊、底层山墙是连成一片的红砖，中间没有天空缝，不要看成两座塔。\n贯通全楼的米色腰线和逐层横窗把两翼与连廊拉成同一层高；两翼外侧削圆角、靠中庭内侧各一列弧形玻璃窗，左翼竖排金字「汾阳中学」，右翼「激发潜能」，连廊顶上还有一道玻璃天桥。\n当中一堵褐红弧形山墙，挂的是学校真正的校徽——土金外环、深蓝环，上半弧「渊迂市汾阳中学」、下半弧 YUANYU FENYANG HIGH SCHOOL，酒红内圆里一只白鸽落在一枚青绿心形上。\n底下是深绿电动推拉门、黑铁栅栏、米色石柱门墩和门前黑黄隔离柱。\n校徽是特意改的深蓝金边真校徽，一个像素没动。值日生还是把 PASS ALL EXAM 写在黑板报上。' },
    track: { t: '操场 · 校园左后侧', body: '红色跑道围着一块绿地，在校园左后侧，和四片篮球场一样都在铁栅栏里面。\n设计稿写的是「汾阳中学 · 新校门 50m」，走过来其实要两分钟。' },
    basketball: { t: '四宫格篮球场 · 2×2', body: '四片场地拼成一个田字：共用外框，中间十字走道隔开，2×2 四宫格，不是一字横排。每片都有白线中圈、三分弧、罚球区和两端篮架。\n从校门进来左手边靠前就是它们；再往里（左后侧）才是操场。四片都在铁栅栏里面，属于学校内部。' }
  };

  /* ================================================================
     汾阳中学 · 教师 NPC（按用户给的名册，分布在六层楼里）
     floor 是楼层，x/y 是楼层平面图的格子坐标；path 可选，走道里巡课。
     ================================================================ */
  PC.SCHOOL_STAFF = [
    { name: '袁雪',   title: '德育处老师',             gender: '男', color: '#3f6b8f', floor: 1, x: 29, y: 8,  dir: 0,
      path: [[29, 8], [40, 8], [40, 23], [29, 23]] },
    { name: '李徐',   title: '教师',                   gender: '女', color: '#c05b86', floor: 1, x: 20, y: 23, dir: 2 },
    { name: '洪果',   title: '校长',                   gender: '男', color: '#3b3b8f', floor: 2, x: 52, y: 8,  dir: 0 },
    { name: '严继国', title: '副校长',                 gender: '女', color: '#d99b1f', floor: 2, x: 17, y: 23, dir: 1,
      path: [[17, 23], [30, 23], [30, 8]] },
    { name: '严啸鸣', title: '副校长',                 gender: '女', color: '#5b4fb3', floor: 3, x: 24, y: 8,  dir: 2 },
    { name: '惠影湖', title: '教师',                   gender: '女', color: '#4fb8a8', floor: 3, x: 14, y: 15, dir: 1 },
    { name: '秦章',   title: '教师',                   gender: '女', color: '#e2564d', floor: 4, x: 38, y: 23, dir: 3,
      path: [[38, 23], [24, 23], [24, 8], [38, 8]] },
    { name: '张雨京', title: '课程与教学管理处主任',   gender: '女', color: '#7fe0c8', floor: 5, x: 27, y: 8,  dir: 0 },
    { name: '戴欣星', title: '教师',                   gender: '女', color: '#ffb347', floor: 6, x: 46, y: 15, dir: 1 }
  ];

  /* ================================================================
     汾阳中学 · 教学行政楼 1~6 层平面图（按用户给的六张图）
     · 平面图右侧 = 大门方向，所以楼层里玩家从右侧大厅进来
     · top / bottom / left / right 四排房间，门一律开向内侧过道 / 中庭
     · 1F 中间 = 中心花园（靠花园一侧开放式）；2~5F = 天井；6F = 天台排球场
     · 每一间标注过的房间都能进去（sroom:<层>:<序号>）
     ================================================================ */
  PC.SCHOOL_FLOORS = [
    { n: 1, code: '0010', atrium: 'garden', atriumName: '中心花园',
      top: ['体育', '仓库', '餐厅', '食堂', '卫生室', '蒸箱间'],
      bottom: ['女厕所', '男厕所', '教室', '教室', '教室', '教室', '数据办公室'],
      left: ['室外排球场', '水池', '内花园'], right: ['大厅'],
      note: '一楼中间是中心花园，靠花园那一侧整排是开放式柱廊，没有封闭墙。左下角只有一组厕所：左边女厕所、右边男厕所；右侧（大门方向）只有大厅，没有「出入口」这种房间。' },
    { n: 2, code: '0010', atrium: 'void', atriumName: '天井',
      top: ['校长室', '广播室', '教师', '化学室', '物理室', '综合实验室'],
      bottom: ['女厕所', '男厕所', '教室', '教室', '教室', '教室', '教师办公室'],
      left: ['美术教室', '心理室', '档案室', '工会', '人事室', '会议室'], right: ['花园通道'],
      rightY0: 14, rightY1: 18, pass: true,
      note: '二楼平面图 0010。左下角补上了男厕所（左女右男）；上排不再放厕所。只有二层右侧有一条「花园通道」横着穿过天井，把两边连起来；其他楼层右侧都是敞开的，没有房间。' },
    { n: 3, code: '0100', atrium: 'void', atriumName: '天井',
      top: ['团队室', '美术室', '教室', '音乐室', '综合教室'],
      bottom: ['女厕所', '男厕所', '教室', '教室', '教室', '教室', '教师办公室'],
      left: ['多媒体室', '图书储藏室', '图书室'], right: [],
      note: '三楼平面图 0100，左侧整列是图书与多媒体，右侧敞开、没有房间也没有花园通道。' },
    { n: 4, code: '0100', atrium: 'void', atriumName: '天井',
      top: ['团队室', '舞蹈室', '教室', '音乐室'],
      bottom: ['女厕所', '男厕所', '教室', '教室', '教室', '教室', '教师办公室'],
      left: ['化妆间', '大礼堂'], right: [],
      note: '四楼平面图 0100，左侧是大礼堂和化妆间，右侧敞开，天井依旧挑空。' },
    { n: 5, code: '0100', atrium: 'void', atriumName: '天井',
      top: ['教研室', '语言室', '电脑室', '电脑室'],
      bottom: ['女厕所', '男厕所', '教室', '教室', '教室', '教室', '教师办公室'],
      left: ['储藏室'], right: [],
      note: '五楼平面图 0100，上排全是语言与电脑教室，右侧敞开。' },
    { n: 6, code: '0100', atrium: 'roof', atriumName: '天台 · 上花园下排球场',
      top: ['水泵房', '楼梯', '储藏室'],
      bottom: ['储藏室', '楼梯', '储藏室'],
      left: [], right: [],
      note: '六楼天台按你说的分两侧：上面一侧是屋顶花园，下面一侧只有一个排球场；四周高隔离网防止球飞走。天台上没有教室也没有厕所，房间只有水泵房、楼梯和储藏室。' }
  ];

  /* 房间按名字推断室内类型 */
  PC.SCHOOL_ROOM_KIND = function (name) {
    const n = name || '';
    if (/厕所|卫生间/.test(n)) return 'toilet';
    if (/教室|课/.test(n) && !/美术|音乐|舞蹈|电脑|语言|多媒体|综合|化学|物理|生物/.test(n)) return 'classroom';
    if (/化学|物理|生物|电脑|语言|多媒体|综合|实验/.test(n)) return 'lab';
    if (/餐厅|食堂|蒸箱|厨房/.test(n)) return 'canteen';
    if (/图书/.test(n)) return 'library';
    if (/礼堂|舞蹈|音乐|美术|化妆|团队/.test(n)) return 'arts';
    if (/校长|办公|数据|档案|人事|工会|会议|教研|广播|教师|储藏|仓库|水泵|卫生/.test(n)) return 'office';
    if (/楼梯|出入口|过道|通道|大厅|阳台|天井|水池|花园|排球|体育/.test(n)) return 'hall';
    return 'office';
  };
  PC.SCHOOL_ROOM_INFO = {
    '中心花园': '一楼正中，水池、花坛、藤架和几条碎石小径。靠花园一侧是开放式柱廊，走过去不用推门。',
    '天台排球场': '六楼天台，两片排球场，四周高隔离网把球拦住。风比楼下大。',
    '教室': '一整排课桌，黑板还没擦干净，讲台角上摞着作业本。',
    '教师办公室': '几张办公桌拼在一起，红笔、教案和没喝完的茶。',
    '化学室': '通风橱、试剂架、一排贴着标签的瓶子，桌上摆着护目镜。',
    '物理室': '轨道小车、滑轮、弹簧秤，墙角还有一台老示波器。',
    '电脑室': '两排显示器同时亮着，键盘声此起彼伏。',
    '语言室': '一格一格的语音座位，耳机挂在隔板边上。',
    '多媒体室': '投影幕布放下来一半，讲台上是遥控器与音响。',
    '图书室': '顶到天花板的书架，靠窗有一张长阅览桌。',
    '图书储藏室': '一摞摞没上架的书，纸箱上写着年份。',
    '大礼堂': '一排排折叠椅对着舞台，幕布是深红的。',
    '舞蹈室': '整面墙的镜子、把杆，地板擦得发亮。',
    '音乐室': '钢琴、谱架、几只鼓，墙上贴着合唱比赛的海报。',
    '美术室': '画架、石膏像、晾到一半的水彩。',
    '团队室': '队旗、鼓号、叠得整整齐齐的红领巾。',
    '校长室': '一张大办公桌、书柜、沙发，窗台上养着两盆绿萝。',
    '广播室': '调音台、话筒、一只写着「午间广播」的牌子。',
    '会议室': '长条会议桌，一圈椅子，白板上还留着上周的议程。',
    '档案室': '一排排铁柜，抽屉标签按年份排好。',
    '心理室': '浅色沙发、沙盘、一柜子桌游，窗帘是暖黄的。',
    '食堂': '长条餐桌、打饭窗口，蒸箱间就在隔壁。',
    '餐厅': '圆桌与椅子，墙上贴着本周菜单。',
    '蒸箱间': '三台不锈钢蒸箱，白汽从缝里往外冒。',
    '卫生室': '一张铺白布的小床、药柜、身高体重秤。',
    '体育': '垫子、跳绳、篮球筐和一只装满器材的铁柜。',
    '室外排球场': '一楼西侧，界线画在水泥地上，网子拉得笔直。',
    '水池': '一方浅水池，睡莲和几尾锦鲤，旁边一圈石凳。',
    '内花园': '从一楼过道能直接走进去的一小片绿地，花草最多。',
    '大厅': '进楼第一眼就是这里，右侧通向大门方向，楼层牌挂在墙上。',
    '出入口': '门厅，右手边就是楼梯，平面图右侧正是大门方向。',
    '楼梯': '水磨石台阶，扶手被摸得发亮，可以上下楼。',
    '阳台': '朝大门方向的一排栏杆，能看见校门与前庭。',
    '水泵房': '天台角落，两台水泵和一圈压力表，嗡嗡地响。',
    '储藏室': '课桌椅、旧海报、几只纸箱，靠墙摞得很高。',
    '厕所': '瓷砖隔断、洗手台，窗户开得很高。',
    '化妆间': '一圈带灯的镜子，台面上摆着发夹与油彩。',
    '工会': '书架、乒乓球拍、一张贴着活动照片的公告板。',
    '人事室': '文件柜、电脑、一摞密封袋。',
    '教研室': '几张拼起来的桌子，摊着教材与试卷。',
    '档案室': '铁柜、编号标签、一台老式打孔机。',
    '女厕所': '每层左下角靠左那一间。瓷砖隔断、洗手台、高窗，门牌是蓝底金字。',
    '男厕所': '每层左下角靠右那一间，和女厕所紧挨着。二楼这间以前漏标了，现在补上。',
    '花园通道': '只有二楼右侧有：一条横着穿过天井的花园通道，把左右两边连起来。两侧是花台与矮栏杆，头顶是敞开的，不是封闭房间。'
  };

  PC.NPC_LINES = {
    '遛狗的上班族': ['「这条街我走了八年，店铺换了一轮又一轮。」', '「狗比我会认路。」'],
    '发传单的人': ['「拿一张吧，不买也没关系。」', '「今天发的是烤肉店，昨天是健身房。」'],
    '背书包的同学': ['「新校门修好啦，一整栋红砖楼配绿门，比围挡好看一百倍。」', '「PASS ALL EXAM! 我贴了三张在书上。」'],
    '校门门卫': ['「正门开了，不用再绕侧门。」', '「往里走一段才到教学楼门口，别在栅栏这儿就以为到了。」', '「里头六层楼，六楼天台还能打排球。」'],
    '浇花的园丁': ['「这一排花从校门一直铺到教学楼门口。」', '「中心花园那侧是敞开的，不用推门就能过去。」'],
    '拍照的家长': ['「站远一点才能把整栋楼都拍进去，两翼和连廊是一体的。」', '「蓝底金边那枚才是校徽，中间有白鸽和青绿色的心，特意没换。」'],
    '打篮球的同学': ['「四片是田字格，中间那条十字线别踩。」', '「左边两片归我们，右边两片给高年级。」', '「投完这个就回去值日，PASS ALL EXAM!」'],
    '返校的校友': ['「毕业那会儿门还围着，这次回来总算看见正脸了。」', '「右翼写的是激发潜能，我们当年只敢念前两个字。」'],
    '买菜回来的阿姨': ['「蓝草咖啡今天 7 折，我刚看见。」', '「别买 470 万那套，朝向不好。」'],
    '公园里的跑者': ['「林景园绕一圈刚好一公里。」', '「9 度，跑步刚好。」'],
    '小区保安': ['「3 栋 502？进门直走，第二排那栋。」', '「A/B/C 座在南边，看房先去售楼处。」'],
    '看房的情侣': ['「290 万那套朝向好，470 万那套带水池。」', '「售楼处说游戏里能直接买，我们试试。」'],
    '修剪蔷薇的园丁': ['「B 座那圈蔷薇是我种的，别踩。」', '「健身区往西，水池在中间。」'],
    /* ---- 汾阳中学教师 ---- */
    '袁雪': ['「德育处在一楼，走廊里别跑，砖地滑。」', '「胸卡戴好，校徽别蹭花了。」', '「中心花园那侧是敞开的，过去可以，别踩灌木。」'],
    '李徐': ['「这节课的作业本我抱去办公室，你帮我让一下。」', '「一楼教室靠花园，采光是最好的。」'],
    '洪果': ['「校长室在二楼，门开着，有事直接进来。」', '「这栋楼六层，一层层回廊都是从天井往下看的。」', '「校徽是特意改的深蓝金边，别再让人画错了。」'],
    '严继国': ['「副校长室就在校长室隔壁，找我签字不用排队。」', '「二楼天井那圈白柱子，是当年一起砌的。」', '「六楼天台排球场的网子加高过，球飞不出去。」'],
    '严啸鸣': ['「三楼图书室和多媒体室在这一侧，别走反。」', '「下午的会改到四楼大礼堂了。」'],
    '惠影湖': ['「图书储藏室那几箱旧书，我整理了一整个暑假。」', '「天井对面就是美术室，光线好。」'],
    '秦章': ['「大礼堂的幕布是深红的，排练别踩到台边。」', '「舞蹈室把杆旁的镜子，麻烦轻点擦。」', '「四楼平面图是 0100，别和二楼 0010 记混。」'],
    '张雨京': ['「课程与教学管理处管排课，五楼语言室和电脑室归我调。」', '「这学期的课表贴在教研室门口了。」', '「每层平面图右侧才是大门方向，记一下。」'],
    '戴欣星': ['「六楼风大，排球别往网外挑。」', '「天台水泵房那边别靠太近，机器响。」', '「从这儿能看见整片中心花园。」'],
    '上学赶路的同学': ['「7:40 了！再晚就要迟到。」', '「早读前冲进校门，书包还没拉好拉链。」', '「中心花园那边能抄近路。」'],
    '放学回家的同学': ['「18:00 了，回家！」', '「明天见，作业别忘了。」', '「从大门出去，往曙光路走。」']

  };

  /* ================================================================
     第二张手绘设计稿 · 迂龙路 YULONG ROAD（坐地铁抵达）
     稿件文字：迂龙地下通道 / 921路 曙光路⇆景迂路 SAFE LINE /
     迂龙路 ☀17°C 下一班车 3·13·20min 天气降温记得保暖添衣 /
     道路千万条安全第一条 / 渊迂市高级人民法院 立案·判决查询 /
     PARK LAR / POLICE 保安亭 / LINE 1 AIR L1 / 票价2元 /
     无限極人生 创造你的路 ENTRANCE / 迂龙有轨电车1号线 下一站中华门 /
     迂龙路地铁站 M / 迂龙大排档 三黄鸡32元 / 星降电信 /
     ACMA机场联络线 / SI线谷园方向 S2线中华门方向 / We are hiring!
     ================================================================ */
  Object.assign(I, {
    metroTicket: { name: '地铁单程票', price: 2, desc: '设计稿「票价 2元」· 刷卡进站', eff: { addFlag: 'metroTicket', knowledge: 1 }, tag: 'card' },
    yChicken: { name: '迂龙三黄鸡', price: 32, desc: '迂龙大排档 今日爆款 · 32元/份', eff: { stamina: 32, mood: 14 }, tag: 'food' },
    yNoodle: { name: '大排档炒面', price: 16, desc: '锅气很足，坐在塑料凳上吃', eff: { stamina: 22, mood: 8 }, tag: 'food' },
    ySkewer: { name: '小吃一条街烤串', price: 9, desc: '十几家摊子连成一排', eff: { stamina: 14, mood: 6 }, tag: 'food' },
    yNetCard: { name: '星晨网吧 上网卡', price: 10, desc: '未满 18 禁止上网！18 LIMITED', eff: { mood: 9, knowledge: 3 }, tag: 'card' },
    yHoner: { name: 'HONER WARDROBE 华服', price: 128, desc: 'UPSTAIRS HONOR! 楼上那排', eff: { mood: 18, fitness: 2 }, tag: 'clothes' },
    yVipCard: { name: 'VIP 80% 贵宾卡', price: 20, desc: '稿子上被框起来的那张', eff: { mood: 7, addFlag: 'yVip' }, tag: 'card' },
    yMnBag: { name: 'MN 柳 SALE 手提袋', price: 19, desc: 'SALE! 600FF 的找零刚好够', eff: { mood: 8 }, tag: 'gear' },
    ySim: { name: '星降电信 手机号', price: 30, desc: '办理手机号 / 更换电话卡 / 网络办理', eff: { knowledge: 3, addFlag: 'sim' }, tag: 'service' },
    ySimSwap: { name: '更换电话卡', price: 15, desc: '旧卡当场剪掉', eff: { mood: 3 }, tag: 'service' },
    yAirTicket: { name: 'ACMA 机场联络线车票', price: 20, desc: 'T1 / T2 航站楼 · 轨交图', eff: { knowledge: 4, mood: 5 }, tag: 'card' },
    yRegForm: { name: '立案登记表', price: 5, desc: 'Register · 渊迂市高级人民法院', eff: { knowledge: 5 }, tag: 'read' },
    yJudgement: { name: '判决查询打印件', price: 8, desc: 'Judgement · 为人民服务', eff: { knowledge: 6 }, tag: 'read' },
    yJobAd: { name: 'We are hiring! 报名表', price: 3, desc: '公司招人！广告招租', eff: { knowledge: 2, fame: 1 }, tag: 'read' },
    yTramTicket: { name: '迂龙有轨电车 1号线票', price: 2, desc: '下一站 中华门 ZHONGHUA', eff: { mood: 3, knowledge: 1 }, tag: 'card' },
    yAtlas: { name: '迂龙路轨交图', price: 12, desc: '迂龙南路 / 迂龙路 / 龙川路 / 迂龙北', eff: { knowledge: 9, mood: 2 }, tag: 'read' }
  });

  S.push(
    { id: 'y_snackstreet', name: '小吃一条街', en: 'SNACK STREET', type: 'snackstreet', color: '#d99b1f', icon: 'burger', door: 'bottom', sign: '小吃一条街', blurb: '十几家摊子连成一排，蒸笼的白气把招牌熏得发黄。', counter: '「先吃后付，别跑就行。」', items: ['ySkewer', 'yNoodle', 'onigiri', 'chips'] },
    { id: 'y_netbar', name: '星晨网吧', en: 'MORNING NETBAR', type: 'netbar', color: '#3b3b8f', icon: 'gamepad', door: 'bottom', sign: '未满18禁止上网！18 LIMITED · VIP 80%', blurb: '一排屏幕全亮着，门口贴着「未满 18 禁止上网」，里面却没人查。', counter: '「开机按左边那个键，别按电源。」', items: ['yNetCard', 'yVipCard', 'cola', 'energy'] },
    { id: 'y_wardrobe', name: '霍尔德比 HONER WARDROBE', en: 'HONER WARDROBE', type: 'wardrobe', color: '#c05b86', icon: 'shirt', door: 'bottom', sign: 'UPSTAIRS HONOR! · 两层', twoFloor: true, blurb: '稿子上星辰网吧旁边两格其实是连起来的一家：一楼门面加 UPSTAIRS 箭头，二楼整排礼服橱窗。', counter: '「楼上还有一排，慢慢看。」', items: ['yHoner', 'iceJacket', 'hoodie', 'yMnBag'] },
    { id: 'y_mn', name: 'MN 柳 · SALE', en: 'MN SALE!', type: 'sale', color: '#b5503c', icon: 'bag', door: 'bottom', sign: 'PAY NOW! 游趣 · SALE! 600FF · EMPIRE→', blurb: '大红 SALE 贴满玻璃，600FF 的价签被划掉又写了一遍。', counter: '「PAY NOW，不议价。」', items: ['yMnBag', 'postcard', 'chips', 'yVipCard'] },
    { id: 'y_paynow', name: 'PAY NOW 游趣', en: 'PAY NOW!', type: 'arcade', color: '#5b4fb3', icon: 'gamepad', door: 'bottom', sign: 'PAY NOW! 游趣 · 无限極人生', blurb: '投币口亮着，屏幕停在标题画面。', counter: '「一枚币，一次机会。」', items: ['arcadeToken', 'gameMW', 'chips'] },
    { id: 'y_traffic', name: '迂龙交通 1L', en: 'YULONG TRANSIT 1L', type: 'ticket', color: '#4fb8a8', icon: 'metro', door: 'bottom', sign: '迂龙交通 1L · AB 1号线 · 票价 2元', blurb: '售票窗口贴着 1 号线 / 2 号线线路图，票价 2 元。', counter: '「去曙光路就坐 1 号线，两站。」', items: ['metroTicket', 'yTramTicket', 'yAtlas', 'busCard'] },
    { id: 'y_court', name: '渊迂市高级人民法院', en: 'HIGH PEOPLE COURT', type: 'court', color: '#8f92b5', icon: 'book', door: 'bottom', sign: '立案 Register · 判决查询 Judgement · 为人民服务', blurb: '台阶很高，门厅里挂着「为人民服务」。立案和判决查询各一个窗口。', counter: '「材料带齐了吗？表格在左边。」', items: ['yRegForm', 'yJudgement', 'newsPaper', 'pen'] },
    { id: 'y_arrival', name: '迂龙路 北中 · 51', en: 'ARRIVAL / TRAIN', type: 'ticket', color: '#4b8fb5', icon: 'metro', door: 'top', sign: '列车到达 Arrival · Train · 2分钟 · 《谷园 晨楼东》', blurb: '到站屏一直跳着「2 分钟」，旁边贴着《谷园 晨楼东》的旧海报。', counter: '「下一班还是两分钟，别急。」', items: ['metroTicket', 'yAtlas', 'postcard', 'newsPaper'] },
    { id: 'y_metrooffice', name: '迂龙地铁商务', en: 'METRO BUSINESS', type: 'rent', color: '#a08a5b', icon: 'house', door: 'top', sign: '地铁旺铺 · 请前往总部 或访问网站', blurb: '玻璃门上贴着「地铁旺铺」，里面只有一张桌子和一台饮水机。', counter: '「总部在中华门，网站也行。」', items: ['lease', 'floorplan', 'yAtlas'] },
    { id: 'y_dapaidang', name: '迂龙大排档', en: 'YULONG FOOD STALL', type: 'dapaidang', color: '#b5503c', icon: 'meat', door: 'top', sign: '客栈里边请 · 今日爆款：迂龙三黄鸡 32元/份', blurb: '塑料凳、圆桌、一口冒烟的炒锅。招牌上「今日爆款」四个字最大。', counter: '「三黄鸡 32，今天刚出的。」', items: ['yChicken', 'yNoodle', 'beer', 'skewer'] },
    { id: 'y_telecom', name: '星降电信', en: 'STAR TELECOM 1L', type: 'telecom', color: '#3d9a94', icon: 'phone', door: 'top', sign: '办理手机号 · 更换电话卡 · 网络办理', blurb: '墙上贴满号码段，柜台上摆着一排 SIM 卡托。', counter: '「办卡还是换卡？都在这排。」', items: ['ySim', 'ySimSwap', 'phoneCase', 'screenFilm'] },
    { id: 'y_airport', name: 'ACMA 机场联络线', en: 'ACMA AIRPORT LINK', type: 'travel', color: '#4b8fb5', icon: 'plane', door: 'top', sign: '轨交图 迂龙南路 / 迂龙路 / 龙川路 / 迂龙北 · T1 / T2 航站楼', blurb: '整面墙是轨交图，T1、T2 两个航站楼的箭头分得很清楚。', counter: '「去机场坐这趟，别上反方向。」', items: ['yAirTicket', 'yAtlas', 'travelBook', 'postcard'] },
    { id: 'y_sline', name: 'S1 / S2 线 站台', en: 'LINE S1 / S2', type: 'ticket', color: '#5b4fb3', icon: 'metro', door: 'top', sign: 'SI线 谷园方向列车 · S2线 中华门方向 · 列车进站', blurb: '两块屏并排：左边谷园方向，右边中华门方向，中间夹着「广告招租」。', counter: '「看清方向再上车。」', items: ['metroTicket', 'yTramTicket', 'yAtlas'] },
    { id: 'y_hiring', name: 'We are hiring! 公司招人', en: 'WE ARE HIRING', type: 'rent', color: '#a08a5b', icon: 'house', door: 'top', sign: 'We are hiring! 公司招人！ · <广告招租>', blurb: '半间屋子全是纸箱，墙上用马克笔写着 We are hiring!', counter: '「今天就能上工，日结。」', items: ['yJobAd', 'newsPaper', 'yAtlas'] },
    { id: 'y_police', name: 'POLICE 保安亭', en: 'POLICE BOX', type: 'police', color: '#3f6b8f', icon: 'key', door: 'top', sign: 'POLICE 保安亭 · 为人民服务', blurb: '小亭子只容得下一张桌子和一把椅子，窗上贴着「为人民服务」。', counter: '「问路先敲门。」', items: ['yAtlas', 'newsPaper', 'keyring'] }
  );
  S.forEach(s => { PC.SHOP_BY_ID[s.id] = s; });

  /* 迂龙路地图布局（tile 96×64） */
  PC.LAYOUT_YULONG = {
    roads: [
      { x: 0, y: 20, w: 96, h: 7 }, { x: 44, y: 0, w: 8, h: 64 },
      { x: 70, y: 0, w: 6, h: 64 }, { x: 0, y: 50, w: 96, h: 6 },
      { x: 16, y: 27, w: 4, h: 23 }, { x: 84, y: 27, w: 4, h: 23 }
    ],
    plazas: [{ x: 0, y: 0, w: 96, h: 3 }, { x: 0, y: 27, w: 96, h: 2 }, { x: 0, y: 56, w: 96, h: 8 }],
    grass: [{ x: 82, y: 16, w: 14, h: 4 }, { x: 2, y: 15, w: 12, h: 5 }, { x: 78, y: 56, w: 6, h: 5 }],
    water: [],
    buildings: [
      /* 左上角 x:2~13 不是店面，是「地下小吃一条街」的下沉大入口（斜线楼梯），由 props 绘制 */
      { shop: 'y_netbar', x: 13, y: 3, w: 9, h: 11 },
      /* 稿子上星辰网吧右边两格连在一起，是同一家两层服装店 */
      { shop: 'y_wardrobe', x: 23, y: 3, w: 18, h: 11 },
      { shop: 'y_mn', x: 42, y: 3, w: 9, h: 11 },
      { shop: 'y_paynow', x: 52, y: 3, w: 9, h: 11 },
      { shop: 'y_traffic', x: 62, y: 3, w: 8, h: 11 },
      /* x:71~80 是有轨电车竖直轨道 + 站台 + 进站口的空地，不设建筑 */
      { shop: 'y_court', x: 82, y: 3, w: 12, h: 11 },
      { shop: 'y_arrival', x: 2, y: 57, w: 9, h: 6 },
      { shop: 'y_metrooffice', x: 12, y: 57, w: 9, h: 6 },
      { shop: 'y_dapaidang', x: 22, y: 57, w: 10, h: 6 },
      { shop: 'y_telecom', x: 33, y: 57, w: 9, h: 6 },
      { shop: 'y_airport', x: 43, y: 57, w: 10, h: 6 },
      { shop: 'y_sline', x: 54, y: 57, w: 9, h: 6 },
      { shop: 'y_hiring', x: 64, y: 57, w: 9, h: 6 },
      { shop: 'y_police', x: 76, y: 57, w: 8, h: 6 }
    ],
    /* 稿子中间那块不是大 LED，而是「长矩形公交途径站牌」+ 右下角一小块（班车/天气/路） */
    screens: [{ x: 14, y: 29, w: 32, h: 8, kind: 'yulong' }],
    points: [
      { id: 'yMetroIn', type: 'metro', tx: 8, ty: 47, label: '🚇 进入 迂龙路 地铁站 · 坐地铁' },
      { id: 'yUnderground', type: 'underground', tx: 8, ty: 14, label: '⬇ 地下小吃一条街 · 下沉入口' },
      { id: 'yBus', type: 'bus', tx: 17, ty: 33, label: '921 路 · 曙光路 ⇆ 景迂路' },
      { id: 'ySafe', type: 'sign', tx: 22, ty: 28, label: 'SAFE LINE · 安全线' },
      { id: 'yInfo', type: 'screenY', tx: 32, ty: 33, label: '站牌 · 921 路途径站 / 下一班车' },
      { id: 'ySchool', type: 'sign', tx: 24, ty: 41, label: '◀ 渊迂市渊迂中学 YUANYU HIGH SCHOOL' },
      { id: 'yYuanyuGate', type: 'yuanyu', tx: 17, ty: 43, label: '🏫 渊迂市渊迂中学 · 走进校门' },
      { id: 'ySlogan', type: 'sign', tx: 50, ty: 36, label: '地面标语 · 道路千万条，安全第一条' },
      { id: 'yPrice', type: 'sign', tx: 66, ty: 24, label: '票价 2元 · 晴 17°C SUNNY' },
      { id: 'yTramGate', type: 'tramGate', tx: 74, ty: 13, label: '🚋 有轨电车 进站口 · 房顶信息屏' },
      { id: 'yTramPlatform', type: 'tramPlatform', tx: 78, ty: 39, label: '🚉 有轨电车 站台 · 等车 / 上车' },
      { id: 'yTram', type: 'sign', tx: 72, ty: 44, label: '迂龙有轨电车 1号线 · 轨道与道口' },
      { id: 'yEntrance', type: 'sign', tx: 68, ty: 46, label: 'ENTRANCE ↑ 无限極人生 · 创造你的路' },
      { id: 'yCourtSign', type: 'sign', tx: 84, ty: 28, label: '渊迂市高级人民法院 · 为人民服务' },
      { id: 'yParkLar', type: 'sign', tx: 84, ty: 33, label: '停车场 PARK LAR' },
      { id: 'yUnderpass', type: 'underpass', tx: 4, ty: 17, label: '迂龙地下通道 · 过街到对面' },
      { id: 'yBack', type: 'sign', tx: 92, ty: 48, label: '→ 曙光路（坐地铁回去）' },
      { id: 'yJob', type: 'jobs', tx: 40, ty: 33, label: '💼 迂龙路零工 · 发传单 / 站台引导', ctx: 'yulong' },
      { id: 'yGigBoard', type: 'gigboard', tx: 40, ty: 46, label: '零工委托板 · 接单赚钱' },
      { id: 'yLedger', type: 'earn', tx: 62, ty: 46, label: '街区账本 · 赚钱总览' },
      { id: 'yRecycle', type: 'recycle', tx: 57, ty: 33, label: '回收箱 · 卖可回收物' },
      { id: 'yStall', type: 'stall', tx: 34, ty: 46, label: '空地 · 摆个摊' }
    ],
    pickupZones: [
      { x: 2, y: 28, w: 14, h: 3 }, { x: 53, y: 28, w: 16, h: 3 },
      { x: 20, y: 46, w: 22, h: 3 }, { x: 83, y: 46, w: 11, h: 3 },
      { x: 2, y: 21, w: 12, h: 5 }
    ],
    decos: [
      { kind: 'lane', tx: 0, ty: 20, w: 96, h: 1 }, { kind: 'lane', tx: 0, ty: 50, w: 96, h: 1 },
      { kind: 'zebra', tx: 40, ty: 20, w: 5, h: 6 }, { kind: 'zebra', tx: 40, ty: 50, w: 5, h: 6 },
      { kind: 'zebra', tx: 68, ty: 50, w: 4, h: 6 }, { kind: 'zebra', tx: 14, ty: 20, w: 3, h: 6 },
      { kind: 'tree', tx: 1, ty: 18, solid: 1 }, { kind: 'tree', tx: 20, ty: 18, solid: 1 },
      { kind: 'tree', tx: 41, ty: 18, solid: 1 }, { kind: 'tree', tx: 68, ty: 18, solid: 1 },
      { kind: 'tree', tx: 80, ty: 18, solid: 1 }, { kind: 'tree', tx: 94, ty: 18, solid: 1 },
      { kind: 'tree', tx: 1, ty: 48 }, { kind: 'tree', tx: 41, ty: 48 }, { kind: 'tree', tx: 68, ty: 48 },
      { kind: 'lamp', tx: 12, ty: 19 }, { kind: 'lamp', tx: 42, ty: 19 }, { kind: 'lamp', tx: 69, ty: 19 },
      { kind: 'lamp', tx: 85, ty: 19 }, { kind: 'lamp', tx: 12, ty: 49 }, { kind: 'lamp', tx: 42, ty: 49 },
      { kind: 'lamp', tx: 69, ty: 49 }, { kind: 'lamp', tx: 85, ty: 49 },
      { kind: 'bench', tx: 21, ty: 29 }, { kind: 'bench', tx: 58, ty: 29 }, { kind: 'bench', tx: 36, ty: 48 },
      { kind: 'car', tx: 27, ty: 23 }, { kind: 'car', tx: 58, ty: 24 }, { kind: 'car', tx: 64, ty: 35 },
      { kind: 'stairs', tx: 6, ty: 46 }, { kind: 'busStop', tx: 17, ty: 31 },
      { kind: 'board', tx: 13, ty: 30 }, { kind: 'board', tx: 13, ty: 36 }, { kind: 'board', tx: 13, ty: 42 },
      { kind: 'board', tx: 83, ty: 30 }, { kind: 'board', tx: 83, ty: 38 }, { kind: 'board', tx: 83, ty: 44 },
      { kind: 'signpost', tx: 24, ty: 40 }, { kind: 'signpost', tx: 50, ty: 35 }, { kind: 'signpost', tx: 69, ty: 46 }
    ],
    npcs: [
      { tx: 30, ty: 29, path: [[30, 29], [40, 29], [40, 34], [30, 34]], name: '赶车的上班族', color: '#e2564d' },
      { tx: 56, ty: 34, path: [[56, 34], [66, 34], [66, 42], [56, 42]], name: '大排档伙计', color: '#d99b1f' },
      { tx: 78, ty: 30, path: [[78, 30], [90, 30], [90, 36], [78, 36]], name: '法院门口的法警', color: '#3f6b8f' },
      { tx: 20, ty: 46, path: [[20, 46], [32, 46], [32, 48], [20, 48]], name: '等 921 路的人', color: '#4caf7d' },
      { tx: 86, ty: 46, path: [[86, 46], [93, 46], [93, 48], [86, 48]], name: '举着牌子的骑手', color: '#4fb8a8' }
    ]
  };

  Object.assign(PC.ADS, {
    Y1: { t: '迂龙路 17°C', en: 'YULONG ROAD / SUNNY', body: '下一班车 3min / 13min / 20min\n天气降温，记得保暖添衣。', tag: '站牌' },
    Y2: { t: '迂龙大排档', en: 'TODAY SPECIAL', body: '今日爆款：迂龙三黄鸡 32元/份\n客栈里边请。', tag: '大排档', coupon: 'y_dapaidang' },
    Y3: { t: 'We are hiring!', en: '公司招人！', body: '广告招租　We are hiring!\nSI线 谷园方向 / S2线 中华门方向。', tag: '招租' },
    Y4: { t: '渊迂市高级人民法院', en: 'Register / Judgement', body: '立案 Register　判决查询 Judgement\n为人民服务。', tag: '公告' },
    Y5: { t: 'ACMA 机场联络线', en: 'AIRPORT LINK', body: '轨交图：迂龙南路 / 迂龙路 / 龙川路 / 迂龙北\nT1 · T2 航站楼　列车进站。', tag: '轨交' },
    Y6: { t: '无限極人生', en: 'INFINITY LIVES', body: '创造你的路 ◆ 票价 2元 ◆ ENTRANCE ↑\n下一站 中华门 ZHONGHUA。', tag: '街区' }
  });
  PC.SCREEN_ADS_YULONG = ['Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'];
  PC.SCREEN_NAV_YULONG = [
    '↑ 迂龙路 地铁站 ENTRANCE', '→ 渊迂市渊迂中学 YUANYU HIGH SCHOOL',
    '→ 迂龙大排档 三黄鸡 32元', '→ 渊迂市高级人民法院',
    '→ 下一站 中华门 ZHONGHUA', '→ 曙光路（1号线换乘）'
  ];
  Object.assign(PC.BOARDS, {
    Y1: { t: '921 路 · 曙光路 ⇆ 景迂路', body: 'SAFE LINE　安全线\n曙光路 / 迂龙路 / 为疾路 / 景迂路 四站。' },
    Y2: { t: 'PAY NOW! 游趣', body: 'SALE! 600FF　MN 柳\nEMPIRE → 楼上 HONER WARDROBE。' },
    Y3: { t: '迂龙地铁商务', body: '地铁旺铺　请前往总部 或访问网站\nletsgomlq.code.blpg' },
    Y4: { t: '星降电信 1L', body: '办理手机号 / 更换电话卡 / 网络办理' },
    Y5: { t: 'ACMA 机场联络线', body: '轨交图：迂龙南路 · 迂龙路 · 龙川路 · 迂龙北\nT1 赶花北航站楼 / T2 航站楼。' },
    Y6: { t: 'S1 / S2 线', body: 'SI 线 谷园方向列车　S2 线 中华门方向\n< 广告招租 >　We are hiring! 公司招人！' }
  });
  Object.assign(PC.SIGNS, {
    ySafe: { t: 'SAFE LINE · 安全线', body: '921 路站台边上那条粗线。设计稿上 SAFE 和 LINE 分开写，中间空了一格。' },
    ySchool: { t: '◀ 渊迂市渊迂中学 YUANYU HIGH SCHOOL', body: '一支很大的空心箭头印在地上，指向左边，下面小字写着「市交巡体中心往南中」。\n箭头尽头就是渊迂中学的校门——不是曙光路右上角那所汾阳中学，是另一所。' },
    yYuanyuGate: { t: '渊迂市渊迂中学 · 校门', body: 'YUANYU HIGH SCHOOL\n顺着地上那支大空心箭头走过来，就是这扇门。' },
    yUnderground: { t: '⬇ 地下小吃一条街', body: '「迂龙地下通道」旁边那个圆圈里写着「地口」。\n一串斜线是往下去的楼梯，坡道尽头挂着一排小吃摊的雨棚。' },
    ySlogan: { t: '道路千万条，安全第一条', body: '「道路千万条，安全第一条。／行车不规范，亲人两行泪。」\n不是牌子，是直接漆在车道地面上的白字，被车轮磨掉了一点。' },
    yPrice: { t: '票价 2元 · 晴 17°C SUNNY', body: 'AB 1号线 / 2号线，票价 2 元。\n迂龙路今天 17 度，比曙光路暖 8 度。' },
    yTramGate: { t: '🚋 有轨电车 · 进站口', body: '尖顶小房子的房顶是块信息屏：LINE 1 / AIR L1、票价 2元、晴 17°C SUNNY、\n下一站 中华门 ZHONGHUA、ENTRANCE ↑ 无限極人生 · 创造你的路。' },
    yTramPlatform: { t: '🚉 有轨电车 · 站台', body: '两条钢轨竖着穿过街区，夹在游趣和法院中间。\n站台有雨棚、长椅和黄线，轨道尽头是 XXXXX 的道口护栏。' },
    yTram: { t: '迂龙有轨电车 1号线', body: 'YLoong AIR 1号线　下一站：中华门 ZHONGHUA\nENTRANCE ↑ 无限極人生 · 创造你的路。有轨，真的有轨。' },
    yEntrance: { t: 'ENTRANCE ↑', body: '无限極人生 / INFINITY LIVES　创造你的路。\n箭头朝上，指向地铁入口。' },
    yCourtSign: { t: '渊迂市高级人民法院', body: '立案 Register　判决查询 Judgement\n台阶上写着「为人民服务」，旁边是 PARK LAR 停车场。' },
    yParkLar: { t: '停车场 PARK LAR', body: '法院侧门旁的一块空地，画了几条歪歪的停车线。' },
    yBack: { t: '→ 曙光路', body: '顺着箭头能走回 1 号线换乘口。坐地铁两站就到曙光路站。' },
    yMetroIn: { t: '〈迂龙路 地铁站〉', body: 'M 标志在左下角，楼梯往下通向 1 号线站台。票价 2 元。' }
  });
  Object.assign(PC.NPC_LINES, {
    '赶车的上班族': ['「下一班车 3 分钟，屏上写了三行，我一行都不信。」', '「迂龙路比曙光路暖，风小。」'],
    '大排档伙计': ['「三黄鸡 32，今日爆款，卖完就没了。」', '「客栈里边请，塑料凳随便坐。」'],
    '法院门口的法警': ['「立案在左边窗口，判决查询在右边。」', '「为人民服务。」'],
    '等 921 路的人': ['「曙光路 ⇆ 景迂路，四站，我坐了六年。」', '「降温了，记得保暖添衣。」'],
    '举着牌子的骑手': ['「We are hiring！我举了一上午了。」', '「S2 线中华门方向，别坐反。」'],
    '摊主': ['「地口那串斜线就是楼梯，别跑，台阶滑。」', '「蒸笼刚上，等一分钟。」'],
    '端着碗的客人': ['「地下比地面上暖，风进不来。」', '「烤串九块，别讲价。」'],
    '渊迂中学值日生': ['「地上那支大箭头就是我们学校指路牌。」', '「汾阳中学在曙光路，别走错。」'],
    '渊迂中学的同学': ['「YUANYU HIGH SCHOOL，我们这所。」', '「市交巡体中心往南中——括号里就这么写的。」'],
    '等车的中学生': ['「屏蔽门开了再上，别挤。」', '「1 号线两站到迂龙路。」'],
    '看手机的乘客': ['「车厢里信号居然还行。」', '「下一站中华门，屏上滚了三遍了。」'],
    '小区保安': ['「3 栋 502？进门直走，第二排那栋。」', '「A/B/C 座在南边，看房先去售楼处。」'],
    '看房的情侣': ['「两居朝南，顶层复式能看见整条曙光路。」', '「别墅还带泳池和车库。」'],
    '修剪蔷薇的园丁': ['「B 座那圈蔷薇是我种的，别踩。」', '「健身区往西，水池在中间。」']
  });

  /* 地铁线路表：从任一街区进站都能选，票价 ¥2 */
  PC.METRO_LINES = [
    { id: 'l1', no: '1 号线', name: '1 号线 · 迂龙路方向', en: 'LINE 1 / AB', car: '#4fb8a8', mins: 6, note: '经 迂龙南路 → 迂龙路，下一站 中华门' },
    { id: 'l2', no: '2 号线', name: '2 号线 · 中华门方向', en: 'LINE 2', car: '#5b4fb3', mins: 8, note: '停站多一点，但座位多' },
    { id: 's1', no: 'S1 线', name: 'S1 线 · 谷园方向', en: 'LINE S1', car: '#d99b1f', mins: 5, note: '《谷园 晨楼东》接续，快车' },
    { id: 'tram', no: '有轨电车', name: '迂龙有轨电车 1 号线', en: 'YLoong AIR 1L', car: '#e2564d', mins: 11, note: '地面线，能看一路的街景，票价也是 2 元' }
  ];

  PC.WEATHERS = [
    { id: 'sunny', name: '晴', icon: '晴', temp: 9, tint: null },
    { id: 'cloudy', name: '多云', icon: '阴', temp: 11, tint: 'rgba(60,62,110,.13)' },
    { id: 'rain', name: '小雨', icon: '雨', temp: 7, tint: 'rgba(30,42,90,.26)' },
    { id: 'cold', name: '降温', icon: '冷', temp: 3, tint: 'rgba(120,150,200,.15)' },
    { id: 'dusk', name: '傍晚', icon: '暮', temp: 8, tint: 'rgba(120,50,90,.12)' }
  ];
})();
