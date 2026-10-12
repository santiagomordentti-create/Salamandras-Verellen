# Salamandras Verellen

Sitio de Verellen Fuegos, Tandil.

- `index.html`: la home. El hero usa de fondo un video en loop (`assets/hero-loop.mp4`) y muestra una imagen fija (`assets/hero-bg.jpg` o `assets/hero-bg-mobile.jpg`) si el usuario tiene activado "reducir movimiento".
- `categoria.html` y `producto.html`: el catálogo. Se arman solos con `data/productos.js` y `assets/catalogo.js`. Gracias a los rewrites de `vercel.json` se ven en `/productos/<categoria>` y `/productos/<categoria>/<modelo>`.
- `assets/styles.css`: el CSS común de todas las páginas.

El catálogo usa rutas absolutas (`/assets/...`), así que hay que verlo con un servidor y no abriendo el archivo directo.

## Pendientes

Estos textos están marcados entre corchetes en el HTML:

- [ ] Provoleteras: modelos y medidas
- [ ] Discos: modelos y medidas
- [ ] Foto del taller o de la familia Verellen (sección Nosotros)
- [ ] Días y horarios de atención (sección Contacto)
- [ ] Formas de pago (sección Contacto)

También faltan las fotos de producto: cada placeholder `FOTO · ...` dice cuál va.
