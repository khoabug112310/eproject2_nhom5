// Shared SVG helpers for report diagrams
const C = {
  brand: "#2E6B8F", brandDark: "#1B4965",
  entFill: "#EAF3F8", entBorder: "#2E6B8F",
  procFill: "#D6E9F2", procBorder: "#1B4965",
  storeFill: "#FFF4E0", storeBorder: "#C8881F", storeText: "#7a5410",
  extFill: "#E9EEF3", extBorder: "#46607A", extText: "#243648",
  line: "#5A6B79", text: "#1B2A36", sub: "#4a5a67",
  tierFill: "#F4F9FC", tierBorder: "#B9D4E2",
};
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function svgOpen(w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Arial, 'Segoe UI', sans-serif">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L8,3 L0,6 Z" fill="${C.line}"/>
    </marker>
    <marker id="arrowB" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M8,0 L0,3 L8,6 Z" fill="${C.line}"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" fill="#FFFFFF"/>`;
}
const svgClose = () => `</svg>`;

function lines(x, y, arr, opts = {}) {
  const size = opts.size || 14, lh = opts.lh || (size + 5), color = opts.color || C.text;
  const anchor = opts.anchor || "middle", weight = opts.weight || "normal";
  return arr.map((t, i) =>
    `<text x="${x}" y="${y + i * lh}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}">${esc(t)}</text>`
  ).join("\n");
}

function roundRect(x, y, w, h, opts = {}) {
  const r = opts.r != null ? opts.r : 10;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${opts.fill || '#fff'}" stroke="${opts.stroke || C.brand}" stroke-width="${opts.sw || 1.5}"/>`;
}

// External entity (square-cornered box)
function extEntity(x, y, w, h, textArr) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.extFill}" stroke="${C.extBorder}" stroke-width="1.6"/>` +
    lines(x + w / 2, y + h / 2 - (textArr.length - 1) * 9 + 5, textArr, { size: 15, color: C.extText, weight: "bold", lh: 18 });
}

// Process node (rounded rect with id label on top strip)
function proc(x, y, w, h, id, textArr) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" ry="14" fill="${C.procFill}" stroke="${C.procBorder}" stroke-width="1.8"/>`;
  s += `<text x="${x + w / 2}" y="${y + 22}" font-size="13" fill="${C.brandDark}" text-anchor="middle" font-weight="bold">${esc(id)}</text>`;
  s += lines(x + w / 2, y + h / 2 + 8, textArr, { size: 14, color: C.text, weight: "bold", lh: 17 });
  return s;
}

// Data store (open-ended rectangle, DeMarco style)
function store(x, y, w, h, id, name) {
  let s = `<path d="M${x},${y} H${x + w} V${y + h} H${x}" fill="${C.storeFill}" stroke="${C.storeBorder}" stroke-width="1.6"/>`;
  s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${C.storeBorder}" stroke-width="1.6"/>`;
  s += `<line x1="${x + 34}" y1="${y}" x2="${x + 34}" y2="${y + h}" stroke="${C.storeBorder}" stroke-width="1.2"/>`;
  s += `<text x="${x + 17}" y="${y + h / 2 + 5}" font-size="13" fill="${C.storeText}" text-anchor="middle" font-weight="bold">${esc(id)}</text>`;
  const nm = Array.isArray(name) ? name : [name];
  s += lines(x + 34 + (w - 34) / 2, y + h / 2 - (nm.length - 1) * 8 + 5, nm, { size: 13.5, color: C.storeText, weight: "bold", lh: 16 });
  return s;
}

// Entity box for ER (header + attribute rows)
function erEntity(x, y, w, title, attrs) {
  const headH = 28, rowH = 19, h = headH + attrs.length * rowH;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ry="6" fill="#fff" stroke="${C.entBorder}" stroke-width="1.6"/>`;
  s += `<path d="M${x},${y + 12} a6,6 0 0 1 6,-6 H${x + w - 6} a6,6 0 0 1 6,6 V${y + headH} H${x} Z" fill="${C.brand}"/>`;
  s += `<text x="${x + w / 2}" y="${y + 19}" font-size="13.5" fill="#fff" text-anchor="middle" font-weight="bold">${esc(title)}</text>`;
  attrs.forEach((a, i) => {
    const ry = y + headH + i * rowH;
    if (i > 0) s += `<line x1="${x}" y1="${ry}" x2="${x + w}" y2="${ry}" stroke="#E3EEF4" stroke-width="1"/>`;
    const key = a.key ? `<tspan font-weight="bold" fill="${C.brandDark}">${esc(a.key)} </tspan>` : "";
    s += `<text x="${x + 8}" y="${ry + 14}" font-size="11.5" fill="${C.text}">${key}<tspan>${esc(a.name)}</tspan></text>`;
  });
  return { svg: s, h, w, x, y };
}

// straight arrow with optional label and double-head
function arrow(x1, y1, x2, y2, opts = {}) {
  const dash = opts.dashed ? `stroke-dasharray="5 4"` : "";
  const head = opts.double ? `marker-start="url(#arrowB)" marker-end="url(#arrow)"` : `marker-end="url(#arrow)"`;
  let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.line}" stroke-width="${opts.sw || 1.5}" ${dash} ${head}/>`;
  if (opts.label) {
    const mx = opts.lx != null ? opts.lx : (x1 + x2) / 2;
    const my = opts.ly != null ? opts.ly : (y1 + y2) / 2;
    const lab = Array.isArray(opts.label) ? opts.label : [opts.label];
    const wpx = Math.max(...lab.map(t => t.length)) * 6.4 + 10;
    s += `<rect x="${mx - wpx / 2}" y="${my - lab.length * 8 - 2}" width="${wpx}" height="${lab.length * 16 + 4}" fill="#fff" opacity="0.92" rx="3"/>`;
    s += lines(mx, my - (lab.length - 1) * 8 + 4, lab, { size: 11.5, color: opts.labelColor || C.sub, lh: 15 });
  }
  return s;
}

// orthogonal elbow connector (h then v) with arrow
function elbow(x1, y1, x2, y2, opts = {}) {
  const dash = opts.dashed ? `stroke-dasharray="5 4"` : "";
  const path = opts.vfirst
    ? `M${x1},${y1} V${y2} H${x2}`
    : `M${x1},${y1} H${x2} V${y2}`;
  return `<path d="${path}" fill="none" stroke="${C.line}" stroke-width="${opts.sw || 1.4}" ${dash} marker-end="url(#arrow)"/>`;
}

// cardinality label at a point
function card(x, y, t) {
  return `<text x="${x}" y="${y}" font-size="12" fill="${C.brandDark}" text-anchor="middle" font-weight="bold">${esc(t)}</text>`;
}

function title(x, y, t, sub) {
  let s = `<text x="${x}" y="${y}" font-size="20" fill="${C.brandDark}" text-anchor="middle" font-weight="bold">${esc(t)}</text>`;
  if (sub) s += `<text x="${x}" y="${y + 22}" font-size="13" fill="${C.sub}" text-anchor="middle">${esc(sub)}</text>`;
  return s;
}

module.exports = { C, esc, svgOpen, svgClose, lines, roundRect, extEntity, proc, store, erEntity, arrow, elbow, card, title };
