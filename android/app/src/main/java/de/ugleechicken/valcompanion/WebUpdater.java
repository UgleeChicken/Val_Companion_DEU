package de.ugleechicken.valcompanion;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Lädt neue Versionen der Web-App (docs/) aus den GitHub-Releases, ohne dass die ganze App
 * neu installiert werden muss.
 *
 * Jedes Release "web-vN" enthält web.zip (der Inhalt von docs/) und web.json mit
 * Versionsnummer, Prüfsumme und der Mindestversion der Android-App.
 * Heruntergeladene Versionen liegen im internen App-Speicher unter files/web/.
 * Ist dort nichts, wird die in der App eingebaute Version angezeigt.
 *
 * Alle Methoden außer {@link #webDir()} und {@link #hasDownload()} greifen aufs Netz zu
 * und dürfen nicht im UI-Thread laufen.
 */
class WebUpdater {

    private static final String RELEASES_URL =
            "https://api.github.com/repos/UgleeChicken/Val_Companion_DEU/releases?per_page=30";
    private static final String TAG_PREFIX = "web-v";
    private static final int TIMEOUT_MS = 10000;

    private static final String PREFS = "web-update";
    private static final String KEY_TREE = "tree";
    private static final String KEY_APP_VERSION = "appVersion";

    /** Eine verfügbare Web-Version aus den GitHub-Releases. */
    static class Release {
        int version;
        String tree;
        String sha256;
        String zipUrl;
    }

    private final File filesDir;
    private final SharedPreferences prefs;

    WebUpdater(Context context) {
        filesDir = context.getFilesDir();
        prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        // Nach einem App-Update ist die eingebaute Version mindestens so neu wie die
        // heruntergeladene, also wird die heruntergeladene verworfen.
        if (prefs.getInt(KEY_APP_VERSION, -1) != BuildConfig.VERSION_CODE) {
            deleteRecursive(webDir());
            prefs.edit().clear().apply();
        }
    }

    /** Ordner mit der heruntergeladenen Web-App. */
    File webDir() {
        return new File(filesDir, "web");
    }

    boolean hasDownload() {
        return new File(webDir(), "index.html").isFile();
    }

    /** Git-Hash des docs/-Ordners der gerade angezeigten Version. */
    private String currentTree() {
        return hasDownload() ? prefs.getString(KEY_TREE, "") : BuildConfig.DOCS_TREE;
    }

    /** Sucht eine neuere Web-Version. Gibt null zurück, wenn es keine gibt. */
    Release check() throws Exception {
        JSONArray releases = new JSONArray(readText(RELEASES_URL));
        for (int i = 0; i < releases.length(); i++) {
            JSONObject release = releases.getJSONObject(i);
            if (release.optBoolean("draft") || release.optBoolean("prerelease")
                    || !release.optString("tag_name").startsWith(TAG_PREFIX)) {
                continue;
            }
            // Die Liste ist nach Datum sortiert, das erste passende Release ist das neueste.
            String jsonUrl = null;
            String zipUrl = null;
            JSONArray assets = release.getJSONArray("assets");
            for (int j = 0; j < assets.length(); j++) {
                JSONObject asset = assets.getJSONObject(j);
                if ("web.json".equals(asset.optString("name"))) {
                    jsonUrl = asset.getString("browser_download_url");
                } else if ("web.zip".equals(asset.optString("name"))) {
                    zipUrl = asset.getString("browser_download_url");
                }
            }
            if (jsonUrl == null || zipUrl == null) {
                return null;
            }

            JSONObject info = new JSONObject(readText(jsonUrl));
            Release result = new Release();
            result.version = info.getInt("version");
            result.tree = info.getString("tree");
            result.sha256 = info.getString("sha256");
            result.zipUrl = zipUrl;

            if (result.tree.equals(currentTree())
                    || info.optInt("minApp", 0) > BuildConfig.VERSION_CODE) {
                return null;
            }
            return result;
        }
        return null;
    }

    /** Lädt die Version herunter und ersetzt damit die bisherige. */
    void install(Release release) throws Exception {
        File zip = new File(filesDir, "web.zip");
        File fresh = new File(filesDir, "web-new");
        File old = new File(filesDir, "web-old");
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            try (InputStream in = open(release.zipUrl); OutputStream out = new FileOutputStream(zip)) {
                byte[] buffer = new byte[16384];
                int n;
                while ((n = in.read(buffer)) > 0) {
                    sha.update(buffer, 0, n);
                    out.write(buffer, 0, n);
                }
            }
            if (!toHex(sha.digest()).equalsIgnoreCase(release.sha256)) {
                throw new IOException("Prüfsumme stimmt nicht");
            }

            deleteRecursive(fresh);
            unzip(zip, fresh);
            if (!new File(fresh, "index.html").isFile()) {
                throw new IOException("index.html fehlt");
            }

            // Erst die neue Version fertig entpacken, dann austauschen.
            deleteRecursive(old);
            File current = webDir();
            if (current.exists() && !current.renameTo(old)) {
                throw new IOException("Alte Version lässt sich nicht verschieben");
            }
            if (!fresh.renameTo(current)) {
                old.renameTo(current);
                throw new IOException("Neue Version lässt sich nicht verschieben");
            }
            prefs.edit()
                    .putString(KEY_TREE, release.tree)
                    .putInt(KEY_APP_VERSION, BuildConfig.VERSION_CODE)
                    .apply();
        } finally {
            zip.delete();
            deleteRecursive(fresh);
            deleteRecursive(old);
        }
    }

    private static void unzip(File zip, File target) throws IOException {
        String root = target.getCanonicalPath() + File.separator;
        try (ZipInputStream in = new ZipInputStream(new FileInputStream(zip))) {
            byte[] buffer = new byte[16384];
            ZipEntry entry;
            while ((entry = in.getNextEntry()) != null) {
                File file = new File(target, entry.getName());
                // Schutz gegen Einträge wie "../../datei", die außerhalb landen würden.
                if (!file.getCanonicalPath().startsWith(root)) {
                    throw new IOException("Ungültiger Pfad im Archiv: " + entry.getName());
                }
                if (entry.isDirectory()) {
                    file.mkdirs();
                    continue;
                }
                file.getParentFile().mkdirs();
                try (OutputStream out = new FileOutputStream(file)) {
                    int n;
                    while ((n = in.read(buffer)) > 0) {
                        out.write(buffer, 0, n);
                    }
                }
            }
        }
    }

    private static InputStream open(String url) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setConnectTimeout(TIMEOUT_MS);
        connection.setReadTimeout(TIMEOUT_MS);
        connection.setRequestProperty("User-Agent", "ValCompanionApp");
        if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
            throw new IOException("HTTP " + connection.getResponseCode() + " für " + url);
        }
        return connection.getInputStream();
    }

    private static String readText(String url) throws IOException {
        try (InputStream in = open(url)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int n;
            while ((n = in.read(buffer)) > 0) {
                out.write(buffer, 0, n);
            }
            return out.toString("UTF-8");
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder();
        for (byte b : bytes) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }

    private static void deleteRecursive(File file) {
        File[] children = file.listFiles();
        if (children != null) {
            for (File child : children) {
                deleteRecursive(child);
            }
        }
        file.delete();
    }
}
