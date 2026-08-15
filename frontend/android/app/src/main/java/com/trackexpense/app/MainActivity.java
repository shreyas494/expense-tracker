package com.trackexpense.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Settings.canDrawOverlays(this)) {
                startFloatingService();
            } else {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        } else {
            startFloatingService();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        checkAndStartService();
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        checkAndStartService();
    }

    private void checkAndStartService() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Settings.canDrawOverlays(this)) {
                startFloatingService();
            }
        } else {
            startFloatingService();
        }
    }

    private void startFloatingService() {
        try {
            Intent intent = new Intent(this, FloatingWidgetService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent);
            } else {
                startService(intent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
