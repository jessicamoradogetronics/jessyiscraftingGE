# JessyIsCrafting

Web oficial de **JessyIsCrafting**: artesanía, dibujo digital, cuadros y figuras pintadas a mano, hechas con cariño en España.

Sitio estático construido con [Eleventy (11ty)](https://www.11ty.dev/), con soporte multiidioma (español, inglés y alemán), catálogo de productos, formulario de contacto y publicación automática en GitHub Pages.

## 🗂️ Estructura del proyecto

```
.
├── .github/workflows/deploy.yml   # Workflow de despliegue a GitHub Pages
├── .eleventy.js                   # Configuración de Eleventy (filtros, rutas, i18n)
├── src/
│   ├── _data/
│   │   ├── i18n/{es,en,de}.json    # Textos de la interfaz, por idioma
│   │   ├── locales.js               # Idiomas disponibles (código + etiqueta)
│   │   ├── products.json            # Catálogo de productos (EJEMPLO)
│   │   └── site.js                  # Datos del sitio: email, redes, Formspree, etc.
│   ├── _includes/
│   │   ├── layouts/base.njk         # Plantilla HTML base
│   │   └── partials/                # Cabecera, pie, tarjetas de producto, SEO, etc.
│   ├── assets/
│   │   ├── css/style.css            # Estilos (paleta de colores, componentes)
│   │   ├── js/main.js               # Menú móvil, acordeón FAQ, modal de producto
│   │   └── images/placeholders/     # Imágenes de ejemplo (sustituir por fotos reales)
│   ├── shop/                        # Páginas de categorías de la tienda
│   └── *.njk                        # Resto de páginas (inicio, contacto, FAQ, etc.)
└── tools/generate-placeholders.js   # Script usado para generar los SVG de ejemplo
```

Cada página de contenido usa la función de **paginación** de Eleventy sobre `locales` para generar automáticamente las tres versiones de idioma (`/es/...`, `/en/...`, `/de/...`) a partir de una única plantilla.

## 🚀 Desarrollo local

Requiere [Node.js](https://nodejs.org/) 20 o superior.

```bash
npm install
npm start
```

Esto levanta un servidor local (por defecto en `http://localhost:8080`) que se recarga automáticamente al guardar cambios.

Para generar el sitio estático sin levantar el servidor:

```bash
npm run build
```

El resultado se genera en la carpeta `_site/`.

## 🌐 Publicación en GitHub Pages

El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) construye y publica el sitio automáticamente en cada `push` a `main`.

**Para activarlo** (solo la primera vez):

1. Ve a **Settings → Pages** en el repositorio de GitHub.
2. En "Build and deployment" → "Source", selecciona **GitHub Actions**.
3. Haz push a `main`; el sitio quedará publicado en `https://jessicamoradogetronics.github.io/jessyiscraftingGE/`.

El build de producción usa `npm run build:gh-pages`, que añade el prefijo `/jessyiscraftingGE/` a todas las rutas internas automáticamente (gracias al filtro `url` de Eleventy). Si en el futuro configuras un dominio propio:

1. Añade un archivo `src/CNAME` con tu dominio y añade su passthrough en `.eleventy.js`.
2. Cambia el script `build:gh-pages` en `package.json` para que ya no use `--pathprefix`.
3. Actualiza `url` en `src/_data/site.js` con el nuevo dominio.

## ✏️ Cómo editar el contenido

### Textos de la interfaz (menús, títulos, botones, FAQ, etc.)

Edita los archivos en [`src/_data/i18n/`](src/_data/i18n/): `es.json`, `en.json` y `de.json`. Cada clave existe en los tres idiomas con la misma estructura.

### Productos de la tienda

Edita [`src/_data/products.json`](src/_data/products.json). Cada producto sigue este esquema:

```jsonc
{
  "id": "identificador-unico",
  "category": "crafts", // crafts | digitalArt | paintings | figures
  "isExample": true,     // ponlo a false (o elimina la clave) cuando sea un producto real
  "price": 34.9,
  "priceFrom": false,    // true si el precio es "desde X €"
  "customizable": true,
  "image": "/assets/images/placeholders/category-crafts.svg",
  "name": { "es": "...", "en": "...", "de": "..." },
  "description": { "es": "...", "en": "...", "de": "..." },
  "customizationNote": { "es": "...", "en": "...", "de": "..." }
}
```

> ⚠️ Los 11 productos incluidos actualmente son **datos de ejemplo** (marcados con el distintivo "Producto de ejemplo"). Sustitúyelos por tu catálogo real y elimina o pon en `false` el campo `isExample`.

### Fotografías

Todas las imágenes de `src/assets/images/placeholders/` son ilustraciones generadas automáticamente para marcar el hueco visual. Sustitúyelas por tus fotografías reales (mismo nombre de archivo o actualizando las rutas en `products.json` y en las plantillas `.njk`), priorizando fotos con luz natural y fondos claros, como se describe en las guías de marca.

### Datos de contacto y redes sociales

Edita [`src/_data/site.js`](src/_data/site.js):

- `email`: tu correo de contacto real.
- `instagram` / `x`: enlaces a tus redes.
- `formspreeEndpoint`: crea una cuenta gratuita en [Formspree](https://formspree.io/), crea un formulario y pega aquí la URL de endpoint (`https://formspree.io/f/XXXXXXX`) para que el formulario de contacto envíe los mensajes a tu email.
- `fanficUrl`: enlace a donde publiques tus fanfics (AO3, Wattpad, etc.).

## 🎨 Estética

La paleta de colores (blancos rotos, cremas, verde bosque y marrones con acentos dorados) está definida como variables CSS en [`src/assets/css/style.css`](src/assets/css/style.css), bajo `:root`. Cambiar estos valores actualiza el color en todo el sitio.

## 🔍 SEO incluido

- Metaetiquetas `title`/`description` por página e idioma.
- Enlaces `hreflang` entre las tres versiones de idioma de cada página.
- Open Graph y Twitter Cards.
- Datos estructurados (JSON-LD) de tipo `Organization` en todo el sitio y `Product` en las páginas de categoría.
- `sitemap.xml` y `robots.txt` generados automáticamente.
- HTML semántico y textos alternativos en imágenes.

## 🧾 Pendiente antes de publicar

- [ ] Sustituir las fotografías de ejemplo por fotos reales.
- [ ] Sustituir el catálogo de ejemplo por los productos reales.
- [ ] Configurar el email, Formspree y enlaces de redes sociales en `src/_data/site.js`.
- [ ] Revisar y ajustar las traducciones si lo deseas.
- [ ] Activar GitHub Pages con origen "GitHub Actions" (ver arriba).
