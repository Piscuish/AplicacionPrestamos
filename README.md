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
- **Espejo en archivo:** cada vez que se guarda algo, también se escribe en un archivo interno (`gp-data.json`). Si el almacenamiento de la app se perdiera, al abrirla se restaura sola desde ese archivo.
- **Copia antes de cada actualización:** la app detecta que cambió de versión y guarda una copia automática antes de cualquier otra cosa. Además guarda una copia diaria, hasta 5 en total, que se pueden ver en *Configuración → Copias automáticas*.
- **Datos dañados no se borran:** si un dato no se puede leer, se aparta y se recupera desde la última copia.
- **Migraciones solo agregan:** si una versión futura cambia el formato de los datos, se hace con una función en `MIGRATIONS` que agrega campos y nunca borra clientes, préstamos ni pagos.
- **Respaldo de Android activado** (`allowBackup`): Android puede guardar los datos de la app en la cuenta de Google del teléfono.

## Estructura
- `www/` contiene la app. Los cambios se hacen aquí:
  - `index.html` tiene las pantallas.
  - `css/styles.css` tiene el diseño.
  - `js/core.js` maneja los datos y los cálculos (cuotas, pagos, recargos y finanzas).
  - `js/main.js` contiene las pantallas de la app.
  - `js/app.js` maneja la configuración inicial y el inicio de sesión.
- `android/` es el proyecto Android generado por Capacitor.
- `.github/workflows/build-apk.yml` compila y publica el APK.

## Compilar en tu computador (opcional)
Requiere Node 22, JDK 21 y Android Studio:
```
npm install
npx cap sync android
npx cap open android
```
