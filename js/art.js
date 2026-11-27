/* art.js —— 纯代码像素画：图标 / 人物 / 建筑 / 广告牌 / 街景装饰 */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U, D = PC.Draw, P = PC.PAL;

  const PAL = {
    '.': null, k: '#1b1c3a', d: '#2a2a5e', w: '#f4f1e4', c: '#9a97bd', C: '#c9c6b4',
    s: '#f2c39a', h: '#3a2c3e', b: '#3b3b8f', B: '#5b4fb3', g: '#ffd25a', o: '#d99b1f',
    r: '#e2564d', G: '#4caf7d', t: '#4fb8a8', p: '#c05b86', m: '#8a5b3b', W: '#ffffff',
    a: '#4b8fb5', y: '#e8e36a', n: '#6f9e63'
  };

  const S = PC.SPRITES = {
    coffee: ['..kkkk..', '.kwwwwk.', '.kwwccwk', '.kwcccck', '.kwcccck', '.kwwccwk', '..kwwwwk', '..kkkk..'],
    phone: ['..kkkk..', '.kbbbbbk', '.kbWWWbk', '.kbwWwbk', '.kbwWwbk', '.kbWWWbk', '.kbbgbk.', '..kkkk..'],
    shirt: ['.kk..kk.', 'kBBk.kBBk', 'kBBBBBBBk', 'kBBwwwwBBk', '.kBBwwBBk.', '.kBBwwBBk.', '.kBBBBBBk.', '..kkkkkk..'],
    burger: ['..kkkk..', '.koooook', 'koooyyyook', 'kGGGGGGGGk', 'krrrrrrrrk', '.kooooook', '..kkkkkk..', '........'],
    dumbbell: ['kk.....kk', 'kck...kck', '.ckkkkkkc.', '.kwwwwwwk.', '.ckkkkkkc.', 'kck...kck', 'kk.....kk', '........'],
    bag: ['..kkkk..', '.kwwwwk.', 'kwwwwwwk', 'kwBBBBwk', 'kwBggBwk', 'kwBBBBwk', 'kwwwwwwk', '.kkkkkk.'],
    book: ['........', '.kkkkkk.', '.kbbbbk.', '.kbwwwbk', '.kbwwwbk', '.kbwwwbk', '.kbbbbk.', '.kkkkkk.'],
    plane: ['....g...', '...gg...', '..gggg..', '.ggggggg', 'gggggggg', '..gggg..', '..g..g..', '.k....k.'],
    house: ['...kk...', '..krrk..', '.krrrrk.', 'krrrrrrk', 'kwwkkwwk', 'kwwkkwwk', 'kwwwwwwk', 'kkkkkkkk'],
    key: ['..ggg...', '.g...g..', '.g...g..', '..ggg...', '...g....', '...gg...', '...g.g..', '........'],
    meat: ['..kkkk..', '.krrrrk.', 'krwrrwrk', 'krrrrrrk', '.krwrrk.', '..kwwk..', '..kwwk..', '........'],
    gamepad: ['.kkkkkk.', 'kBBBBBBk', 'kBwBwwBk', 'kBggBBgk', 'kBBwBBBk', '.kBBBBk.', '..k..k..', '........'],
    can: ['..kkkk..', '.krrrrk.', '.kwwwwk.', '.kggggk.', '.kwwwwk.', '.krrrrk.', '..kkkk..', '........'],
    metro: ['..kkkk..', '.kBBBBk.', 'kBBwwBBk', 'kBBBBBBk', 'kBggggBk', 'kBBBBBBk', '.kk..kk.', '........'],
    coin: ['..kkkk..', '.kggggk.', 'kgwwwwgk', 'kgwggwgk', 'kgwggwgk', 'kgwwwwgk', '.kggggk.', '..kkkk..'],
    heart: ['.kk.kk.', 'krrkrrk', 'krrrrrrk', 'krrrrrrk', '.krrrrk.', '..krrk..', '...kk...', '........'],
    star: ['...g...', '..ggg..', 'ggggggg', '.ggggg.', '..ggg..', '.gg.gg.', '.g...g.', '.......'],
    cat: ['.k....k.', 'kck..kck', 'kcckkcck', 'kcpwwpck', 'kcccccck', '.kcccck.', '..kkkk..', '........'],
    bus: ['kkkkkkkk', 'kbbbbbbk', 'kwwwwwwk', 'kbwwwwbk', 'kbbbbbbk', 'kggggggk', '.kk..kk.', '........'],
    umbrella: ['..ggggg..', '.gGGGGGg.', 'gGGGGGGGg', '..gkg....', '..gkg....', '..gkg....', '.gk......', '.........'],
    pen: ['.......g', '......gk', '.....gkk', '....gkdk', '...gkddk', '..gkddk.', '.gkkkk..', '........'],
    clock: ['..kkkk..', '.kwwwwk.', 'kwkwkwwk', 'kwwkwkwk', 'kwwwkwwk', 'kwkwkwwk', '.kwwwwk.', '..kkkk..'],
    warn: ['...k...', '..kgk..', '..kgk..', '.kggk..', '.kgkgk.', 'kgggggk', 'kkkkkkk', '.......'],
    flower: ['.r.r.r.', 'rgggrgr', '.gwgwg.', 'rgggrgr', '.r.r.r.', '..nnn..', '..nnn..', '.......'],
    tv: ['kkkkkkkk', 'kddddddk', 'kdaaaadk', 'kdaaaadk', 'kdaaaadk', 'kddddddk', 'kggggggk', 'kkkkkkkk'],
    bag2: ['.kkkkkk.', 'kwwwwwwk', 'kwBBBBwk', 'kwBggBwk', 'kwBBBBwk', 'kwwwwwwk', '.kkkkkk.', '........']
  };

  function sprite(ctx, key, x, y, sc, pal) {
    const rows = S[key]; if (!rows) return;
    sc = sc || 1;
    const w = Math.max.apply(null, rows.map(r => r.length));
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < w; i++) {
        const c = row[i]; if (!c || c === '.') continue;
        const col = (pal && pal[c]) || PAL[c]; if (!col) continue;
        D.rect(ctx, x + i * sc, y + j * sc, sc, sc, col);
      }
    }
  }

  /* 程序化像素小人：dir 0下 1上 2左 3右 */
  function person(ctx, x, y, dir, frame, colors, sc) {
    sc = sc || 1;
    const c = colors || {};
    const skin = c.skin || '#f2c39a', hair = c.hair || '#3a2c3e';
    const body = c.body || '#4caf7d', dark = '#1b1c3a', pants = c.pants || '#2a2a5e';
    const R = (dx, dy, w, h, col) => D.rect(ctx, x + dx * sc, y + dy * sc, w * sc, h * sc, col);
    // 影子
    D.rect(ctx, x + 2 * sc, y + 15 * sc, 8 * sc, 1 * sc, 'rgba(10,10,30,.30)');
    // 腿
    const step = frame ? 1 : 0;
    R(2 + step, 12, 3, 3, dark); R(7 - step, 12, 3, 3, dark);
    R(2 + step, 12, 2, 2, pants); R(7 - step, 12, 2, 2, pants);
    // 身体
    R(2, 7, 8, 5, dark); R(2, 7, 8, 4, body);
    R(3, 8, 2, 2, c.badge || '#ffd25a');
    // 手臂
    R(0, 8, 2, 3, dark); R(0, 8, 2, 2, body);
    R(10, 8, 2, 3, dark); R(10, 8, 2, 2, body);
    // 头
    R(2, 0, 8, 7, dark); R(3, 1, 6, 5, skin);
    // 头发
    R(2, 0, 8, 2, hair); R(2, 2, 1, 2, hair); R(9, 2, 1, 2, hair);
    if (dir === 0) { // 正面
      R(4, 3, 1, 1, dark); R(7, 3, 1, 1, dark); R(5, 5, 2, 1, '#b56a5a');
    } else if (dir === 2 || dir === 3) { // 侧面
      const ex = dir === 2 ? 4 : 6;
      R(ex, 3, 1, 1, dark); R(dir === 2 ? 3 : 8, 5, 1, 1, '#b56a5a');
      R(dir === 2 ? 2 : 9, 1, 1, 4, hair);
    } else { // 背面
      R(3, 1, 6, 5, hair);
    }
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = U.clamp(((n >> 16) & 255) + amt, 0, 255);
    const g = U.clamp(((n >> 8) & 255) + amt, 0, 255);
    const b = U.clamp((n & 255) + amt, 0, 255);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  /* 按可用宽度自动缩放字号，避免长店名溢出招牌 */
  function fitText(ctx, str, maxW, base, min) {
    let size = base || 10; min = min || 5;
    const fam = '"Courier New","WenQuanYi Micro Hei","Microsoft YaHei",monospace';
    ctx.font = 'bold ' + size + 'px ' + fam;
    while (ctx.measureText(str).width > maxW && size > min) {
      size--; ctx.font = 'bold ' + size + 'px ' + fam;
    }
    return size;
  }

  /* 建筑：俯视 + 正面招牌 */
  function building(ctx, b, shop, t) {
    const T = PC.CFG.TILE, x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    const base = shop.color, wall = shade(base, -30), roof = shade(base, -58), light = shade(base, 32);
    // 阴影
    D.rect(ctx, x + 4, y + 6, w, h, 'rgba(10,10,30,.22)');
    // 主体
    D.rect(ctx, x, y, w, h, '#1b1c3a');
    D.rect(ctx, x + 2, y + 2, w - 4, h - 4, wall);
    // 屋顶
    D.rect(ctx, x + 2, y + 2, w - 4, 10, roof);
    D.rect(ctx, x + 2, y + 2, w - 4, 2, light);
    for (let i = 6; i < w - 6; i += 8) D.rect(ctx, x + i, y + 6, 4, 2, shade(roof, 18));
    // 顶部小字
    D.text(ctx, shop.en.slice(0, 20), x + w / 2, y + 14, 6, '#d8d4b0', 'center');
    /* 专属门面：招牌形状 / 橱窗内容 / 雨棚 / 门口物件 / 门型，按业态与店号变化 */
    facade(ctx, b, shop, t, { x, y, w, h, base, wall, roof, light });
  }

  /* ================================================================
     店铺门面差异化
     同一条街上的每家店：招牌形状、窗里摆的东西、雨棚、门口杂物、
     霓虹颜色、门型都不同；同一业态的两家店也会因 id 哈希而错开配色。
     ================================================================ */
  const FACADES = {
    metro:       { sign: 'lightbox',   win: 'map',        awning: 'glass',  props: ['rail', 'bin', 'queue'],       neon: '#8fb8ff' },
    tech:        { sign: 'neon',       win: 'tech',       awning: 'glass',  props: ['ac', 'poster', 'phone'],     neon: '#7fe0c8' },
    telecom:     { sign: 'neon',       win: 'tech',       awning: 'glass',  props: ['ac', 'poster'],             neon: '#8fd8ff' },
    cafe:        { sign: 'board',      win: 'cafe',       awning: 'stripe', props: ['menu', 'flower', 'bike'],    neon: '#ffd25a' },
    clothes:     { sign: 'hanging',    win: 'mannequin',  awning: 'cloth',  props: ['rack', 'bag'],              neon: '#ff9ec4' },
    wardrobe:    { sign: 'hanging',    win: 'mannequin',  awning: 'cloth',  props: ['rack', 'bag'],              neon: '#ffd25a' },
    snack:       { sign: 'round',      win: 'food',       awning: 'stripe', props: ['crate', 'queue', 'steam'],   neon: '#ffb347' },
    snackstreet: { sign: 'lantern',    win: 'food',       awning: 'stripe', props: ['steam', 'crate', 'queue'],   neon: '#ffb347' },
    dapaidang:   { sign: 'lantern',    win: 'food',       awning: 'stripe', props: ['steam', 'crate', 'queue'],   neon: '#ff7a4f' },
    bbq:         { sign: 'lantern',    win: 'food',       awning: 'stripe', props: ['steam', 'crate', 'queue'],   neon: '#ff7a4f' },
    sport:       { sign: 'board',      win: 'glass',      awning: 'none',   props: ['ball', 'poster', 'ac'],      neon: '#7fe0c8' },
    gym:         { sign: 'neon',       win: 'gymwin',     awning: 'none',   props: ['ball', 'poster', 'ac'],      neon: '#7fe0c8' },
    mart:        { sign: 'lightbox',   win: 'fridge',     awning: 'wave',   props: ['umbrella', 'crate', 'bin'],  neon: '#a9c6ff' },
    book:        { sign: 'blackboard', win: 'books',      awning: 'cloth',  props: ['bookstand', 'cat', 'flower'], neon: '#ffe9a8' },
    study:       { sign: 'blackboard', win: 'books',      awning: 'stripe', props: ['bookstand', 'chalk', 'flower'], neon: '#ff9ec4' },
    school:      { sign: 'board',      win: 'classroom',  awning: 'none',   props: ['flag', 'bike'],             neon: '#fff3c4' },
    yuanyu:      { sign: 'board',      win: 'classroom',  awning: 'none',   props: ['flag', 'bike'],             neon: '#fff3c4' },
    travel:      { sign: 'hanging',    win: 'posters',    awning: 'wave',   props: ['suitcase', 'flower'],       neon: '#8fd8ff' },
    estate:      { sign: 'board',      win: 'floorplan',  awning: 'glass',  props: ['signpost', 'flower'],       neon: '#ffd25a' },
    rent:        { sign: 'board',      win: 'floorplan',  awning: 'none',   props: ['signpost', 'crate'],        neon: '#ffd25a' },
    lock:        { sign: 'round',      win: 'keys',       awning: 'none',   props: ['bin', 'poster'],            neon: '#ffe9a8' },
    bank:        { sign: 'board',      win: 'glass',      awning: 'glass',  props: ['atm', 'queue', 'ac'],       neon: '#ffd25a' },
    atm:         { sign: 'lightbox',   win: 'glass',      awning: 'none',   props: ['atm', 'queue'],             neon: '#8fb8ff' },
    arcade:      { sign: 'neon',       win: 'arcade',     awning: 'none',   props: ['neon', 'ticket', 'bin'],    neon: '#c3bfff' },
    game:        { sign: 'neon',       win: 'arcade',     awning: 'none',   props: ['neon', 'ticket'],           neon: '#ff9ec4' },
    netbar:      { sign: 'neon',       win: 'screens',    awning: 'glass',  props: ['ac', 'poster', 'neon'],     neon: '#7fe0c8' },
    court:       { sign: 'board',      win: 'columns',    awning: 'none',   props: ['flag', 'queue'],            neon: '#ffd25a' },
    police:      { sign: 'round',      win: 'glass',      awning: 'none',   props: ['bin', 'signpost'],          neon: '#8fb8ff' },
    tramGate:    { sign: 'lightbox',   win: 'map',        awning: 'glass',  props: ['rail', 'queue'],            neon: '#8fb8ff' },
    tramPlatform:{ sign: 'lightbox',   win: 'map',        awning: 'glass',  props: ['rail', 'queue'],            neon: '#8fb8ff' },
    ticket:      { sign: 'lightbox',   win: 'map',        awning: 'none',   props: ['queue', 'bin'],             neon: '#8fb8ff' },
    vending:     { sign: 'round',      win: 'fridge',     awning: 'none',   props: ['bin'],                     neon: '#a9c6ff' },
    sale:        { sign: 'hanging',    win: 'posters',    awning: 'cloth',  props: ['crate', 'rack'],            neon: '#ff9ec4' },
    underground: { sign: 'lantern',    win: 'food',       awning: 'stripe', props: ['steam', 'crate'],           neon: '#ffb347' },
    generic:     { sign: 'board',      win: 'glass',      awning: 'cloth',  props: ['bin', 'poster'],            neon: '#ffe9a8' }
  };

  function hashId(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }
  function signWords(shop) {
    return (shop.en || shop.name).replace(/[·・]/g, ' ').slice(0, 18);
  }

  /* 橱窗内容：每种业态窗里摆的东西都不一样 */
  function windowContent(ctx, kind, x, y, w, h, shop, t, seed) {
    const night = t.night, tm = t.time || 0;
    const glass = night ? '#2a3a6a' : '#9fc4dc';
    D.rect(ctx, x, y, w, h, '#1b1c3a');
    D.rect(ctx, x + 2, y + 2, w - 4, h - 4, glass);
    D.rect(ctx, x + 2, y + 2, w - 4, 3, night ? '#fff3c4' : '#d8edfa');
    const cols = ['#e2564d', '#ffd25a', '#4fb8a8', '#5b4fb3', '#7fe0c8', '#c05b86', '#d99b1f'];
    switch (kind) {
      case 'cafe': {
        // 咖啡杯 / 蛋糕 / 手写价目
        for (let i = 0; i < 3; i++) {
          const cx = x + 10 + i * (w - 20) / 3;
          D.rect(ctx, cx - 5, y + h - 16, 11, 10, '#f4f1e4');
          D.rect(ctx, cx - 3, y + h - 14, 7, 6, '#6b4a2f');
          D.rect(ctx, cx + 5, y + h - 13, 3, 4, '#f4f1e4');
          D.line(ctx, cx - 1, y + h - 19, cx - 3, y + h - 23, 'rgba(255,255,255,.7)', 1);
        }
        D.rect(ctx, x + 5, y + 5, 26, 12, '#3b2c22');
        D.text(ctx, 'MENU  7折', x + 7, y + 7, 5, '#ffe9a8', 'left', true);
        break;
      }
      case 'tech': {
        // 手机墙 + 15 PRO 灯箱
        for (let i = 0; i < 5; i++) {
          const px = x + 6 + i * (w - 12) / 5;
          D.rect(ctx, px, y + 8, 9, 16, '#1b1c3a');
          D.rect(ctx, px + 1, y + 9, 7, 14, i % 2 ? '#4fb8a8' : '#7fe0c8');
          D.rect(ctx, px + 2, y + 10, 5, 3, '#eaf6ff');
        }
        D.rect(ctx, x + w / 2 - 18, y + h - 13, 36, 9, '#1b1c3a');
        D.text(ctx, '15 PRO ↓30%', x + w / 2, y + h - 11, 5, '#ffd25a', 'center', true);
        break;
      }
      case 'fridge': {
        // 冷柜：格子 + 饮料瓶
        for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
          const px = x + 5 + i * (w - 10) / 6, py = y + 6 + r * (h - 12) / 2;
          D.rect(ctx, px, py, (w - 14) / 6, (h - 16) / 2, '#2a3a5a');
          D.rect(ctx, px + 2, py + 3, 3, 8, cols[(i + r + seed) % cols.length]);
        }
        D.rect(ctx, x + w / 2 - 1, y + 2, 2, h - 4, '#c9d8e6');
        break;
      }
      case 'mannequin': {
        // 无头模特 + 衣架
        for (let i = 0; i < 3; i++) {
          const cx = x + 12 + i * (w - 24) / 3;
          const c = cols[(i * 2 + seed) % cols.length];
          D.rect(ctx, cx - 2, y + 6, 4, 4, '#e6d4c4');
          ctx.fillStyle = c; ctx.beginPath();
          ctx.moveTo(cx - 5, y + 11); ctx.lineTo(cx + 5, y + 11);
          ctx.lineTo(cx + 8, y + h - 8); ctx.lineTo(cx - 8, y + h - 8); ctx.closePath(); ctx.fill();
          D.rect(ctx, cx - 1, y + 16, 2, 4, 'rgba(255,255,255,.5)');
        }
        break;
      }
      case 'books': {
        for (let i = 0; i < 11; i++) {
          const bx = x + 5 + i * (w - 10) / 11;
          const bh = 12 + ((i * 7 + seed) % 9);
          D.rect(ctx, bx, y + h - 6 - bh, (w - 14) / 11 - 1, bh, cols[(i + seed) % cols.length]);
        }
        D.text(ctx, 'PASS ALL EXAM', x + w / 2, y + 6, 5, '#ffe9a8', 'center', true);
        break;
      }
      case 'food': {
        // 蒸笼 + 烤串 + 热气
        for (let i = 0; i < 3; i++) {
          const cx = x + 10 + i * (w - 20) / 3;
          D.rect(ctx, cx - 7, y + h - 14, 15, 8, '#a9805a');
          D.rect(ctx, cx - 6, y + h - 18, 13, 5, '#d8c4a4');
          for (let k = 0; k < 3; k++) {
            const sy = y + 8 + Math.sin(tm * 2 + i + k) * 2;
            D.line(ctx, cx - 3 + k * 3, y + h - 20, cx - 5 + k * 3 + Math.sin(tm + k) * 2, sy, 'rgba(255,255,255,.55)', 1);
          }
        }
        break;
      }
      case 'arcade': {
        // 会闪的街机屏
        for (let i = 0; i < 3; i++) {
          const px = x + 6 + i * (w - 12) / 3;
          D.rect(ctx, px, y + 5, (w - 16) / 3, h - 10, '#2a2a5e');
          const on = Math.floor(tm * 3 + i) % 2;
          D.rect(ctx, px + 2, y + 7, (w - 16) / 3 - 4, h - 14, on ? cols[(i + seed) % cols.length] : '#3b3b8f');
          D.rect(ctx, px + 3, y + h - 9, (w - 16) / 3 - 6, 3, '#ffe9a8');
        }
        break;
      }
      case 'screens': {
        for (let i = 0; i < 4; i++) {
          const px = x + 5 + i * (w - 10) / 4;
          D.rect(ctx, px, y + 7, (w - 14) / 4, 14, '#1b1c3a');
          D.rect(ctx, px + 1, y + 8, (w - 14) / 4 - 2, 12, Math.floor(tm * 2 + i) % 3 ? '#4fb8a8' : '#7fe0c8');
        }
        D.text(ctx, '18 LIMITED  /  VIP 80%', x + w / 2, y + h - 9, 5, '#ff9e9e', 'center', true);
        break;
      }
      case 'map': {
        // 轨交图
        D.rect(ctx, x + 4, y + 5, w - 8, h - 10, '#eaf2f7');
        for (let i = 0; i < 3; i++) {
          D.line(ctx, x + 8, y + 10 + i * 9, x + w - 8, y + 10 + i * 9, ['#e2564d', '#4fb8a8', '#5b4fb3'][i], 2);
          for (let k = 0; k < 4; k++) D.circle(ctx, x + 12 + k * (w - 24) / 4, y + 10 + i * 9, 2, '#1b1c3a');
        }
        D.text(ctx, 'LINE 1 ⇄ 2', x + w / 2, y + h - 8, 5, '#3b3b8f', 'center', true);
        break;
      }
      case 'posters': {
        for (let i = 0; i < 3; i++) {
          const px = x + 5 + i * (w - 10) / 3;
          D.rect(ctx, px, y + 6, (w - 14) / 3, h - 12, '#f4f1e4');
          D.rect(ctx, px + 2, y + 8, (w - 14) / 3 - 4, 8, i % 2 ? '#8fd8ff' : '#ffd25a');
          D.rect(ctx, px + 2, y + 18, (w - 14) / 3 - 4, 3, '#4caf7d');
        }
        break;
      }
      case 'floorplan': {
        D.rect(ctx, x + 4, y + 5, w - 8, h - 10, '#f4f1e4');
        for (let i = 0; i < 3; i++) {
          D.frame(ctx, x + 7 + i * (w - 16) / 3, y + 8, (w - 18) / 3, h - 17, '#9a6b4f', 1);
          D.line(ctx, x + 7 + i * (w - 16) / 3, y + 16, x + 7 + (i + 1) * (w - 16) / 3, y + 16, '#9a6b4f', 1);
        }
        break;
      }
      case 'classroom': {
        for (let i = 0; i < 3; i++) D.rect(ctx, x + 8 + i * (w - 16) / 3, y + 8, (w - 20) / 3, h - 16, night ? '#ffd25a' : '#7fa6c9');
        break;
      }
      case 'columns': {
        for (let i = 0; i < 4; i++) {
          const px = x + 8 + i * (w - 16) / 4;
          D.rect(ctx, px, y + 4, 8, h - 8, '#ded7c2');
          D.rect(ctx, px - 2, y + 3, 12, 4, '#f4f1e4');
        }
        break;
      }
      case 'keys': {
        for (let i = 0; i < 6; i++) {
          const px = x + 8 + i * (w - 16) / 6, py = y + 10 + (i % 2) * 10;
          D.circle(ctx, px, py, 3, '#ffd25a');
          D.rect(ctx, px + 2, py + 2, 8, 2, '#ffd25a');
        }
        break;
      }
      case 'gymwin': {
        for (let i = 0; i < 3; i++) {
          const cx = x + 12 + i * (w - 24) / 3;
          D.rect(ctx, cx - 8, y + h / 2 - 2, 16, 4, '#8f92b5');
          D.circle(ctx, cx - 9, y + h / 2, 5, '#3b3b8f');
          D.circle(ctx, cx + 9, y + h / 2, 5, '#3b3b8f');
        }
        break;
      }
      default: {
        for (let i = 0; i < 3; i++) {
          const px = x + 7 + i * (w - 14) / 3;
          D.rect(ctx, px, y + 7, (w - 18) / 3, h - 14, night ? '#ffd25a' : '#7fa6c9');
          D.line(ctx, px + (w - 18) / 6, y + 7, px + (w - 18) / 6, y + h - 7, '#1b1c3a', 1);
        }
      }
    }
  }

  /* 门口杂物：伞架、外机、菜单立牌、蒸笼、自行车、花箱、旗、扭蛋… */
  function doorProps(ctx, list, x, y, w, h, shop, t, seed) {
    const tm = t.time || 0, front = y + h - 2;
    list.forEach((k, i) => {
      const px = x + 8 + ((i * 37 + seed * 7) % Math.max(20, w - 30));
      switch (k) {
        case 'menu':
          D.rect(ctx, px, front - 20, 13, 18, '#3b2c22');
          D.rect(ctx, px + 1, front - 19, 11, 16, '#f4f1e4');
          D.text(ctx, 'MENU', px + 6, front - 17, 5, '#5b4fb3', 'center', true);
          D.line(ctx, px + 2, front - 10, px + 11, front - 10, '#9a97bd', 1);
          D.line(ctx, px + 2, front - 7, px + 9, front - 7, '#9a97bd', 1);
          break;
        case 'flower':
        case 'flowerBox':
          D.rect(ctx, px, front - 8, 16, 8, '#a9805a');
          for (let j = 0; j < 4; j++) {
            const sway = Math.sin(tm * 1.6 + j + seed) * 1.2;
            D.rect(ctx, px + 2 + j * 4, front - 12, 2, 5, '#4caf7d');
            D.circle(ctx, px + 3 + j * 4 + sway, front - 14, 2.4, j % 2 ? '#e2564d' : '#ffd25a');
          }
          break;
        case 'bike':
          D.circle(ctx, px + 3, front - 6, 5, '#1b1c3a'); D.circle(ctx, px + 17, front - 6, 5, '#1b1c3a');
          D.line(ctx, px + 3, front - 6, px + 9, front - 13, '#8f92b5', 1.5);
          D.line(ctx, px + 9, front - 13, px + 17, front - 6, '#8f92b5', 1.5);
          D.line(ctx, px + 9, front - 13, px + 7, front - 18, '#8f92b5', 1.5);
          break;
        case 'crate':
          D.rect(ctx, px, front - 10, 14, 10, '#a9805a');
          D.frame(ctx, px, front - 10, 14, 10, '#6b4a2f', 1);
          D.line(ctx, px, front - 5, px + 14, front - 5, '#6b4a2f', 1);
          break;
        case 'bin':
          D.rect(ctx, px, front - 9, 9, 9, '#4caf7d'); D.rect(ctx, px - 1, front - 11, 11, 3, '#3b3b8f');
          break;
        case 'umbrella':
          D.rect(ctx, px + 4, front - 16, 2, 16, '#8f92b5');
          for (let j = 0; j < 3; j++) D.line(ctx, px + 5, front - 16, px + (j - 1) * 6 + 5, front - 10, ['#e2564d', '#5b4fb3', '#4fb8a8'][j], 2);
          break;
        case 'ac':
          D.rect(ctx, x + w - 18, y + h * .42, 12, 9, '#c9c6b4');
          for (let j = 0; j < 3; j++) D.line(ctx, x + w - 16, y + h * .42 + 2 + j * 2, x + w - 8, y + h * .42 + 2 + j * 2, '#8f92b5', 1);
          D.circle(ctx, x + w - 12, y + h * .42 + 5 + Math.sin(tm * 6) * .5, 3, 'rgba(140,150,170,.45)');
          break;
        case 'poster':
          D.rect(ctx, px, front - 26, 11, 15, '#f4f1e4');
          D.rect(ctx, px + 1, front - 25, 9, 6, colsFor(seed)[0]);
          D.text(ctx, 'SALE', px + 5, front - 16, 4, '#c2453f', 'center', true);
          break;
        case 'steam':
          for (let j = 0; j < 3; j++) D.line(ctx, px + j * 4, front - 10, px + j * 4 + Math.sin(tm * 2 + j) * 3, front - 20 - j * 2, 'rgba(255,255,255,.55)', 1);
          break;
        case 'queue':
          D.rect(ctx, px, front - 12, 2, 12, '#c9a86a'); D.rect(ctx, px + 16, front - 12, 2, 12, '#c9a86a');
          D.line(ctx, px + 2, front - 10, px + 16, front - 10, '#e2c07a', 1.5);
          break;
        case 'neon':
          D.rect(ctx, px, front - 30, 3, 26, Math.floor(tm * 2 + seed) % 2 ? '#ff9ec4' : '#c3bfff');
          D.circle(ctx, px + 1, front - 30, 3, Math.floor(tm * 3) % 2 ? '#ffd25a' : '#7fe0c8');
          break;
        case 'ticket':
          D.rect(ctx, px, front - 9, 13, 9, '#e2564d');
          D.text(ctx, '券', px + 6, front - 8, 6, '#fff3c4', 'center', true);
          break;
        case 'ball':
          D.circle(ctx, px + 6, front - 6, 6, '#d99b1f');
          D.line(ctx, px, front - 6, px + 12, front - 6, '#8a5b3b', 1);
          break;
        case 'cat':
          D.rect(ctx, px, front - 8, 10, 6, '#3b3b46');
          D.circle(ctx, px + 9, front - 10, 4, '#3b3b46');
          D.circle(ctx, px + 8, front - 11, 1, '#ffd25a');
          break;
        case 'chalk':
          D.rect(ctx, px, front - 7, 12, 3, '#f4f1e4');
          break;
        case 'flag':
          D.rect(ctx, px, front - 26, 2, 26, '#8f92b5');
          D.rect(ctx, px + 2, front - 26, 12, 8, Math.floor(tm * 1.4) % 2 ? '#e2564d' : '#c2453f');
          break;
        case 'suitcase':
          D.rect(ctx, px, front - 11, 12, 11, '#8a5b3b'); D.rect(ctx, px + 4, front - 14, 4, 4, '#6b4a2f');
          break;
        case 'signpost':
          D.rect(ctx, px, front - 20, 2, 20, '#8f92b5');
          D.rect(ctx, px - 5, front - 22, 16, 7, '#e6e0cc');
          D.text(ctx, '→', px + 3, front - 21, 6, P.ink, 'center', true);
          break;
        case 'rail':
          D.rect(ctx, px, front - 6, 18, 2, '#8f92b5');
          D.rect(ctx, px + 3, front - 10, 2, 6, '#8f92b5'); D.rect(ctx, px + 13, front - 10, 2, 6, '#8f92b5');
          break;
        case 'atm':
          D.rect(ctx, px, front - 22, 14, 22, '#3b3b8f');
          D.rect(ctx, px + 2, front - 20, 10, 8, '#8fb8cf');
          D.rect(ctx, px + 4, front - 9, 6, 3, '#ffd25a');
          break;
        case 'phone':
          D.rect(ctx, px, front - 16, 8, 16, '#1b1c3a');
          D.rect(ctx, px + 1, front - 15, 6, 12, '#7fe0c8');
          break;
        case 'rack':
          D.rect(ctx, px, front - 20, 2, 20, '#8f92b5'); D.rect(ctx, px + 16, front - 20, 2, 20, '#8f92b5');
          D.line(ctx, px, front - 20, px + 18, front - 20, '#8f92b5', 1.5);
          for (let j = 0; j < 3; j++) D.rect(ctx, px + 2 + j * 5, front - 18, 4, 10, colsFor(seed)[j % 4]);
          break;
        case 'bag':
          D.rect(ctx, px, front - 10, 9, 10, '#e2564d');
          D.line(ctx, px + 2, front - 10, px + 4, front - 14, '#c9a86a', 1);
          D.line(ctx, px + 7, front - 10, px + 5, front - 14, '#c9a86a', 1);
          break;
        case 'bookstand':
          D.rect(ctx, px, front - 12, 16, 3, '#6b4a2f');
          D.rect(ctx, px + 2, front - 20, 4, 8, '#e2564d'); D.rect(ctx, px + 7, front - 19, 4, 7, '#5b4fb3');
          break;
      }
    });
  }
  function colsFor(seed) {
    const all = ['#e2564d', '#4fb8a8', '#5b4fb3', '#ffd25a', '#c05b86', '#d99b1f', '#7fe0c8'];
    return [all[seed % all.length], all[(seed + 2) % all.length], all[(seed + 4) % all.length], all[(seed + 6) % all.length]];
  }

  /* ================================================================
     渊迂市汾阳中学 · 就这一整栋楼（照用户给的真实照片重做）
     连续红砖 / 两翼圆角 / 内侧弧形玻璃 / 竖排金字 / 贯通腰线与横窗
     + 中央连廊天桥 / 一整堵褐红弧形山墙 / 蓝底金边真校徽
     + 深绿电动推拉门 / 黑铁栅栏 / 石柱门墩 / 门前隔离柱 / 架空线
     街面与校园共用这一套立面，全游戏只有这一栋楼。
     ================================================================ */
  /* ================================================================
     渊迂市汾阳中学 · 真校徽（按用户给的校徽图重画）
     土金外环 / 深蓝环 / 上半弧「渊迂市汾阳中学」/ 下半弧英文校名
     / 酒红内圆 / 白色飞鸽 / 青绿心形（翻开的书页）
     不再是「白圆红芯」那面像旗子的东西。
     ================================================================ */
  function drawFenyangBadge(ctx, cx, cy, R, t) {
    if (!(R > 2)) return;
    const disc = (r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); };
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(R / 100, R / 100);
    disc(100, '#d9a441');                 // 土金色外环
    disc(94, '#1e3f8f');                  // 深蓝环
    ctx.fillStyle = '#fff3c4';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px "WenQuanYi Micro Hei","Microsoft YaHei",sans-serif';
    const cn = '渊迂市汾阳中学';
    for (let i = 0; i < cn.length; i++) {
      const a = -Math.PI * .84 + Math.PI * .68 * i / (cn.length - 1);
      ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.fillText(cn[i], 0, -77); ctx.restore();
    }
    ctx.font = 'bold 9px "Courier New",monospace';
    const en = 'YUANYU FENYANG HIGH SCHOOL';
    for (let i = 0; i < en.length; i++) {
      const a = Math.PI * .84 - Math.PI * .68 * i / (en.length - 1);
      ctx.save(); ctx.rotate(a - Math.PI / 2); ctx.fillText(en[i], 0, 79); ctx.restore();
    }
    disc(60, '#fff3c4');                  // 内圆白边
    disc(57, '#8c1f2f');                  // 酒红内圆
    // 青绿心形 / 翻开的书页
    ctx.beginPath();
    ctx.moveTo(0, 52);
    ctx.bezierCurveTo(-16, 30, -54, 14, -54, -8);
    ctx.bezierCurveTo(-54, -34, -20, -36, 0, -14);
    ctx.bezierCurveTo(20, -36, 54, -34, 54, -8);
    ctx.bezierCurveTo(54, 14, 16, 30, 0, 52);
    ctx.closePath();
    ctx.fillStyle = '#12726b'; ctx.fill();
    ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 2.5; ctx.stroke();
    // 白色飞鸽（朝右上，尾羽落在心形凹口上）
    ctx.beginPath();
    ctx.moveTo(-34, -34);
    ctx.quadraticCurveTo(-14, -56, 20, -50);
    ctx.lineTo(6, -42);
    ctx.quadraticCurveTo(24, -42, 38, -50);
    ctx.lineTo(50, -46);
    ctx.lineTo(38, -38);
    ctx.quadraticCurveTo(22, -26, 8, -12);
    ctx.lineTo(-16, -8);
    ctx.quadraticCurveTo(-26, -20, -34, -34);
    ctx.closePath();
    ctx.fillStyle = '#fff3c4'; ctx.fill();
    ctx.strokeStyle = 'rgba(140,31,47,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-12, -28); ctx.quadraticCurveTo(4, -34, 18, -44); ctx.stroke();
    ctx.restore();
  }

  /* ================================================================
     渊迂市汾阳中学 · 就这一整栋楼
     照片里不是「两座塔 + 中间空着」：左右两翼、中央连廊、底层山墙
     全是同一栋连续的红砖楼，屋顶与腰线横贯到底，中间没有天空缝。
        · 上部：一整片红砖，逐层横窗 + 贯通全楼的米色腰线
        · 两翼外侧削圆角，靠中庭的内侧各一列弧形玻璃窗
        · 左翼竖排「汾阳中学」，右翼「激发潜能」
        · 中央连接体略低，顶上一道玻璃天桥与栏杆
        · 底层：一整堵褐红弧形山墙横跨全宽，挂着深蓝金边真校徽
                （drawFenyangBadge 按用户特意要求，一字未动）
                山墙下深绿电动门 / 黑铁栅栏 / 石柱门墩 / 隔离柱
     ================================================================ */
  function schoolFacade(ctx, b, shop, t, G) {
    const { x, y, w, h } = G;
    const brick = '#7d4a43', mortar = 'rgba(58,30,26,.40)', cream = '#e9e0cc';
    const gold = '#ffd25a', glass = '#8fb8cf', glassD = '#3f6b8f';
    const night = !!t.night;
    const gateH = Math.min(h * .42, 64);
    const bodyH = h - gateH, gy = y + bodyH;
    const wing = Math.max(24, Math.round(w * .28));
    const midX = x + wing, midW = Math.max(20, w - wing * 2);

    D.rect(ctx, x + 4, y + 5, w, h, 'rgba(10,10,30,.22)');
    D.rect(ctx, x, y, w, h, night ? '#20243c' : '#39465e');

    /* --- 一整片连续的红砖楼体：左右两翼与中间连廊连在一起 --- */
    D.rect(ctx, x, y + 8, w, bodyH - 8, brick);
    for (let yy = y + 12; yy < gy; yy += 6) D.line(ctx, x, yy, x + w, yy, mortar, 1);
    D.rect(ctx, x, y + 6, w, 2, cream);                  // 贯通全楼的檐线
    // 只削最左、最右两个外角，中间绝不挖空
    const R = Math.min(14, wing * .3);
    for (let i = 0; i < 6; i++) {
      const inset = Math.round(R * (1 - Math.sin((i + 1) / 7 * Math.PI / 2)));
      D.rect(ctx, x + inset, y + i, wing - inset, 2, brick);
      D.rect(ctx, x + w - wing, y + i, wing - inset, 2, brick);
    }

    /* --- 中央连接体略低：露台暗带 + 玻璃天桥 + 栏杆 --- */
    D.rect(ctx, midX, y + 8, midW, 9, '#6b3f3a');
    D.rect(ctx, midX + 2, y + 10, midW - 4, 5, glassD);
    D.rect(ctx, midX + 3, y + 11, midW - 6, 2, night ? '#ffd25a' : glass);
    D.line(ctx, midX, y + 2, midX + midW, y + 2, '#8f92b5', 1.5);
    for (let i = 0; i <= midW; i += 10) D.rect(ctx, midX + i, y + 1, 1.5, 7, '#8f92b5');
    D.rect(ctx, midX, y + 16, midW, 2, cream);

    /* --- 贯通全楼的腰线（4 道，两翼与连廊同层高） --- */
    const floorH = (bodyH - 20) / 4;
    for (let k = 1; k <= 4; k++) {
      const ly = y + 16 + floorH * k;
      D.rect(ctx, x, ly, w, 2, cream);
      D.rect(ctx, x, ly + 2, w, 1, 'rgba(90,50,44,.55)');
    }
    /* --- 逐层横窗：一排窗从最左贯到最右 --- */
    for (let k = 0; k < 4; k++) {
      const wy = y + 19 + floorH * k, wh = Math.max(5, floorH - 7);
      for (let wx = x + 7; wx < x + w - 12; wx += 22) {
        const ww = Math.min(14, x + w - 8 - wx);
        D.rect(ctx, wx, wy, ww, wh, glassD);
        D.rect(ctx, wx + 1, wy + 1, ww - 2, wh - 2, night ? '#ffd25a' : glass);
        D.line(ctx, wx + ww / 2, wy, wx + ww / 2, wy + wh, '#2a2a5e', 1);
      }
    }

    /* --- 两翼靠中庭的内侧：一列圆角弧形玻璃窗（照片特征） --- */
    [x + wing - 13, x + w - wing + 1].forEach((gx2, side) => {
      for (let k = 0; k < 4; k++) {
        const wy = y + 19 + floorH * k, wh = Math.max(5, floorH - 7);
        const round = k === 0 ? 4 : 0;
        D.rect(ctx, gx2 + round, wy, 12 - round * 2, wh, glassD);
        D.rect(ctx, gx2 + round + 1, wy + 1, 10 - round * 2, wh - 2, night ? '#ffd25a' : glass);
        D.line(ctx, gx2 + (side ? 2 : 10), wy, gx2 + (side ? 2 : 10), wy + wh, '#c9c6b4', 1);
      }
    });

    /* --- 两翼竖排金字（写在稍深的砖柱上，避开腰线） --- */
    const fs = Math.max(6, Math.min(11, Math.floor(floorH * .72)));
    const step = Math.max(9, Math.min(18, floorH * 1.1));
    [['汾', '阳', '中', '学', x + 5], ['激', '发', '潜', '能', x + w - 19]].forEach(q => {
      const px = q[4];
      D.rect(ctx, px, y + 11, 14, bodyH - 15, '#6b3f3a');
      for (let yy = y + 14; yy < gy - 4; yy += 6) D.line(ctx, px, yy, px + 14, yy, mortar, 1);
      for (let i = 0; i < 4; i++) D.text(ctx, q[i], px + 7, y + 15 + i * step, fs, gold, 'center', true);
    });
    // 空调外机
    [x + wing - 14, x + w - wing + 2].forEach(ax => {
      D.rect(ctx, ax, gy - 12, 10, 6, '#c9c6b4');
      for (let j = 0; j < 3; j++) D.line(ctx, ax + 2, gy - 10 + j * 2, ax + 8, gy - 10 + j * 2, '#8f92b5', 1);
    });

    /* --- 底层：整片红砖围墙，把两翼在地面层也连成一栋 --- */
    D.rect(ctx, x, gy, w, y + h - gy, brick);
    for (let yy = gy + 3; yy < y + h; yy += 6) D.line(ctx, x, yy, x + w, yy, mortar, 1);
    D.rect(ctx, x, gy, w, 2, cream);

    /* --- 一整堵褐红弧形山墙，横跨接近全宽 --- */
    const pedW = w * .88, pedX = x + (w - pedW) / 2, pedH = gateH * .56;
    ctx.fillStyle = '#6b3f3a';
    ctx.beginPath();
    ctx.moveTo(pedX, gy + 6);
    ctx.quadraticCurveTo(x + w / 2, gy - 14, pedX + pedW, gy + 6);
    ctx.lineTo(pedX + pedW, gy + pedH);
    ctx.lineTo(pedX, gy + pedH);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(244,241,228,.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pedX, gy + 6);
    ctx.quadraticCurveTo(x + w / 2, gy - 14, pedX + pedW, gy + 6); ctx.stroke();
    D.rect(ctx, pedX, gy + pedH - 3, pedW, 3, '#e9d9b8');
    // 墙上几道浅色横条（照片里山墙左侧那种白色短线）
    for (let i = 0; i < 3; i++) D.rect(ctx, pedX + 10, gy + 12 + i * 7, 14 - i * 3, 2, 'rgba(233,224,204,.5)');

    /* --- 深蓝金边真校徽：按用户特意要求，保持上一版不变 --- */
    const ccx = x + w / 2, ccy = gy + pedH * .40;
    const cr = Math.max(11, Math.min(18, pedH * .46));
    drawFenyangBadge(ctx, ccx, ccy, cr, t);
    D.text(ctx, 'YUANYU · FENYANG', ccx, gy + pedH - 9, 5, '#e9d9b8', 'center');

    /* --- 深绿电动推拉门 --- */
    const doorTop = gy + pedH, doorW = w * .38, doorX = x + w / 2 - doorW / 2;
    D.rect(ctx, doorX - 3, doorTop - 2, doorW + 6, y + h - doorTop + 2, '#12291f');
    D.rect(ctx, doorX, doorTop, doorW, y + h - doorTop, '#1c4a36');
    for (let yy = doorTop + 3; yy < y + h; yy += 5) D.line(ctx, doorX, yy, doorX + doorW, yy, 'rgba(127,224,170,.28)', 1);
    for (let i = 0; i < doorW; i += 14) D.line(ctx, doorX + i, doorTop, doorX + i, y + h, 'rgba(10,30,20,.55)', 1);
    D.rect(ctx, doorX + doorW / 2 - 1, doorTop, 2, y + h - doorTop, '#0c2419');
    D.circle(ctx, doorX + doorW / 2 - 5, y + h - 8, 1.5, gold);

    /* --- 两侧黑铁栅栏 + 米色石柱门墩 --- */
    [0, 1].forEach(side => {
      const fw = (w - doorW) / 2 - 6;
      const fx = side ? x + w / 2 + doorW / 2 + 3 : x + 3;
      const fTop = doorTop - 6;
      D.rect(ctx, fx, fTop, fw, 3, '#16161f');
      D.rect(ctx, fx, y + h - 7, fw, 2, '#16161f');
      for (let i = 2; i < fw; i += 6) {
        D.rect(ctx, fx + i, fTop, 2, y + h - fTop - 5, '#16161f');
        D.circle(ctx, fx + i + 1, fTop - 2, 1.6, '#16161f');
      }
      const px = side ? doorX + doorW + 1 : doorX - 11;
      D.rect(ctx, px, doorTop - 12, 10, y + h - doorTop + 12, '#c9c6b4');
      D.rect(ctx, px - 2, doorTop - 14, 14, 5, cream);
      D.rect(ctx, px + 2, doorTop - 8, 6, 8, 'rgba(90,80,70,.22)');
    });

    /* --- 左侧深褐竖匾「中学」金字 --- */
    const pw = Math.max(14, w * .075), plaqueX = x + 4, plaqueY = gy + 4;
    const ph = Math.min(34, gateH * .7);
    D.rect(ctx, plaqueX, plaqueY, pw, ph, '#3b2a2a');
    D.rect(ctx, plaqueX + 1, plaqueY + 1, pw - 2, ph - 2, '#2a1f22');
    ['中', '学'].forEach((c, i) => D.text(ctx, c, plaqueX + pw / 2, plaqueY + 3 + i * 13, 8, gold, 'center', true));

    /* --- 门前黑色隔离柱 --- */
    const bh = Math.min(9, gateH * .2);
    for (let i = 0; i < 5; i++) {
      const bx = x + w * (.16 + i * .17);
      D.rect(ctx, bx, y + h - bh, 4, bh, '#16161f');
      D.circle(ctx, bx + 2, y + h - bh - 1, 2, gold);
      D.rect(ctx, bx - 2, y + h - 2, 8, 2, '#2a2a3a');
    }

    /* --- 横过楼顶的架空电线与电线杆 --- */
    for (let k = 0; k < 3; k++) D.line(ctx, x - 8, y - 6 + k * 5, x + w + 8, y - 4 + k * 5, 'rgba(30,32,50,.75)', 1);
    D.rect(ctx, x + w - 9, y - 12, 2, 16, '#6b6f8c');
    D.rect(ctx, x + w - 15, y - 11, 12, 2, '#6b6f8c');
  }

  function facade(ctx, b, shop, t, G) {
    const { x, y, w, h, base, wall, roof, light } = G;
    if (shop.type === 'school') { schoolFacade(ctx, b, shop, t, G); return; }
    const F = FACADES[shop.type] || FACADES.generic;
    const seed = hashId(shop.id || shop.name);
    const C = colsFor(seed);
    const tm = t.time || 0, night = t.night;
    const sy = y + h - 44;                 // 招牌区上沿
    const wy = y + 20, wh = Math.max(18, sy - wy - 6);   // 窗区

    /* ---- 1. 窗区 ---- */
    if (shop.twoFloor) {
      // 霍尔德比：两格连铺、两层楼，2F 整排礼服橱窗
      const mid = y + Math.floor(h * .49);
      D.rect(ctx, x + 2, mid - 3, w - 4, 5, roof);
      D.rect(ctx, x + 2, mid + 2, w - 4, 2, light);
      D.rect(ctx, x + 3, y + 16, w - 6, 12, '#1b1c3a');
      D.text(ctx, '2F   HONER WARDROBE   /   UPSTAIRS HONOR!', x + w / 2, y + 18, 6, '#ffe9a8', 'center', true);
      const cw = Math.min(24, (w - 26) / 6), gowns = C.concat(['#5b4fb3', '#4fb8a8']);
      for (let i = 0; i < 6; i++) {
        const wx = x + 12 + i * (cw + 3), wy2 = y + 30;
        if (wx + cw > x + w - 10) break;
        D.rect(ctx, wx, wy2, cw, 34, '#1b1c3a');
        D.rect(ctx, wx + 1, wy2 + 1, cw - 2, 32, night ? '#3a3458' : '#b9c9d6');
        const cx = wx + cw / 2;
        D.rect(ctx, cx - 3, wy2 + 6, 6, 4, gowns[i % gowns.length]);
        ctx.fillStyle = gowns[i % gowns.length]; ctx.beginPath();
        ctx.moveTo(cx - 3, wy2 + 10); ctx.lineTo(cx + 3, wy2 + 10);
        ctx.lineTo(cx + 7, wy2 + 30); ctx.lineTo(cx - 7, wy2 + 30); ctx.closePath(); ctx.fill();
      }
      const ay = mid + 12, ax = x + 18;
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(ax + 18, ay); ctx.lineTo(ax + 2, ay + 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax + 2, ay + 14); ctx.lineTo(ax + 9, ay + 13); ctx.moveTo(ax + 2, ay + 14); ctx.lineTo(ax + 6, ay + 7); ctx.stroke();
      D.text(ctx, 'UPSTAIRS', ax + 24, ay + 2, 8, '#fff3c4', 'left', true);
      D.text(ctx, 'HONOR !  2F →', ax + 24, ay + 13, 7, '#ffd25a');
      for (let i = 0; i < 5; i++) D.rect(ctx, x + w - 62 + i * 9, mid + 30 - i * 5, 9, 3, '#8f92b5');
    } else {
      windowContent(ctx, F.win, x + 4, wy, w - 8, wh, shop, t, seed);
      // 窗框分格（玻璃类才画）
      if (['glass', 'classroom', 'columns', 'gymwin'].indexOf(F.win) >= 0) {
        for (let i = 1; i < 3; i++) D.rect(ctx, x + 4 + (w - 8) * i / 3 - 1, wy + 2, 2, wh - 4, '#1b1c3a');
      }
    }

    /* ---- 2. 雨棚 ---- */
    const awY = sy - 12, awH = 11;
    if (F.awning === 'stripe') {
      D.rect(ctx, x + 1, awY, w - 2, 5, shade(base, -18));
      for (let i = 0; i < w; i += 12) {
        D.rect(ctx, x + 1 + i, awY + 4, 6, awH - 4, i % 24 ? '#f4f1e4' : C[0]);
      }
      D.rect(ctx, x + 1, awY + awH - 1, w - 2, 2, shade(base, -35));
    } else if (F.awning === 'wave') {
      D.rect(ctx, x + 1, awY, w - 2, 5, shade(base, -18));
      for (let i = 0; i < w; i += 10) {
        ctx.fillStyle = i % 20 ? '#f4f1e4' : C[1];
        ctx.beginPath(); ctx.arc(x + 1 + i + 5, awY + 5, 5, 0, Math.PI); ctx.fill();
      }
    } else if (F.awning === 'cloth') {
      ctx.fillStyle = shade(base, -12); ctx.beginPath();
      ctx.moveTo(x + 1, awY); ctx.lineTo(x + w - 1, awY);
      ctx.lineTo(x + w - 1, awY + 7); ctx.lineTo(x + 1, awY + 7); ctx.closePath(); ctx.fill();
      D.rect(ctx, x + 1, awY, w - 2, 2, light);
    } else if (F.awning === 'glass') {
      D.rect(ctx, x + 1, awY, w - 2, 6, '#7fa6c9');
      D.rect(ctx, x + 1, awY, w - 2, 2, '#d8edfa');
      for (let i = 0; i < w; i += 16) D.line(ctx, x + i, awY, x + i, awY + 6, 'rgba(27,28,58,.5)', 1);
    }

    /* ---- 3. 招牌（形状按业态） ---- */
    const sign = F.sign, blink = Math.floor(tm * 2 + seed) % 2;
    const nameY = sy + 6;
    if (sign === 'neon') {
      D.rect(ctx, x + 3, sy + 1, w - 6, 30, '#14152e');
      D.frame(ctx, x + 3, sy + 1, w - 6, 30, blink ? F.neon : shade(F.neon, -60), 2);
      D.shadowText(ctx, shop.name, x + w / 2, nameY, fitText(ctx, shop.name, w - 16, 11, 6), blink ? F.neon : shade(F.neon, -40), 'center');
      D.text(ctx, signWords(shop), x + w / 2, sy + 19, 6, blink ? '#fff3c4' : '#8b87c0', 'center', true);
      for (let i = 0; i < 5; i++) D.circle(ctx, x + 8 + i * (w - 16) / 5, sy + 27, 1.5, blink ? F.neon : '#3b3b8f');
    } else if (sign === 'hanging') {
      // 竖挂灯箱 + 横匾
      D.rect(ctx, x + 4, sy - 4, w - 8, 32, '#1b1c3a');
      D.rect(ctx, x + 6, sy - 2, w - 12, 28, shade(base, -12));
      D.rect(ctx, x + 6, sy - 2, w - 12, 2, light);
      D.shadowText(ctx, shop.name, x + w / 2, nameY, fitText(ctx, shop.name, w - 26, 10, 6), '#fff', 'center');
      D.text(ctx, shop.sign.slice(0, 22), x + w / 2, sy + 19, 6, '#ffe9a8', 'center');
      D.rect(ctx, x + w - 16, sy - 16, 12, 20, '#1b1c3a');
      D.rect(ctx, x + w - 15, sy - 15, 10, 18, base);
      D.text(ctx, (shop.en || '').slice(0, 3), x + w - 10, sy - 12, 5, '#fff3c4', 'center', true);
      D.rect(ctx, x + w - 11, sy - 20, 2, 5, '#8f92b5');
    } else if (sign === 'round') {
      D.rect(ctx, x + 4, sy, w - 8, 30, '#1b1c3a');
      D.rect(ctx, x + 6, sy + 2, w - 12, 26, shade(base, -6));
      D.circle(ctx, x + 18, sy + 15, 11, night && blink ? F.neon : '#f4f1e4');
      D.circle(ctx, x + 18, sy + 15, 8, base);
      sprite(ctx, shop.icon || 'bag', x + 13, sy + 10, 1.1);
      D.shadowText(ctx, shop.name, x + 34, nameY, fitText(ctx, shop.name, w - 44, 10, 6), '#fff');
      D.text(ctx, shop.sign.slice(0, 20), x + 34, sy + 19, 6, '#ffe9a8', 'left');
    } else if (sign === 'lantern') {
      D.rect(ctx, x + 4, sy, w - 8, 30, '#2a1c1c');
      D.rect(ctx, x + 6, sy + 2, w - 12, 26, shade(base, -18));
      for (let i = 0; i < 3; i++) {
        const lx = x + 12 + i * (w - 24) / 3;
        const glow = night || blink;
        D.rect(ctx, lx, sy - 8, 10, 12, glow ? '#e2564d' : '#8a3b36');
        D.rect(ctx, lx + 2, sy - 6, 6, 8, glow ? '#ffd25a' : '#a95a44');
        D.rect(ctx, lx + 4, sy - 11, 2, 4, '#3b2c22');
      }
      D.shadowText(ctx, shop.name, x + w / 2, nameY, fitText(ctx, shop.name, w - 16, 10, 6), '#fff3c4', 'center');
      D.text(ctx, shop.sign.slice(0, 20), x + w / 2, sy + 19, 6, '#ffe9a8', 'center');
    } else if (sign === 'blackboard') {
      D.rect(ctx, x + 4, sy - 2, w - 8, 32, '#6b4a2f');
      D.rect(ctx, x + 7, sy + 1, w - 14, 26, '#2a3a34');
      D.shadowText(ctx, shop.name, x + w / 2, nameY, fitText(ctx, shop.name, w - 20, 10, 6), '#f4f1e4', 'center');
      D.text(ctx, shop.sign.slice(0, 22), x + w / 2, sy + 19, 6, '#ffd25a', 'center', true);
      for (let i = 0; i < 4; i++) D.rect(ctx, x + 10 + i * (w - 20) / 4, sy + 24, 8, 1, 'rgba(244,241,228,.35)');
    } else if (sign === 'lightbox') {
      D.rect(ctx, x + 3, sy, w - 6, 31, '#1b1c3a');
      D.rect(ctx, x + 5, sy + 2, w - 10, 27, night || blink ? '#d8e6f0' : '#f4f1e4');
      D.rect(ctx, x + 5, sy + 2, w - 10, 3, F.neon);
      D.shadowText(ctx, shop.name, x + w / 2, nameY, fitText(ctx, shop.name, w - 18, 10, 6), '#1b1c3a', 'center');
      D.text(ctx, signWords(shop), x + w / 2, sy + 19, 6, '#3b3b8f', 'center', true);
    } else { /* board */
      D.rect(ctx, x + 2, sy, w - 4, 30, '#1b1c3a');
      D.rect(ctx, x + 4, sy + 2, w - 8, 26, base);
      D.rect(ctx, x + 4, sy + 2, w - 8, 2, light);
      sprite(ctx, shop.icon || 'bag', x + 7, sy + 9, 1.4);
      D.shadowText(ctx, shop.name, x + 24, nameY, fitText(ctx, shop.name, w - 32, 10, 6), '#fff');
      D.text(ctx, shop.sign.slice(0, 22), x + 24, sy + 19, 6, '#ffe9a8', 'left');
    }
    // 渊迂中学保留一面小校旗，汾阳中学走上面那一整栋楼的立面
    if (shop.type === 'yuanyu') {
      D.rect(ctx, x + w - 8, y - 18, 2, 22, '#8f92b5');
      D.rect(ctx, x + w - 6, y - 18, 9, 6, '#e2564d');
    }

    /* ---- 4. 门口杂物 ---- */
    doorProps(ctx, F.props, x, y, w, h, shop, t, seed);

    /* ---- 5. 门（形状按业态 + 朝向后略变） ---- */
    const doorSide = shop.door || 'bottom';
    const doorCol = F.sign === 'neon' ? '#2a2a5e' : '#6b5a3a';
    const drawDoor = (dx, dy, dw, dh) => {
      D.rect(ctx, dx - 2, dy - 2, dw + 4, dh + 4, '#1b1c3a');
      D.rect(ctx, dx, dy, dw, dh, doorCol);
      D.rect(ctx, dx + 2, dy + 2, dw - 4, dh - 4, night ? '#ffd25a' : '#8fb8cf');
      D.rect(ctx, dx + dw / 2 - 1, dy + 2, 2, dh - 4, '#3b2c22');
      D.circle(ctx, dx + dw - 4, dy + dh / 2, 1.2, P.gold);
      D.rect(ctx, dx - 3, dy - 4, dw + 6, 3, light);
      // 门垫
      D.rect(ctx, dx - 2, dy + dh + 2, dw + 4, 3, shade(base, -40));
    };
    if (doorSide === 'left') drawDoor(x - 2, y + h - 44, 7, 26);
    else if (doorSide === 'right') drawDoor(x + w - 5, y + h - 44, 7, 26);
    else drawDoor(x + w / 2 - 9, y + h - 16, 18, 14);

    /* ---- 6. 门牌 / 营业灯 / 霓虹边框 ---- */
    D.rect(ctx, x + w - 20, sy - 14, 17, 10, '#1b1c3a');
    D.text(ctx, '#' + (b.x + 1), x + w - 12, sy - 12, 6, '#ffe9a8', 'center', true);
    D.circle(ctx, x + 8, sy - 10, 2.5, night && blink ? F.neon : shade(F.neon, -40));
    if (night && F.sign === 'neon') {
      D.frame(ctx, x + 1, y + 1, w - 2, h - 2, blink ? F.neon : shade(F.neon, -50), 1);
    }
  }

  /* 中央大广告牌（还原设计稿的格纸分区） */
  function billboard(ctx, b, ads, t) {
    const T = PC.CFG.TILE, x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    D.rect(ctx, x + 5, y + 5, w, h, 'rgba(10,10,30,.25)');
    D.rect(ctx, x, y, w, h, P.ink);
    D.rect(ctx, x + 2, y + 2, w - 4, h - 4, '#eeebdd');
    // 顶部欢迎条
    D.rect(ctx, x + 4, y + 4, w - 8, 22, '#dedaf0');
    D.text(ctx, b.side === 'L' ? '欢迎来到 曙光路' : '☀ 9°C SUNNY', x + 8, y + 7, 10, P.blue, 'left', true);
    D.text(ctx, b.side === 'L' ? 'INFINITY LIVES' : '曙光路 · 中心街 / 5G', x + w - 8, y + 10, 7, P.violet, 'right');
    D.line(ctx, x + 4, y + 27, x + w - 4, y + 27, P.blue, 1);
    // 2x2 广告格
    const cw = (w - 12) / 2, ch = (h - 34) / 2;
    ads.forEach((ad, i) => {
      const cx = x + 4 + (i % 2) * (cw + 2), cy = y + 29 + Math.floor(i / 2) * (ch + 2);
      D.rect(ctx, cx, cy, cw - 2, ch - 3, '#f8f6ea');
      D.frame(ctx, cx, cy, cw - 2, ch - 3, P.blue, 1);
      D.rect(ctx, cx + 3, cy + 3, cw - 8, 3, i % 2 ? P.violet : P.blue);
      D.text(ctx, ad.t.slice(0, 12), cx + 5, cy + 9, 9, P.ink, 'left', true);
      D.text(ctx, ad.en.slice(0, 20), cx + 5, cy + 22, 6, P.violet);
      D.text(ctx, ad.tag, cx + 5, cy + ch - 16, 7, '#8b87c0');
      // 折扣小条
      D.rect(ctx, cx + cw - 42, cy + ch - 19, 36, 12, i % 3 === 0 ? P.red : P.gold);
      D.text(ctx, ['ON SALE', '-60%', '7折', '-20%'][i % 4], cx + cw - 24, cy + ch - 17, 6, i % 3 === 0 ? '#fff' : P.ink, 'center', true);
    });
    // 手绘格线
    for (let gx = x + 4; gx < x + w; gx += 16) D.line(ctx, gx, y + 4, gx, y + h - 4, 'rgba(59,59,143,.10)', 1);
  }

  /* 地面层装饰 */
  function groundDeco(ctx, d, t) {
    const T = PC.CFG.TILE, x = d.tx * T, y = d.ty * T, w = (d.w || 1) * T, h = (d.h || 1) * T;
    if (d.kind === 'zebra') {
      for (let i = 0; i < w; i += 12) D.rect(ctx, x + i + 2, y + 3, 7, h - 6, 'rgba(240,236,210,.72)');
    } else if (d.kind === 'lane') {
      for (let i = 0; i < w; i += 20) D.rect(ctx, x + i, y + h / 2, 10, 1, P.roadLine);
    } else if (d.kind === 'laneV') {
      for (let i = 0; i < h; i += 20) D.rect(ctx, x + w / 2, y + i, 1, 10, P.roadLine);
    } else if (d.kind === 'stairs') {
      for (let i = 0; i < 5; i++) D.rect(ctx, x + 2, y + i * 8, 34, 6, i % 2 ? '#b8b4a2' : '#d8d4c0');
      D.frame(ctx, x + 2, y, 34, 42, P.ink, 1);
      D.text(ctx, '立体过街', x + 19, y + 44, 6, P.blue, 'center');
    }
  }

  /* 物件层装饰 */
  function deco(ctx, d, t) {
    const T = PC.CFG.TILE, x = d.tx * T, y = d.ty * T;
    const K = P.ink;
    switch (d.kind) {
      case 'tree': {
        D.rect(ctx, x + 6, y + 12, 4, 6, '#6b4a2f');
        D.rect(ctx, x + 1, y - 2, 14, 14, '#2f5b36');
        D.rect(ctx, x + 3, y - 4, 10, 4, '#3f7a45');
        D.rect(ctx, x + 2, y + 2, 12, 8, '#4e8e52');
        D.rect(ctx, x + 4, y - 3, 3, 3, '#79b56f');
        D.rect(ctx, x + 10, y + 4, 2, 2, '#79b56f');
        break;
      }
      case 'lamp': {
        D.rect(ctx, x + 7, y - 4, 2, 20, '#4a4b62');
        D.rect(ctx, x + 4, y - 8, 8, 5, K);
        D.rect(ctx, x + 5, y - 7, 6, 3, t.night ? '#ffe9a8' : '#c9c6b4');
        if (t.night) { ctx.fillStyle = 'rgba(255,220,120,.10)'; ctx.beginPath(); ctx.arc(x + 8, y - 2, 26, 0, 7); ctx.fill(); }
        break;
      }
      case 'bench': {
        D.rect(ctx, x + 1, y + 5, 24, 3, '#6b4a2f'); D.rect(ctx, x + 1, y + 9, 24, 3, '#8a6540');
        D.rect(ctx, x + 2, y + 12, 3, 4, K); D.rect(ctx, x + 21, y + 12, 3, 4, K);
        break;
      }
      case 'car': {
        const cols = ['#e2564d', '#4b8fb5', '#ffd25a', '#4caf7d', '#c05b86'];
        const col = cols[Math.abs(d.tx * 7 + d.ty * 3) % cols.length];
        D.rect(ctx, x + 1, y + 3, 22, 12, 'rgba(10,10,30,.25)');
        D.rect(ctx, x, y, 22, 12, K); D.rect(ctx, x + 2, y + 2, 18, 8, col);
        D.rect(ctx, x + 5, y + 3, 10, 6, '#8fb8cf');
        D.rect(ctx, x + 1, y + 4, 3, 2, '#ffe9a8'); D.rect(ctx, x + 18, y + 4, 3, 2, '#e2564d');
        break;
      }
      case 'fence': {
        const w = (d.w || 6) * T, h = (d.h || 2) * T;
        D.rect(ctx, x, y + 4, w, h - 4, 'rgba(59,59,143,.20)');
        for (let i = 0; i < w; i += 12) {
          D.rect(ctx, x + i, y, 10, h, i % 24 ? '#d9b64f' : '#c9a53f');
          D.rect(ctx, x + i, y, 10, 3, '#8a7430');
          D.line(ctx, x + i, y + 5, x + i + 10, y + h - 3, '#8a7430', 1);
        }
        D.text(ctx, '地铁施工 · 请通行 ↑', x + w / 2, y + 2, 8, '#2a2a5e', 'center', true);
        break;
      }
      case 'tower5g': {
        D.rect(ctx, x + 6, y - 10, 4, 26, '#8f92b5');
        D.rect(ctx, x + 2, y + 12, 12, 3, K);
        D.line(ctx, x + 8, y - 10, x + 2, y + 4, '#8f92b5', 1);
        D.line(ctx, x + 8, y - 10, x + 14, y + 4, '#8f92b5', 1);
        D.text(ctx, '5G', x + 8, y - 18, 8, P.gold, 'center', true);
        break;
      }
      case 'busStop': {
        D.rect(ctx, x, y - 4, 34, 5, K); D.rect(ctx, x + 1, y - 3, 32, 3, '#4b8fb5');
        D.rect(ctx, x + 2, y + 1, 2, 18, '#8f92b5'); D.rect(ctx, x + 30, y + 1, 2, 18, '#8f92b5');
        D.rect(ctx, x, y + 8, 34, 12, 'rgba(75,143,181,.30)');
        D.rect(ctx, x + 6, y - 2, 22, 11, '#f4f1e4'); D.frame(ctx, x + 6, y - 2, 22, 11, K, 1);
        D.text(ctx, '92 路', x + 17, y, 8, P.blue, 'center', true);
        break;
      }
      case 'vending': {
        D.rect(ctx, x + 2, y - 6, 15, 24, K); D.rect(ctx, x + 3, y - 5, 13, 22, '#4fb8a8');
        D.rect(ctx, x + 4, y - 4, 11, 11, '#dff2f0');
        ['#e2564d', '#ffd25a', '#4b8fb5'].forEach((c, i) => D.rect(ctx, x + 5 + i * 3, y - 2, 2, 6, c));
        D.rect(ctx, x + 5, y + 9, 9, 4, '#1b1c3a'); D.rect(ctx, x + 12, y + 12, 2, 3, P.gold);
        D.text(ctx, 'AUTO', x + 8, y + 18, 6, '#fff', 'center');
        break;
      }
      case 'atm': {
        D.rect(ctx, x, y - 4, 14, 22, K); D.rect(ctx, x + 1, y - 3, 12, 20, '#3b3b8f');
        D.rect(ctx, x + 2, y - 1, 10, 7, '#7fa6c9'); D.rect(ctx, x + 3, y + 8, 8, 2, '#c9c6b4');
        D.rect(ctx, x + 3, y + 12, 8, 4, '#1b1c3a');
        D.text(ctx, 'ATM', x + 7, y + 17, 6, P.gold, 'center', true);
        break;
      }
      case 'signpost': {
        D.rect(ctx, x + 7, y + 4, 2, 16, '#8f92b5');
        D.rect(ctx, x, y, 24, 8, '#f4f1e4'); D.frame(ctx, x, y, 24, 8, K, 1);
        D.text(ctx, d.tx < 60 ? '50m' : '100m', x + 12, y + 1, 7, P.blue, 'center', true);
        break;
      }
      case 'noHorn': {
        D.circle(ctx, x + 8, y + 8, 9, '#e2564d'); D.circle(ctx, x + 8, y + 8, 7, '#f4f1e4');
        D.line(ctx, x + 3, y + 13, x + 13, y + 3, '#e2564d', 2);
        D.text(ctx, '禁鸣', x + 8, y + 5, 6, P.red, 'center', true);
        break;
      }
      case 'warn': {
        sprite(ctx, 'warn', x, y, 2);
        break;
      }
      case 'arrowUp': {
        D.rect(ctx, x + 3, y + 6, 10, 14, '#4caf7d');
        D.rect(ctx, x, y + 6, 16, 4, '#4caf7d');
        D.rect(ctx, x + 5, y, 6, 8, '#4caf7d');
        D.rect(ctx, x + 6, y + 2, 4, 4, '#f4f1e4');
        break;
      }
      case 'board': {
        D.rect(ctx, x + 1, y, 14, 18, K); D.rect(ctx, x + 2, y + 1, 12, 16, '#f4f1e4');
        D.rect(ctx, x + 3, y + 2, 10, 3, P.blue);
        for (let i = 0; i < 4; i++) D.rect(ctx, x + 3, y + 7 + i * 3, 7 + (i % 2) * 3, 1, '#8b87c0');
        D.rect(ctx, x + 11, y + 13, 2, 3, P.gold);
        break;
      }
      case 'parkGate': {
        D.rect(ctx, x - 2, y - 6, 5, 22, '#6b4a2f'); D.rect(ctx, x + 20, y - 6, 5, 22, '#6b4a2f');
        D.rect(ctx, x - 2, y - 8, 27, 5, '#4caf7d');
        D.text(ctx, '林景园', x + 11, y + 18, 7, '#2f5b36', 'center', true);
        break;
      }
      case 'flower': {
        D.rect(ctx, x, y + 8, 22, 8, '#8a6540');
        for (let i = 0; i < 5; i++) sprite(ctx, 'flower', x + 2 + i * 4, y + 1, 1);
        break;
      }
    }
  }

  /* 中央地面 LED 显示屏：日期 / 天气 / 导航 / 轮播广告，持续动画 */
  function groundScreen(ctx, sc, t) {
    const T = PC.CFG.TILE, x = sc.x * T, y = sc.y * T, w = sc.w * T, h = sc.h * T;
    const St = PC.State, d = St.d(), wth = St.weather(), tm = t.time || 0;
    const pulse = .5 + .5 * Math.sin(tm * 2.2);
    // 底座与外框
    D.rect(ctx, x + 6, y + 6, w, h, 'rgba(8,8,24,.35)');
    D.rect(ctx, x, y, w, h, '#1b1c3a');
    D.rect(ctx, x + 3, y + 3, w - 6, h - 6, '#070c22');
    // 呼吸发光边
    ctx.fillStyle = 'rgba(90,210,220,' + (.25 + .35 * pulse).toFixed(3) + ')';
    ctx.fillRect(x + 1, y + 1, w - 2, 2); ctx.fillRect(x + 1, y + h - 3, w - 2, 2);
    ctx.fillRect(x + 1, y + 1, 2, h - 2); ctx.fillRect(x + w - 3, y + 1, 2, h - 2);
    // 点阵底纹
    ctx.fillStyle = 'rgba(90,120,200,.13)';
    for (let j = 6; j < h - 6; j += 6) for (let i = 6; i < w - 6; i += 6) ctx.fillRect(x + i, y + j, 1, 1);
    // 四角螺丝
    [[8, 8], [w - 10, 8], [8, h - 10], [w - 10, h - 10]].forEach(q => D.circle(ctx, x + q[0], y + q[1], 2, '#4b4b78'));

    // ---- 顶部状态条 ----
    const barY = y + 8;
    D.rect(ctx, x + 10, barY, w - 20, 22, '#122048');
    D.rect(ctx, x + 10, barY, w - 20, 2, '#4fb8a8');
    D.text(ctx, '无限極人生', x + 16, barY + 6, 9, '#ffd25a', 'left', true);
    D.text(ctx, 'SHUGUANG LU', x + 82, barY + 8, 6, '#6f8fd0');
    D.text(ctx, 'D' + d.day + '  ' + St.timeStr(), x + w / 2, barY + 6, 10, '#ffffff', 'center', true);
    D.text(ctx, wth.icon + ' ' + d.temp + '°C', x + w - 16, barY + 6, 9, '#7fe0c8', 'right', true);
    if (Math.floor(tm * 2) % 2 === 0) D.rect(ctx, x + w - 62, barY + 8, 4, 8, '#ffd25a');

    // ---- 导航滚动条 ----
    const navY = y + 34;
    D.rect(ctx, x + 10, navY, w - 20, 24, '#0b1636');
    D.frame(ctx, x + 10, navY, w - 20, 24, '#2b3a72', 1);
    D.text(ctx, 'NAV', x + 15, navY + 8, 7, '#ffd25a', 'left', true);
    D.rect(ctx, x + 40, navY + 3, 1, 18, '#2b3a72');
    const navStr = PC.SCREEN_NAV.join('　◆　') + '　◆　';
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 44, navY + 2, w - 62, 20); ctx.clip();
    ctx.font = '8px "Courier New","WenQuanYi Micro Hei",monospace';
    const nw = ctx.measureText(navStr).width;
    const off = (tm * 34) % nw;
    D.text(ctx, navStr, x + 44 - off, navY + 7, 8, '#a9e6f5');
    D.text(ctx, navStr, x + 44 - off + nw, navY + 7, 8, '#a9e6f5');
    ctx.restore();
    D.rect(ctx, x + 40, navY + 2, 5, 20, '#0b1636');
    D.rect(ctx, x + w - 18, navY + 2, 8, 20, '#0b1636');
    D.text(ctx, '▶', x + w - 14, navY + 7, 8, '#ffd25a');

    // ---- 主区：左轮播广告 / 右实时信息 ----
    const mainY = navY + 28, mainH = h - (mainY - y) - 34;
    const split = Math.floor(w * .62);
    D.rect(ctx, x + 10, mainY, split - 14, mainH, '#0e1a3e');
    D.rect(ctx, x + split + 2, mainY, w - split - 12, mainH, '#0a1430');
    D.frame(ctx, x + 10, mainY, split - 14, mainH, '#2b3a72', 1);
    D.frame(ctx, x + split + 2, mainY, w - split - 12, mainH, '#2b3a72', 1);

    const idx = Math.floor(tm / 4) % PC.SCREEN_ADS.length;
    const slot = (tm / 4) % 1;
    const ad = PC.ADS[PC.SCREEN_ADS[idx]];
    // 切换瞬间的闪白
    if (slot < .06) {
      ctx.fillStyle = 'rgba(180,230,255,' + ((.06 - slot) / .06 * .55).toFixed(3) + ')';
      ctx.fillRect(x + 10, mainY, split - 14, mainH);
    }
    const ax = x + 20, ay = mainY + 8;
    D.rect(ctx, ax, ay, 34, 11, '#e2564d');
    D.text(ctx, ad.tag.slice(0, 4), ax + 17, ay + 2, 6, '#fff', 'center', true);
    const titleSize = fitText(ctx, ad.t, split - 50, 14, 7);
    D.shadowText(ctx, ad.t, ax, ay + 17, titleSize, '#ffd25a');
    D.text(ctx, ad.en.slice(0, 34), ax, ay + 38, 7, '#7fa6d0');
    ad.body.split('\n').forEach((ln, i) => D.text(ctx, ln.slice(0, 26), ax, ay + 50 + i * 10, 7, '#c9d8f0'));
    D.rect(ctx, ax, mainY + mainH - 14, split - 34, 9, '#122048');
    D.rect(ctx, ax, mainY + mainH - 14, (split - 34) * slot, 9, '#4fb8a8');
    D.text(ctx, 'AD ' + (idx + 1) + '/' + PC.SCREEN_ADS.length, x + split - 18, mainY + mainH - 13, 6, '#6f8fd0', 'right');

    const rx = x + split + 10;
    D.text(ctx, 'TODAY', rx, mainY + 6, 7, '#6f8fd0');
    const clockSize = fitText(ctx, St.timeStr(), w - split - 30, 18, 10);
    D.shadowText(ctx, St.timeStr(), rx, mainY + 16, clockSize, '#ffffff');
    D.text(ctx, 'DAY ' + d.day, rx, mainY + 40, 9, '#ffd25a', 'left', true);
    D.text(ctx, wth.name + ' 天', rx, mainY + 54, 9, '#7fe0c8', 'left', true);
    const tempSize = fitText(ctx, d.temp + '°C', w - split - 30, 16, 9);
    D.shadowText(ctx, d.temp + '°C', rx, mainY + 68, tempSize, '#c9e8ff');
    D.circle(ctx, x + w - 30, mainY + 22, 6 + pulse * 2, 'rgba(255,210,90,' + (.12 + .18 * pulse).toFixed(3) + ')');
    D.text(ctx, wth.icon, x + w - 30, mainY + 17, 10, '#ffd25a', 'center', true);

    // ---- 底部滚动字幕 ----
    const tickY = y + h - 28;
    D.rect(ctx, x + 10, tickY, w - 20, 18, '#1b1030');
    D.frame(ctx, x + 10, tickY, w - 20, 18, '#d99b1f', 1);
    const tickStr = '◆ 无限極人生 INFINITY LIVES　◆　' + ad.t + '　◆　' + PC.SCREEN_NAV[0] + '　◆　9°C SUNNY　◆　';
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 12, tickY + 2, w - 24, 14); ctx.clip();
    ctx.font = '8px "Courier New","WenQuanYi Micro Hei",monospace';
    const tw = ctx.measureText(tickStr).width;
    const toff = (tm * 46) % tw;
    D.text(ctx, tickStr, x + 12 - toff, tickY + 5, 8, '#ffd25a');
    D.text(ctx, tickStr, x + 12 - toff + tw, tickY + 5, 8, '#ffd25a');
    ctx.restore();

    // ---- 扫描线 / 移动亮线 / 噪点 ----
    ctx.fillStyle = 'rgba(0,0,0,.16)';
    for (let j = 4; j < h - 4; j += 3) ctx.fillRect(x + 4, y + j, w - 8, 1);
    const scanY = y + 4 + ((tm * 55) % (h - 8));
    ctx.fillStyle = 'rgba(150,230,255,.13)'; ctx.fillRect(x + 4, scanY, w - 8, 3);
    ctx.fillStyle = 'rgba(255,255,255,.20)';
    for (let k = 0; k < 22; k++) {
      const nx = x + 6 + U.noise2(k, Math.floor(tm * 8), 11) * (w - 12);
      const ny = y + 6 + U.noise2(k, Math.floor(tm * 8), 12) * (h - 12);
      ctx.fillRect(Math.round(nx), Math.round(ny), 1, 1);
    }
    D.text(ctx, 'GROUND LED / LIVE', x + w - 12, y + h - 34, 6, '#4a6a9c', 'right');
  }

  /* 第二张设计稿：中间那块不是大 LED，而是「长矩形 921 路途径站牌」
     + 右下角叠着一小块「迂龙路 ☀17°C / 下一班车 / 天气 / 路」。
     全部按手绘格纸蓝墨牌子的质感画：纸底、墨线、斜线纹理带、菱形站标，不发光。 */
  function groundScreenYulong(ctx, sc, t) {
    const T = PC.CFG.TILE, x = sc.x * T, y = sc.y * T, w = sc.w * T, h = sc.h * T;
    const St = PC.State, d = St.d(), wth = St.weather(), tm = t.time || 0;
    const INK = '#3b3b8f', VIO = '#5b4fb3', RED = '#c2453f', PALE = '#7f7bc0';
    const paper = '#f6f4e9';

    /* 阴影 + 纸底 + 格纸 */
    D.rect(ctx, x + 5, y + 5, w, h, 'rgba(20,22,50,.28)');
    D.rect(ctx, x, y, w, h, '#e8e5d8');
    D.rect(ctx, x + 2, y + 2, w - 4, h - 4, paper);
    ctx.strokeStyle = 'rgba(59,59,143,.13)'; ctx.lineWidth = 1;
    for (let gx = x + 8; gx < x + w - 4; gx += 20) { ctx.beginPath(); ctx.moveTo(gx + .5, y + 3); ctx.lineTo(gx + .5, y + h - 3); ctx.stroke(); }
    for (let gy = y + 8; gy < y + h - 4; gy += 20) { ctx.beginPath(); ctx.moveTo(x + 3, gy + .5); ctx.lineTo(x + w - 3, gy + .5); ctx.stroke(); }
    D.frame(ctx, x, y, w, h, INK, 2);

    /* 顶边那条密集斜线纹理带（稿子上 SAFE LINE 上方的一排墨斜线） */
    D.rect(ctx, x + 3, y + 3, w - 6, 9, '#dcd8c8');
    ctx.save(); ctx.beginPath(); ctx.rect(x + 3, y + 3, w - 6, 9); ctx.clip();
    const off = (tm * 9) % 8;
    for (let s = -12; s < w + 12; s += 5) {
      D.line(ctx, x + s - off, y + 12, x + s + 9 - off, y + 3, 'rgba(42,42,94,.55)', 1);
    }
    ctx.restore();
    D.rect(ctx, x + 3, y + 12, w - 6, 1, INK);

    /* 左上「921 路」方框 */
    const noW = Math.min(84, w * .18);
    D.rect(ctx, x + 6, y + 16, noW, 30, paper);
    D.frame(ctx, x + 6, y + 16, noW, 30, INK, 1.6);
    D.text(ctx, '921', x + 12, y + 20, 15, INK, 'left', true);
    D.text(ctx, '路', x + noW - 10, y + 26, 12, INK, 'left', true);
    /* 中间线路名 + 右侧 SAFE LINE */
    D.text(ctx, '曙光路 ⇆ 景迂路', x + noW + 20, y + 24, 13, INK, 'left', true);
    D.text(ctx, 'SAFE  LINE', x + w - 14, y + 25, 10, VIO, 'right', true);
    D.line(ctx, x + 5, y + 49, x + w - 5, y + 49, INK, 1.4);

    /* 四个菱形站标 + 竖排站名（公交途径站） */
    const stops = ['曙光路', '迂龙路', '为疾路', '景迂路'];
    const stopW = Math.min(62, (w * .52) / 4);
    const cur = Math.floor(tm / 3) % stops.length;
    stops.forEach((nm, i) => {
      const sx = x + 14 + i * stopW, sy = y + 55;
      const on = i === cur;
      // 菱形
      ctx.strokeStyle = on ? RED : INK; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx + 5, sy); ctx.lineTo(sx + 10, sy + 5); ctx.lineTo(sx + 5, sy + 10); ctx.lineTo(sx, sy + 5);
      ctx.closePath(); ctx.stroke();
      if (on) { ctx.fillStyle = 'rgba(194,69,63,.25)'; ctx.fill(); }
      // 竖排站名
      nm.split('').forEach((ch, k) => D.text(ctx, ch, sx + 1, sy + 14 + k * 9, 8, on ? RED : INK, 'left', on));
      if (i < stops.length - 1) D.line(ctx, sx + 15, sy + 5, sx + stopW - 2, sy + 5, PALE, 1);
    });
    D.text(ctx, '◇ 途径站 / STOPS', x + 12, y + h - 12, 6, PALE);

    /* ===== 右下角那一小块：班车时间 / 天气 / 路 ===== */
    const bx = x + Math.floor(w * .55), by = y + Math.floor(h * .40);
    const bw = x + w - bx - 5, bh = y + h - by - 5;
    D.rect(ctx, bx + 3, by + 3, bw, bh, 'rgba(20,22,50,.22)');
    D.rect(ctx, bx, by, bw, bh, '#fbf9ef');
    D.frame(ctx, bx, by, bw, bh, INK, 1.8);
    // 标题「迂龙路 ☀17°C」
    D.rect(ctx, bx + 2, by + 2, bw - 4, 15, '#eae6d6');
    D.text(ctx, '迂龙路', bx + 7, by + 5, 10, INK, 'left', true);
    const sun = .5 + .5 * Math.sin(tm * 2.4);
    D.circle(ctx, bx + 58, by + 9, 3 + sun, '#e2a33a');
    D.text(ctx, St.tempAt('yulong') + '°C', bx + 68, by + 5, 9, RED, 'left', true);
    D.line(ctx, bx + 2, by + 18, bx + bw - 2, by + 18, INK, 1.2);

    // 左半：下一班车三行（倒计时会走）
    const cyc = (tm * 4) % 20;
    const arr = [3, 13, 20];
    arr.forEach((m, i) => {
      const left = Math.max(0, m - cyc);
      const shown = left > 0 ? Math.ceil(left) + 'min' : '进站中';
      D.text(ctx, '下一班车:', bx + 7, by + 23 + i * 11, 7, INK);
      D.text(ctx, shown, bx + 55, by + 22 + i * 11, 8, i === 0 ? RED : INK, 'left', i === 0);
    });
    // 右半：天气 + 添衣
    const wx = bx + Math.floor(bw * .55);
    D.line(ctx, wx - 5, by + 20, wx - 5, by + bh - 16, PALE, 1);
    const cold = wth.id === 'cold' || wth.id === 'rain';
    D.text(ctx, cold ? '天气降温' : wth.name + ' · 路', wx, by + 23, 8, RED, 'left', true);
    D.text(ctx, '记得保暖添衣 ≪', wx, by + 36, 7, VIO, 'left', true);
    D.text(ctx, '路面 ' + (St.isRain() ? '湿滑' : '正常'), wx, by + 47, 6, PALE);
    // 底部一行「路」：滚动的线路信息
    D.rect(ctx, bx + 2, by + bh - 13, bw - 4, 11, '#1b1c3a');
    const route = '921 路　曙光路 ⇆ 迂龙路 ⇆ 为疾路 ⇆ 景迂路　◆　下一站 中华门 ZHONGHUA　◆　';
    ctx.save(); ctx.beginPath(); ctx.rect(bx + 4, by + bh - 12, bw - 8, 9); ctx.clip();
    ctx.font = '7px "Courier New","WenQuanYi Micro Hei",monospace';
    const rw = Math.max(160, ctx.measureText(route).width);
    const ro = (tm * 24) % rw;
    D.text(ctx, route, bx + 4 - ro, by + bh - 11, 7, '#ffd25a');
    D.text(ctx, route, bx + 4 - ro + rw, by + bh - 11, 7, '#ffd25a');
    ctx.restore();

    /* 纸面斑驳 + 四角墨点，保持手绘质感但不发光 */
    for (let k = 0; k < 26; k++) {
      ctx.fillStyle = 'rgba(59,59,143,.045)';
      ctx.fillRect(Math.round(x + 4 + U.noise2(k, 3, 11) * (w - 8)),
        Math.round(y + 4 + U.noise2(k, 9, 12) * (h - 8)), 2, 2);
    }
    [[3, 3], [w - 5, 3], [3, h - 5], [w - 5, h - 5]].forEach(q => D.circle(ctx, x + q[0], y + q[1], 1.5, PALE));
  }

  PC.Art = { sprite, person, building, billboard, groundDeco, deco, shade, fitText, groundScreen, groundScreenYulong, PAL, FACADES, drawFenyangBadge };
})();
