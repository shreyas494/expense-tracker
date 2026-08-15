package com.trackexpense.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import com.getcapacitor.BridgeActivity;

import android.media.projection.MediaProjectionManager;
import android.content.Context;

public class MainActivity extends BridgeActivity {
    private static final int REQUEST_MEDIA_PROJECTION = 2002;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Settings.canDrawOverlays(this)) {
                requestMediaProjection();
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
            requestMediaProjection();
        }
    }

    public void requestMediaProjection() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            MediaProjectionManager projectionManager = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            if (projectionManager != null) {
                try {
                    startActivityForResult(projectionManager.createScreenCaptureIntent(), REQUEST_MEDIA_PROJECTION);
                } catch (Exception e) {
                    startFloatingService(null, 0);
                }
            } else {
                startFloatingService(null, 0);
            }
        } else {
            startFloatingService(null, 0);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_MEDIA_PROJECTION) {
            if (resultCode == RESULT_OK && data != null) {
                startFloatingService(data, resultCode);
            } else {
                startFloatingService(null, 0);
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        checkAndStartService();
        handleBatchImportIntent(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        checkAndStartService();
        handleBatchImportIntent(intent);
    }

    private void handleBatchImportIntent(final Intent intent) {
        if (intent != null && intent.getBooleanExtra("open_batch_import", false)) {
            final java.util.ArrayList<String> paths = intent.getStringArrayListExtra("snapped_paths");
            final int count = paths != null ? paths.size() : 1;
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        bridge.getWebView().evaluateJavascript(
                            "window.location.hash = 'phonepe-import-" + System.currentTimeMillis() + "'; window.dispatchEvent(new CustomEvent('phonepe_auto_trigger', { detail: { count: " + count + " } }));",
                            null
                        );
                    }
                }, 500);
            }
        }
    }

    private void checkAndStartService() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Settings.canDrawOverlays(this)) {
                startFloatingService(null, 0);
            }
        } else {
            startFloatingService(null, 0);
        }
    }

    private void startFloatingService(Intent projectionData, int resultCode) {
        try {
            Intent intent = new Intent(this, FloatingWidgetService.class);
            if (projectionData != null) {
                intent.putExtra("resultCode", resultCode);
                intent.putExtra("projectionData", projectionData);
            }
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
