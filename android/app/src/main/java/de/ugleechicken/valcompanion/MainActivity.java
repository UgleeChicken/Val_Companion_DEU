package de.ugleechicken.valcompanion;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Zeigt Val Companion (docs/index.html) in einer WebView an. */
public class MainActivity extends Activity {

    private static final int BACKGROUND = 0xFF2A1709;
    // Die App-Dateien werden unter dieser https-Adresse ausgeliefert, damit Online-Partien
    // (Firebase) und der Speicher zuverlässig funktionieren. Die Dateien kommen trotzdem aus der App.
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + APP_HOST + "/index.html";

    private WebView web;
    private WebUpdater updater;
    private final ExecutorService background = Executors.newSingleThreadExecutor();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Bildschirm bleibt während des Spiels an.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(BACKGROUND);
        getWindow().setNavigationBarColor(BACKGROUND);

        updater = new WebUpdater(this);

        // Eine heruntergeladene Web-App hat Vorrang vor der eingebauten (siehe WebUpdater).
        final WebViewAssetLoader.PathHandler builtIn = new WebViewAssetLoader.AssetsPathHandler(this);
        final WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
                .setDomain(APP_HOST)
                .addPathHandler("/", path -> updater.hasDownload()
                        ? new WebViewAssetLoader.InternalStoragePathHandler(this, updater.webDir()).handle(path)
                        : builtIn.handle(path))
                .build();

        web = new WebView(this);
        web.setBackgroundColor(BACKGROUND);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true); // Spielstand speichern (localStorage)
        settings.setAllowFileAccess(false);
        settings.setUserAgentString(settings.getUserAgentString() + " ValCompanionApp");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assets.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (APP_HOST.equals(uri.getHost())) {
                    return false;
                }
                // Externe Links im Browser bzw. in der passenden App öffnen.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (ActivityNotFoundException ignored) {
                    // Keine passende App installiert: Link ignorieren.
                }
                return true;
            }
        });

        setContentView(web);

        if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
            web.loadUrl(START_URL);
        }
        if (savedInstanceState == null) {
            checkForUpdate();
        }
    }

    /** Fragt im Hintergrund nach einer neuen Web-Version. Ohne Internet passiert einfach nichts. */
    private void checkForUpdate() {
        background.execute(() -> {
            try {
                WebUpdater.Release release = updater.check();
                if (release != null) {
                    runOnUiThread(() -> askToInstall(release));
                }
            } catch (Exception ignored) {
                // Offline oder GitHub nicht erreichbar: beim nächsten Start wieder versuchen.
            }
        });
    }

    private void askToInstall(WebUpdater.Release release) {
        if (isFinishing() || isDestroyed()) return;
        new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle(R.string.update_title)
                .setMessage(R.string.update_message)
                .setPositiveButton(R.string.update_install, (dialog, which) -> install(release))
                .setNegativeButton(R.string.update_later, null)
                .show();
    }

    private void install(WebUpdater.Release release) {
        Toast.makeText(this, R.string.update_loading, Toast.LENGTH_SHORT).show();
        background.execute(() -> {
            try {
                updater.install(release);
                runOnUiThread(() -> {
                    if (!isDestroyed()) web.loadUrl(START_URL);
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    if (!isDestroyed()) Toast.makeText(this, R.string.update_failed, Toast.LENGTH_LONG).show();
                });
            }
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        background.shutdown();
        web.destroy();
        super.onDestroy();
    }
}
