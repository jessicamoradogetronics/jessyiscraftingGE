# JessyIsCrafting

Web estática (HTML + CSS + JavaScript, sin frameworks ni build step) para
**JessyIsCrafting**, lista para alojarse gratis en **GitHub Pages**.

Estética minimalista, cálida y con alma de bosque medieval: blancos rotos,
cremas, verdes bosque y maderas, con tipografía serif (Cormorant Garamond)
para titulares y una sans (Work Sans) para el texto.

## Estructura del proyecto

```
├── index.html              Portada
├── tienda.html              Tienda (listado con filtro por categoría)
├── producto.html             Ficha de producto (?id=<slug>, ver data/products.json)
├── galeria.html              Galería visual (piezas + taller)
├── historia.html             Nuestra historia
├── personalizados.html        Personalizados y regalos
├── colaboraciones.html        Colaboraciones (comisiones, marcas, talleres)
├── inspiracion.html           Inspiración (Kingdom Come: Deliverance, lectura, fanfics)
├── contacto.html              Formulario + canales de contacto
├── faq.html                   Preguntas frecuentes (con JSON-LD FAQPage)
├── 404.html                   Página de error
├── partials/                  Cabecera y pie compartidos (se inyectan por JS)
├── css/styles.css             Sistema de diseño (variables, componentes, responsive)
├── js/
│   ├── include.js             Inyecta header/footer en cada página
│   ├── i18n.js                 Motor de idiomas (detecta navegador, guarda preferencia)
│   ├── main.js                  Menú móvil, enlace activo, lightbox de imágenes
│   ├── store.js                  Render + filtro de la tienda
│   ├── product.js                 Render de la ficha de producto
│   └── contact.js                  Prefill del formulario desde un producto
├── i18n/{es,en,de}.json        Diccionarios de texto (español, inglés, alemán)
├── data/products.json           Catálogo de productos (precio, categoría, imágenes)
└── assets/img/                  Fotografías optimizadas (JPEG + WebP, a tamaño completo y miniatura)
```

## Cómo funciona el multi-idioma

No hay backend: todo el texto vive en `i18n/es.json`, `i18n/en.json` e
`i18n/de.json` con la misma estructura de claves. `js/i18n.js`:

1. Detecta el idioma guardado (`localStorage`) o, si no hay ninguno, el
   idioma del navegador (`navigator.languages`), con español como idioma
   por defecto.
2. Descarga el JSON correspondiente y sustituye todo el texto marcado con
   `data-i18n="clave.anidada"` (o `data-i18n-attr="attr:clave"` para
   atributos como `placeholder` o `alt`).
3. El selector de idioma del menú permite cambiarlo en cualquier momento,
   sin recargar la página.

Para añadir un idioma nuevo: duplica `i18n/es.json`, tradúcelo entero y
añade la opción correspondiente en `<select id="langSelect">`
(`partials/header.html`) y en `SUPPORTED_LANGS` (`js/i18n.js`).

## Cómo añadir o editar productos

Cada producto tiene dos partes:

1. **Datos** en `data/products.json`: `id`, `category`
   (`artesanias` | `dibujos` | `cuadros` | `figuras`), `price`, `priceFrom`,
   `customizable`, `featured` y la lista de `images` (ruta **sin** extensión;
   el código añade `.jpg` / `.webp` / `-thumb.jpg` / `-thumb.webp`).
2. **Textos** (nombre, descripción corta, descripción larga y texto de
   personalización) en la sección `products.<id>` de cada archivo de
   `i18n/*.json`.

Las imágenes de producto deben colocarse en `assets/img/<categoria>/` en
dos tamaños: tamaño completo y miniatura (sufijo `-thumb`), en `.jpg` y
`.webp`. Si añades fotos nuevas, genera ambos tamaños y formatos (puedes
usar herramientas como [Squoosh](https://squoosh.app/) o `sharp` en Node).

## Pendiente de personalizar antes de publicar

- **Fotos del taller / de Jessy trabajando**: hay marcadores de posición
  (`photo-frame__placeholder`, `placeholder-tile`) en `historia.html`,
  `index.html` y `galeria.html` listos para sustituir por fotos reales.
- **Formulario de contacto**: `contacto.html` apunta a
  `https://formspree.io/f/your-form-id` — crea una cuenta gratuita en
  [Formspree](https://formspree.io) (o similar) y sustituye esa URL por la
  tuya para que los mensajes lleguen a tu correo.
- **Redes sociales y correo**: sustituye los enlaces de Instagram, X y el
  correo `hola@jessyiscrafting.com` por los reales en
  `partials/header.html`, `partials/footer.html` y `contacto.html`.
- **Dominio**: las etiquetas `canonical` y Open Graph usan
  `https://jessicamrey.github.io/jessyiscrafting/`. Si usas un dominio
  propio, actualiza esas URLs y `sitemap.xml` / `robots.txt`.

## Desarrollo local

Al ser una web 100% estática pero con `fetch()` a archivos JSON locales,
necesitas servirla con un servidor HTTP (no abrir los archivos con
`file://`). Por ejemplo:

```bash
npx http-server -p 8080
# o
python -m http.server 8080
```

Y abre `http://localhost:8080/`.

## Publicar en GitHub Pages

1. Sube el contenido de este repositorio a GitHub (rama `main`).
2. En **Settings → Pages**, selecciona la rama `main` y la carpeta raíz (`/`).
3. GitHub publicará la web en `https://<usuario>.github.io/<repositorio>/`.

## SEO incluido

- Metaetiquetas `title`/`description`/Open Graph/Twitter Card por página.
- `sitemap.xml` y `robots.txt`.
- Datos estructurados JSON-LD (`Organization` en portada, `FAQPage` en
  preguntas frecuentes).
- HTML semántico, textos alternativos en imágenes y un único `<h1>` por
  página.
- Contenido en español renderizado por defecto (idioma principal del
  negocio), con cambio de idioma instantáneo vía JavaScript.
