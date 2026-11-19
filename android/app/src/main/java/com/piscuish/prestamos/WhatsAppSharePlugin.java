package com.piscuish.prestamos;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;

/**
 * Envía una imagen directamente al chat de WhatsApp de un número,
 * sin pasar por el menú de compartir ni buscar el contacto.
 * WhatsApp abre el chat con la imagen y el texto listos; solo se toca "Enviar".
 */
@CapacitorPlugin(name = "WhatsAppShare")
public class WhatsAppSharePlugin extends Plugin {

    static final String WA = "com.whatsapp";
    static final String WA_BUSINESS = "com.whatsapp.w4b";

    private boolean installed(String pkg) {
        try {
            getContext().getPackageManager().getPackageInfo(pkg, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    @PluginMethod
    public void available(PluginCall call) {
        JSObject r = new JSObject();
        r.put("whatsapp", installed(WA));
        r.put("business", installed(WA_BUSINESS));
        call.resolve(r);
    }

    @PluginMethod
    public void shareImage(PluginCall call) {
        String phone = call.getString("phone", "");
        String base64 = call.getString("base64", "");
        String text = call.getString("text", "");
        String fileName = call.getString("fileName", "imagen.png");
        String app = call.getString("app", "");

        phone = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        if (phone.isEmpty()) { call.reject("Número no válido", "no_phone"); return; }
        if (base64 == null || base64.isEmpty()) { call.reject("Imagen vacía", "no_image"); return; }
        int comma = base64.indexOf(',');
        if (base64.startsWith("data:") && comma > 0) base64 = base64.substring(comma + 1);

        String pkg;
        if (WA_BUSINESS.equals(app) && installed(WA_BUSINESS)) pkg = WA_BUSINESS;
        else if (installed(WA)) pkg = WA;
        else if (installed(WA_BUSINESS)) pkg = WA_BUSINESS;
        else { call.reject("WhatsApp no está instalado", "not_installed"); return; }

        try {
            File dir = new File(getContext().getCacheDir(), "compartir");
            if (!dir.exists()) dir.mkdirs();
            File file = new File(dir, fileName.replaceAll("[^A-Za-z0-9._-]", "_"));
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(Base64.decode(base64, Base64.DEFAULT));
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);

            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("image/png");
            intent.setPackage(pkg);
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            if (text != null && !text.isEmpty()) intent.putExtra(Intent.EXTRA_TEXT, text);
            intent.putExtra("jid", phone + "@s.whatsapp.net");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);

            JSObject r = new JSObject();
            r.put("app", pkg);
            call.resolve(r);
        } catch (ActivityNotFoundException e) {
            call.reject("WhatsApp no está instalado", "not_installed");
        } catch (Exception e) {
            call.reject("No se pudo abrir WhatsApp: " + e.getMessage(), "error");
        }
    }
}
