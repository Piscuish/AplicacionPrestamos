# Gestión de Préstamos (App Android)

App para administrar un negocio de préstamos. Hecha con HTML/CSS/JS + Capacitor.

## Qué incluye
- **Primera configuración e inicio de sesión:** logo opcional, nombre de la empresa, usuario y contraseña cifrada.
- **Inicio:** dinero por cobrar, prestado, recaudado, intereses ganados, clientes, préstamos activos, pagos vencidos y próximos pagos. Tocar el logo abre Configuración.
- **Clientes:** solo el nombre es obligatorio. Tienen foto, documento, teléfono, dirección, correo y notas, y desde el perfil se puede llamar, escribir por WhatsApp o abrir la ubicación.
- **Préstamos:**
  - El interés se cobra una sola vez sobre el monto.
  - La frecuencia de cobro puede ser diaria, semanal, quincenal o mensual.
  - Las cuotas se calculan solas y se muestran como pagada, parcial, pendiente o vencida.
- **Pagos:**
  - Se registra si el cliente pagó total, pagó una parte o no pagó.
  - Si sobra dinero, pasa automáticamente a la siguiente cuota.
  - Cada pago genera un comprobante en imagen que se puede enviar por WhatsApp.
- **Calendario de cobros** y una lista de **cobros del día**.
- **Finanzas:** ganancia del período, ingresos, gastos, una gráfica de flujo, la distribución entre capital e intereses y la rentabilidad.
- **Movimientos:** pagos, préstamos entregados, gastos y otros ingresos.
- **Configuración:**
  - Datos de la empresa, usuario y contraseña.
  - Recargo por atraso, opcional, en % o valor fijo y con días de gracia.
  - Actualizaciones.
  - Copia de seguridad para guardar y restaurar.

## Cómo obtener el APK
1. Sube este proyecto a GitHub en la rama `main`, en el repositorio **Piscuish/AplicacionPrestamos**.
2. GitHub compila la app sola en unos 5 minutos y publica una **Release** con el APK (pestaña *Releases*).
3. Descarga el `.apk` en el teléfono e instálalo. Android pedirá permitir "instalar apps de origen desconocido".

Cada vez que subas cambios se publica una versión nueva y la app la detecta sola al abrirse.

### Actualizaciones en vivo (sin instalar APK)
- Si el cambio es solo de la app (pantallas, cálculos, diseño: todo lo que está en `www/`), la app **descarga la actualización sola** y la aplica la próxima vez que se abre. También se puede aplicar al momento desde el aviso en Inicio. No hay que instalar nada.
- Si el cambio agrega complementos (`package.json`), cambia `capacitor.config.json` o los permisos (`AndroidManifest.xml`), la app pide instalar el APK. El archivo `android-compat.txt` guarda la versión de APK mínima compatible; súbelo al número de la nueva versión cuando agregues un complemento o permiso (si se te olvida, el workflow lo detecta y exige el APK igual).
- Cambiar el ícono o la pantalla de carga NO bloquea las actualizaciones en vivo: el ícono nuevo se ve al instalar el APK, pero el resto de la app se sigue actualizando sola.
- **Protección:** si una versión nueva tiene un error y no abre bien, la app vuelve sola a la versión anterior, marca esa versión como fallida y no la reintenta.
- Antes de aplicar cualquier actualización se guarda una copia automática de los datos.

> Para que la app pueda consultar las versiones, el repositorio debe ser **público**.

## ⚠️ Reglas para NO perder datos al actualizar
Android conserva los datos de la app cuando el APK nuevo es una actualización de la misma app.
Para que siempre sea así:
1. **No cambies** el identificador `com.piscuish.prestamos` (archivo `capacitor.config.json`).
2. **No cambies ni borres** la firma `android/app/debug.keystore`. Si se pierde, las nuevas versiones no se podrán instalar encima de la anterior.
3. El número de versión siempre debe subir. El workflow lo hace solo con cada compilación.
4. **Nunca desinstales** la app para instalar una versión nueva. Desinstalar sí borra los datos.
5. Antes de actualizar, guarda una copia en **Configuración → Copia de seguridad**.

### Protecciones automáticas dentro del código (`www/js/core.js`)
- **Datos en archivo, sin límite de tamaño:** en el teléfono los datos viven en el archivo interno `gp-data.json`. Se escribe de forma segura: primero un temporal y luego se reemplaza, guardando también la versión anterior (`gp-data.prev.json`). Al abrir se usa el más reciente que se pueda leer. Mientras los datos son pequeños también hay una copia rápida en el almacenamiento web (`localStorage`), que tiene un límite de ~10 MB; al pasar de ~4 MB la app deja de usarlo y todo queda solo en el archivo (`gp.data.store = "file"`). Mientras el archivo se lee al abrir, la app no permite guardar, para no pisar nada.
- **Copias automáticas en archivos** (carpeta `copias/`, máximo 6): una diaria, antes de cada actualización, antes de migrar y antes de restaurar. Se ven y restauran en *Configuración → Copias automáticas*.
- **Datos dañados no se borran:** si un dato no se puede leer, se aparta y se recupera desde la última copia.
- **Migraciones solo agregan:** si una versión futura cambia el formato de los datos, se hace con una función en `MIGRATIONS` que agrega campos y nunca borra clientes, préstamos ni pagos.
- **Respaldo de Android activado** (`allowBackup`): Android puede guardar los datos de la app en la cuenta de Google del teléfono.

