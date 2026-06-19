# Calculadora de Paella Valenciana 🥘

Webapp (PWA instalable y offline) que calcula los **ingredientes**, la **proporción
arroz/caldo** y el **grosor de la capa** de tu paella valenciana según:

- **Comensales** (2–10)
- **Diámetro** de la paella (32–90 cm)
- **Tipo de arroz** (Redondo/Senia, Albufera, Bomba)
- **Tipo de fuego** (normal · tubo redondo / alta potencia · tubo plano)

Avisa cuando el arroz es **insuficiente** para ese diámetro o cuando **se pasa de
rango** (hay que ampliar la paella), y sugiere correcciones de diámetro o comensales.

## Origen de los datos

Tablas transcritas de la calculadora de [arrocesconestilo.com](https://www.arrocesconestilo.com)
y de la tabla de Instagram de @arrocesconestilo (ver `calculadora-paella-valenciana.md`).
Se aplican las correcciones de anomalías documentadas (judía, Q2, aceite, sal).

## Desarrollo

```bash
npm install
npm run gen-icons   # genera iconos PWA en public/icons (una vez)
npm run dev         # servidor de desarrollo
npm run build       # build de producción en dist/
npm run preview     # sirve el build de producción
```

> Tras `npm install`, ejecuta `npm run gen-icons` antes del primer `dev`/`build`
> para crear los iconos de la app.

## Arquitectura

- `src/data.js` — tablas de lookup (ingredientes, Q1, Q2, arroz por capa, rangos IG).
- `src/engine.js` — motor de cálculo puro (capa, agua, proporción, sugerencias).
- `src/main.js` — UI, estado (localStorage) y render.
- `src/pwa.js` — service worker e instalación.
- `src/styles.css` — estilos mobile-first.
- `public/app-icons/` — iconos PWA. Se llama `app-icons` (no `icons`) porque Apache
  reserva `/icons/` con un `Alias` global (fancy-indexing) que intercepta esa ruta
  antes de llegar al docroot del subdominio.

### Cómo se combinan las dos fuentes

- **Ingredientes y agua exacta** vienen de la calculadora web (por comensales).
- **El grosor de capa** se nombra con los umbrales de Instagram (arroz por diámetro),
  pero la banda "aceptable" se ensancha para cubrir lo que la web ofrece: así solo se
  avisa de "insuficiente/excesiva" en combinaciones realmente extremas.
- **El fuego alto** añade ~5–9 % de caldo (derivado de la tabla de Instagram).

Las cantidades son orientativas.

## Despliegue — arroces.soydac.com (VPS IONOS + Plesk)

Sitio **estático**: GitHub Actions compila el `dist/` y lo sube por `rsync`/SSH al
document root del subdominio en Plesk, que lo sirve con SSL. No hace falta PM2 ni
ningún proceso corriendo.

Flujo: `push a main` → [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
→ `npm ci` + `npm test` + `npm run build` → `rsync dist/ → VPS`.

### Puesta en marcha (una sola vez)

1. **Subdominio en Plesk**: *Sitios web y dominios* → *Añadir subdominio* → nombre
   `arroces`, dominio padre `soydac.com`. Anota su document root real comprobando
   `DocumentRoot` en `/var/www/vhosts/system/<subdominio>/conf/httpd.conf` del VPS:
   en este subdominio es `/var/www/vhosts/soydac.com/arroces.soydac.com` (**sin**
   `/httpdocs`, a diferencia de otros dominios de Plesk).
2. **DNS**: asegúrate de que `arroces.soydac.com` resuelve al VPS (si IONOS gestiona
   el DNS, Plesk suele crear el registro automáticamente).
3. **SSL**: en el subdominio → *Certificados SSL/TLS* → activa **Let's Encrypt** con
   renovación automática.
4. **Secrets del repo** (`Settings → Secrets and variables → Actions`), los mismos
   que en home-tasks salvo `DEPLOY_PATH`:

   | Secret | Valor |
   |---|---|
   | `SSH_HOST` | IP/host del VPS |
   | `SSH_USER` | usuario SSH del VPS |
   | `SSH_KEY` | clave **privada** SSH con acceso al VPS |
   | `SSH_PORT` | puerto SSH (si no es 22) |
   | `DEPLOY_PATH` | document root del subdominio (ver paso 1; **verifica** que coincide con el `DocumentRoot` real de Apache, no asumas `httpdocs`) |

   Por línea de comandos:

   ```bash
   gh secret set SSH_HOST   --repo dacmail/arroces --body "<ip-o-host-del-vps>"
   gh secret set SSH_USER   --repo dacmail/arroces --body "<usuario>"
   gh secret set SSH_PORT   --repo dacmail/arroces --body "22"
   gh secret set DEPLOY_PATH --repo dacmail/arroces --body "/var/www/vhosts/soydac.com/arroces.soydac.com"
   gh secret set SSH_KEY    --repo dacmail/arroces < ~/.ssh/id_vps   # tu clave privada
   ```

5. **Primer despliegue**: haz `push` a `main` o lanza el workflow manualmente
   (*Actions → Build & Deploy → Run workflow*).

> El job de `build`/`test` corre también en Pull Requests; el `rsync` solo se ejecuta
> en push a `main`.
