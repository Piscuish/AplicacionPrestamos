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

Cada vez que subas cambios se publica una versión nueva y la app la detecta en
**Configuración → Actualizaciones**. También la revisa sola una vez al día.

> Para que la app pueda consultar las versiones, el repositorio debe ser **público**.

## ⚠️ Reglas para NO perder datos al actualizar
Android conserva los datos de la app cuando el APK nuevo es una actualización de la misma app.
Para que siempre sea así:
1. **No cambies** el identificador `com.piscuish.prestamos` (archivo `capacitor.config.json`).
2. **No cambies ni borres** la firma `android/app/debug.keystore`. Si se pierde, las nuevas versiones no se podrán instalar encima de la anterior.
3. El número de versión siempre debe subir. El workflow lo hace solo con cada compilación.
4. **Nunca desinstales** la app para instalar una versión nueva. Desinstalar sí borra los datos.
5. Antes de actualizar, guarda una copia en **Configuración → Copia de seguridad**.

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
