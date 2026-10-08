package com.webiptv.player;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enableFullScreen();
        configureWebView();
    }

    @Override
    public void onStart() {
        super.onStart();
        configureWebView();
    }

    private void configureWebView() {
        try {
            WebView webView = null;
            if (this.bridge != null) {
                webView = this.bridge.getWebView();
            } else if (this.getBridge() != null) {
                webView = this.getBridge().getWebView();
            }
            if (webView != null) {
                WebSettings webSettings = webView.getSettings();
                // User-Agent VLC essencial para transmissões IPTV (evita rejeição HTTP 403 de streams)
                webSettings.setUserAgentString("VLC/3.0.18 LibVLC/3.0.18");
                webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                webSettings.setMediaPlaybackRequiresUserGesture(false);
                webSettings.setAllowFileAccess(true);
                webSettings.setAllowContentAccess(true);
                webSettings.setDomStorageEnabled(true);
                webSettings.setDatabaseEnabled(true);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableFullScreen();
            configureWebView();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        enableFullScreen();
        configureWebView();
    }

    private void enableFullScreen() {
        Window window = getWindow();
        if (window == null) return;

        // Estender por toda a tela incluindo área de recorte de câmera (Notch / Cutout)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams layoutParams = window.getAttributes();
            layoutParams.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(layoutParams);
        }

        // Configuração de tela cheia imersiva (Oculta Status Bar e Navigation Bar)
        WindowCompat.setDecorFitsSystemWindows(window, false);
        WindowInsetsControllerCompat insetsController =
            new WindowInsetsControllerCompat(window, window.getDecorView());
        
        insetsController.hide(WindowInsetsCompat.Type.systemBars());
        insetsController.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );

        // Fallback para flags de sistema legadas (garantir compatibilidade ampla no Android)
        window.getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }
}
