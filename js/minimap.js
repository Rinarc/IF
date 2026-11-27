/* minimap.js —— 右上角真正的小地图 / 探索迷雾
 * 未走过的格子是黑的；走过之后按地形着色并永久记住（存 localStorage）。
 * 店铺门、出口、交互点只在已探索区域显示；主角是闪烁的金点 + 朝向箭头。
 * 室内（店铺 / 家）一屏可见，不做迷雾，直接显示家具与门口。
 */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U, D = PC.Draw, T = PC.CFG.TILE;
  const STORE = 'pixel-city-explored-v1';
  const $ = id => document.getElementById(id);

  const COL = {
    road: '#464760', pave: '#8e8b7b', plaza: '#aaa68e', grass: '#4e7c4c',
    water: '#2f6188', metroFloor: '#33365f', platform: '#5b607e',
    floor: '#b9a888', roomFloor: '#b9a888'
  };
  const cache = Object.create(null);
  let store = {};
  let lastSave = 0, lastRender = 0, big = false, lastSceneId = null;

  function load() {
    try { store = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { store = {}; }
  }
  function persist() {
    try { localStorage.setItem(STORE, JSON.stringify(store)); } catch (e) { }
  }
  load();

  function bits(scene) {
    const w = scene.w, h = scene.h, id = scene.id;
    if (!cache[id] || cache[id].w !== w || cache[id].h !== h) {
      const b = new Uint8Array(Math.ceil(w * h / 8));
      const raw = store[id];
      if (raw) {
        try {
          const bin = atob(raw);
          for (let i = 0; i < bin.length && i < b.length; i++) b[i] = bin.charCodeAt(i);
        } catch (e) { }
      }
      cache[id] = { w, h, b };
    }
    return cache[id];
  }
  function get(bb, x, y) { const i = y * bb.w + x; return (bb.b[i >> 3] >> (i & 7)) & 1; }
  function set(bb, x, y) { const i = y * bb.w + x; bb.b[i >> 3] |= (1 << (i & 7)); }

  function indoor(scene) {
    return scene.indoor || scene.id.indexOf('shop:') === 0 || scene.id.indexOf('interior:') === 0 ||
      scene.id === 'home' || scene.id.indexOf('villa:') === 0 || scene.id === 'metro' || scene.id === 'train' ||
      scene.id.indexOf('floor:') === 0 || scene.id.indexOf('sroom:') === 0;
  }

  /* 每帧调用：以玩家为中心揭开半径 R 的圆形视野 */
  function mark(scene, player, now) {
    const bb = bits(scene);
    if (indoor(scene)) {
      // 室内一屏看全，全部点亮，不写存档也无所谓
      bb.b.fill(255);
      return;
    }
    const tx = Math.floor(player.x / T), ty = Math.floor(player.y / T), R = 8;
    let changed = false;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy > R * R) continue;
      const x = tx + dx, y = ty + dy;
      if (x < 0 || y < 0 || x >= bb.w || y >= bb.h) continue;
      if (!get(bb, x, y)) { set(bb, x, y); changed = true; }
    }
    if (changed && now - lastSave > 900) {
      lastSave = now;
      store[scene.id] = btoa(String.fromCharCode.apply(null, bb.b));
      persist();
    }
  }

  function exploredPct(scene) {
    const bb = bits(scene);
    let n = 0;
    for (let i = 0; i < bb.w * bb.h; i++) if ((bb.b[i >> 3] >> (i & 7)) & 1) n++;
    return Math.round(n / (bb.w * bb.h) * 100);
  }

  function tileColor(scene, x, y) {
    if (scene.solid[y] && scene.solid[y][x]) return scene.id === 'street' ? '#24274d' : '#3a3d66';
    const g = scene.ground[y] && scene.ground[y][x];
    if (g === 'roomFloor' || g === 'floor') return scene.floorColor || COL.roomFloor;
    return COL[g] || '#8e8b7b';
  }

  function render(scene, player, t) {
    const cv = $('minimap'); if (!cv) return;
    const ctx = cv.getContext('2d');
    const VW = cv.width, VH = cv.height;
    const fog = !indoor(scene);
    const bb = bits(scene);
    const s = Math.max(1, Math.floor(Math.min(VW / scene.w, VH / scene.h)));
    const ox = Math.floor((VW - scene.w * s) / 2), oy = Math.floor((VH - scene.h * s) / 2);
    const tm = t && t.time ? t.time : performance.now() / 1000;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#050610'; ctx.fillRect(0, 0, VW, VH);
    // 未探索区的极暗网格，暗示「这里还是黑的」
    ctx.fillStyle = 'rgba(70,80,150,.10)';
    for (let j = 0; j < VH; j += 4) for (let i = 0; i < VW; i += 4) ctx.fillRect(i, j, 1, 1);

    for (let y = 0; y < scene.h; y++) for (let x = 0; x < scene.w; x++) {
      if (fog && !get(bb, x, y)) continue;
      const c = tileColor(scene, x, y);
      ctx.fillStyle = c;
      ctx.fillRect(ox + x * s, oy + y * s, s, s);
      // 已探索 / 未探索的边界描一道暗线
      if (fog && y > 0 && !get(bb, x, y - 1)) {
        ctx.fillStyle = 'rgba(10,12,32,.55)';
        ctx.fillRect(ox + x * s, oy + y * s, s, 1);
      }
    }

    // 交互点：只画已探索区域的（门口 / 出口 / 计数器用不同颜色）
    scene.points.forEach(p => {
      if (p.taken) return;
      const mx = Math.floor(p.x / T), my = Math.floor(p.y / T);
      if (mx < 0 || my < 0 || mx >= scene.w || my >= scene.h) return;
      if (fog && !get(bb, mx, my)) return;
      let c = '#6f8fd0';
      if (p.type === 'door' || p.type === 'home') c = '#ffd25a';
      else if (p.type === 'exit') c = '#7fe0c8';
      else if (p.type === 'jobs' || p.type === 'gigboard' || p.type === 'earn') c = '#e2564d';
      ctx.fillStyle = c;
      ctx.fillRect(ox + mx * s, oy + my * s, Math.max(2, s), Math.max(2, s));
    });

    // 主角：闪烁金点 + 朝向小箭头
    const px = Math.floor(player.x / T), py = Math.floor(player.y / T);
    const cx = ox + px * s, cy = oy + py * s;
    const blink = Math.floor(tm * 3) % 2 === 0;
    ctx.fillStyle = blink ? '#fff3c4' : '#ffd25a';
    ctx.fillRect(cx - 1, cy - 1, Math.max(3, s + 2), Math.max(3, s + 2));
    ctx.fillStyle = '#1b1c3a';
    ctx.fillRect(cx, cy, Math.max(1, s), Math.max(1, s));
    const dir = player.dir || 0;
    ctx.fillStyle = '#ffffff';
    if (dir === 1) ctx.fillRect(cx, cy - 3, 1, 2);
    else if (dir === 0) ctx.fillRect(cx, cy + s + 1, 1, 2);
    else if (dir === 2) ctx.fillRect(cx - 3, cy, 2, 1);
    else ctx.fillRect(cx + s + 1, cy, 2, 1);

    // 外框与角标
    ctx.strokeStyle = 'rgba(91,87,173,.9)'; ctx.lineWidth = 1;
    ctx.strokeRect(.5, .5, VW - 1, VH - 1);
    ctx.fillStyle = 'rgba(16,18,48,.82)'; ctx.fillRect(1, 1, 26, 8);
    ctx.font = '6px "Courier New",monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffd25a'; ctx.fillText('MAP', 3, 2);

    // 文字信息
    const lab = $('minimapLabel');
    if (lab) {
      const short = String(scene.label || scene.id).split(' · ')[0].slice(0, 9);
      lab.textContent = short + '  ' + px + ',' + py + '  ' + (fog ? exploredPct(scene) + '% 已探索' : '室内全图');
    }
  }

  function tick(scene, player, t) {
    if (!scene || !player) return;
    const now = performance.now();
    mark(scene, player, now);
    if (now - lastRender > 90 || lastSceneId !== scene.id) {
      lastRender = now; lastSceneId = scene.id;
      render(scene, player, t);
    }
  }

  function reset() {
    for (const k in cache) delete cache[k];
    store = {}; persist();
  }
  function revealAll(scene) {
    const bb = bits(scene); bb.b.fill(255);
    store[scene.id] = btoa(String.fromCharCode.apply(null, bb.b)); persist();
  }

  /* 点击小地图：放大 / 还原，方便看整条街 */
  function bind() {
    const wrap = $('minimapWrap'); if (!wrap) return;
    wrap.addEventListener('click', () => {
      big = !big; wrap.classList.toggle('big', big);
      PC.Audio.sfx('click');
      if (PC.Main) render(PC.Main.scene, PC.Main.player, { time: performance.now() / 1000 });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();

  PC.Minimap = { tick, render, mark, reset, revealAll, exploredPct, get big() { return big; } };
})();
