/* Nihongo Room — ขั้นที่ 1: กรอบหน้าจอ ห้องพิกเซล และเลย์เอาต์ */
(function () {
  'use strict';
  const CORE = window.NR_CORE;
  const W = CORE.pixel.w, H = CORE.pixel.h;

  /* ================= สี ================= */
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (r) => '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const dark = (c, t) => mix(c, '#2a1420', t);
  const light = (c, t) => mix(c, '#ffffff', t);

  /* ================= เครื่องวาดพิกเซล ================= */
  class Layer {
    constructor(id, opt = {}) { this.id = id; this.px = new Map(); this.outline = opt.outline !== false; this.outlineT = opt.outlineT || 0.42; }
    set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; this.px.set(y * W + x, c); }
    has(x, y) { return this.px.has(y * W + x); }
    get(x, y) { return this.px.get(y * W + x); }
  }
  function inPoly(x, y, pts) { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; }
  function line(L, x0, y0, x1, y1, c) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { L.set(x0, y0, typeof c === 'function' ? c(x0, y0) : c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  function poly(L, pts, c, edge = true) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs)), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inPoly(x + 0.5, y + 0.5, pts)) L.set(x, y, typeof c === 'function' ? c(x, y) : c);
    if (edge) for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; line(L, a[0], a[1], b[0], b[1], c); }
  }
  function polySet(pts) { const s = new Set(); const T = new Layer('tmp'); poly(T, pts, '#000'); T.px.forEach((_, k) => s.add(k)); return s; }
  function ellipse(L, cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) L.set(x, y, typeof c === 'function' ? c(x, y) : c); } }
  function outline(L) {
    if (!L.outline) return; const add = [];
    L.px.forEach((c, k) => { const x = k % W, y = (k / W) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !L.has(nx, ny)) add.push([nx, ny, dark(c, L.outlineT)]); }); });
    add.forEach(([x, y, c]) => { if (!L.has(x, y)) L.set(x, y, c); });
  }
  function toSVG(L) {
    const byColor = new Map();
    for (let y = 0; y < H; y++) { let x = 0; while (x < W) { const c = L.get(x, y); if (!c) { x++; continue; } let n = 1; while (x + n < W && L.get(x + n, y) === c) n++; if (!byColor.has(c)) byColor.set(c, []); byColor.get(c).push(`M${x} ${y}h${n}v1h-${n}z`); x += n; } }
    let s = ''; byColor.forEach((d, c) => { s += `<path fill="${c}" d="${d.join('')}"/>`; });
    return s;
  }

  /* ================= มุมเอียง (isometric 2:1) ================= */
  const OX = 160, OY = 80, RL = 56, RH = 62;
  const P = (x, y, z) => [OX + 2 * (x - y), OY + (x + y) - z];
  const WL = (y, z) => P(0, y, z), WR = (x, z) => P(x, 0, z);
  function box(L, x, y, z, w, d, h, c, o = {}) {
    const top = o.top || light(c, 0.12), fy = o.fy || c, fx = o.fx || dark(c, 0.14);
    poly(L, [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], fy);
    poly(L, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], fx);
    poly(L, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top);
  }
  const ring = (cx, cy, z, r, n = 40) => Array.from({ length: n }, (_, i) => P(cx + r * Math.cos((i / n) * 6.283), cy + r * Math.sin((i / n) * 6.283), z));

  /* ================= ห้อง ================= */
  function drawRoom(themeKey) {
    const T = CORE.themes[themeKey].room; const layers = [];
    const L = (id, o) => { const l = new Layer(id, o); layers.push(l); return l; };

    // --- ฐาน ผนัง พื้น ---
    const base = L('base', { outlineT: 0.35 });
    const edgeY = (sx) => OY + Math.abs(sx - OX) / 2;
    poly(base, [P(RL, 0, 0), P(RL, RL, 0), P(0, RL, 0), [P(0, RL, 0)[0], P(0, RL, 0)[1] + 8], [P(RL, RL, 0)[0], P(RL, RL, 0)[1] + 8], [P(RL, 0, 0)[0], P(RL, 0, 0)[1] + 8]], (x, y) => (y > P(0, RL, 0)[1] - Math.abs(x - OX) / 2 + 0 && x < OX ? dark(T.slab, 0.08) : T.slab));
    poly(base, [P(0, 0, 0), P(RL, 0, 0), P(RL, RL, 0), P(0, RL, 0)], (x, y) => {
      const d = y - edgeY(x); const seam = ((x + 2 * y) % 16 === 0);
      if (d < 9 && (x + y) % 2 === 0) return T.floorSh;
      if (seam) return T.floorSh; return T.floor;
    });
    const wallC = (shade) => (x, y) => {
      const bottom = edgeY(x), top = edgeY(x) - RH; const fromB = bottom - y, fromT = y - top;
      if (fromB < 4) return T.trim; if (fromB < 6) return dark(T.wall, 0.06);
      if (fromT < 7 && (x + y) % 2 === 0) return T.wallSh;
      if (x % 8 === 0 && y % 8 === 4) return T.wallSh;
      return shade ? mix(T.wall, T.wallSh, 0.45) : T.wall;
    };
    poly(base, [WL(0, 0), WL(RL, 0), WL(RL, RH), WL(0, RH)], wallC(true));
    poly(base, [WR(0, 0), WR(RL, 0), WR(RL, RH), WR(0, RH)], wallC(false));
    line(base, ...WL(0, 0), ...WL(0, RH), dark(T.wall, 0.12));

    // --- หน้าต่าง (ใช้ซ้ำทั้งสองบาน) ---
    function windowOn(id, F, a0, a1, z0, z1, side) {
      const Lw = L(id);
      [[a0 - 3, a0 - 0.5], [a1 + 0.5, a1 + 3]].forEach(([u0, u1]) => poly(Lw, [F(u0, z0 - 4), F(u1, z0 - 4), F(u1, z1 + 2), F(u0, z1 + 2)], (x, y) => ((x + y) % 3 === 0 ? dark(T.accent, 0.1) : T.accent)));
      poly(Lw, [F(a0, z0), F(a1, z0), F(a1, z1), F(a0, z1)], '#fff8ef');
      const inner = [F(a0 + 1.5, z0 + 1.5), F(a1 - 1.5, z0 + 1.5), F(a1 - 1.5, z1 - 1.5), F(a0 + 1.5, z1 - 1.5)];
      const ys = inner.map((p) => p[1]); const yTop = Math.min(...ys), yBot = Math.max(...ys);
      const inside = polySet(inner);
      inside.forEach((k) => { const x = k % W, y = (k / W) | 0; const t = (y - yTop) / (yBot - yTop); Lw.set(x, y, mix(T.sky, T.sky2, themeKey === 'christmas' ? t * 0.25 : t * 0.7)); });
      const put = (x, y, c) => { if (inside.has(Math.round(y) * W + Math.round(x))) Lw.set(x, y, c); };
      const box2 = [Math.min(...inner.map((p) => p[0])), Math.max(...inner.map((p) => p[0]))];
      const cxw = (box2[0] + box2[1]) / 2, ww = box2[1] - box2[0];
      // วิวตามธีม
      for (let x = box2[0]; x <= box2[1]; x++) { const hill = yBot - 6 - Math.round(Math.sin((x + side * 7) / 5) * 2); for (let y = hill; y <= yBot; y++) put(x, y, themeKey === 'christmas' ? '#f4f8ff' : themeKey === 'autumn' ? '#e3a35e' : '#9fd88a'); }
      if (themeKey === 'christmas') { for (let i = 0; i < 18; i++) put(box2[0] + ((i * 7 + side * 3) % ww), yTop + ((i * 5) % (yBot - yTop - 6)), '#ffffff'); ellipse({ set: put }, cxw + side * 4, yTop + 6, 3, 3, '#fff6c8'); }
      else if (themeKey === 'sakura') { for (let i = 0; i < 10; i++) put(box2[0] + 2 + ((i * 5) % (ww - 3)), yTop + 3 + ((i * 3) % 7), i % 3 ? '#f7a8c6' : '#ffffff'); line({ set: put }, box2[0], yTop + 4, box2[0] + ww * 0.6, yTop + 9, '#8a5a4a'); }
      else if (themeKey === 'spring') { ellipse({ set: put }, cxw - side * 3, yTop + 6, 4, 2, '#ffffff'); ellipse({ set: put }, cxw - side * 3 + 3, yTop + 5, 3, 2, '#ffffff'); }
      else { ellipse({ set: put }, cxw + side * 3, yBot - 11, 4, 4, T.leaf); ellipse({ set: put }, cxw + side * 3 + 2, yBot - 12, 3, 3, T.leaf2); line({ set: put }, cxw + side * 3, yBot - 8, cxw + side * 3, yBot - 5, '#7a4a2a'); }
      // กรอบกลาง
      const am = (a0 + a1) / 2, zm = (z0 + z1) / 2;
      line(Lw, ...F(am, z0 + 1), ...F(am, z1 - 1), '#fff8ef'); line(Lw, ...F(a0 + 1, zm), ...F(a1 - 1, zm), '#fff8ef');
      poly(Lw, [F(a0 - 1, z0 - 1), F(a1 + 1, z0 - 1), F(a1 + 1, z0 - 2.5), F(a0 - 1, z0 - 2.5)], '#fff8ef');
      return Lw;
    }
    windowOn('windowL', WL, 10, 26, 26, 50, -1);
    windowOn('windowR', WR, 40, 53, 28, 52, 1);

    // --- ปล่องไฟ + พวงหรีด ---
    const ch = L('chimney', { outlineT: 0.3 });
    poly(ch, [WR(21, 27), WR(35, 27), WR(35, RH), WR(21, RH)], (x, y) => { const r = (y - x / 2) | 0; const row = ((r % 5) + 5) % 5; if (row === 0) return light(T.brick, 0.25); if (((x + (Math.floor(r / 5) % 2) * 4) % 8) === 0) return light(T.brick, 0.25); return T.brick; });
    const wr = L('wreath', { outlineT: 0.45 });
    for (let r = 3.4; r <= 6; r += 0.2) for (let a = 0; a < 6.283; a += 0.04) { const [x, y] = WR(28 + r * Math.cos(a), 46 + r * Math.sin(a)); wr.set(x, y, (Math.round(a * 10 + r * 3) % 4 === 0) ? T.leaf2 : T.leaf); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283 + 0.3; const [x, y] = WR(28 + 4.8 * Math.cos(a), 46 + 4.8 * Math.sin(a)); wr.set(x, y, T.accent); wr.set(x + 1, y, T.accent); }
    { const [bx, by] = WR(28, 41); [[-2, 0], [-1, 0], [1, 0], [2, 0], [0, 0], [-2, 1], [2, 1], [-1, 2], [1, 2]].forEach(([dx, dy]) => wr.set(bx + dx, by + dy, T.accent)); }

    // --- ไฟประดับ / ธง ---
    const gl = L('garland', { outlineT: 0.35 });
    const flags = [T.accent, T.accent2, '#fff3b0', T.leaf2];
    const strand = (F, a0, a1, flip) => {
      const pts = []; for (let a = a0; a <= a1; a += 0.5) pts.push([a, RH - 5 - Math.sin(((a - a0) / 14) * Math.PI) ** 2 * 3]);
      pts.forEach(([a, z], i) => { if (i) { const [x0, y0] = F(pts[i - 1][0], pts[i - 1][1]), [x1, y1] = F(a, z); line(gl, x0, y0, x1, y1, '#8a6a5a'); } });
      for (let a = a0 + 2, i = 0; a < a1 - 1; a += 3.5, i++) { const z = RH - 5 - Math.sin(((a - a0) / 14) * Math.PI) ** 2 * 3; const [x, y] = F(a, z); const c = themeKey === 'christmas' ? ['#ffd34d', '#ff6b7f', '#7fd6ff', '#9cf08a'][i % 4] : themeKey === 'autumn' ? [T.leaf, T.leaf2, '#d4552b'][i % 3] : flags[i % 4];
        if (themeKey === 'christmas') { gl.set(x, y + 1, c); gl.set(x, y + 2, c); gl.set(x + 1, y + 1, c); }
        else if (themeKey === 'autumn') { [[0, 1], [-1, 2], [0, 2], [1, 2], [0, 3]].forEach(([dx, dy]) => gl.set(x + dx, y + dy, c)); }
        else { for (let r = 0; r < 4; r++) for (let k = -2 + Math.ceil(r / 2); k <= 2 - Math.ceil(r / 2); k++) gl.set(x + k, y + 1 + r, c); } }
    };
    strand(WL, 2, RL - 2); strand(WR, 2, RL - 2);

    // --- ชั้นหนังสือ (ผนังซ้าย) ---
    const sh = L('shelf');
    box(sh, 0, 31, 0, 8, 16, 46, T.wood);
    const FX = (y, z) => P(8, y, z);
    const books = ['#e56b6f', '#6c9bd2', '#f2c14e', '#8fc28a', '#b48ad6', '#f29e6b', '#5fb7b2', '#ef8fb1'];
    [[3, 13], [15, 25], [27, 37], [39, 44]].forEach(([z0, z1], r) => {
      poly(sh, [FX(32, z0), FX(46, z0), FX(46, z1), FX(32, z1)], T.wood2);
      let y = 32.4, i = 0;
      while (y < 45 && !(r === 3 && y > 38)) { const w = 1.1 + ((i * 7 + r) % 3) * 0.35, h = (z1 - z0) - 1 - ((i + r * 2) % 3); const c = books[(i * 3 + r) % books.length]; poly(sh, [FX(y, z0), FX(y + w, z0), FX(y + w, z0 + h), FX(y, z0 + h)], (x, yy) => (x % 2 && (yy % 5 === 0) ? light(c, 0.35) : c)); y += w + 0.25; i++; }
      poly(sh, [FX(31.5, z0 - 1.2), FX(46.5, z0 - 1.2), FX(46.5, z0), FX(31.5, z0)], light(T.wood, 0.15));
    });

    // --- เตาผิง ---
    const fp = L('fireplace');
    box(fp, 19, 0, 0, 18, 7, 26, T.brick, { fy: T.brick, top: light(T.brick, 0.15) });
    const FY = (x, z) => P(x, 7, z);
    poly(fp, [FY(23.5, 1), FY(32.5, 1), FY(32.5, 13), FY(31, 16), FY(28, 17), FY(25, 16), FY(23.5, 13)], '#3b2420');
    for (let z = 2; z < 26; z += 4) line(fp, ...FY(19.3, z), ...FY(23, z), light(T.brick, 0.25));
    for (let z = 2; z < 26; z += 4) line(fp, ...FY(33, z), ...FY(36.7, z), light(T.brick, 0.25));
    box(fp, 17.5, 0, 26, 21, 9, 2.4, T.wood);
    [[25, 1.2, '#7a4a2a'], [29, 1.2, '#8a5a35']].forEach(([x, z, c]) => line(fp, ...FY(x, z), ...FY(x + 5, z + 1), c));
    if (!T.fire) [[25.5, '#f7a8c6'], [28, '#fff3b0'], [30.5, '#b9a2e8']].forEach(([x, c]) => { const [px, py] = FY(x, 3); ellipse(fp, px, py - 2, 2.4, 2.2, c); fp.set(px, py - 2, '#f2c14e'); });
    const mantel = [[20.5, 'deco1'], [34.5, 'deco2']];
    mantel.forEach(([x], i) => { const [px, py] = P(x, 4, 28.4); if (i === 0) { for (let k = 0; k < 6; k++) { fp.set(px, py - k, '#fffaf0'); fp.set(px + 1, py - k, '#fffaf0'); } fp.set(px, py - 7, '#ffcf5a'); fp.set(px + 1, py - 6, '#ffb347'); } else { ellipse(fp, px, py - 3, 3, 3, T.accent2); fp.set(px, py - 6, T.leaf); fp.set(px + 1, py - 7, T.leaf); } });

    if (T.fire) [0, 1, 2].forEach((f) => {
      const fl = L('fire' + f, { outline: false });
      const sway = [0, 0.8, -0.7][f], tall = [1, 1.15, 0.9][f];
      [['#ff8a3c', 4.2, 11], ['#ffb347', 3, 8.5], ['#ffe08a', 1.6, 5.5]].forEach(([c, w, h]) => poly(fl, [FY(28 - w, 2), FY(28 + w, 2), FY(28 + w * 0.4 + sway * 0.5, 2 + h * 0.6 * tall), FY(28 + sway, 2 + h * tall), FY(28 - w * 0.5 + sway * 0.3, 2 + h * 0.55 * tall)], c));
      if (f === 1) { const [ex, ey] = FY(26.5, 14); fl.set(ex, ey, '#ffe08a'); } if (f === 2) { const [ex, ey] = FY(29.5, 13); fl.set(ex, ey, '#ffb347'); }
    });

    // --- โต๊ะเล็ก + กล่องการ์ด ---
    const tb = L('table');
    box(tb, 4.5, 15.5, 0, 1.4, 1.4, 9, T.wood2);
    box(tb, 1.5, 12, 9, 8, 8, 1.4, T.wood);
    box(tb, 3, 13.5, 10.4, 5, 5, 3.2, T.accent2);
    [[3.8, '#ffffff'], [5.1, '#fff3b0'], [6.4, '#ffffff']].forEach(([x, c]) => box(tb, x, 14.5, 13.6, 0.7, 3, 2.4, c, { top: c, fx: dark(c, 0.06) }));

    // --- อาร์มแชร์ ---
    const ac = L('armchair');
    box(ac, 13, 9, 0, 3.5, 13, 19, T.accent);
    box(ac, 13, 9, 0, 12, 2.6, 11, dark(T.accent, 0.04));
    box(ac, 15.5, 11.6, 0, 9.5, 7.8, 6.5, T.accent, { top: light(T.accent, 0.25) });
    box(ac, 13, 19.4, 0, 12, 2.6, 11, T.accent);
    [[24.5, 9.5], [24.5, 21.5]].forEach(([x, y]) => box(ac, x - 0.5, y - 0.5, 0, 1, 1, 1.6, T.wood2));
    { const [px, py] = P(19, 15, 7.4); ellipse(ac, px - 1, py - 1, 4, 2.5, light(T.accent2, 0.3)); }

    // --- กระถางเล็ก (ใต้หน้าต่างขวา) ---
    const sp = L('smallplant');
    box(sp, 47, 3, 0, 4, 4, 4, '#e09a72');
    { const [px, py] = P(49, 5, 6); ellipse(sp, px, py - 2, 4, 3.5, T.leaf); ellipse(sp, px + 1, py - 4, 2.5, 2, T.leaf2); }

    // --- พรม ---
    const rg = L('rug', { outlineT: 0.25 });
    poly(rg, ring(33, 33, 0.2, 14.5, 48), T.rug2);
    poly(rg, ring(33, 33, 0.2, 12.5, 48), (x, y) => ((x + y * 2) % 7 === 0 ? light(T.rug, 0.35) : T.rug));
    poly(rg, ring(33, 33, 0.2, 6, 32), (x, y) => ((x + y) % 2 ? T.rug2 : T.rug));

    // --- หูฟัง (วางบนพื้น) ---
    const hp = L('headphones');
    { const [cx, cy] = P(13, 41, 0); const band = T.accent2, cup = T.accent;
      for (let a = Math.PI; a <= 2 * Math.PI; a += 0.05) { hp.set(cx + Math.cos(a) * 7, cy - 3 + Math.sin(a) * 6, band); hp.set(cx + Math.cos(a) * 6, cy - 3 + Math.sin(a) * 5, light(band, 0.3)); }
      ellipse(hp, cx - 7, cy - 1, 2.6, 3.4, cup); ellipse(hp, cx + 7, cy - 1, 2.6, 3.4, cup); hp.set(cx - 8, cy - 2, light(cup, 0.5)); hp.set(cx + 6, cy - 2, light(cup, 0.5)); }

    // --- แมว (นอนบนพรม) ---
    const cat = L('cat');
    drawCat(cat, ...P(33, 33, 0), themeKey, T);

    // --- ต้นไม้ (มุมซ้าย) ---
    const tr = L('tree');
    box(tr, 2.5, 46, 0, 7, 7, 8, '#e0936b', { top: '#7a5038' });
    { const [px, py] = P(6, 49.5, 8);
      line(tr, px, py, px, py - 12, '#8a5a3a'); line(tr, px + 1, py, px + 1, py - 12, '#7a4a2a');
      if (themeKey === 'christmas') {
        [[py - 10, 13], [py - 20, 10], [py - 28, 7]].forEach(([y, w], i) => poly(tr, [[px - w, y + 4], [px + w + 1, y + 4], [px + 1, y - 10 + i]], (x, yy) => ((x + yy) % 5 === 0 ? T.leaf2 : T.leaf)));
        [[-6, -12, T.accent], [5, -15, '#ffd34d'], [-3, -21, '#ffffff'], [4, -24, T.accent], [-5, -6, '#7fd6ff'], [6, -7, '#ffffff']].forEach(([dx, dy, c]) => { tr.set(px + dx, py + dy, c); tr.set(px + dx + 1, py + dy, c); });
        [[0, 0], [-1, 1], [1, 1], [0, 1], [0, 2], [-2, 1], [2, 1]].forEach(([dx, dy]) => tr.set(px + 1 + dx, py - 41 + dy, '#ffd34d'));
      } else {
        [[0, -20, 10, 8], [-7, -15, 7, 6], [7, -16, 7, 6], [0, -27, 7, 5], [-4, -24, 6, 5], [5, -24, 6, 5]].forEach(([dx, dy, rx, ry], i) => ellipse(tr, px + dx, py + dy, rx, ry, (x, y) => ((x * 3 + y * 5) % 11 === 0 ? '#ffffff' : (x + y) % 4 === 0 ? T.leaf2 : i % 2 ? T.leaf : mix(T.leaf, T.leaf2, 0.4))));
      } }

    // --- ของมุมห้องตามธีม (มุมขวาหน้า) ---
    const cn = L('corner');
    { const [cx, cy] = P(52, 31, 0);
      if (themeKey === 'sakura') { ellipse(cn, cx, cy, 7, 2.5, '#ffffff'); line(cn, cx - 6, cy - 1, cx + 5, cy - 10, '#c9935e'); [['#f7a8c6', 0], ['#ffffff', 3.3], ['#9fd88a', 6.6]].forEach(([c, t]) => ellipse(cn, cx - 4 + t, cy - 3.5 - t * 0.85, 2.2, 2.2, c)); }
      else if (themeKey === 'spring') { ellipse(cn, cx, cy - 3, 6, 3.6, '#7fcf6e'); ellipse(cn, cx, cy - 2, 4, 2, '#c5ecb0'); [-3, 3].forEach((dx) => { ellipse(cn, cx + dx, cy - 7, 1.8, 1.8, '#ffffff'); cn.set(cx + dx, cy - 7, '#2a2a2a'); }); cn.set(cx - 5, cy - 4, '#f59ab8'); cn.set(cx + 5, cy - 4, '#f59ab8'); line(cn, cx - 1, cy - 4, cx + 1, cy - 4, '#3f7a3a'); }
      else if (themeKey === 'autumn') { poly(cn, [[cx - 4, cy], [cx + 4, cy], [cx + 4, cy - 7], [cx - 4, cy - 7]], '#fff1d6'); poly(cn, [[cx - 1, cy], [cx + 1, cy], [cx + 1, cy - 4], [cx - 1, cy - 4]], '#a0643c'); ellipse(cn, cx, cy - 8, 8, 5, (x, y) => (y > cy - 8 ? '#ffffff00' : '#e2552e')); poly(cn, [[cx - 8, cy - 8], [cx + 8, cy - 8], [cx + 8, cy - 7], [cx - 8, cy - 7]], '#c94322'); [[-4, -11], [3, -12], [0, -10]].forEach(([dx, dy]) => { cn.set(cx + dx, cy + dy, '#fff1d6'); cn.set(cx + dx + 1, cy + dy, '#fff1d6'); }); }
      else { box(cn, 49, 28, 0, 5, 5, 5, T.accent); box(cn, 50, 34, 0, 3.5, 3.5, 3.5, T.accent2); const [rx, ry] = P(51.5, 33, 2.5); line(cn, rx - 4, ry - 2, rx + 4, ry + 2, '#ffe6a8'); const [tx, ty] = P(51.5, 30.5, 5); [[0, 0], [-1, -1], [1, -1]].forEach(([dx, dy]) => cn.set(tx + dx, ty + dy, '#ffe6a8')); } }

    layers.forEach(outline);
    layers.forEach((l) => { let a = W, b = H, c = 0, d = 0; l.px.forEach((_, k) => { const x = k % W, y = (k / W) | 0; if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; }); l.bbox = [a, b, c + 1, d + 1]; });
    return layers;
  }

  function drawCat(L, ax, ay, themeKey, T) {
    const o = '#f4a65a', d = '#d9803a', w = '#fde7c8', k = '#6b3b22', p = '#f59ab8';
    const cx = ax + 2, cy = ay + 1;
    ellipse(L, cx + 4, cy - 5, 10, 5, (x, y) => (y >= cy - 2 ? w : ((x - cx) % 4 === 0 && y < cy - 6 ? d : o)));
    ellipse(L, cx - 8, cy - 7, 5.5, 5, (x, y) => (y >= cy - 3 ? w : o));
    poly(L, [[cx - 13, cy - 9], [cx - 12, cy - 15], [cx - 9, cy - 11]], o); poly(L, [[cx - 7, cy - 11], [cx - 4, cy - 15], [cx - 3, cy - 9]], o);
    L.set(cx - 12, cy - 12, p); L.set(cx - 4, cy - 12, p);
    [[cx - 11, cy - 7], [cx - 10, cy - 7], [cx - 6, cy - 7], [cx - 5, cy - 7]].forEach(([x, y]) => L.set(x, y, k));
    L.set(cx - 8, cy - 5, p); L.set(cx - 12, cy - 5, light(p, 0.3)); L.set(cx - 4, cy - 5, light(p, 0.3));
    for (let a = 0; a < 3.2; a += 0.08) { L.set(cx + 13 + Math.cos(a) * 3, cy - 2 + Math.sin(a) * 2.5, d); }
    for (let x = cx - 2; x < cx + 13; x++) L.set(x, cy, d);
    if (themeKey === 'christmas') { poly(L, [[cx - 13, cy - 11], [cx - 3, cy - 11], [cx - 2, cy - 17]], '#d6455d'); line(L, cx - 13, cy - 11, cx - 3, cy - 11, '#ffffff'); ellipse(L, cx - 1, cy - 17, 1.5, 1.5, '#ffffff'); }
    else if (themeKey === 'sakura') { [[-12, -12, '#f7a8c6'], [-9, -13, '#ffffff'], [-6, -13, '#b9a2e8'], [-3, -12, '#f7a8c6']].forEach(([dx, dy, c]) => { L.set(cx + dx, cy + dy, c); L.set(cx + dx + 1, cy + dy, c); L.set(cx + dx, cy + dy - 1, c); }); }
    else if (themeKey === 'autumn') { for (let x = cx - 12; x <= cx - 3; x++) { L.set(x, cy - 2, (x % 2) ? '#c94322' : '#e8c27a'); L.set(x, cy - 1, (x % 2) ? '#e8c27a' : '#c94322'); } L.set(cx - 3, cy, '#c94322'); }
    else { L.set(cx - 7, cy - 13, '#7fcf6e'); L.set(cx - 6, cy - 14, '#7fcf6e'); L.set(cx - 7, cy - 14, '#b5e6a3'); L.set(cx - 7, cy - 12, '#5a9a4a'); }
  }

  /* ================= สไปรต์ฉากหลัง ================= */
  function spriteSVG(w, h, draw, cls, label) {
    const L = new Layer('s'); const savedW = W; // ใช้กริดเดียวกันแต่วาดที่มุมซ้ายบน
    draw(L); outline(L);
    let s = ''; const byC = new Map();
    for (let y = 0; y < h + 1; y++) for (let x = 0; x < w + 1; x++) { const c = L.get(x, y); if (!c) continue; if (!byC.has(c)) byC.set(c, []); byC.get(c).push(`M${x} ${y}h1v1h-1z`); }
    byC.forEach((d, c) => { s += `<path fill="${c}" d="${d.join('')}"/>`; });
    return `<svg class="${cls}" viewBox="0 0 ${w + 1} ${h + 1}" width="${(w + 1) * 3}" height="${(h + 1) * 3}" shape-rendering="crispEdges" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${s}</svg>`;
  }
  const SPR = {
    cloud: () => spriteSVG(22, 10, (L) => { ellipse(L, 7, 6, 6, 4, '#ffffff'); ellipse(L, 13, 4.5, 6, 4.5, '#ffffff'); ellipse(L, 18, 6.5, 4, 3, '#ffffff'); }, 'bg-cloud'),
    star: (c = '#ffe27a') => spriteSVG(14, 14, (L) => { const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7, a = (i / 10) * 6.283 - 1.57; pts.push([7 + Math.cos(a) * r, 7.5 + Math.sin(a) * r]); } poly(L, pts, c); L.set(5, 7, '#6b3b22'); L.set(9, 7, '#6b3b22'); L.set(6, 9, '#6b3b22'); L.set(7, 10, '#6b3b22'); L.set(8, 9, '#6b3b22'); L.set(4, 9, '#f59ab8'); L.set(10, 9, '#f59ab8'); }, 'bg-star'),
    sparkle: (c = '#ffffff') => spriteSVG(7, 7, (L) => { for (let i = 0; i < 7; i++) { L.set(3, i, c); L.set(i, 3, c); } }, 'bg-sparkle'),
    rainbow: () => spriteSVG(30, 15, (L) => { ['#ff9aa2', '#ffc98b', '#fff1a1', '#b5ead7', '#a7c7ff', '#cdb4ff'].forEach((c, i) => { for (let a = Math.PI; a <= 2 * Math.PI; a += 0.01) { const r = 14 - i; L.set(15 + Math.cos(a) * r, 15 + Math.sin(a) * r, c); } }); }, 'bg-rainbow'),
    moon: () => spriteSVG(12, 12, (L) => { ellipse(L, 6, 6, 5.5, 5.5, (x, y) => ((x - 9) ** 2 + (y - 4) ** 2 < 22 ? undefined : '#fff2a8')); }, 'bg-moon'),
    folder: () => spriteSVG(18, 14, (L) => { poly(L, [[1, 3], [7, 3], [8, 5], [17, 5], [17, 13], [1, 13]], '#ffd76e'); poly(L, [[1, 6], [17, 6], [17, 13], [1, 13]], '#ffe8a3'); }, 'game-folder'),
  };
  // ellipse กับ colorFn ที่คืน undefined = ไม่วาด
  const _set = Layer.prototype.set; Layer.prototype.set = function (x, y, c) { if (!c || c === '#ffffff00') return; _set.call(this, x, y, c); };

  function catAvatar() {
    const L = new Layer('av'); drawCat(L, 18, 18, state.theme, CORE.themes[state.theme].room); outline(L);
    let s = ''; const byC = new Map(); for (let y = 0; y < 22; y++) for (let x = 0; x < 36; x++) { const c = L.get(x, y); if (c) { if (!byC.has(c)) byC.set(c, []); byC.get(c).push(`M${x} ${y}h1v1h-1z`); } }
    byC.forEach((d, c) => { s += `<path fill="${c}" d="${d.join('')}"/>`; });
    return `<svg viewBox="2 2 30 19" shape-rendering="crispEdges" aria-hidden="true">${s}</svg>`;
  }

  /* ================= สถานะ ================= */
  const KEY = 'nihongoRoom.v1';
  const DEF_UI = { theme: 'sakura', todayOpen: true, night: false, sound: false, reduce: false, stickers: [] };
  const state = (() => { const d = { ...DEF_UI }; try { return Object.assign(d, (JSON.parse(localStorage.getItem(KEY)) || {}).ui || {}); } catch { return d; } })();
  function save() { try { const all = JSON.parse(localStorage.getItem(KEY) || '{}'); all.v = 1; all.ui = { theme: state.theme, todayOpen: state.todayOpen, night: state.night, sound: state.sound, reduce: state.reduce, stickers: state.stickers }; localStorage.setItem(KEY, JSON.stringify(all)); } catch { document.body.classList.add('nosave'); } }

  const $ = (s, r = document) => r.querySelector(s); const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reducedOS = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => state.reduce || reducedOS.matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  /* ================= ของที่กดได้ ================= */
  const OBJ = CORE.objects;
  const MAIN = { shelf: 'บทเรียน', armchair: 'ไวยากรณ์', table: 'การ์ด', wreath: 'คันจิ', headphones: 'ฟังและพูดตาม', windowR: 'แพลนเนอร์' };
  const INTERACTIVE = ['garland', 'windowL', 'windowR', 'wreath', 'shelf', 'fireplace', 'table', 'armchair', 'tree', 'headphones', 'cat', 'corner'];
  const CORNER = {
    sakura: { jp: '団子', kana: 'だんご', th: 'ขนมดังโงะ' }, spring: { jp: 'カエル', kana: 'かえる', th: 'กบ' },
    autumn: { jp: 'きのこの家', kana: 'きのこのいえ', th: 'บ้านเห็ด' }, christmas: { jp: 'プレゼント', kana: 'ぷれぜんと', th: 'ของขวัญ' },
  };
  const PRAISE = [['よくできました！', 'ทำได้ดีมาก!'], ['がんばってるね！', 'ขยันจังเลยนะ!'], ['にゃ〜♪', 'เมี้ยว~'], ['いっしょに がんばろう！', 'สู้ไปด้วยกันนะ!']];

  let rooms = {}, meta = {};
  function renderRoom() {
    const t = state.theme;
    if (!rooms[t]) { const ls = drawRoom(t); meta[t] = Object.fromEntries(ls.map((l) => [l.id, l.bbox])); meta[t].__garland = garlandBins(ls.find((l) => l.id === 'garland'));
      rooms[t] = ls.map((l) => `<g class="obj obj-${l.id}" id="o-${l.id}" data-obj="${l.id}">${toSVG(l)}</g>`).join(''); }
    const fx = CORE.themes[t].room;
    $('#room').innerHTML = `<defs><filter id="glow" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="1" result="a"/><feMorphology in="SourceAlpha" operator="dilate" radius="2" result="b"/><feFlood class="glow1" result="c1"/><feComposite in="c1" in2="a" operator="in" result="o1"/><feFlood class="glow2" result="c2"/><feComposite in="c2" in2="b" operator="in" result="o2"/><feMerge><feMergeNode in="o2"/><feMergeNode in="o1"/><feMergeNode in="SourceGraphic"/></feMerge></filter><mask id="roomMask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><use href="#roomAll"/></mask></defs>`
      + `<g id="roomAll">${rooms[t]}</g>`
      + `<g class="night-layer" aria-hidden="true" mask="url(#roomMask)"><rect width="${W}" height="${H}" class="night-shade"/>${fx.fire ? '<ellipse class="night-glow" cx="' + P(28, 7, 8)[0] + '" cy="' + P(28, 7, 8)[1] + '" rx="46" ry="30"/>' : ''}<ellipse class="night-glow lamp" cx="${P(20.5, 4, 34)[0]}" cy="${P(20.5, 4, 34)[1]}" rx="14" ry="12"/></g>`
      + `<rect class="dim" width="${W}" height="${H}" mask="url(#roomMask)"/><use class="hilite" href="" />`;
    buildHits();
  }
  function garlandBins(l) {
    const bins = new Map(); l.px.forEach((_, k) => { const x = k % W, y = (k / W) | 0, b = Math.floor(x / 22); const v = bins.get(b) || [W, H, 0, 0]; bins.set(b, [Math.min(v[0], x), Math.min(v[1], y), Math.max(v[2], x + 1), Math.max(v[3], y + 1)]); });
    return [...bins.values()];
  }
  function buildHits() {
    const m = meta[state.theme]; const h = $('#hits'); const pct = (v, t) => (v / t) * 100 + '%';
    const btn = (id, bb, extra = '') => `<button class="hit" data-obj="${id}" style="--cx:${pct((bb[0] + bb[2]) / 2, W)};--cy:${pct((bb[1] + bb[3]) / 2, H)};--w:${pct(bb[2] - bb[0], W)};--h:${pct(bb[3] - bb[1], H)}" ${extra}></button>`;
    const label = (id) => (id === 'corner' ? `${CORNER[state.theme].th} (${CORNER[state.theme].kana})` : OBJ[id].th);
    h.innerHTML = INTERACTIVE.map((id) => {
      if (id === 'garland') return m.__garland.map((bb, i) => btn(id, bb, i ? 'tabindex="-1" aria-hidden="true"' : `aria-label="${label(id)}"`)).join('');
      return btn(id, m[id], `aria-label="${label(id)}"`);
    }).join('');
  }

  /* ---- ไฮไลต์ / ป้ายชื่อ ---- */
  let hotId = null, labelT;
  function setHot(id, showLabel = true) {
    if (hotId === id) return; hotId = id; const svg = $('#room');
    svg.classList.toggle('focusing', !!id);
    const use = $('.hilite', svg); use.setAttribute('href', id ? '#o-' + id : '');
    if (id) $$('.hit').forEach((b) => b.classList.toggle('on', b.dataset.obj === id));
    if (id && showLabel) showTag(id); else hideTag();
  }
  function showTag(id) {
    const bb = meta[state.theme][id]; const tag = $('#tag');
    tag.innerHTML = id === 'corner' ? `<span lang="ja">${CORNER[state.theme].kana}</span> · ${CORNER[state.theme].th}` : OBJ[id].th.replace(' · ', ' · <b>') + '</b>';
    tag.classList.add('show'); place(tag, (bb[0] + bb[2]) / 2, bb[1]); clearTimeout(labelT);
  }
  // วางลูกโป่งไม่ให้ล้นขอบส่วนที่มองเห็นของห้อง (สำคัญบนมือถือที่ห้องเลื่อนได้)
  function place(el, xUnits, yUnits) {
    const cv = $('#canvas'), wrap = $('#roomScroll'); const sx = cv.clientWidth / W;
    el.style.top = (yUnits / H) * 100 + '%'; let x = xUnits * sx; const half = el.offsetWidth / 2 + 6;
    const visL = wrap.scrollLeft - cv.offsetLeft, visR = visL + wrap.clientWidth;
    x = Math.max(visL + half, Math.min(visR - half, x)); el.style.left = x + 'px';
  }
  function hideTag() { $('#tag').classList.remove('show'); }

  /* ---- ลูกโป่งคำพูดของแมว ---- */
  let sayT;
  function say(jp, th, ms = 3200) {
    const b = $('#say'); const bb = meta[state.theme].cat;
    b.innerHTML = `<span lang="ja">${jp}</span>${th ? `<small>${th}</small>` : ''}`;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); hideTag(); place(b, (bb[0] + bb[2]) / 2, bb[1]); clearTimeout(sayT); sayT = setTimeout(() => b.classList.remove('show'), ms);
  }

  /* ---- เสียง (Web Audio · ปิดเป็นค่าเริ่มต้น) ---- */
  let AC = null;
  const audio = () => { if (!state.sound) return null; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; } catch { return null; } };
  function beep(freqs, dur = 0.18, vol = 0.12, type = 'square') { const c = audio(); if (!c) return; vol *= (typeof sets !== 'undefined' ? sets.volFx : 0.6) / 0.6; freqs.forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; const t = c.currentTime + i * 0.07; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02); }); }
  function purr() { const c = audio(); if (!c) return; const n = c.sampleRate * 1.2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (0.55 + 0.45 * Math.sin((i / c.sampleRate) * 2 * Math.PI * 23)) * Math.sin((i / n) * Math.PI); const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 170; const g = c.createGain(); g.gain.value = 0.55; s.connect(f).connect(g).connect(c.destination); s.start(); }
  const SFX = { tap: () => beep([880], 0.08, 0.06), open: () => beep([660, 990], 0.12, 0.07), boing: () => beep([330, 520, 300], 0.14, 0.08, 'triangle'), chime: () => beep([1046, 1318, 1568], 0.35, 0.06, 'sine'), purr, night: () => beep([520, 390], 0.2, 0.06, 'triangle') };

  /* ---- เอฟเฟกต์ตอนคลิก: รอยเท้าแมว + ประกายพิกเซล ---- */
  const FX_SHAPES = { petal: ['#f7a8c6', [[0, 1], [1, 0], [1, 1], [2, 1], [1, 2]]], leaf: ['#7fcf6e', [[0, 2], [1, 1], [2, 0], [1, 2], [2, 1]]], maple: ['#ee7d3a', [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [0, 2], [2, 2]]], snow: ['#ffffff', [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]] };
  const pixSVG = (pts, c, n = 3) => `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges">${pts.map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`).join('')}</svg>`;
  const PAW = [[1, 0], [3, 0], [0, 2], [4, 2], [1, 3], [2, 3], [3, 3], [1, 4], [2, 4], [3, 4], [2, 2]];
  function clickFX(x, y, touch) {
    if (calm()) return; const kind = CORE.themes[state.theme].fx; const [c, shape] = FX_SHAPES[kind];
    const host = document.body;
    if (!touch) { const p = document.createElement('span'); p.className = 'fx-paw'; p.innerHTML = pixSVG(PAW, getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e05a92', 5); p.style.left = x + 'px'; p.style.top = y + 'px'; host.appendChild(p); setTimeout(() => p.remove(), 700); }
    const n = touch ? 4 : 7;
    for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'fx-spark'; s.innerHTML = pixSVG(shape, c); const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, r = (touch ? 22 : 30) + Math.random() * 14; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.setProperty('--dx', Math.round(Math.cos(a) * r) + 'px'); s.style.setProperty('--dy', Math.round(Math.sin(a) * r) + 'px'); host.appendChild(s); setTimeout(() => s.remove(), 650); }
  }

  /* ---- ของลอยตามฤดู ---- */
  function buildFloaters() {
    const host = $('#floaters'); const kind = CORE.themes[state.theme].fx; const [c, shape] = FX_SHAPES[kind];
    const lay = layoutName(); const n = calm() ? 0 : lay === 'desktop' ? 30 : lay === 'mobile' ? 12 : 20;
    let h = ''; for (let i = 0; i < n; i++) { const dur = (kind === 'snow' ? 9 : 12) + Math.random() * 8; h += `<span class="floater" style="left:${(Math.random() * 100).toFixed(1)}%;--dur:${dur.toFixed(1)}s;--delay:${(-Math.random() * dur).toFixed(1)}s;--sway:${(Math.random() * 40 + 10).toFixed(0)}px">${pixSVG(shape, c)}</span>`; }
    host.innerHTML = h;
  }

  /* ---- โพโมโดโร่ (ต้นไม้) ---- */
  const timer = { focus: 25, brk: 5, mode: 'focus', left: 25 * 60, running: false, id: 0, drop: 0 };
  function tick() {
    if (timer.left > 0) timer.left--;
    if (timer.left === 0) { SFX.chime(); if (timer.mode === 'focus') { timer.mode = 'brk'; timer.left = timer.brk * 60; say('おつかれさま！', 'เหนื่อยหน่อยนะ พัก 5 นาทีกัน'); } else { timer.mode = 'focus'; timer.left = timer.focus * 60; toggleTimer(false); say('さあ、つづけよう！', 'เอาล่ะ เรียนต่อกันเถอะ'); } }
    showTimer(); if (!calm() && !document.hidden && ++timer.drop % 2 === 0) dropFromTree();
  }
  function toggleTimer(on = !timer.running) {
    timer.running = on; clearInterval(timer.id); if (on) timer.id = setInterval(tick, 1000);
    document.body.classList.toggle('timer-on', on); showTimer();
  }
  function showTimer() { const m = String(Math.floor(timer.left / 60)).padStart(2, '0') + ':' + String(timer.left % 60).padStart(2, '0'); $$('.timer-read').forEach((e) => (e.textContent = (timer.mode === 'brk' ? '☕ ' : '🌳 ') + m + (timer.running ? '' : ' ⏸'))); }
  function dropFromTree() {
    const bb = meta[state.theme].tree; const kind = CORE.themes[state.theme].fx; const [c, shape] = FX_SHAPES[kind];
    const s = document.createElement('span'); s.className = 'tree-drop'; s.innerHTML = pixSVG(shape, c);
    s.style.left = ((bb[0] + Math.random() * (bb[2] - bb[0])) / W) * 100 + '%'; s.style.top = ((bb[1] + (bb[3] - bb[1]) * 0.35) / H) * 100 + '%';
    $('#canvas').appendChild(s); setTimeout(() => s.remove(), 2600);
  }

  /* ---- หน้าต่างป๊อปอัปเล็ก (คำศัพท์ประจำฤดู) ---- */
  function popCard(html) { const p = $('#pop'); p.innerHTML = `<div class="pop-bar"><span class="pixel">♡ word.exe</span><button class="pop-x" aria-label="ปิด">×</button></div><div class="pop-body">${html}</div>`; p.hidden = false; p.classList.remove('in'); void p.offsetWidth; p.classList.add('in'); $('.pop-x', p).focus(); }
  function collect(id, label) { if (!state.stickers.includes(id)) { state.stickers.push(id); save(); updateStickers(); return true; } return false; }
  function updateStickers() { $$('.sticker-count').forEach((e) => (e.textContent = state.stickers.length)); }

  /* ---- กดของ ---- */
  let seasonIdx = 0;
  function activate(id, ev) {
    if (!id) return;
    if (MAIN[id]) { bounce(id); openPanel({ shelf: 'lessons', armchair: 'grammar', table: 'cards', wreath: 'kanji', headphones: 'listen', windowR: 'planner' }[id]); return; }
    switch (id) {
      case 'fireplace': state.night = !state.night; save(); syncNight(); SFX.night(); say(state.night ? 'おやすみ…' : 'おはよう！', state.night ? 'โหมดกลางคืน 🌙' : 'โหมดกลางวัน ☀️'); break;
      case 'tree': toggleTimer(); SFX.tap(); say(timer.running ? 'がんばろう！' : 'ひとやすみ', timer.running ? `เริ่มจับเวลา ${timer.mode === 'focus' ? timer.focus : timer.brk} นาที 🌳` : 'หยุดจับเวลาไว้ก่อน'); break;
      case 'cat': { SFX.purr(); hearts(); const p = PRAISE[Math.floor(Math.random() * PRAISE.length)]; say(p[0], p[1]); break; }
      case 'windowL': { const list = CORE.seasonal[state.theme]; const w = list[seasonIdx++ % list.length]; SFX.chime(); bounce(id);
        popCard(`<p class="pop-jp" lang="ja"><ruby>${w.jp}<rt>${w.kana}</rt></ruby></p><p>${w.th}</p><button class="jelly pop-keep" data-key="season-${state.theme}-${w.jp}">⭐ เก็บเข้าแฟลชการ์ดและสมุดสติกเกอร์</button>`); break; }
      case 'corner': { const c = CORNER[state.theme]; SFX.boing(); bounce(id); const isNew = collect('corner-' + state.theme); say(`${c.jp}（${c.kana}）`, `= ${c.th}${isNew ? ' · ได้สติกเกอร์ใหม่! 🌟' : ''}`); break; }
      case 'garland': SFX.chime(); blink(); break;
    }
  }
  function bounce(id) { if (calm()) return; const g = $('#o-' + id); g.classList.remove('boing'); void g.getBBox(); g.classList.add('boing'); setTimeout(() => g.classList.remove('boing'), 650); }
  function blink() { if (calm()) return; const g = $('#o-garland'); g.classList.add('blink'); setTimeout(() => g.classList.remove('blink'), 1800); }
  function hearts() {
    if (calm()) return; const bb = meta[state.theme].cat;
    for (let i = 0; i < 3; i++) { const s = document.createElement('span'); s.className = 'heart'; s.innerHTML = pixSVG([[1, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [2, 3]], '#ff6f9a', 5); s.style.left = ((bb[0] + 4 + i * 7) / W) * 100 + '%'; s.style.top = (bb[1] / H) * 100 + '%'; s.style.animationDelay = i * 0.15 + 's'; $('#canvas').appendChild(s); setTimeout(() => s.remove(), 1700); }
  }
  function syncNight() { $('#stage').classList.toggle('night', state.night); }
  function setUrl(p) { $('#urlPath').textContent = p; }

  /* ---- เคอร์เซอร์อุ้งเท้า (สีตามธีม) ---- */
  function cursorFor(c) {
    const svg = (pts, w, h, extra = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${w * 3}' height='${h * 3}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'>${extra}${pts.map(([x, y, f]) => `<rect x='${x}' y='${y}' width='1' height='1' fill='${f}'/>`).join('')}</svg>`;
    const o = '#4a2440', pad = [[1, 0], [3, 0], [5, 0], [0, 2], [6, 2], [2, 3], [3, 3], [4, 3], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [2, 5], [3, 5], [4, 5]];
    const outlined = (pts) => { const set = new Set(pts.map(([x, y]) => x + ',' + y)); const out = []; pts.forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = (x + dx) + ',' + (y + dy); if (!set.has(k)) { set.add(k); out.push([x + dx, y + dy, o]); } })); return [...out, ...pts.map(([x, y]) => [x, y, c])]; };
    const sh = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
    const paw = outlined(sh(pad, 1, 1)); const point = outlined(sh([[3, 0], [3, 1], [3, 2], [2, 3], [3, 3], [4, 3], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [2, 6], [3, 6], [4, 6]], 1, 1));
    const enc = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
    return { def: `${enc(svg(paw, 9, 8))} 4 4, auto`, ptr: `${enc(svg(point, 9, 9))} 12 3, pointer` };
  }

  /* ================= การแสดงผล ================= */
  function applyTheme() {
    setTimeout(() => typeof syncThemeNav === 'function' && syncThemeNav());
    const th = CORE.themes[state.theme]; const u = th.ui; const r = document.documentElement.style;
    Object.entries(u).forEach(([k, v]) => r.setProperty('--' + k, v));
    const cur = cursorFor(u.accent); r.setProperty('--cur', cur.def); r.setProperty('--cur-ptr', cur.ptr);
    r.setProperty('--glow1', '#ffffff'); r.setProperty('--glow2', u.accent);
    document.documentElement.dataset.theme = state.theme;
    $('meta[name=theme-color]').setAttribute('content', u.bar1);
    $$('.theme-btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.theme === state.theme));
    hotId = null; renderRoom(); $$('.avatar').forEach((a) => (a.innerHTML = catAvatar()));
    const sw = CORE.seasonal[state.theme][0]; $$('.season-word').forEach((e) => (e.innerHTML = `<ruby lang="ja">${sw.jp}<rt>${sw.kana}</rt></ruby> = ${sw.th}`));
    buildFloaters(); syncNight();
  }
  function fitRoom() {
    const wrap = $('#roomScroll'), cv = $('#canvas'); if (!wrap) return;
    const dpr = window.devicePixelRatio || 1; const mobile = layoutName() === 'mobile';
    const aw = wrap.clientWidth - (mobile ? 0 : 24), ah = wrap.clientHeight - 16;
    let k = mobile ? Math.floor((ah * dpr) / H) : Math.floor(Math.min((aw * dpr) / W, (ah * dpr) / H));
    k = Math.max(Math.round(dpr), k); const css = k / dpr;
    cv.style.width = W * css + 'px'; cv.style.height = H * css + 'px';
    document.documentElement.style.setProperty('--px', css + 'px');
    if (mobile && !fitRoom.centered) { wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2; fitRoom.centered = true; }
    if (!mobile) fitRoom.centered = false;
    updateDots();
  }
  function layoutName() { const a = $('#app'), w = a.clientWidth, h = a.clientHeight; return w < 768 || (h < 500 && w < 1024) ? 'mobile' : w < 1024 ? 'tablet-p' : w < 1200 ? 'tablet-l' : 'desktop'; }
  let lastLayout = '';
  function updateLayout() { const n = layoutName(); $('#app').dataset.layout = n; fitRoom(); if (n !== lastLayout) { lastLayout = n; buildFloaters(); } }
  function updateDots() {
    const wrap = $('#roomScroll'); const max = wrap.scrollWidth - wrap.clientWidth; const i = max <= 2 ? 1 : Math.round((wrap.scrollLeft / max) * 2);
    $$('.room-dots button').forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
  }

  /* ================= ประกอบหน้า ================= */
  function buildBackground() {
    const items = [['cloud', 6, 12], ['cloud', 70, 6], ['cloud', 86, 62], ['star', 14, 70], ['star', 90, 22], ['sparkle', 30, 8], ['sparkle', 60, 84], ['sparkle', 80, 40], ['rainbow', 3, 40], ['moon', 50, 3]];
    $('#bgDeco').innerHTML = items.map(([k, x, y], i) => `<span class="deco deco-${k}" style="left:${x}%;top:${y}%;--d:${i * 0.7}s">${SPR[k]()}</span>`).join('');
    $('#gameFolder').insertAdjacentHTML('afterbegin', SPR.folder());
  }
  function buildLists() {
    const next = CORE.lessons[0];
    $$('.continue-title').forEach((e) => (e.innerHTML = `บทที่ ${next.n} · ${next.th}<br><span lang="ja">${next.jp}</span>`));
    $('#lessonMini').innerHTML = CORE.lessons.slice(0, 6).map((l) => `<li><span class="st" aria-label="ยังไม่เริ่ม">◻️</span> บทที่ ${l.n} · ${l.th}</li>`).join('') + `<li class="more">… อีก ${CORE.lessons.length - 6} บท</li>`;
    $('#themeBtns').innerHTML = $('#themeBtnsBar').innerHTML = Object.entries(CORE.themes).map(([k, t]) => `<button class="theme-btn jelly" data-theme="${k}" aria-pressed="false" title="${t.name}"><span aria-hidden="true">${t.icon}</span><span class="tn">${t.name}</span></button>`).join('');
  }
  function clock() { const d = new Date(); $$('.clock').forEach((e) => (e.textContent = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }))); const th = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'][d.getDay()]; $$('.today-date').forEach((e) => (e.textContent = `วัน${th} ที่ ${d.getDate()}`)); }
  function syncToggles() {
    $$('.sound-btn').forEach((b) => { b.textContent = state.sound ? '🔊' : '🔇'; b.setAttribute('aria-pressed', state.sound); b.setAttribute('aria-label', state.sound ? 'ปิดเสียง' : 'เปิดเสียง'); });
    $$('.calm-btn').forEach((b) => { b.setAttribute('aria-pressed', state.reduce); b.textContent = state.reduce ? '🐢 ลดการเคลื่อนไหว: เปิด' : '✨ ลดการเคลื่อนไหว: ปิด'; });
    document.body.classList.toggle('calm', calm());
  }

  function init() {
    initPanels(); buildBackground(); buildLists(); applyTheme(); syncToggles(); showTimer(); updateStickers(); refreshSide();
    const inFrame = (() => { try { return window.self !== window.top; } catch { return true; } })();
    document.body.classList.toggle('in-frame', inFrame);
    if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) document.body.classList.add('standalone');
    $('#openFull').addEventListener('click', () => window.open(location.href, '_blank', 'noopener'));

    // ---- ของในห้อง: เมาส์ / นิ้ว / ปากกา / คีย์บอร์ด ----
    const hits = $('#hits'); let press = null;
    hits.addEventListener('pointerover', (e) => { const b = e.target.closest('.hit'); if (b && e.pointerType === 'mouse') setHot(b.dataset.obj); });
    hits.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setHot(null); });
    hits.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.hit'); if (!b || e.pointerType === 'mouse') return;
      press = { id: b.dataset.obj, long: false, t: setTimeout(() => { press.long = true; setHot(press.id); if (navigator.vibrate) navigator.vibrate(8); }, 400) };
    });
    const endPress = () => { if (press) clearTimeout(press.t); };
    hits.addEventListener('pointerup', endPress); hits.addEventListener('pointercancel', () => { endPress(); press = null; });
    hits.addEventListener('contextmenu', (e) => { if (e.target.closest('.hit')) e.preventDefault(); });
    hits.addEventListener('click', (e) => {
      const b = e.target.closest('.hit'); if (!b) return;
      if (press && press.long) { press = null; setTimeout(() => setHot(null), 1200); return; }
      const touch = !!press; press = null;
      const r = b.getBoundingClientRect(); const x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2;
      if (touch) { setHot(b.dataset.obj, false); setTimeout(() => setHot(null), 450); }
      activate(b.dataset.obj, e); if (!(e.clientX || e.clientY)) clickFX(x, y, false);
    });
    let lastPtr = 0; hits.addEventListener('pointerdown', () => (lastPtr = Date.now()), true);
    hits.addEventListener('focusin', (e) => { const b = e.target.closest('.hit'); if (b && Date.now() - lastPtr > 600) setHot(b.dataset.obj); });
    hits.addEventListener('focusout', () => setHot(null));

    // ---- คลิกที่ใดก็ได้: ประกาย / รอยเท้า ----
    document.addEventListener('pointerdown', (e) => { if (e.button === 0) clickFX(e.clientX, e.clientY, e.pointerType !== 'mouse'); }, { passive: true });

    document.addEventListener('click', (e) => {
      const tb = e.target.closest('.theme-btn'); if (tb) { state.theme = tb.dataset.theme; save(); applyTheme(); SFX.tap(); }
      const tg = e.target.closest('#todayToggle'); if (tg) { state.todayOpen = !state.todayOpen; save(); syncToday(); }
      const dot = e.target.closest('.room-dots button'); if (dot) { const wrap = $('#roomScroll'); const max = wrap.scrollWidth - wrap.clientWidth; wrap.scrollTo({ left: (max * +dot.dataset.i) / 2, behavior: calm() ? 'auto' : 'smooth' }); }
      if (e.target.closest('.sound-btn')) { state.sound = !state.sound; save(); syncToggles(); if (state.sound) { audio(); SFX.chime(); } }
      if (e.target.closest('.calm-btn')) { state.reduce = !state.reduce; save(); syncToggles(); buildFloaters(); }
      if (e.target.closest('.hint-btn')) reveal();
      if (e.target.closest('.timer-read')) activate('tree');
      if (e.target.closest('.pop-x')) closePop();
      const keep = e.target.closest('.pop-keep'); if (keep) { const isNew = collect(keep.dataset.key); { const jp = keep.dataset.key.split('-').slice(2).join('-'); const w = Object.values(CORE.seasonal).flat().find((x) => x.jp === jp); if (w && !prog.collected.some((c) => c.jp === jp)) { prog.collected.push(w); grade('s:' + jp, false); saveAll(); } } keep.textContent = isNew ? '🌟 เก็บแล้ว! อยู่ในกล่องการ์ด → คำที่เก็บจากในห้อง' : '✔ เก็บไว้แล้ว'; keep.disabled = true; SFX.chime(); }
      const soon = e.target.closest('[data-soon]'); if (soon) toast(soon.dataset.soon || 'เร็ว ๆ นี้ 🐾');
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closePop(); setHot(null); } });
    $('#roomScroll').addEventListener('scroll', () => requestAnimationFrame(updateDots), { passive: true });
    syncToday();
    new ResizeObserver(updateLayout).observe($('#app'));
    window.addEventListener('orientationchange', () => setTimeout(updateLayout, 250));
    reducedOS.addEventListener?.('change', () => { syncToggles(); buildFloaters(); });
    clock(); setInterval(clock, 30000);
    document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));
    new IntersectionObserver(([en]) => document.body.classList.toggle('room-off', !en.isIntersecting)).observe($('#stage'));
    if (!sessionStorage.getItem('nr-greet')) { setTimeout(() => say('ようこそ！', 'ชี้หรือแตะของในห้องดูสิ 🐾', 4500), 700); try { sessionStorage.setItem('nr-greet', 1); } catch {} }
  }
  function reveal() { const s = $('#stage'); s.classList.remove('reveal'); void s.offsetWidth; s.classList.add('reveal'); setTimeout(() => s.classList.remove('reveal'), 3000); }
  function closePop() { const p = $('#pop'); if (!p.hidden) { p.hidden = true; } }
  function syncToday() { $$('.today-card').forEach((c) => c.classList.toggle('collapsed', !state.todayOpen)); $('#todayToggle').setAttribute('aria-expanded', state.todayOpen); }
  let toastT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

  /* ======================================================================
     ขั้นที่ 3: แผงต่าง ๆ — ระบบหน้าต่าง, บทเรียน, การ์ด, คันจิ, แบบทดสอบ, แพลนเนอร์
     ====================================================================== */
  const jr = (s) => esc(s).replace(/([\u3400-\u9fff々]+)\{([^}]+)\}/g, '<ruby>$1<rt>$2</rt></ruby>'); // 漢字{かな} → ruby
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dISO = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); x.setHours(0, 0, 0, 0); return x; };
  const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const pick = (a, n) => shuffle(a).slice(0, n);
  const TH_DOW = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'], TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  /* ---------- ข้อมูลความคืบหน้า + การตั้งค่า (บันทึกคีย์เดียวกัน) ---------- */
  const DEF_PROG = { status: {}, last: null, scores: {}, tests: [], leitner: {}, tasks: {}, targets: {}, visits: {}, minutes: {}, collected: [], grammarMiss: {} };
  const DEF_SET = { furi: true, romaji: false, trans: true, unchecked: true, volFx: 0.6, volBgm: 0.3, rate: 1 };
  const prog = (() => { try { return Object.assign(structuredClone(DEF_PROG), (JSON.parse(localStorage.getItem(KEY)) || {}).prog || {}); } catch { return structuredClone(DEF_PROG); } })();
  const sets = (() => { try { return Object.assign({ ...DEF_SET }, (JSON.parse(localStorage.getItem(KEY)) || {}).settings || {}); } catch { return { ...DEF_SET }; } })();
  function saveAll() { save(); try { const all = JSON.parse(localStorage.getItem(KEY) || '{}'); all.v = 1; all.prog = prog; all.settings = sets; localStorage.setItem(KEY, JSON.stringify(all)); } catch { document.body.classList.add('nosave'); } refreshSide(); }

  /* ---------- โหลดบทเรียน (เมื่อเปิดบทนั้น) ---------- */
  const LESSONS = CORE.lessons; const lessonCache = {};
  async function loadLesson(n) {
    if (lessonCache[n]) return lessonCache[n];
    try { const r = await fetch(`data/lesson-${String(n).padStart(2, '0')}.json`); if (!r.ok) throw 0; return (lessonCache[n] = await r.json()); } catch { return null; }
  }
  const loadAll = () => Promise.all(LESSONS.map((l) => loadLesson(l.n))).then((a) => a.filter(Boolean));

  /* ---------- ทบทวนตามรอบ (Leitner 5 กล่อง) ---------- */
  const GAP = [0, 1, 3, 7, 14];
  const today = () => dISO();
  function grade(id, ok) { const c = prog.leitner[id] || { box: 1 }; c.box = ok ? Math.min(5, (c.box || 1) + (prog.leitner[id] ? 1 : 0)) : 1; c.due = dISO(addD(new Date(), GAP[c.box - 1] || (ok ? 1 : 0))); if (ok && c.box === 1) c.due = dISO(addD(new Date(), 1)); prog.leitner[id] = c; }
  const dueIds = () => Object.entries(prog.leitner).filter(([, c]) => c.due <= today()).map(([id]) => id);

  /* ---------- การแสดงผลภาษาญี่ปุ่น ---------- */
  const ruby = (jp, kana) => (jp && kana && jp !== kana ? `<ruby lang="ja">${esc(jp)}<rt>${esc(kana)}</rt></ruby>` : `<span lang="ja">${esc(jp || kana)}</span>`);
  const rom = (k) => `<span class="romaji">${esc(romajiOf(k))}</span>`;
  const tr = (t) => `<span class="tr">${esc(t)}</span>`;
  const uncheckedBadge = (o) => (o && o.checked === false ? '<span class="unchk" title="เนื้อหานี้ยังไม่มีคนตรวจ">ยังไม่ตรวจ</span>' : '');
  const KMAP = { 'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o' };
  function romajiOf(k) { // ใช้ค่าจากไฟล์ถ้ามี ไม่มีก็ข้าม
    return (k && romajiOf.cache && romajiOf.cache[k]) || ''; }
  romajiOf.cache = {};
  function applyDisplay() { const c = document.documentElement.classList; c.toggle('no-furi', !sets.furi); c.toggle('show-romaji', !!sets.romaji); c.toggle('no-trans', !sets.trans); c.toggle('hide-unchk', !sets.unchecked); }

  /* ---------- เสียงอ่านภาษาญี่ปุ่น ---------- */
  let jaVoice = null, voicesReady = false;
  function findVoice() { try { const vs = speechSynthesis.getVoices(); if (vs.length) voicesReady = true; jaVoice = vs.find((v) => /ja[-_]JP/i.test(v.lang)) || vs.find((v) => /^ja/i.test(v.lang)) || null; } catch {} }
  if ('speechSynthesis' in window) { findVoice(); speechSynthesis.addEventListener?.('voiceschanged', findVoice); }
  function speak(text) {
    if (!('speechSynthesis' in window)) { noVoice(); return; }
    findVoice(); if (voicesReady && !jaVoice) { noVoice(); return; }
    try { const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; if (jaVoice) u.voice = jaVoice; u.rate = sets.rate; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { noVoice(); }
  }
  function noVoice() { modalMsg('🔈 เครื่องนี้ไม่มีเสียงภาษาญี่ปุ่น', `<ul class="plain"><li><b>iPhone / iPad:</b> ตั้งค่า → การช่วยการเข้าถึง → เนื้อหาที่ถูกพูด → เสียง → ภาษาญี่ปุ่น</li><li><b>Mac:</b> การตั้งค่าระบบ → การช่วยการเข้าถึง → เนื้อหาที่ถูกพูด → เสียงของระบบ → เพิ่มภาษาญี่ปุ่น</li><li><b>Windows:</b> การตั้งค่า → เวลาและภาษา → คำพูด → เพิ่มเสียง → ภาษาญี่ปุ่น</li></ul><p class="muted">เพิ่มเสียงแล้วปิดเปิดเบราว์เซอร์ใหม่</p>`); }
  const sayBtn = (text) => `<button class="spk jelly mini-btn" data-say="${esc(text)}" aria-label="ฟังเสียง">🔊</button>`;

  /* ================= ระบบหน้าต่าง ================= */
  const wins = []; let zTop = 20, cascade = 0;
  function winMode() { const l = layoutName(); if (l === 'mobile') return 'full'; if (l === 'tablet-p') return 'sheet'; if (l === 'desktop' && (finePointer.matches || /[?&]mouse\b/.test(location.search))) return 'float'; return 'modal'; }
  function openPanel(kind, arg) {
    const def = PANELS[kind]; if (!def) return;
    const mode = winMode();
    let w = wins.find((x) => x.kind === kind);
    if (w) { w.min = false; w.el.hidden = false; focusWin(w); if (arg !== undefined) w.go(def.view(...String(arg).split(':')), true); return w; }
    if (mode !== 'float') wins.slice().forEach(closeWin);
    else if (wins.length >= 3) closeWin(wins[0]);
    const el = document.createElement('section'); el.className = `pwin pwin-${mode} pwin-${kind}`; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', mode === 'float' ? 'false' : 'true');
    const tid = 'pw' + Math.random().toString(36).slice(2, 7); el.setAttribute('aria-labelledby', tid);
    el.innerHTML = `<header class="pw-bar"><button class="pw-back" aria-label="ย้อนกลับ" hidden>←</button><span class="pw-ic" aria-hidden="true">${def.icon}</span><h2 class="pw-title" id="${tid}" tabindex="-1"></h2>
      <span class="pw-btns">${mode === 'float' ? '<button class="pw-min" aria-label="ย่อหน้าต่าง">_</button><button class="pw-max" aria-label="ขยายหน้าต่าง">□</button>' : ''}<button class="pw-x" aria-label="ปิด">×</button></span></header><div class="pw-body"></div>`;
    w = { kind, el, mode, stack: [], min: false, prevFocus: document.activeElement };
    w.go = (view, replace) => { if (replace) w.stack = []; w.stack.push(view); renderWin(w); };
    w.back = () => { if (w.stack.length > 1) { w.stack.pop(); renderWin(w); } else closeWin(w); };
    wins.push(w);
    const host = mode === 'float' ? $('#winLayer') : document.body;
    if (mode !== 'float') { const bd = document.createElement('div'); bd.className = 'pw-backdrop pw-backdrop-' + mode; bd.addEventListener('click', () => closeWin(w)); document.body.appendChild(bd); w.bd = bd; document.body.classList.add('panel-open'); }
    host.appendChild(el);
    if (mode === 'float') { const L = $('#winLayer').getBoundingClientRect(); const ww = Math.min(560, L.width - 40), wh = Math.min(L.height - 30, 620); Object.assign(el.style, { width: ww + 'px', height: wh + 'px', left: Math.max(8, (L.width - ww) / 2 + (cascade % 3) * 34 - 34) + 'px', top: Math.max(6, 12 + (cascade % 3) * 26) + 'px' }); cascade++; makeDraggable(w); }
    if (mode === 'sheet') sheetSwipe(w); if (mode === 'full') edgeSwipe(w);
    el.addEventListener('click', (e) => onWinClick(w, e)); el.addEventListener('pointerdown', () => focusWin(w));
    w.go(def.view(...(arg === undefined ? [] : String(arg).split(':')))); focusWin(w); SFX.open();
    requestAnimationFrame(() => el.classList.add('in'));
    return w;
  }
  function renderWin(w) {
    const v = w.stack[w.stack.length - 1]; const body = $('.pw-body', w.el);
    $('.pw-title', w.el).textContent = v.title; $('.pw-back', w.el).hidden = !(w.stack.length > 1 || w.mode === 'full');
    setUrl(v.path || v.title); body.scrollTop = 0;
    const r = v.render(); if (r instanceof Promise) { body.innerHTML = '<p class="loading pixel">Loading…</p>'; r.then((h) => { if (w.stack[w.stack.length - 1] === v) { body.innerHTML = h; v.after?.(body, w); } }); }
    else { body.innerHTML = r; v.after?.(body, w); }
    if (w.mode !== 'float') $('.pw-title', w.el).focus({ preventScroll: true });
    renderTaskWins();
  }
  function focusWin(w) { w.el.style.zIndex = (w.mode === 'float' ? 0 : 1000) + ++zTop; if (w.bd) w.bd.style.zIndex = w.el.style.zIndex - 1; wins.forEach((x) => x.el.classList.toggle('front', x === w)); }
  function closeWin(w) {
    const i = wins.indexOf(w); if (i < 0) return; wins.splice(i, 1); w.v?.cleanup?.(); w.stack.forEach((v) => v.cleanup?.());
    w.el.classList.remove('in'); w.el.classList.add('out'); setTimeout(() => w.el.remove(), calm() ? 0 : 180);
    if (w.bd) { w.bd.remove(); } if (!wins.some((x) => x.mode !== 'float')) document.body.classList.remove('panel-open');
    if (!wins.length) setUrl('ห้อง'); renderTaskWins(); try { w.prevFocus?.focus?.(); } catch {}
  }
  const topWin = () => wins.filter((w) => !w.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
  function renderTaskWins() { const h = $('#taskWins'); if (!h) return; h.innerHTML = wins.filter((w) => w.mode === 'float').map((w, i) => `<button class="tw ${w.min ? 'min' : ''}" data-tw="${i}">${PANELS[w.kind].icon} ${esc(PANELS[w.kind].short)}</button>`).join(''); }
  function makeDraggable(w) {
    const bar = $('.pw-bar', w.el); let st = null;
    bar.addEventListener('pointerdown', (e) => { if (e.target.closest('button') || w.el.classList.contains('max')) return; const r = w.el.getBoundingClientRect(), L = $('#winLayer').getBoundingClientRect(); st = { x: e.clientX, y: e.clientY, l: r.left - L.left, t: r.top - L.top, L }; bar.setPointerCapture(e.pointerId); });
    bar.addEventListener('pointermove', (e) => { if (!st) return; const l = Math.max(-w.el.offsetWidth + 80, Math.min(st.L.width - 80, st.l + e.clientX - st.x)), t = Math.max(0, Math.min(st.L.height - 40, st.t + e.clientY - st.y)); w.el.style.left = l + 'px'; w.el.style.top = t + 'px'; });
    bar.addEventListener('pointerup', () => (st = null)); bar.addEventListener('pointercancel', () => (st = null));
    bar.addEventListener('dblclick', (e) => { if (!e.target.closest('button')) w.el.classList.toggle('max'); });
  }
  function sheetSwipe(w) {
    const bar = $('.pw-bar', w.el); let y0 = null, dy = 0;
    bar.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; y0 = e.clientY; dy = 0; bar.setPointerCapture(e.pointerId); w.el.style.transition = 'none'; });
    bar.addEventListener('pointermove', (e) => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); w.el.style.transform = `translateY(${dy}px)`; });
    const end = () => { if (y0 === null) return; w.el.style.transition = ''; w.el.style.transform = ''; if (dy > 90) closeWin(w); y0 = null; };
    bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
  }
  function edgeSwipe(w) {
    let s = null;
    w.el.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' && e.clientX < 28) s = { x: e.clientX, y: e.clientY }; });
    w.el.addEventListener('pointerup', (e) => { if (s && e.clientX - s.x > 70 && Math.abs(e.clientY - s.y) < 60) w.back(); s = null; });
    w.el.addEventListener('pointercancel', () => (s = null));
  }
  function onWinClick(w, e) {
    const t = e.target;
    if (t.closest('.pw-x')) return closeWin(w);
    if (t.closest('.pw-back')) return w.back();
    if (t.closest('.pw-min')) { w.min = true; w.el.hidden = true; renderTaskWins(); return; }
    if (t.closest('.pw-max')) { w.el.classList.toggle('max'); return; }
    const sp = t.closest('[data-say]'); if (sp) { speak(sp.dataset.say); return; }
    const nav = t.closest('[data-nav]'); if (nav) { const [k, a, b] = nav.dataset.nav.split(':'); const view = PANELS[k]?.view(a, b); if (!view) return; if (k === w.kind) w.go(view); else openPanel(k, a === undefined ? undefined : a + (b ? ':' + b : '')); return; }
    const v = w.stack[w.stack.length - 1]; v.onClick?.(e, w);
  }
  function modalMsg(title, html) {
    const box = document.createElement('div'); box.className = 'y2k-pop'; box.setAttribute('role', 'alertdialog'); box.setAttribute('aria-modal', 'true');
    box.innerHTML = `<div class="pop-card"><div class="pop-bar"><span class="pixel">${esc(title)}</span><button class="pop-close" aria-label="ปิด">×</button></div><div class="pop-in">${html}</div></div>`;
    document.body.appendChild(box); const close = () => box.remove();
    box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('.pop-close') || e.target.closest('[data-close]')) close(); });
    $('.pop-close', box).focus(); return { box, close };
  }

  /* ================= เครื่องมือแบบทดสอบ ================= */
  const norm = (s) => String(s || '').normalize('NFKC').replace(/[\s。．.、,]/g, '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).toLowerCase();
  function kanjiItems(list, mode) {
    const all = list; const meanings = [...new Set(all.map((k) => k.th))];
    return list.map((k, i) => {
      const m = mode === 'mix' ? (i % 2 ? 'read' : 'mean') : mode;
      if (m === 'mean') return { id: 'kq-' + k.char, ref: 'kanji:' + k.char, kind: 'mc', section: '文字・語彙', label: '💡 ความหมาย', big: k.char, hint: k.emoji, choices: shuffle([k.th, ...pick(meanings.filter((x) => x !== k.th), 3)]), answer: k.th, explain: `${k.char} = ${k.th} · ${k.strokes} ขีด` };
      const w = k.words[Math.floor(Math.random() * k.words.length)]; const pool = [...new Set(all.flatMap((x) => x.words.map((y) => y.kana)).filter((y) => y !== w.kana))];
      const close = pool.filter((y) => Math.abs(y.length - w.kana.length) <= 1);
      return { id: 'kr-' + k.char, ref: 'kanji:' + k.char, kind: 'mc', section: '文字・語彙', label: '🔤 คำอ่าน', big: w.jp, hint: k.emoji, choices: shuffle([w.kana, ...pick(close.length >= 3 ? close : pool, 3)]), answer: w.kana, jp: true, explain: `${w.jp} อ่านว่า ${w.kana} = ${w.th}` };
    });
  }
  const QLABEL = { fill: '🎯 เติมคำ', conjugate: '🔄 ผันรูป', order: '🧩 เรียงประโยค', choose: '✅ เลือกประโยคที่ถูก', translate: '🇹🇭→🇯🇵 แปล', situation: '💬 สถานการณ์', vocab: '🗣️ คำศัพท์', listening: '🎧 ฟัง', reading: '📖 อ่าน' };
  function quizItem(q, L) {
    const base = { id: q.id, ref: 'q:' + q.id, section: q.section || '文法', label: QLABEL[q.type] || '🎯', explain: q.explainTh, grammarRef: q.grammarRef, lesson: L?.lesson, hint: q.emoji, checked: q.checked };
    if (q.type === 'order') return { ...base, kind: 'order', prompt: q.prompt, tokens: q.tokens, answer: q.answer };
    if (q.type === 'type') return { ...base, kind: 'type', prompt: q.prompt, accept: q.accept || [q.answer] };
    return { ...base, kind: 'mc', prompt: q.prompt, sub: q.hintTh, jp: !['translate', 'situation'].includes(q.type) || true, showHint: q.type === 'situation', choices: shuffle(q.choices), answer: q.answer, promptTh: ['translate', 'situation'].includes(q.type) };
  }
  function vocabItems(L, n) {
    const v = L.vocab; const ths = v.map((x) => x.th);
    return pick(v, n).map((x, i) => i % 2 ? { id: 'vm-' + x.id, ref: 'card:' + x.id, kind: 'mc', section: '文字・語彙', label: '🗣️ ความหมาย', big: x.kanji || x.kana, bigKana: x.kanji ? x.kana : '', hint: x.emoji, choices: shuffle([x.th, ...pick(ths.filter((t) => t !== x.th), 3)]), answer: x.th, explain: `${x.kanji || x.kana}（${x.kana}）= ${x.th}` }
      : { id: 'vr-' + x.id, ref: 'card:' + x.id, kind: 'mc', section: '文字・語彙', label: '🔤 คำอ่าน', big: x.kanji || x.kana, hint: x.emoji, skip: !x.kanji, choices: shuffle([x.kana, ...pick(v.map((y) => y.kana).filter((y) => y !== x.kana), 3)]), answer: x.kana, jp: true, explain: `${x.kanji || x.kana} อ่านว่า ${x.kana} = ${x.th}` }).filter((x) => !x.skip);
  }
  function listenItems(L, n) { const ths = L.listening.map((x) => x.th); return pick(L.listening, n).map((x) => ({ id: 'li-' + x.id, ref: 'listen:' + x.id, kind: 'mc', section: '聴解', label: '🎧 ฟังแล้วเลือกความหมาย', listen: x.jp, choices: shuffle([x.th, ...pick(ths.filter((t) => t !== x.th), Math.min(3, ths.length - 1))]), answer: x.th, explain: `${x.jp} = ${x.th}` })); }

  // แสดงแบบทดสอบทีละข้อ แล้วเรียก done(results)
  function runQuiz(body, items, done, title = '') {
    let i = 0; const res = [];
    const draw = () => {
      const q = items[i]; if (!q) return finish();
      body.innerHTML = `${title ? `<p class="muted small">${esc(title)}</p>` : ''}<div class="qbar" role="progressbar" aria-valuemin="0" aria-valuemax="${items.length}" aria-valuenow="${i}"><i style="width:${(i / items.length) * 100}%"></i></div>
        <div class="qcard sticker"><div class="qmeta"><span class="qtag">${esc(q.label)}</span><span class="muted small">ข้อ ${i + 1}/${items.length} ${q.section ? '· ' + esc(q.section) : ''}</span>${uncheckedBadge(q)}</div>
        ${q.listen ? `<div class="qlisten">${sayBtn(q.listen)}<span class="muted">กดฟังประโยค แล้วเลือกความหมาย</span></div>` : ''}
        ${q.big ? `<div class="qbig" lang="ja">${esc(q.big)}</div>` : ''}
        ${q.prompt ? `<div class="qprompt ${q.promptTh ? '' : 'jpq'}" ${q.promptTh ? '' : 'lang="ja"'}>${q.showHint ? esc(q.hint) + ' ' : ''}${jr(q.prompt)}</div>` : ''}${q.sub ? `<div class="muted small">💭 ${esc(q.sub)}</div>` : ''}
        <div class="qarea"></div><div class="qfb" aria-live="polite"></div></div>`;
      const area = $('.qarea', body);
      if (q.kind === 'mc') { area.innerHTML = `<div class="choices">${q.choices.map((c, k) => `<button class="choice" data-c="${k}" ${q.jp || /[ぁ-ヿ一-龯]/.test(c) ? 'lang="ja"' : ''}><span class="kbd">${k + 1}</span>${jr(c)}</button>`).join('')}</div>`;
        area.onclick = (e) => { const b = e.target.closest('.choice'); if (b && !b.disabled) answer(q.choices[+b.dataset.c] === q.answer, q.choices[+b.dataset.c]); }; }
      else if (q.kind === 'type') { area.innerHTML = `<form class="typeq"><input lang="ja" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="พิมพ์คำตอบ"><button class="jelly">ตรวจ</button></form>`; area.querySelector('form').onsubmit = (e) => { e.preventDefault(); const v = area.querySelector('input').value; answer(q.accept.some((a) => norm(a) === norm(v)), v); }; area.querySelector('input').focus(); }
      else orderUI(area, q, answer);
      body.onkeydown = (e) => { if (q.kind === 'mc' && /^[1-4]$/.test(e.key)) { const b = $$('.choice', area)[+e.key - 1]; b?.click(); } };
    };
    const answer = (ok, given) => {
      const q = items[i]; if (res[i]) return; res[i] = { ...q, ok, given };
      $$('.choice', body).forEach((b) => { const c = q.choices?.[+b.dataset.c]; b.disabled = true; if (c === q.answer) b.classList.add('right'); else if (c === given) b.classList.add('wrong'); });
      (ok ? SFX.chime : SFX.tap)();
      const fb = $('.qfb', body);
      fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'ng'}">${ok ? '✅ ถูกต้อง!' : '💭 ยังไม่ถูกนะ'} ${q.big && q.hint ? `<span class="em">${esc(q.hint)}</span>` : ''} ${!ok && q.kind === 'order' ? '<br>ประโยคที่ถูก: <span lang="ja">' + jr(q.tokens.join(' ')) + '</span>' : ''}${!ok && q.kind !== 'order' ? '<br>คำตอบ: <b lang="ja">' + jr(q.kind === 'type' ? q.accept[0] : q.answer) + '</b>' : ''}${q.explain ? '<br><span class="muted">' + esc(q.explain) + '</span>' : ''}</div>
        <button class="jelly next-q">${i + 1 >= items.length ? 'ดูผลคะแนน' : 'ข้อต่อไป →'}</button>`;
      const nb = $('.next-q', fb); nb.onclick = () => { i++; draw(); }; nb.focus();
    };
    const finish = () => done(res);
    draw();
  }
  function orderUI(area, q, answer) {
    let bank; do { bank = shuffle(q.tokens.map((t, k) => ({ t, k }))); } while (q.tokens.length > 2 && bank.every((x, k) => x.k === k));
    let line = [];
    const draw = () => {
      area.innerHTML = `<div class="oline" aria-label="ประโยคของคุณ">${line.length ? line.map((x, k) => `<button class="tok on" data-l="${k}" lang="ja">${jr(x.t)}</button>`).join('') : '<span class="muted small">แตะหรือลากคำมาวางตรงนี้ · ลากเพื่อสลับลำดับ</span>'}</div>
        <div class="obank">${bank.map((x) => `<button class="tok" data-b="${x.k}" lang="ja" ${line.includes(x) ? 'disabled' : ''}>${jr(x.t)}</button>`).join('')}</div>
        <button class="jelly check-o" ${line.length === q.tokens.length ? '' : 'disabled'}>ตรวจคำตอบ</button>`;
      $('.check-o', area).onclick = () => { answer(line.map((x) => x.t).join('') === q.tokens.join(''), line.map((x) => x.t).join(' ')); $$('.tok', area).forEach((b) => (b.disabled = true)); $('.check-o', area).remove(); };
      bindDrag();
    };
    let drag = null, moved = false;
    function bindDrag() {
      $$('.tok', area).forEach((b) => {
        b.addEventListener('pointerdown', (e) => { if (b.disabled) return; moved = false; drag = { b, x: e.clientX, y: e.clientY, from: b.dataset.l !== undefined ? 'l' : 'b', idx: +(b.dataset.l ?? b.dataset.b) }; b.setPointerCapture(e.pointerId); });
        b.addEventListener('pointermove', (e) => { if (!drag || drag.b !== b) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!moved && Math.hypot(dx, dy) > 8) { moved = true; b.classList.add('dragging'); } if (moved) b.style.transform = `translate(${dx}px,${dy}px)`; });
        const end = (e) => {
          if (!drag || drag.b !== b) return; const d = drag; drag = null; b.style.transform = ''; b.classList.remove('dragging');
          if (!moved) { if (d.from === 'b') { line.push(bank.find((x) => x.k === d.idx)); } else line.splice(d.idx, 1); SFX.tap(); draw(); return; }
          b.style.visibility = 'hidden'; const under = document.elementFromPoint(e.clientX, e.clientY); b.style.visibility = '';
          const ol = $('.oline', area); const overLine = under && under.closest('.oline') === ol;
          const item = d.from === 'b' ? bank.find((x) => x.k === d.idx) : line[d.idx];
          if (overLine) {
            if (d.from === 'l') line.splice(d.idx, 1);
            const toks = $$('.tok.on', ol).filter((t) => t !== b); let pos = line.length;
            for (let k = 0; k < toks.length; k++) { const r = toks[k].getBoundingClientRect(); if (e.clientY < r.bottom && e.clientX < r.left + r.width / 2) { pos = +toks[k].dataset.l - (d.from === 'l' && +toks[k].dataset.l > d.idx ? 1 : 0); break; } }
            line.splice(pos, 0, item);
          } else if (d.from === 'l') line.splice(d.idx, 1);
          SFX.tap(); draw();
        };
        b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
        b.addEventListener('click', (e) => e.preventDefault());
      });
    }
    draw();
  }
  function resultHTML(res, extra = '') {
    const sc = res.filter((r) => r.ok).length; const by = {};
    res.forEach((r) => { const k = r.section || r.label; by[k] = by[k] || [0, 0]; by[k][1]++; if (r.ok) by[k][0]++; });
    return `<div class="result"><div class="score pixel">${sc}/${res.length}</div><p>${sc === res.length ? 'เต็ม! 🎉' : sc >= res.length * 0.7 ? 'เก่งมาก 😊' : 'สู้ ๆ นะ 💪'}</p>
      <table class="ntable"><tbody>${Object.entries(by).map(([k, [a, b]]) => `<tr><td lang="ja">${esc(k)}</td><td class="r">${a}/${b}</td></tr>`).join('')}</tbody></table>${extra}</div>`;
  }
  function showResult(res, opts = {}) {
    const sc = res.filter((r) => r.ok).length;
    // บันทึก: ผิด → กล่อง 1, ถูก → เลื่อนกล่อง (เฉพาะการ์ดที่อยู่ในระบบแล้ว)
    res.forEach((r) => { const id = r.ref && (r.ref.startsWith('kanji:') ? 'k:' + r.ref.slice(6) : r.ref.startsWith('card:') ? r.ref.slice(5) : null); if (id && (!r.ok || prog.leitner[id])) grade(id, r.ok); if (r.grammarRef && !r.ok) prog.grammarMiss[r.grammarRef] = (prog.grammarMiss[r.grammarRef] || 0) + 1; });
    prog.tests.unshift({ type: opts.type || 'quiz', d: today(), score: sc, total: res.length, n: opts.lesson || null }); prog.tests = prog.tests.slice(0, 100);
    if (opts.lesson) { const p = prog.scores[opts.lesson] || {}; prog.scores[opts.lesson] = { last: sc, best: Math.max(sc, p.best || 0), total: res.length }; }
    saveAll();
    const weak = {}; res.filter((r) => !r.ok && r.grammarRef).forEach((r) => (weak[r.grammarRef] = (weak[r.grammarRef] || 0) + 1));
    const weakHTML = Object.keys(weak).length ? `<div class="callout">📌 เรื่องที่ควรทบทวน<ul class="plain">${Object.entries(weak).map(([g, n]) => { const L = +g.slice(1).split('-')[0]; const G = lessonCache[L]?.grammar.find((x) => x.id === g); return `<li><button class="link" data-close data-gref="${g}">บทที่ ${L}: <span lang="ja">${esc(G?.pattern || g)}</span></button> <span class="muted">(${n} ข้อ)</span></li>`; }).join('')}</ul></div>` : '';
    const m = modalMsg('🏆 result.exe', resultHTML(res, weakHTML) + `<div class="row"><button class="jelly" data-close>ปิด</button>${opts.again ? '<button class="jelly again">ทำอีกชุด</button>' : ''}</div>`);
    m.box.addEventListener('click', (e) => { const g = e.target.closest('[data-gref]'); if (g) { const L = +g.dataset.gref.slice(1).split('-')[0]; openPanel('grammar', String(L)); } if (e.target.closest('.again')) { m.close(); opts.again(); } });
    if (sc === res.length) { starRain(); say('よくできました！', 'คะแนนเต็ม! เก่งที่สุดเลย 🌟', 4000); } else if (sc >= res.length * 0.7) say('いいね！', `ได้ ${sc}/${res.length} เก่งมาก`, 3000);
  }
  function starRain() { if (calm()) return; for (let i = 0; i < 26; i++) { const s = document.createElement('span'); s.className = 'star-rain'; s.innerHTML = pixSVG([[2, 0], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [3, 3]], ['#ffd34d', '#ff9ac1', '#9fd0f5'][i % 3], 5); s.style.left = Math.random() * 100 + 'vw'; s.style.animationDelay = Math.random() * 0.6 + 's'; document.body.appendChild(s); setTimeout(() => s.remove(), 2600); } }

  /* ================= แผงทั้งหมด ================= */
  const STATUS = { todo: ['◻️', 'ยังไม่เริ่ม'], learning: ['📖', 'กำลังเรียน'], done: ['✅', 'เรียนจบแล้ว'] };
  const SECS = [['vocab', '🗣️', 'คำศัพท์'], ['grammar', '🧩', 'ไวยากรณ์'], ['kanji', '✍️', 'คันจิ'], ['reading', '📖', 'อ่าน'], ['listen', '🎧', 'ฟังและพูดตาม'], ['review', '🎯', 'ทบทวน']];
  const tabsHTML = (tabs, cur, attr = 'data-tab') => `<div class="ptabs" role="tablist">${tabs.map(([id, ic, n]) => `<button role="tab" ${attr}="${id}" aria-selected="${id === cur}">${ic} <span>${n}</span></button>`).join('')}</div>`;
  const lessonChips = (cur, attr = 'data-ch') => `<div class="chips">${LESSONS.map((l) => `<button class="chip" ${attr}="${l.n}" aria-pressed="${+cur === l.n}">บท ${l.n}</button>`).join('')}</div>`;
  const notionBtn = (L) => (L.notionUrl ? `<a class="jelly" href="${esc(L.notionUrl)}" target="_blank" rel="noopener">📝 เปิดบทเรียนใน Notion</a>` : '');
  const toggles = () => `<div class="disp" role="group" aria-label="การแสดงผล"><button class="chip" data-disp="furi" aria-pressed="${sets.furi}">ふりがな</button><button class="chip" data-disp="romaji" aria-pressed="${sets.romaji}">romaji</button><button class="chip" data-disp="trans" aria-pressed="${sets.trans}">คำแปล</button></div>`;
  document.addEventListener('click', (e) => { const d = e.target.closest('[data-disp]'); if (d) { sets[d.dataset.disp] = !sets[d.dataset.disp]; saveAll(); applyDisplay(); $$(`[data-disp=${d.dataset.disp}]`).forEach((b) => b.setAttribute('aria-pressed', sets[d.dataset.disp])); } });

  function vocabHTML(L) { return `<ul class="vlist">${L.vocab.map((v) => `<li><span class="em">${esc(v.emoji)}</span><div class="vtext"><span class="vjp">${ruby(v.kanji || v.kana, v.kanji ? v.kana : '')}<span class="romaji">${esc(v.romaji)}</span></span>${tr(v.th)}${uncheckedBadge(v)}</div>${sayBtn(v.kana)}</li>`).join('')}</ul>`; }
  function grammarHTML(L) {
    return L.grammar.map((g) => `<article class="gcard sticker" id="${g.id}"><h3 lang="ja">${esc(g.pattern)} ${uncheckedBadge(g)}</h3><p>${esc(g.explainTh)}</p>
      ${g.examples.map((x) => `<div class="ex"><span class="em">${esc(x.emoji || '💬')}</span><div><div lang="ja" class="exjp">${esc(x.jp)} ${sayBtn(x.jp)}</div><div class="kana-line" lang="ja">${esc(x.kana || '')}</div>${tr(x.th)}</div></div>`).join('')}
      ${g.thaiPitfall ? `<div class="pitfall">⚠️ <b>คนไทยมักพลาด</b><br>${esc(g.thaiPitfall)}</div>` : ''}</article>`).join('');
  }
  function kanjiCardHTML(k) {
    const box = prog.leitner['k:' + k.char]?.box;
    return `<div class="kcard-wrap"><button class="flip kflip" data-flip aria-pressed="false" aria-label="การ์ดคันจิ ${esc(k.char)} แตะเพื่อพลิก"><span class="face front"><span class="kbig" lang="ja">${esc(k.char)}</span><span class="kem">${esc(k.emoji)}</span></span>
      <span class="face back"><b>${esc(k.emoji)} ${esc(k.th)}</b><span class="small">${k.strokes} ขีด</span><span class="small" lang="ja">音 ${esc(k.on.join('・') || '—')}<br>訓 ${esc(k.kun.join('・') || '—')}</span>${k.words.map((w) => `<span class="small">${ruby(w.jp, w.kana)} = ${esc(w.th)}</span>`).join('')}</span></button>
      <div class="kbtns"><button class="chip" data-grade="k:${esc(k.char)}:1">😊 จำได้</button><button class="chip warn" data-grade="k:${esc(k.char)}:0">🔁 ต้องทบทวน</button></div>${box ? `<span class="boxno small">กล่อง ${box}</span>` : ''}${uncheckedBadge(k)}</div>`;
  }
  function listenHTML(L) {
    return L.listening.map((x, i) => `<div class="lrow sticker"><div class="row sb"><b>🎧 ประโยคที่ ${i + 1}</b>${x.audio ? `<audio controls preload="none" src="${esc(x.audio)}"></audio>` : '<span class="pill-tag">ยังไม่มีไฟล์เสียง</span>'}</div>
      <div class="row">${sayBtn(x.jp)}<button class="chip" data-reveal aria-expanded="false">👀 ดูคำอ่านและคำแปล</button></div><div class="reveal-body" hidden><div lang="ja">${esc(x.jp)}</div><div class="kana-line" lang="ja">${esc(x.kana)}</div>${tr(x.th)}</div><p class="muted small">ฟังแล้วพูดตามดัง ๆ 2–3 รอบ</p></div>`).join('')
      + `<div class="row"><span class="muted small">ความเร็วเสียง</span><button class="chip" data-rate="0.7" aria-pressed="${sets.rate == 0.7}">0.7×</button><button class="chip" data-rate="1" aria-pressed="${sets.rate == 1}">1×</button></div>`;
  }
  const commonClick = (e, w) => {
    const f = e.target.closest('[data-flip]'); if (f) { f.classList.toggle('on'); f.setAttribute('aria-pressed', f.classList.contains('on')); SFX.tap(); }
    const g = e.target.closest('[data-grade]'); if (g) { const [, , okS] = g.dataset.grade.split(':'); const id = g.dataset.grade.slice(0, g.dataset.grade.lastIndexOf(':')); grade(id, okS === '1'); saveAll(); const wrap = g.closest('.kcard-wrap'); const b = wrap?.querySelector('.boxno'); const txt = `กล่อง ${prog.leitner[id].box}`; if (b) b.textContent = txt; else wrap?.insertAdjacentHTML('beforeend', `<span class="boxno small">${txt}</span>`); SFX.tap(); toast(okS === '1' ? `😊 จำได้ → ${txt}` : '🔁 กลับไปกล่อง 1 · ทบทวนวันนี้'); }
    const rv = e.target.closest('[data-reveal]'); if (rv) { const b = rv.parentElement.nextElementSibling; b.hidden = !b.hidden; rv.setAttribute('aria-expanded', !b.hidden); }
    const rt = e.target.closest('[data-rate]'); if (rt) { sets.rate = +rt.dataset.rate; saveAll(); $$('[data-rate]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.rate === sets.rate)); }
  };

  const PANELS = {
    /* ---------- 📚 บทเรียน ---------- */
    lessons: { icon: '📚', short: 'บทเรียน', view: (a, b) => (a ? lessonView(+a, b || 'vocab') : lessonList()) },
    grammar: { icon: '📓', short: 'ไวยากรณ์', view: (a) => grammarPanel(a ? +a : null) },
    cards: { icon: '🗂️', short: 'การ์ด', view: (a) => cardsPanel(a) },
    kanji: { icon: '✍️', short: 'คันจิ', view: (a) => kanjiPanel(a) },
    listen: { icon: '🎧', short: 'ฟัง', view: (a) => listenPanel(a ? +a : null) },
    quiz: { icon: '🎯', short: 'แบบทดสอบ', view: () => quizHub() },
    planner: { icon: '📅', short: 'แพลนเนอร์', view: (a) => plannerPanel(a || 'subjects') },
    stickers: { icon: '🌟', short: 'สติกเกอร์', view: () => stickerPanel() },
    settings: { icon: '⚙️', short: 'ตั้งค่า', view: () => settingsPanel() },
    menu: { icon: '★', short: 'เมนู', view: () => menuPanel() },
  };
  function lessonList() {
    return { title: 'ชั้นหนังสือ · บทเรียน', path: 'บทเรียน', render: () => {
      const due = dueIds().length; const last = prog.last;
      return `${due ? `<button class="callout due-callout" data-nav="cards:due">🔴 มีการ์ดถึงกำหนดทบทวน <b>${due}</b> ใบ → ทบทวนเลย</button>` : ''}
        <button class="jelly wide" data-nav="lessons:${last ? last.n + ':' + last.sec : '1:vocab'}">▶ เรียนต่อ ${last ? `· บทที่ ${last.n} ${SECS.find((s) => s[0] === last.sec)?.[2] || ''}` : '· เริ่มบทที่ 1'}</button>
        <button class="chip kana-chip" data-soon-x="ชุดอุ่นเครื่องคานะจะมาในขั้นที่ 5">🔤 อุ่นเครื่องคานะ (ฮิรางานะ/คาตาคานะ)</button>
        <ul class="booklist">${LESSONS.map((l) => { const st = prog.status[l.n] || 'todo', sc = prog.scores[l.n]; return `<li><button class="bookrow" data-nav="lessons:${l.n}:vocab"><span class="spine" style="--h:${(l.n * 37) % 360}"></span><span class="grow"><b>บทที่ ${l.n} · ${esc(l.th)}</b> <span lang="ja" class="muted small">${esc(l.jp)}</span><br><span class="small">${STATUS[st][0]} ${STATUS[st][1]} · ✍️ 第${l.n + 2}課${sc ? ` · ทบทวน ${sc.best}/${sc.total}` : ''}</span></span><span aria-hidden="true">›</span></button></li>`; }).join('')}</ul>`;
    }, onClick: (e) => { if (e.target.closest('[data-soon-x]')) toast(e.target.closest('[data-soon-x]').dataset.soonX); } };
  }
  function lessonView(n, sec) {
    const meta = LESSONS.find((l) => l.n === n); const secName = SECS.find((s) => s[0] === sec)?.[2] || '';
    const v = { title: `บทที่ ${n} · ${meta?.th || ''}`, path: `บทที่-${n}/${secName}`, render: async () => {
      prog.last = { n, sec }; if (!prog.status[n] || prog.status[n] === 'todo') prog.status[n] = 'learning'; saveAll();
      const L = await loadLesson(n); if (!L) return `<p class="callout">บทนี้ยังไม่มีเนื้อหา</p>`;
      let body = '';
      if (sec === 'vocab') body = toggles() + vocabHTML(L);
      else if (sec === 'grammar') body = toggles() + grammarHTML(L);
      else if (sec === 'kanji') body = `<p class="muted small">✍️ ตามหนังสือคันจิสูตรสำเร็จ 第${L.kanjiBookLesson}課 · แตะการ์ดเพื่อพลิก</p>` + [1, 2].map((p) => `<h3 class="pixel">第${L.kanjiBookLesson}課 · ${p}</h3><div class="kgrid">${L.kanji.filter((k) => k.part === p).map(kanjiCardHTML).join('')}</div>`).join('');
      else if (sec === 'reading') body = L.reading ? toggles() + `<div class="reading sticker" lang="ja">${esc(L.reading.jp)}</div>${tr(L.reading.th)}<button class="jelly start-reading">ตอบคำถาม</button>` : `<div class="callout">📖 บทอ่านของบทนี้จะเพิ่มในขั้นที่ 5–6</div>`;
      else if (sec === 'listen') body = listenHTML(L);
      else body = `<p>ทบทวนแบบ JLPT: <span lang="ja">文字・語彙 · 文法 · 聴解${L.reading ? ' · 読解' : ''}</span></p><button class="jelly wide start-review">▶ เริ่มทบทวน (${Math.min(15, 4 + L.quiz.length + 2)} ข้อ)</button>`;
      const st = prog.status[n] || 'todo';
      return `<div class="lhead"><span lang="ja">${esc(L.emoji)} ${esc(L.titleJp)}</span> <span class="pill-tag">${STATUS[st][0]} ${STATUS[st][1]}</span></div>${tabsHTML(SECS, sec)}<div class="lbody">${body}</div>
        <div class="lfoot"><button class="jelly" data-mark>${st === 'done' ? '↩︎ ยกเลิกเรียนจบ' : '✅ ทำเครื่องหมายว่าเรียนจบ'}</button>${notionBtn(L)}</div>`;
    }, onClick: async (e, w) => {
      commonClick(e, w);
      const t = e.target.closest('[data-tab]'); if (t) { w.stack.pop(); w.go(lessonView(n, t.dataset.tab)); return; }
      if (e.target.closest('[data-mark]')) { const done = prog.status[n] === 'done'; prog.status[n] = done ? 'learning' : 'done'; saveAll(); if (!done) { starRain(); say('おめでとう！', `เรียนจบบทที่ ${n} แล้ว 🎉`); } w.stack.pop(); w.go(lessonView(n, sec)); return; }
      const L = lessonCache[n];
      if (e.target.closest('.start-review')) { const items = [...vocabItems(L, 3), ...kanjiItems(pick(L.kanji, 2), 'mix'), ...shuffle(L.quiz).slice(0, 7).map((q) => quizItem(q, L)), ...listenItems(L, 2)];
        const body = $('.lbody', w.el); runQuiz(body, items, (res) => { showResult(res, { type: 'lesson', lesson: n, again: () => { w.stack.pop(); w.go(lessonView(n, 'review')); } }); w.stack.pop(); w.go(lessonView(n, 'review')); }, `ทบทวนบทที่ ${n}`); }
      if (e.target.closest('.start-reading')) { const body = $('.lbody', w.el); runQuiz(body, L.reading.questions.map((q) => quizItem({ ...q, section: '読解' }, L)), (res) => { showResult(res, { type: 'reading', lesson: null }); w.stack.pop(); w.go(lessonView(n, 'reading')); }); }
    } };
    return v;
  }
  /* ---------- 📓 ไวยากรณ์ ---------- */
  function grammarPanel(n, tab = 'sum') {
    n = n || prog.last?.n || 1;
    return { title: 'อาร์มแชร์ · ไวยากรณ์', path: `ไวยากรณ์/บทที่-${n}`, render: async () => {
      if (tab === 'test') return tabsHTML([['sum', '📘', 'สรุป'], ['test', '🎯', 'แบบทดสอบ']], tab) + `<div class="tbody"><p>เลือกบทที่จะทดสอบ (เลือกได้หลายบท)</p>${lessonChips(n, 'data-pick')}
        <p class="muted small">โจทย์ 6 แบบ: เติมคำ · ผันรูป · เรียงประโยค (ลากหรือแตะ) · เลือกประโยคที่ถูก · แปล · สถานการณ์ — ชุดละไม่เกิน 10 ข้อ</p><button class="jelly wide start-g">▶ เริ่มทำแบบทดสอบ</button></div>`;
      const L = await loadLesson(n); if (!L) return 'ไม่พบบทนี้';
      return tabsHTML([['sum', '📘', 'สรุป'], ['test', '🎯', 'แบบทดสอบ']], tab) + lessonChips(n) + toggles() + grammarHTML(L) + notionBtn(L);
    }, after: (body) => { if (tab === 'test') $$('[data-pick]', body).forEach((b) => b.addEventListener('click', () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'))); },
    onClick: async (e, w) => {
      commonClick(e, w);
      const t = e.target.closest('[data-tab]'); if (t) { w.stack.pop(); w.go(grammarPanel(n, t.dataset.tab)); return; }
      const c = e.target.closest('[data-ch]'); if (c) { w.stack.pop(); w.go(grammarPanel(+c.dataset.ch, 'sum')); return; }
      if (e.target.closest('.start-g')) {
        const chosen = $$('[data-pick][aria-pressed=true]', w.el).map((b) => +b.dataset.pick); if (!chosen.length) { toast('เลือกอย่างน้อย 1 บท'); return; }
        const Ls = (await Promise.all(chosen.map(loadLesson))).filter(Boolean);
        const items = pick(Ls.flatMap((L) => L.quiz.map((q) => quizItem(q, L))), 10);
        runQuiz($('.tbody', w.el), items, (res) => { showResult(res, { type: 'grammar', again: () => { w.stack.pop(); w.go(grammarPanel(n, 'test')); } }); w.stack.pop(); w.go(grammarPanel(n, 'test')); }, 'แบบทดสอบไวยากรณ์');
      }
    } };
  }
  /* ---------- 🗂️ แฟลชการ์ด (Leitner) ---------- */
  function cardsPanel(deck) {
    return { title: 'กล่องการ์ด · แฟลชการ์ด', path: 'การ์ด', render: async () => {
      const all = await loadAll(); const due = dueIds();
      const boxes = [1, 2, 3, 4, 5].map((b) => Object.values(prog.leitner).filter((c) => c.box === b).length);
      if (deck) return '';
      return `<div class="leitner">${boxes.map((n, i) => `<div class="lbox"><span class="pixel">BOX ${i + 1}</span><b>${n}</b><span class="small muted">${['วันนี้', '1 วัน', '3 วัน', '7 วัน', '14 วัน'][i]}</span></div>`).join('')}</div>
        <button class="jelly wide" data-deck="due" ${due.length ? '' : 'disabled'}>🔴 ทบทวนการ์ดที่ถึงกำหนด (${due.length})</button>
        <h3>เลือกชุดการ์ดคำศัพท์</h3><div class="chips">${all.map((L) => `<button class="chip" data-deck="v${L.lesson}">บท ${L.lesson}</button>`).join('')}</div>
        <h3>คำที่เก็บจากในห้อง</h3>${prog.collected.length ? `<button class="chip" data-deck="room">⭐ ${prog.collected.length} คำ</button>` : '<p class="muted small">แตะหน้าต่างซ้ายเพื่อเก็บคำศัพท์ประจำฤดู</p>'}
        <p class="muted small">คีย์ลัด: Space = พลิก · 1 = จำได้ · 2 = ต้องทบทวน · ←/→ = ก่อนหน้า/ถัดไป</p>`;
    }, after: (body, w) => { if (deck) startDeck(body, w, deck); },
    onClick: (e, w) => { const d = e.target.closest('[data-deck]'); if (d) w.go(cardsPanel(d.dataset.deck)); } };
  }
  async function deckCards(deck) {
    const all = await loadAll(); const vocab = all.flatMap((L) => L.vocab.map((v) => ({ id: v.id, front: v.kanji || v.kana, sub: v.kanji ? v.kana : '', back: v.th, emoji: v.emoji, romaji: v.romaji, kana: v.kana })));
    const kan = all.flatMap((L) => L.kanji.map((k) => ({ id: 'k:' + k.char, front: k.char, back: k.th, emoji: k.emoji, sub: '', extra: k.words.map((w) => `${w.jp}（${w.kana}）`).join(' · '), kana: k.words[0]?.kana })));
    const room = prog.collected.map((c) => ({ id: 's:' + c.jp, front: c.jp, sub: c.kana, back: c.th, emoji: '⭐', kana: c.kana }));
    const pool = [...vocab, ...kan, ...room];
    if (deck === 'due') { const ids = new Set(dueIds()); return pool.filter((c) => ids.has(c.id)); }
    if (deck === 'room') return room; if (deck.startsWith('v')) return vocab.filter((c) => c.id.startsWith(deck + '-'));
    if (deck.startsWith('u')) { const u = +deck.slice(1); const L = all.find((x) => x.kanjiBookLesson === u); return L ? L.kanji.map((k) => kan.find((c) => c.id === 'k:' + k.char)) : []; }
    return [];
  }
  async function startDeck(body, w, deck) {
    const cards = await deckCards(deck); let i = 0, flipped = false;
    $('.pw-title', w.el).textContent = deck === 'due' ? 'ทบทวนการ์ดถึงกำหนด' : deck === 'room' ? 'คำที่เก็บจากในห้อง' : deck.startsWith('u') ? `คันจิ 第${deck.slice(1)}課` : `การ์ดคำศัพท์ บทที่ ${deck.slice(1)}`;
    if (!cards.length) { body.innerHTML = '<p class="callout">ไม่มีการ์ดในชุดนี้ 🎉</p>'; return; }
    const draw = () => {
      const c = cards[i]; const box = prog.leitner[c.id]?.box;
      body.innerHTML = `<div class="deck"><p class="muted small center">ใบที่ ${i + 1}/${cards.length}${box ? ` · กล่อง ${box}` : ' · ใบใหม่'}</p>
        <button class="flip big-flip ${flipped ? 'on' : ''}" data-dflip aria-pressed="${flipped}" aria-label="การ์ด ${esc(c.front)} แตะหรือปัดเพื่อพลิก">
          <span class="face front"><span class="em">${esc(c.emoji)}</span><span class="dfront" lang="ja">${esc(c.front)}</span></span>
          <span class="face back"><span lang="ja" class="dsub">${esc(c.sub || '')}</span><span class="romaji">${esc(c.romaji || '')}</span><b class="dback">${esc(c.back)}</b>${c.extra ? `<span class="small" lang="ja">${esc(c.extra)}</span>` : ''}</span></button>
        <div class="row center">${c.kana ? sayBtn(c.kana) : ''}<button class="jelly nav-b" data-dn="-1" aria-label="การ์ดก่อนหน้า">←</button><button class="jelly ok-b" data-dg="1"><span class="kbd">1</span> 😊 จำได้</button><button class="jelly ng-b" data-dg="0"><span class="kbd">2</span> 🔁 ต้องทบทวน</button><button class="jelly nav-b" data-dn="1" aria-label="การ์ดถัดไป">→</button></div></div>`;
      const fc = $('[data-dflip]', body); let sx = null;
      fc.addEventListener('pointerdown', (e) => (sx = e.clientX)); fc.addEventListener('pointerup', (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 50) { flip(); fc.dataset.swiped = 1; } sx = null; });
    };
    const flip = () => { flipped = !flipped; const f = $('[data-dflip]', body); f.classList.toggle('on', flipped); f.setAttribute('aria-pressed', flipped); SFX.tap(); };
    const move = (d) => { i = (i + d + cards.length) % cards.length; flipped = false; draw(); };
    const gradeC = (ok) => { grade(cards[i].id, ok); saveAll(); SFX[ok ? 'chime' : 'tap'](); if (i === cards.length - 1) { toast('ครบชุดแล้ว 🎉'); say('おつかれさま！', 'ทบทวนครบชุดแล้ว'); } move(1); };
    body.onclick = (e) => { const f = e.target.closest('[data-dflip]'); if (f) { if (f.dataset.swiped) { delete f.dataset.swiped; return; } flip(); } const g = e.target.closest('[data-dg]'); if (g) gradeC(g.dataset.dg === '1'); const n = e.target.closest('[data-dn]'); if (n) move(+n.dataset.dn); };
    w.keys = (e) => { if (e.key === ' ') { e.preventDefault(); flip(); } else if (e.key === '1') gradeC(true); else if (e.key === '2') gradeC(false); else if (e.key === 'ArrowLeft') move(-1); else if (e.key === 'ArrowRight') move(1); };
    draw();
  }
  /* ---------- ✍️ คันจิ ---------- */
  function kanjiPanel(arg, tab = 'cards') {
    const u = arg ? +arg : (prog.last ? prog.last.n + 2 : 3);
    return { title: 'พวงหรีด · คันจิ', path: `คันจิ/第${u}課`, render: async () => {
      const all = await loadAll(); const head = tabsHTML([['cards', '🀄', 'การ์ดคันจิ'], ['test', '🎯', 'แบบทดสอบ']], tab);
      const units = all.map((L) => L.kanjiBookLesson);
      if (tab === 'test') { const dueK = dueIds().filter((id) => id.startsWith('k:')).length;
        return head + `<div class="tbody"><p>1. เลือกบทในหนังสือ</p><div class="chips">${units.map((x) => `<button class="chip" data-pick="${x}" aria-pressed="${x === u}">第${x}課</button>`).join('')}<button class="chip warn" data-pick="due" aria-pressed="false" ${dueK ? '' : 'disabled'}>🔴 ถึงกำหนดทบทวน (${dueK})</button></div>
          <p>2. โหมด</p><div class="chips" role="radiogroup"><button class="chip" data-mode="read" aria-pressed="false">🔤 คำอ่าน</button><button class="chip" data-mode="mean" aria-pressed="false">💡 ความหมาย</button><button class="chip" data-mode="mix" aria-pressed="true">🔀 ผสม</button></div>
          <p class="muted small">ชุดละ 10 ข้อ · ข้อที่ผิดกลับไปกล่อง 1 ของระบบทบทวน</p><button class="jelly wide start-k">▶ เริ่มทำแบบทดสอบ</button></div>`; }
      const L = all.find((x) => x.kanjiBookLesson === u) || all[0];
      return head + `<div class="chips">${units.map((x) => `<button class="chip" data-unit="${x}" aria-pressed="${x === u}">第${x}課</button>`).join('')}</div>
        <button class="chip" data-deck-k="u${u}">🗂️ ทบทวนแบบแฟลชการ์ด</button>` + [1, 2].map((p) => `<h3 class="pixel">第${u}課 · ${p}</h3><div class="kgrid">${L.kanji.filter((k) => k.part === p).map(kanjiCardHTML).join('')}</div>`).join('');
    }, after: (body) => { $$('[data-pick]', body).forEach((b) => b.addEventListener('click', () => { if (b.dataset.pick === 'due') $$('[data-pick]', body).forEach((x) => x.setAttribute('aria-pressed', x === b)); else { $('[data-pick=due]', body)?.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); } }));
      $$('[data-mode]', body).forEach((b) => b.addEventListener('click', () => $$('[data-mode]', body).forEach((x) => x.setAttribute('aria-pressed', x === b)))); },
    onClick: async (e, w) => {
      commonClick(e, w);
      const t = e.target.closest('[data-tab]'); if (t) { w.stack.pop(); w.go(kanjiPanel(u, t.dataset.tab)); return; }
      const un = e.target.closest('[data-unit]'); if (un) { w.stack.pop(); w.go(kanjiPanel(un.dataset.unit, 'cards')); return; }
      const dk = e.target.closest('[data-deck-k]'); if (dk) { openPanel('cards'); const cw = wins.find((x) => x.kind === 'cards'); cw.go(cardsPanel(dk.dataset.deckK)); return; }
      if (e.target.closest('.start-k')) {
        const all = await loadAll(); const picks = $$('[data-pick][aria-pressed=true]', w.el).map((b) => b.dataset.pick); const mode = $('[data-mode][aria-pressed=true]', w.el).dataset.mode;
        let pool = picks.includes('due') ? all.flatMap((L) => L.kanji).filter((k) => prog.leitner['k:' + k.char]?.due <= today()) : all.filter((L) => picks.includes(String(L.kanjiBookLesson))).flatMap((L) => L.kanji);
        if (!pool.length) { toast('เลือกอย่างน้อย 1 บท'); return; }
        const set = pool.length >= 10 ? pick(pool, 10) : Array.from({ length: 10 }, (_, k) => pool[k % pool.length]);
        const items = kanjiItems(shuffle(set), mode); const allK = all.flatMap((L) => L.kanji);
        items.forEach((q) => { if (q.label.includes('ความหมาย')) { const k = allK.find((x) => x.char === q.big); q.choices = shuffle([k.th, ...pick([...new Set(allK.map((x) => x.th))].filter((x) => x !== k.th), 3)]); } });
        runQuiz($('.tbody', w.el), items, (res) => { showResult(res, { type: 'kanji', again: () => { w.stack.pop(); w.go(kanjiPanel(u, 'test')); } }); w.stack.pop(); w.go(kanjiPanel(u, 'test')); }, 'แบบทดสอบคันจิ');
      }
    } };
  }
  /* ---------- 🎧 ฟัง ---------- */
  function listenPanel(n) { n = n || prog.last?.n || 1; return { title: 'หูฟัง · ฟังและพูดตาม', path: `ฟัง/บทที่-${n}`, render: async () => { const L = await loadLesson(n); return lessonChips(n) + toggles() + listenHTML(L); }, onClick: (e, w) => { commonClick(e, w); const c = e.target.closest('[data-ch]'); if (c) { w.stack.pop(); w.go(listenPanel(+c.dataset.ch)); } } }; }
  /* ---------- 🎯 ศูนย์แบบทดสอบ ---------- */
  function quizHub() {
    return { title: 'แบบทดสอบ', path: 'แบบทดสอบ', render: () => `<div class="hub">
      <button class="hub-card sticker" data-nav="kanji:${prog.last ? prog.last.n + 2 : 3}"><span class="em">✍️</span><b>แบบทดสอบคันจิ</b><span class="small">คำอ่าน · ความหมาย · ผสม</span></button>
      <button class="hub-card sticker" data-nav="grammar:${prog.last?.n || 1}"><span class="em">🧩</span><b>แบบทดสอบไวยากรณ์</b><span class="small">โจทย์ 6 แบบ</span></button>
      <button class="hub-card sticker" data-nav="lessons:${prog.last?.n || 1}:review"><span class="em">🎯</span><b>ทบทวนแบบ JLPT รายบท</b><span class="small" lang="ja">文字・語彙 · 文法 · 聴解</span></button></div>
      <h3>ผลล่าสุด</h3>${prog.tests.length ? `<table class="ntable"><tbody>${prog.tests.slice(0, 8).map((t) => `<tr><td>${t.d.slice(5)}</td><td>${{ kanji: '✍️ คันจิ', grammar: '🧩 ไวยากรณ์', lesson: '🎯 บทที่ ' + t.n, reading: '📖 อ่าน' }[t.type] || t.type}</td><td class="r">${t.score}/${t.total}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">ยังไม่มีผลแบบทดสอบ</p>'}`,
      onClick: (e, w) => { /* data-nav จัดการโดยระบบหน้าต่าง */ } };
  }
  // จัดการ data-nav ที่ไปยังแผงอื่นพร้อมแท็บ
  const _openPanel = openPanel;

  /* ---------- 📅 แพลนเนอร์ ---------- */
  function virtualTasks(d) { const out = []; if (d === today()) { const n = dueIds().length; if (n) out.push({ id: 'due', text: `ทบทวนการ์ด ${n} ใบ`, auto: true, virtual: true, done: false }); } return out; }
  function plannerPanel(tab, ref) {
    const base = ref ? fromISO(ref) : new Date();
    return { title: 'หน้าต่างขวา · แพลนเนอร์', path: 'แพลนเนอร์', render: () => {
      const head = `<div class="notebook">` + tabsHTML([['subjects', '📚', 'รายวิชา'], ['week', '🗓️', 'รายสัปดาห์'], ['month', '📅', 'รายเดือน']], tab);
      if (tab === 'subjects') return head + `<button class="jelly auto-plan">✨ สร้างแผนอัตโนมัติ</button><div class="tablewrap"><table class="ntable plan"><thead><tr><th>บท</th><th>สถานะ</th><th>เป้าหมาย</th><th>คะแนน</th></tr></thead><tbody>
        ${LESSONS.map((l) => { const st = prog.status[l.n] || 'todo', sc = prog.scores[l.n]; return `<tr><td><button class="link" data-nav="lessons:${l.n}:vocab">บท ${l.n}</button><div class="small muted">${esc(l.th)}</div></td><td><div class="stbtns">${Object.entries(STATUS).map(([k, [e2, nm]]) => `<button data-st="${l.n}:${k}" aria-pressed="${st === k}" aria-label="บท ${l.n}: ${nm}" title="${nm}">${e2}</button>`).join('')}</div></td><td><input type="date" data-target="${l.n}" value="${prog.targets[l.n] || ''}" aria-label="วันเป้าหมายบท ${l.n}"></td><td class="small">${sc ? `${sc.last}/${sc.total}` : '—'}</td></tr>`; }).join('')}</tbody></table></div>
        <p class="small">💮 เข้ามาเรียนแล้ว ${Object.keys(prog.visits).length} วัน · 🔥 ต่อเนื่อง ${streak()} วัน · 🌳 เวลาเรียนรวม ${Object.values(prog.minutes).reduce((a, b) => a + b, 0)} นาที</p></div>`;
      if (tab === 'week') {
        const mobile = layoutName() === 'mobile';
        if (mobile) { const d = dISO(base); return head + `<div class="row sb"><button class="jelly" data-wk="-1" aria-label="วันก่อน">←</button><b>${TH_DOW[base.getDay()]} ${base.getDate()} ${TH_MON[base.getMonth()]}</b><button class="jelly" data-wk="1" aria-label="วันถัดไป">→</button></div><div class="week one" data-swipe-day>${dayCol(d)}</div><p class="muted small center">ปัดซ้าย–ขวาเพื่อเปลี่ยนวัน</p></div>`; }
        const mon = addD(base, -((base.getDay() + 6) % 7));
        return head + `<div class="row sb"><button class="jelly" data-wk="-7" aria-label="สัปดาห์ก่อน">←</button><b>${mon.getDate()} ${TH_MON[mon.getMonth()]} – ${addD(mon, 6).getDate()} ${TH_MON[addD(mon, 6).getMonth()]}</b><button class="jelly" data-wk="7" aria-label="สัปดาห์ถัดไป">→</button></div><div class="week">${[0, 1, 2, 3, 4, 5, 6].map((k) => dayCol(dISO(addD(mon, k)))).join('')}</div></div>`;
      }
      const first = new Date(base.getFullYear(), base.getMonth(), 1); const start = addD(first, -((first.getDay() + 6) % 7));
      return head + `<div class="row sb"><button class="jelly" data-mo="-1" aria-label="เดือนก่อน">←</button><b>${TH_MON[base.getMonth()]} ${base.getFullYear() + 543}</b><button class="jelly" data-mo="1" aria-label="เดือนถัดไป">→</button></div>
        <div class="month">${['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map((x) => `<span class="mh">${x}</span>`).join('')}${Array.from({ length: 42 }, (_, k) => { const c = addD(start, k), d = dISO(c); const ts = prog.tasks[d] || []; const tg = Object.entries(prog.targets).filter(([, v]) => v === d).map(([n]) => n); const tests = prog.tests.filter((t) => t.d === d).length;
          return `<button class="mday ${c.getMonth() !== base.getMonth() ? 'out' : ''} ${d === today() ? 'today' : ''}" data-day="${d}" aria-label="${c.getDate()} ${TH_MON[c.getMonth()]} งาน ${ts.length}"><span>${c.getDate()}</span>${prog.visits[d] ? '<i class="stamp">💮</i>' : ''}<span class="dots">${ts.slice(0, 3).map((t) => `<i class="${t.done ? 'd' : ''}"></i>`).join('')}${tests ? '🎯' : ''}${tg.map((n) => `🏁${n}`).join('')}</span></button>`; }).join('')}</div>
        <p class="small muted">💮 วันที่เข้ามาเรียน · ● งาน · 🎯 ทำแบบทดสอบ · 🏁 เป้าหมายของบท</p></div>`;
    }, after: (body, w) => {
      const sd = $('[data-swipe-day]', body); if (sd) { let sx = null; sd.addEventListener('pointerdown', (e) => (sx = e.clientX)); sd.addEventListener('pointerup', (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 60 && !e.target.closest('input,button,label')) { w.stack.pop(); w.go(plannerPanel('week', dISO(addD(base, e.clientX < sx ? 1 : -1)))); } sx = null; }); }
      $$('[data-target]', body).forEach((inp) => inp.addEventListener('change', () => { prog.targets[inp.dataset.target] = inp.value; saveAll(); }));
      $$('form[data-add]', body).forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); const v = f.querySelector('input').value.trim(); if (!v) return; (prog.tasks[f.dataset.add] = prog.tasks[f.dataset.add] || []).push({ id: Date.now() + '' + Math.random(), text: v, done: false }); saveAll(); w.stack.pop(); w.go(plannerPanel(tab, ref)); }));
      $$('input[data-task]', body).forEach((c) => c.addEventListener('change', () => { const [d, id] = c.dataset.task.split('|'); const t = (prog.tasks[d] || []).find((x) => x.id === id); if (t) { t.done = c.checked; saveAll(); SFX.tap(); } }));
    }, onClick: (e, w) => {
      const t = e.target.closest('[data-tab]'); if (t) { w.stack.pop(); w.go(plannerPanel(t.dataset.tab)); return; }
      const st = e.target.closest('[data-st]'); if (st) { const [n, k] = st.dataset.st.split(':'); prog.status[n] = k; saveAll(); w.stack.pop(); w.go(plannerPanel(tab, ref)); return; }
      const wk = e.target.closest('[data-wk]'); if (wk) { w.stack.pop(); w.go(plannerPanel('week', dISO(addD(base, +wk.dataset.wk)))); return; }
      const mo = e.target.closest('[data-mo]'); if (mo) { w.stack.pop(); w.go(plannerPanel('month', dISO(new Date(base.getFullYear(), base.getMonth() + +mo.dataset.mo, 1)))); return; }
      const dy = e.target.closest('[data-day]'); if (dy) { w.stack.pop(); w.go(plannerPanel('week', dy.dataset.day)); return; }
      const del = e.target.closest('[data-del]'); if (del) { const [d, id] = del.dataset.del.split('|'); prog.tasks[d] = (prog.tasks[d] || []).filter((x) => x.id !== id); saveAll(); w.stack.pop(); w.go(plannerPanel(tab, ref)); return; }
      if (e.target.closest('.auto-plan')) autoPlanDialog(() => { w.stack.pop(); w.go(plannerPanel('week')); });
    } };
  }
  function dayCol(d) {
    const c = fromISO(d); const ts = [...virtualTasks(d), ...(prog.tasks[d] || [])];
    return `<div class="day ${d === today() ? 'today' : ''}"><div class="dh">${TH_DOW[c.getDay()]} ${c.getDate()} ${prog.visits[d] ? '<i class="stamp">💮</i>' : ''}${prog.minutes[d] ? `<span class="small muted">🌳${prog.minutes[d]}น.</span>` : ''}</div>
      ${ts.map((t) => t.virtual ? `<div class="task auto"><span>🔴 ${esc(t.text)}</span><button class="link small" data-nav="cards:due">ทบทวน</button></div>` : `<div class="task"><label><input type="checkbox" data-task="${d}|${t.id}" ${t.done ? 'checked' : ''}> <span class="${t.done ? 'done' : ''}">${esc(t.text)}</span></label><button class="x" data-del="${d}|${t.id}" aria-label="ลบงาน ${esc(t.text)}">×</button></div>`).join('')}
      <form data-add="${d}"><input placeholder="+ เพิ่มงาน" aria-label="เพิ่มงานวันที่ ${c.getDate()}"></form></div>`;
  }
  function autoPlanDialog(after) {
    const def = dISO(addD(new Date(), 7 * 12));
    const m = modalMsg('✨ plan.exe', `<form class="ap"><label>วันสอบหรือวันเป้าหมาย<br><input type="date" name="end" value="${def}" required></label>
      <label>เรียนได้กี่วันต่อสัปดาห์<br><select name="days">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option ${n === 5 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <p class="small muted">ระบบจะแบ่งบทที่ยังไม่จบให้เท่า ๆ กันจนถึงวันเป้าหมาย และแทนที่งานที่เคยสร้างอัตโนมัติไว้</p><button class="jelly">สร้างแผน</button></form>`);
    $('form', m.box).addEventListener('submit', (e) => {
      e.preventDefault(); const f = new FormData(e.target); const end = fromISO(f.get('end')); const per = +f.get('days');
      const allow = per >= 7 ? [0, 1, 2, 3, 4, 5, 6] : [[1], [1, 4], [1, 3, 5], [1, 2, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6]][per - 1];
      const days = []; for (let d = addD(new Date(), 0); d <= end; d = addD(d, 1)) if (allow.includes(d.getDay())) days.push(dISO(d));
      const left = LESSONS.filter((l) => prog.status[l.n] !== 'done'); if (!days.length || !left.length) { toast('ช่วงเวลาสั้นเกินไป หรือเรียนครบแล้ว'); return; }
      Object.keys(prog.tasks).forEach((d) => { prog.tasks[d] = prog.tasks[d].filter((t) => !t.auto); if (!prog.tasks[d].length) delete prog.tasks[d]; });
      const per1 = days.length / left.length; const steps = ['🗣️ คำศัพท์', '🧩 ไวยากรณ์', '✍️ คันจิ', '📖 อ่าน + 🎧 ฟัง', '🎯 ทบทวน'];
      left.forEach((l, i) => { const my = days.slice(Math.floor(i * per1), Math.max(Math.floor(i * per1) + 1, Math.floor((i + 1) * per1)));
        steps.forEach((s, k) => { const d = my[Math.min(my.length - 1, Math.floor((k * my.length) / steps.length))]; (prog.tasks[d] = prog.tasks[d] || []).push({ id: 'a' + l.n + k + Math.random(), text: `บท ${l.n}: ${s}`, done: false, auto: true }); });
        prog.targets[l.n] = my[my.length - 1]; });
      saveAll(); m.close(); toast(`สร้างแผน ${left.length} บท ใน ${days.length} วันเรียนแล้ว ✨`); after();
    });
  }
  function streak() { let n = 0; let d = new Date(); if (!prog.visits[dISO(d)]) d = addD(d, -1); while (prog.visits[dISO(d)]) { n++; d = addD(d, -1); } return n; }
  /* ---------- 🌟 สมุดสติกเกอร์ ---------- */
  const ALL_STICKERS = () => [...Object.entries(CORE.seasonal).flatMap(([t, l]) => l.map((w) => ({ key: `season-${t}-${w.jp}`, ...w, icon: CORE.themes[t].icon }))), ...Object.entries(CORNER).map(([t, c]) => ({ key: 'corner-' + t, ...c, icon: '🎁' }))];
  function stickerPanel() { return { title: 'สมุดสะสมสติกเกอร์', path: 'สติกเกอร์', render: () => { const got = new Set(state.stickers); const all = ALL_STICKERS(); return `<p class="small">สะสมแล้ว ${all.filter((s) => got.has(s.key)).length}/${all.length} · แตะหน้าต่างซ้ายและของมุมห้องในแต่ละธีมเพื่อเก็บ</p><div class="stk-grid">${all.map((s) => got.has(s.key) ? `<div class="stk sticker"><span class="em">${s.icon}</span>${ruby(s.jp, s.kana)}<span class="small">${esc(s.th)}</span></div>` : `<div class="stk locked" aria-label="ยังไม่ได้"><span class="em">❔</span><span class="pixel">???</span></div>`).join('')}</div>`; } }; }
  /* ---------- ⚙️ ตั้งค่า ---------- */
  function settingsPanel() {
    return { title: 'ตั้งค่า', path: 'ตั้งค่า', render: () => `<div class="settings">
      <h3>🔊 เสียง</h3><label class="sw"><input type="checkbox" data-set="sound" ${state.sound ? 'checked' : ''}> เปิดเสียง</label>
      <label>เสียงเอฟเฟกต์ <input type="range" min="0" max="1" step="0.1" data-vol="volFx" value="${sets.volFx}"></label>
      <label>เพลงพื้นหลัง <input type="range" min="0" max="1" step="0.1" data-vol="volBgm" value="${sets.volBgm}"> <span class="small muted">(ยังไม่มีเพลง)</span></label>
      <div class="row"><span>ความเร็วเสียงอ่าน</span><button class="chip" data-rate="0.7" aria-pressed="${sets.rate == 0.7}">0.7×</button><button class="chip" data-rate="1" aria-pressed="${sets.rate == 1}">1×</button><button class="chip" data-say="こんにちは。にほんごの へやへ ようこそ。">ทดลองฟัง</button></div>
      <h3>🎨 ธีมห้อง</h3><div class="theme-btns menu-themes" role="group" aria-label="เลือกธีมห้อง">${Object.entries(CORE.themes).map(([k, t]) => `<button class="theme-btn jelly" data-theme="${k}" aria-pressed="${state.theme === k}"><span aria-hidden="true">${t.icon}</span> <span class="tn">${t.name}</span></button>`).join('')}</div><h3>👀 การแสดงผล</h3>${toggles()}
      <label class="sw"><input type="checkbox" data-set2="unchecked" ${sets.unchecked ? 'checked' : ''}> แสดงป้าย "ยังไม่ตรวจ"</label>
      <label class="sw"><input type="checkbox" data-set="reduce" ${state.reduce ? 'checked' : ''}> ลดการเคลื่อนไหว</label>
      <h3>💾 ข้อมูล</h3><p class="small">ความคืบหน้าบันทึกในเบราว์เซอร์และอุปกรณ์นี้เท่านั้น ปุ่มส่งออก/นำเข้าจะมาในขั้นที่ 4</p></div>`,
      after: (body) => {
        $$('[data-set]', body).forEach((c) => c.addEventListener('change', () => { state[c.dataset.set] = c.checked; saveAll(); syncToggles(); if (c.dataset.set === 'reduce') buildFloaters(); if (c.dataset.set === 'sound' && c.checked) { audio(); SFX.chime(); } }));
        $$('[data-set2]', body).forEach((c) => c.addEventListener('change', () => { sets[c.dataset.set2] = c.checked; saveAll(); applyDisplay(); }));
        $$('[data-vol]', body).forEach((r) => r.addEventListener('change', () => { sets[r.dataset.vol] = +r.value; saveAll(); SFX.tap(); }));
      }, onClick: (e, w) => commonClick(e, w) };
  }
  /* ---------- ★ เมนู + ค้นหา ---------- */
  function menuPanel() {
    return { title: '★ เมนู', path: 'เมนู', render: () => `<h3>🎨 ธีมห้อง</h3><div class="theme-btns menu-themes" role="group" aria-label="เลือกธีมห้อง">${Object.entries(CORE.themes).map(([k, t]) => `<button class="theme-btn jelly" data-theme="${k}" aria-pressed="${state.theme === k}"><span aria-hidden="true">${t.icon}</span> <span class="tn">${t.name}</span></button>`).join('')}</div><form class="search" role="search"><input type="search" placeholder="ค้นหาคำศัพท์ คันจิ ไวยากรณ์ (ไทย / かな / 漢字 / romaji)" aria-label="ค้นหา" lang="ja"></form><div class="sresults" aria-live="polite"></div>
      <div class="menu-grid">${[['lessons', '📚', 'บทเรียน'], ['cards', '🗂️', 'แฟลชการ์ด'], ['kanji', '✍️', 'คันจิ'], ['quiz', '🎯', 'แบบทดสอบ'], ['grammar', '📓', 'ไวยากรณ์'], ['listen', '🎧', 'ฟังและพูดตาม'], ['planner', '📅', 'แพลนเนอร์'], ['stickers', '🌟', 'สมุดสติกเกอร์'], ['settings', '⚙️', 'ตั้งค่า']].map(([k, ic, n]) => `<button class="mcard sticker" data-nav="${k}"><span class="em">${ic}</span>${n}</button>`).join('')}
        <button class="mcard sticker" data-soonm="ชุดอุ่นเครื่องคานะจะมาในขั้นที่ 5"><span class="em">🔤</span>อุ่นเครื่องคานะ</button><button class="mcard sticker" data-soonm="ทัวร์แนะนำจะมาในขั้นที่ 4"><span class="em">🐾</span>ทัวร์แนะนำ</button><button class="mcard sticker" data-soonm="มุมเกม 🎮 เร็ว ๆ นี้ (รอบที่ 2)"><span class="em">🎮</span>GAME</button></div>`,
      after: (body, w) => { const inp = $('input', body); if (finePointer.matches) inp.focus(); let t; inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => runSearch(inp.value, $('.sresults', body)), 180); }); $('form', body).addEventListener('submit', (e) => e.preventDefault()); },
      onClick: (e) => { const s = e.target.closest('[data-soonm]'); if (s) toast(s.dataset.soonm); } };
  }
  async function runSearch(q, out) {
    q = q.trim(); if (!q) { out.innerHTML = ''; return; } const all = await loadAll(); const nq = norm(q); const hit = (s) => s && norm(s).includes(nq);
    const res = [];
    all.forEach((L) => { L.vocab.forEach((v) => { if (hit(v.kana) || hit(v.kanji) || hit(v.romaji) || (v.th || '').includes(q)) res.push(`<li><button class="link" data-nav="lessons:${L.lesson}:vocab">🗣️ ${ruby(v.kanji || v.kana, v.kanji ? v.kana : '')} = ${esc(v.th)}</button> <span class="small muted">บท ${L.lesson}</span></li>`); });
      L.kanji.forEach((k) => { if (k.char === q || hit(k.th) || k.words.some((x) => hit(x.kana) || hit(x.jp)) || k.th.includes(q)) res.push(`<li><button class="link" data-nav="kanji:${L.kanjiBookLesson}">✍️ <span lang="ja">${esc(k.char)}</span> = ${esc(k.th)}</button> <span class="small muted">第${L.kanjiBookLesson}課</span></li>`); });
      L.grammar.forEach((g) => { if (hit(g.pattern) || g.explainTh.includes(q)) res.push(`<li><button class="link" data-nav="grammar:${L.lesson}">🧩 <span lang="ja">${esc(g.pattern)}</span></button> <span class="small muted">บท ${L.lesson}</span></li>`); }); });
    out.innerHTML = res.length ? `<ul class="plain sres">${[...new Set(res)].slice(0, 40).join('')}</ul>` : '<p class="muted">ไม่พบ</p>';
  }
  // ให้ romaji ทำงานในการ์ดหลังโหลดข้อมูล (ข้อมูลมีค่า romaji อยู่แล้ว)

  /* ---------- ข้อมูลข้างห้อง ---------- */
  function refreshSide() {
    $$('.streak-n').forEach((e) => (e.textContent = streak())); $$('.stamp-n').forEach((e) => (e.textContent = Object.keys(prog.visits).length));
    const n = dueIds().length; const sb = $('.hit[data-obj=shelf]'); if (sb) { let b = $('.due-badge', sb); if (n) { if (!b) { b = document.createElement('span'); b.className = 'due-badge'; sb.appendChild(b); } b.textContent = n; b.setAttribute('aria-label', `การ์ดถึงกำหนด ${n} ใบ`); } else b?.remove(); }
    const last = prog.last; const meta = LESSONS.find((l) => l.n === (last?.n || 1));
    $$('.continue-title').forEach((e) => (e.innerHTML = `บทที่ ${meta.n} · ${esc(meta.th)}${last ? ' · ' + (SECS.find((s) => s[0] === last.sec)?.[2] || '') : ''}<br><span lang="ja">${esc(meta.jp)}</span>`));
    $('#lessonMini') && ($('#lessonMini').innerHTML = LESSONS.map((l) => `<li><button class="link" data-nav-side="lessons:${l.n}:vocab"><span aria-hidden="true">${STATUS[prog.status[l.n] || 'todo'][0]}</span> บทที่ ${l.n} · ${esc(l.th)}</button></li>`).join(''));
    const todo = $('.todo'); if (todo) { const d = today(); const ts = [...virtualTasks(d), ...(prog.tasks[d] || [])]; todo.innerHTML = ts.length ? ts.slice(0, 5).map((t) => `<li>${t.virtual ? '🔴' : t.done ? '☑' : '☐'} ${esc(t.text)}</li>`).join('') : '<li class="muted">ยังไม่มีงานวันนี้ · เพิ่มได้ในแพลนเนอร์</li>'; }
  }
  // บันทึกวันที่เข้ามาเรียน
  prog.visits[today()] = 1;


  /* ---------- เปลี่ยนธีมด้วยปุ่ม ◀ ▶ และการปัดที่ขอบห้อง ---------- */
  const THEME_KEYS = () => Object.keys(CORE.themes);
  function stepTheme(d) {
    const ks = THEME_KEYS(); const i = (ks.indexOf(state.theme) + d + ks.length) % ks.length; state.theme = ks[i]; save(); applyTheme(); SFX.tap();
    const st = $('#stage'); if (!calm()) { st.classList.remove('swap-l', 'swap-r'); void st.offsetWidth; st.classList.add(d > 0 ? 'swap-l' : 'swap-r'); }
    toast(CORE.themes[state.theme].icon + ' ห้องธีม' + CORE.themes[state.theme].name);
  }
  function syncThemeNav() { const ks = THEME_KEYS(), i = ks.indexOf(state.theme); const prev = CORE.themes[ks[(i + ks.length - 1) % ks.length]], next = CORE.themes[ks[(i + 1) % ks.length]];
    const p = $('.theme-nav.prev'), n = $('.theme-nav.next'); if (!p) return; $('.ti', p).textContent = prev.icon; $('.ti', n).textContent = next.icon; p.setAttribute('aria-label', 'ไปห้องธีม' + prev.name); n.setAttribute('aria-label', 'ไปห้องธีม' + next.name); }
  function initThemeSwipe() {
    const sc = $('#roomScroll'); let t0 = null;
    sc.addEventListener('touchstart', (e) => { if (e.touches.length !== 1) { t0 = null; return; } const max = sc.scrollWidth - sc.clientWidth; t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY, sl: sc.scrollLeft, max }; }, { passive: true });
    sc.addEventListener('touchend', (e) => {
      if (!t0) return; const tt = e.changedTouches[0]; const dx = tt.clientX - t0.x, dy = tt.clientY - t0.y; const s = t0; t0 = null;
      if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
      const fits = s.max <= 4, atL = s.sl <= 4, atR = s.sl >= s.max - 4;
      if (dx < 0 && (fits || atR) && sc.scrollLeft >= sc.scrollWidth - sc.clientWidth - 4) { stepTheme(1); requestAnimationFrame(() => sc.scrollTo({ left: 0 })); }
      else if (dx > 0 && (fits || atL) && sc.scrollLeft <= 4) { stepTheme(-1); requestAnimationFrame(() => sc.scrollTo({ left: sc.scrollWidth })); }
    }, { passive: true });
  }

  function initPanels() {
    initThemeSwipe();
    document.addEventListener('click', (e) => { const tn = e.target.closest('[data-tnav]'); if (tn) stepTheme(+tn.dataset.tnav); });
    applyDisplay(); saveAll();
    document.addEventListener('click', (e) => {
      const o = e.target.closest('[data-open]'); if (o) { if (o.dataset.open === 'continue') openPanel('lessons', prog.last ? prog.last.n + ':' + prog.last.sec : '1:vocab'); else openPanel(o.dataset.open, o.dataset.arg); return; }
      const ns = e.target.closest('[data-nav-side]'); if (ns) { const [k, a, b] = ns.dataset.navSide.split(':'); openPanel(k, a + (b ? ':' + b : '')); return; }
      const tw = e.target.closest('[data-tw]'); if (tw) { const w = wins.filter((x) => x.mode === 'float')[+tw.dataset.tw]; if (w) { if (w.min || w.el.classList.contains('front')) { w.min = !w.min; w.el.hidden = w.min; } if (!w.min) focusWin(w); renderTaskWins(); } }
    });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPanel('menu'); return; }
      if (document.querySelector('.y2k-pop')) { if (e.key === 'Escape') $$('.y2k-pop').pop()?.remove(); return; }
      const w = topWin(); if (!w) return;
      if (e.key === 'Escape') { e.preventDefault(); closeWin(w); return; }
      if (w.keys && !e.target.closest('input,textarea,select')) w.keys(e);
    });
  }

  window.NR = { drawRoom, toSVG, state, activate, timer };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
