# JessyIsCrafting

Web oficial de **JessyIsCrafting**: artesanía, dibujo digital, cuadros y figuras pintadas a mano, hechas con cariño en España.

Sitio **100% HTML, CSS y JavaScript estático** — sin build, sin Node, sin frameworks. Se publica directamente en GitHub Pages sirviendo los archivos del repositorio tal cual ("Deploy from a branch").

## 🗂️ Estructura del proyecto

```
.
├── index.html, our-story.html, contact.html, faq.html, ...   # Páginas (raíz)
├── shop/
│   ├── index.html            # Vitrina de categorías
│   ├── crafts.html            # Artesanías
│   ├── digital-art.html       # Dibujo digital
│   ├── paintings.html         # Cuadros
│   └── figures.html           # Figuras
├── partials/
│   ├── header.html            # Cabecera + menú + selector de idioma (se inyecta por JS)
│   ├── footer.html            # Pie de página (se inyecta por JS)
│   └── product-modal.html     # Modal de "ver detalles" de producto (solo en páginas de tienda)
├── assets/
│   ├── css/style.css          # Estilos (paleta de colores, componentes)
│   ├── js/
│   │   ├── i18n.js            # Carga los textos y traduce la página al vuelo
│   │   ├── app.js              # Inyecta cabecera/pie, menú móvil, modal, acordeón FAQ
│   │   └── products.js        # Carga products.json y pinta las tarjetas de producto
│   ├── images/placeholders/   # Imágenes de ejemplo (sustituir por fotos reales)
│   └── data/
│       ├── i18n/{es,en,de}.json  # Textos de la interfaz, por idioma
│       └── products.json         # Catálogo de productos (EJEMPLO)
├── 404.html, robots.txt, sitemap.xml
└── tools/generate-placeholders.js  # Script opcional para regenerar los SVG de ejemplo
```

## 🌍 Cómo funciona el idioma (sin build)

No hay carpetas `/es/`, `/en/`, `/de/`: cada página existe una sola vez. Al cargarla:

1. `i18n.js` detecta el idioma del visitante (el que eligió la última vez, si no, el de su navegador) y descarga los 3 archivos JSON de `assets/data/i18n/`.
2. Sustituye el texto de todos los elementos marcados con `data-i18n="clave"` por la traducción correspondiente.
3. Al pulsar ES/EN/DE en el menú, el cambio es instantáneo (sin recargar la página) y se recuerda la próxima visita.

Esto significa que **cada página HTML se edita una sola vez**, con el texto en español como contenido de respaldo visible, y las claves de traducción controlan lo que se muestra.

## ✏️ Cómo editar el contenido

### Textos de la interfaz (menús, títulos, botones, FAQ, etc.)

Edita los archivos en [`assets/data/i18n/`](assets/data/i18n/): `es.json`, `en.json` y `de.json`. Cada clave existe en los tres idiomas con la misma estructura. Por ejemplo, para cambiar el eslogan de la portada, busca `home.heroSubtitle` en los tres archivos.

### Productos de la tienda

Edita [`assets/data/products.json`](assets/data/products.json). Cada producto sigue este esquema:

```jsonc
{
  "id": "identificador-unico",
  "category": "crafts", // crafts | digitalArt | paintings | figures
  "isExample": true,     // ponlo a false (o elimina la clave) cuando sea un producto real
  "price": 34.9,
  "priceFrom": false,    // true si el precio es "desde X €"
  "customizable": true,
  "image": "assets/images/placeholders/category-crafts.svg",
  "name": { "es": "...", "en": "...", "de": "..." },
  "description": { "es": "...", "en": "...", "de": "..." },
  "customizationNote": { "es": "...", "en": "...", "de": "..." }
}
```

> ⚠️ Los 11 productos incluidos son **datos de ejemplo** (marcados con el distintivo "Producto de ejemplo"). Sustitúyelos por tu catálogo real y pon `isExample` en `false`.

Las tarjetas de producto, el modal de detalle y las piezas destacadas de portada se generan automáticamente a partir de este archivo: no hace falta tocar el HTML de las páginas de la tienda.

### Fotografías

Todas las imágenes de [`assets/images/placeholders/`](assets/images/placeholders/) son ilustraciones generadas automáticamente para marcar el hueco visual. Sustitúyelas por tus fotografías reales (mismo nombre de archivo, o cambia la ruta en `products.json` y en el HTML correspondiente), priorizando fotos con luz natural y fondos claros.

### Datos de contacto y redes sociales

Como no hay build, estos datos están escritos directamente en el HTML. Busca y reemplaza (en [`contact.html`](contact.html) y [`partials/footer.html`](partials/footer.html)):

- `tu-email@ejemplo.com` → tu correo real.
- `https://x.com/TU_USUARIO` → tu enlace de X.
- La acción del formulario `https://formspree.io/f/TU_ID_DE_FORMSPREE` → crea una cuenta gratuita en [Formspree](https://formspree.io/), crea un formulario y pega aquí tu endpoint real para que los mensajes lleguen a tu email.
- El enlace de fanfics en [`inspiration.html`](inspiration.html) (`https://archiveofourown.org/`) → tu perfil real (AO3, Wattpad, etc.).

## 🚀 Ver el sitio en local

Al no haber build, basta con servir la carpeta con cualquier servidor estático (abrir los archivos directamente con doble clic no funciona bien porque el navegador bloquea las peticiones `fetch` en `file://`). Por ejemplo, con Node ya instalado:

```bash
npx http-server -p 8080
```

Y abre `http://localhost:8080/index.html`.

## 🌐 Publicación en GitHub Pages (sin build)

1. Ve a **Settings → Pages** en el repositorio de GitHub.
2. En "Build and deployment" → "Source", selecciona **Deploy from a branch**.
3. Elige la rama `main` y la carpeta `/ (root)`.
4. Guarda. GitHub publica el sitio tal cual, sin ningún paso de compilación, en `https://jessicamoradogetronics.github.io/jessyiscraftingGE/`.

Cualquier cambio que subas a `main` (editar un HTML, una traducción o una imagen) se publica automáticamente en uno o dos minutos, sin workflows ni Actions.

## 🎨 Estética

La paleta de colores (blancos rotos, cremas, verde bosque y marrones con acentos dorados) está definida como variables CSS en [`assets/css/style.css`](assets/css/style.css), bajo `:root`. Cambiar estos valores actualiza el color en todo el sitio.

## 🔍 SEO incluido

- Metaetiquetas `title`/`description` traducidas dinámicamente por idioma.
- Open Graph y Twitter Cards.
- Datos estructurados (JSON-LD) de tipo `Organization` en la portada.
- `sitemap.xml` y `robots.txt` estáticos.
- HTML semántico y textos alternativos en imágenes.
- Página `404.html` personalizada.

> Nota: al no haber una URL distinta por idioma, los buscadores indexan cada página en el idioma con el que la detectan (español por defecto si no hay preferencia guardada). Es la contrapartida de no usar build ni carpetas por idioma.

## 🧾 Pendiente antes de publicar

- [ ] Sustituir las fotografías de ejemplo por fotos reales.
- [ ] Sustituir el catálogo de ejemplo por los productos reales en `assets/data/products.json`.
- [ ] Buscar y reemplazar el email, el enlace de X y el endpoint de Formspree.
- [ ] Revisar y ajustar las traducciones si lo deseas.
- [ ] Activar GitHub Pages con origen "Deploy from a branch" (ver arriba).
