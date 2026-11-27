/* entities.js —— 玩家 / NPC / 交互提示 */
(function () {
  const PC = window.PC = window.PC || {};
  const U = PC.U, D = PC.Draw, A = PC.Art, P = PC.PAL, W = PC.World, C = PC.CFG;

  function createPlayer(scene) {
    const sp = W.freeSpot ? W.freeSpot(scene, scene.spawn.x, scene.spawn.y) : scene.spawn;
    return {
      x: sp.x, y: sp.y, dir: 0, frame: 0, anim: 0,
      moving: false, run: false, colors: { body: '#4caf7d', hair: '#3a2c3e', pants: '#2a2a5e', badge: '#ffd25a' }
    };
  }

  function updatePlayer(p, input, dt, scene) {
    let dx = input.dx || 0, dy = input.dy || 0;
    const len = Math.hypot(dx, dy);
    p.moving = false;
    if (len > .12) {
      if (len > 1) { dx /= len; dy /= len; }
      p.run = !!input.run && Math.hypot(dx, dy) > .82;
      const sp = (p.run ? C.RUN : C.WALK) * Math.min(dt, .05);
      W.move(scene, p, dx * sp, dy * sp);
      p.moving = true;
      if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 3 : 2;
      else p.dir = dy > 0 ? 0 : 1;
      p.anim += dt * (p.run ? 12 : 8);
      p.frame = Math.floor(p.anim) % 2;
      if (U.chance(.12)) PC.Audio.sfx('step');
    } else { p.frame = 0; p.anim = 0; }
  }

  function updateNPCs(scene, dt, t) {
    scene.npcs.forEach(n => {
      if (n.stationary) { n.dir = 0; return; }
      if (n.wait > 0) { n.wait -= dt; return; }
      const target = n.path[n.pi];
      if (!target) return;
      const ddx = target.x - n.x, ddy = target.y - n.y, d = Math.hypot(ddx, ddy);
      if (d < 3) {
        n.pi = (n.pi + 1) % n.path.length;
        n.wait = U.rand(.4, 1.8);
        n.frame = 0;
        return;
      }
      const vx = ddx / d, vy = ddy / d, sp = 32 * Math.min(dt, .05);
      if (!W.collide(scene, W.boxAt(n.x + vx * sp, n.y))) n.x += vx * sp;
      if (!W.collide(scene, W.boxAt(n.x, n.y + vy * sp))) n.y += vy * sp;
      if (Math.abs(vx) > Math.abs(vy)) n.dir = vx > 0 ? 3 : 2; else n.dir = vy > 0 ? 0 : 1;
      n.anim = (n.anim || 0) + dt * 7; n.frame = Math.floor(n.anim) % 2;
    });
  }

  function nearest(scene, p, r) {
    let best = null, bd = r === undefined ? C.INTERACT_R : r;
    scene.points.forEach(pt => {
      const d = U.dist(p.x, p.y, pt.x, pt.y);
      if (d < bd) { bd = d; best = pt; }
    });
    scene.npcs.forEach(n => {
      if (n.stationary) return;
      const d = U.dist(p.x, p.y, n.x, n.y);
      if (d < Math.min(bd, C.INTERACT_R)) {
        bd = d;
        best = { id: 'npc_' + n.id, type: 'npc', x: n.x, y: n.y, label: '和 ' + n.name + ' 聊聊', data: n };
      }
    });
    return best;
  }

  function draw(ctx, scene, p, t) {
    const list = scene.npcs.map(n => ({ e: n, npc: true })).concat([{ e: p, npc: false }]);
    list.sort((a, b) => a.e.y - b.e.y);
    list.forEach(o => {
      const e = o.e;
      // 脚下光圈
      D.rect(ctx, e.x - 5, e.y - 1, 10, 1, o.npc ? 'rgba(20,20,50,.22)' : 'rgba(255,210,90,.65)');
      if (!o.npc) {
        D.rect(ctx, e.x - 6, e.y - 17, 12, 1, P.gold);
        A.person(ctx, e.x - 6, e.y - 15, e.dir, e.frame, e.colors, 1);
      } else {
        A.person(ctx, e.x - 6, e.y - 15, e.dir, e.frame, { body: e.color, hair: '#2a2a3e' }, 1);
        if (U.dist(e.x, e.y, p.x, p.y) < 70 && !(t.targetId && t.targetId === 'npc_' + e.id)) {
          D.rect(ctx, e.x - 18, e.y - 26, 36, 8, 'rgba(16,18,48,.72)');
          D.text(ctx, e.name.slice(0, 5), e.x, e.y - 25, 6, '#ffe9a8', 'center');
        }
      }
    });
  }

  function drawHint(ctx, p, pt, t, cam, vw) {
    if (!pt) return;
    const VW = vw || C.VIEW_W;
    cam = cam || { x: 0, y: 0 };
    const sx = p.x - cam.x, sy = p.y - cam.y, hx = pt.x - cam.x, hy = pt.y - cam.y;
    const bob = Math.sin(t.time * 4) * 1;
    // 交互点高亮
    D.rect(ctx, hx - 9, hy - 9, 18, 18, 'rgba(255,210,90,.18)');
    D.frame(ctx, hx - 9, hy - 9, 18, 18, P.gold, 1);
    // 气泡
    const label = pt.label || '交互';
    const k = C.TEXT_SCALE || 1;
    ctx.font = Math.round(8 * k) + 'px "Courier New","WenQuanYi Micro Hei",monospace';
    const tw = Math.min(200 * k, VW - 8, ctx.measureText(label).width + 18 * k);
    const bx = U.clamp(sx - tw / 2, 4, VW - tw - 4);
    const by = sy - 36 + bob;
    D.box(ctx, bx, by, tw, 17 * k, '#16183a', P.gold);
    D.text(ctx, label, bx + tw / 2, by + 4, 8 * k, '#fff3c4', 'center');
    D.text(ctx, 'A/E', bx + tw / 2, by - 9, 7 * k, P.gold, 'center', true);
  }

  PC.Entities = { createPlayer, updatePlayer, updateNPCs, nearest, draw, drawHint };
})();
