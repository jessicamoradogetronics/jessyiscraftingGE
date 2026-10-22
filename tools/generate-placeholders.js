/**
 * Temporary utility to generate elegant SVG placeholder images using the
 * site's color palette. Run with `node tools/generate-placeholders.js`.
 * Safe to delete once real photography replaces the placeholders.
 */
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "assets", "images", "placeholders");
fs.mkdirSync(OUT_DIR, { recursive: true });

const palette = {
  cream: "#F7F2E8",
  creamDark: "#ECE2CC",
  green: "#3F5A43",
  moss: "#6F8F6B",
  brown: "#6B4A33",
  brownDark: "#4A3222",
  gold: "#B08D57",
};

const ICONS = {
  dice: `<g stroke="${palette.brownDark}" stroke-width="2" fill="none">
    <rect x="-30" y="-30" width="60" height="60" rx="10" />
    <circle cx="-13" cy="-13" r="4" fill="${palette.brownDark}" stroke="none"/>
    <circle cx="13" cy="-13" r="4" fill="${palette.brownDark}" stroke="none"/>
    <circle cx="0" cy="0" r="4" fill="${palette.brownDark}" stroke="none"/>
    <circle cx="-13" cy="13" r="4" fill="${palette.brownDark}" stroke="none"/>
    <circle cx="13" cy="13" r="4" fill="${palette.brownDark}" stroke="none"/>
  </g>`,
  brush: `<g stroke="${palette.brownDark}" stroke-width="2.5" stroke-linecap="round" fill="none">
    <path d="M-25,30 L5,0" />
    <path d="M0,-5 L28,-33 C34,-39 42,-31 36,-25 L8,3 Z" fill="${palette.moss}" />
    <path d="M-25,30 C-30,35 -32,40 -30,45 C-25,47 -20,45 -18,40 Z" fill="${palette.brownDark}"/>
  </g>`,
  frame: `<g stroke="${palette.brownDark}" stroke-width="3" fill="none">
    <rect x="-32" y="-24" width="64" height="48" rx="2" />
    <path d="M-32,14 L-10,-6 L6,8 L20,-10 L32,2" stroke="${palette.moss}" stroke-width="2.5"/>
    <circle cx="14" cy="-10" r="5" fill="${palette.gold}" stroke="none"/>
  </g>`,
  figure: `<g stroke="${palette.brownDark}" stroke-width="2.5" fill="none">
    <circle cx="0" cy="-22" r="10" fill="${palette.gold}" stroke="${palette.brownDark}"/>
    <path d="M-14,32 L-10,-2 C-10,-8 10,-8 10,-2 L14,32" fill="${palette.moss}"/>
    <path d="M-18,10 L-26,-6 M18,10 L26,-6" />
  </g>`,
  portrait: `<g stroke="${palette.brownDark}" stroke-width="2.5" fill="none">
    <circle cx="0" cy="-10" r="18" fill="${palette.creamDark}"/>
    <path d="M-26,34 C-26,10 26,10 26,34" fill="${palette.creamDark}"/>
  </g>`,
  tools: `<g stroke="${palette.brownDark}" stroke-width="2.5" stroke-linecap="round" fill="none">
    <path d="M-28,28 L10,-10" />
    <path d="M6,-14 L30,-34" stroke="${palette.gold}" stroke-width="4"/>
    <path d="M-28,28 C-33,33 -33,38 -28,40 C-23,38 -23,33 -28,28 Z" fill="${palette.brownDark}"/>
  </g>`,
  leaf: `<g stroke="${palette.green}" stroke-width="2.5" fill="none">
    <path d="M0,34 C-26,18 -26,-18 0,-34 C26,-18 26,18 0,34 Z" fill="${palette.moss}" opacity="0.35"/>
    <path d="M0,34 L0,-34" />
  </g>`,
};

function svgPlaceholder({ width, height, icon, caption, sublabel, bg }) {
  const iconMarkup = ICONS[icon] || ICONS.leaf;
  const cx = width / 2;
  const cy = height / 2 - (sublabel ? 18 : 8);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${caption}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg || palette.cream}"/>
      <stop offset="1" stop-color="${palette.creamDark}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="14" y="14" width="${width - 28}" height="${height - 28}" fill="none" stroke="${palette.gold}" stroke-width="1.5" opacity="0.6"/>
  <g transform="translate(${cx}, ${cy}) scale(${Math.min(width, height) / 170})">
    ${iconMarkup}
  </g>
  <text x="${cx}" y="${height - 34}" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(height * 0.052)}" fill="${palette.brownDark}" text-anchor="middle">${caption}</text>
  ${sublabel ? `<text x="${cx}" y="${height - 14}" font-family="Verdana, sans-serif" font-size="${Math.round(height * 0.032)}" fill="${palette.brown}" text-anchor="middle" letter-spacing="1">${sublabel}</text>` : ""}
</svg>`;
}

const images = [
  { name: "hero-main", width: 1200, height: 900, icon: "leaf", caption: "Fotografía de producto", sublabel: "PRÓXIMAMENTE" },
  { name: "category-crafts", width: 800, height: 600, icon: "dice", caption: "Artesanías en madera" },
  { name: "category-digital-art", width: 800, height: 600, icon: "portrait", caption: "Dibujo digital" },
  { name: "category-paintings", width: 800, height: 600, icon: "frame", caption: "Cuadros pintados a mano" },
  { name: "category-figures", width: 800, height: 600, icon: "figure", caption: "Figuras pintadas" },
  { name: "portrait-founder", width: 900, height: 1100, icon: "portrait", caption: "Fotografía de la artesana", sublabel: "PRÓXIMAMENTE" },
  { name: "workshop-1", width: 900, height: 700, icon: "tools", caption: "En el taller", sublabel: "PRÓXIMAMENTE" },
  { name: "workshop-2", width: 900, height: 700, icon: "brush", caption: "Preparando un pedido", sublabel: "PRÓXIMAMENTE" },
  { name: "gallery-1", width: 700, height: 700, icon: "dice", caption: "Pieza terminada" },
  { name: "gallery-2", width: 700, height: 700, icon: "portrait", caption: "Pieza terminada" },
  { name: "gallery-3", width: 700, height: 700, icon: "frame", caption: "Pieza terminada" },
  { name: "gallery-4", width: 700, height: 700, icon: "figure", caption: "Pieza terminada" },
  { name: "gallery-5", width: 700, height: 700, icon: "brush", caption: "Proceso creativo" },
  { name: "gallery-6", width: 700, height: 700, icon: "tools", caption: "Proceso creativo" },
  { name: "og-default", width: 1200, height: 630, icon: "leaf", caption: "JessyIsCrafting", sublabel: "ARTESANÍA HECHA A MANO" },
];

for (const img of images) {
  const svg = svgPlaceholder(img);
  fs.writeFileSync(path.join(OUT_DIR, `${img.name}.svg`), svg, "utf8");
}

console.log(`Generated ${images.length} placeholder images in ${OUT_DIR}`);