### Pruebas (obligatorias antes de publicar)
`npm test` corre `tests/core.test.js`. Incluye:
- **Migración de datos reales:** `tests/fixtures/datos-v118.json` se generó con el código de la versión 1.0.118. Toda versión nueva debe abrir esos datos y calcular exactamente los mismos saldos, cuotas y fechas. **No modificar ese archivo.**
- **Almacenamiento en archivo:** datos grandes pasan a archivo, se recuperan al reabrir y sobreviven a un archivo principal dañado.

## Estructura
- `www/` contiene la app (HTML/CSS/JS sin frameworks). Los scripts se cargan en este orden:
  - `js/core.js`: datos, migraciones, cálculos financieros, permisos, auditoría, caja y cifrado. **Toda escritura pasa por `GP.ops`**, que revisa permisos, valida y audita.
  - `js/ui.js`: componentes (campos, listas, hojas, diálogos), navegación, tema claro/oscuro, CSV.
  - `js/docs.js`: comprobante y estado de cuenta (imagen y PDF) y envío por WhatsApp.
  - `js/s-home.js` (Inicio, Más, Buscar), `s-clients.js`, `s-loans.js`, `s-pay.js`, `s-cobros.js` (Cobros y Calendario), `s-org.js` (Carteras y Rutas), `s-money.js` (Finanzas, Movimientos, Caja, Reportes), `s-admin.js` (Usuarios, Auditoría, Configuración).
  - `js/main.js`: arranque, barra inferior, botón central, copias, bloqueo de sesión y actualizaciones.
  - `js/app.js`: configuración inicial e inicio de sesión.
  - `css/styles.css`: sistema de diseño. Los colores son variables; el modo oscuro solo cambia variables.
- `tests/core.test.js`: pruebas de la lógica financiera y de datos.
- `tools/serve.js`: servidor local para probar en el navegador.
- `android/` es el proyecto Android generado por Capacitor.
- `.github/workflows/build-apk.yml` compila y publica el APK.

## Probar en el computador
Requiere solo Node (no instala nada):
```
node --test tests/core.test.js     # pruebas de la lógica (29)
node tools/serve.js                # abre http://localhost:5173
```
En el navegador funciona todo excepto lo nativo: WhatsApp directo, huella, guardar archivos y actualizaciones en vivo.

## Modelo de datos (esquema 2)
La migración 1 → 2 (`MIGRATIONS[2]` en `core.js`) **solo agrega**:
- Antes de migrar se guarda una copia intacta en *Copias automáticas* y en el archivo interno `gp-data-antes-esquema-2.json`.
- Clientes: `status`, `docType`, `refs`, y opcionales `phone2`, `barrio`, `city`, `portfolioId`.
- Préstamos: `interestMode` (los existentes quedan en `"flat"`, el interés de siempre, así sus cuotas no cambian), y opcionales `firstDate`, `portfolioId`, `method`, `notes`.
- Pagos: `receiptNo`, `user`, `token` (anti-duplicados) y anulación (`voided`, `voidReason`, `voidedBy`, `voidedAt`). Los pagos ya no se borran: se anulan.
- Movimientos: `kind` (`gasto`, `ingreso`, `aporte`, `retiro`, `ajuste`).
- Listas nuevas: `portfolios`, `routes`, `visits`, `users`, `cash`, `audit`.
- Ajustes nuevos: métodos de pago, categorías de gastos, tasa de usura, días para "en mora", modalidad de interés por defecto.

Si se volviera a una versión anterior de la app, los datos se siguen leyendo (los campos nuevos se ignoran), pero esa versión contaría los pagos anulados.

## Limitaciones conocidas (no simuladas)
- **Varios usuarios, un solo teléfono.** Los cobradores entran con su usuario en el mismo teléfono; no hay sincronización entre teléfonos. Eso requiere un servidor con autenticación compartida y una estrategia de conflictos (por ejemplo, pagos con identificador único, que ya existe: `token`).
- **Mapa:** no hay mapa dentro de la app (necesitaría un proveedor de mapas y una clave). La ruta se abre en Google Maps con las direcciones registradas; no se inventan coordenadas.
- **Tasa de usura:** la certifica la Superintendencia Financiera cada mes. La app no la descarga: se escribe en *Configuración → Finanzas*, y cada préstamo nuevo se compara con ella.
- **Excel:** los reportes se exportan en CSV (separado por `;`, con tildes), que Excel abre directamente.

## Compilar en tu computador (opcional)
Requiere Node 22, JDK 21 y Android Studio:
```
npm install
npx cap sync android
npx cap open android
```
