package com.trackexpense.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import android.content.pm.ServiceInfo;
import androidx.core.app.NotificationCompat;

public class FloatingWidgetService extends Service {
    private WindowManager windowManager;
    private View floatingView;
    private int snapCount = 0;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // Show foreground service notification for Android 8+ / Android 16 compatibility
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String CHANNEL_ID = "trackexpense_overlay_channel";
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "TrackExpense Floating Snapper",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }

            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle("TrackExpense PhonePe Snapper Active")
                    .setContentText("Floating Camera Bubble active over PhonePe")
                    .setSmallIcon(android.R.drawable.ic_menu_camera)
                    .build();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(1001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(1001, notification);
            }
        }

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

        // Define layout params for floating overlay window
        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
        }

        final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        params.x = 0;
        params.y = 150;

        // Create horizontal linear layout container for glassmorphic capsule
        android.widget.LinearLayout capsuleLayout = new android.widget.LinearLayout(this);
        capsuleLayout.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        capsuleLayout.setGravity(Gravity.CENTER_VERTICAL);
        capsuleLayout.setPadding(20, 14, 20, 14);

        // Glassmorphic background
        android.graphics.drawable.GradientDrawable containerBg = new android.graphics.drawable.GradientDrawable();
        containerBg.setColor(Color.parseColor("#f00f172a")); // Dark slate translucent
        containerBg.setCornerRadius(80f);
        containerBg.setStroke(4, Color.parseColor("#9333ea")); // Neon purple border
        capsuleLayout.setBackground(containerBg);

        // 1. Snap Button (Purple Pill)
        final Button snapBtn = new Button(this);
        snapBtn.setText("📸 Snap (0)");
        snapBtn.setTextColor(Color.WHITE);
        snapBtn.setTextSize(12f);
        android.graphics.drawable.GradientDrawable snapBg = new android.graphics.drawable.GradientDrawable();
        snapBg.setColor(Color.parseColor("#9333ea"));
        snapBg.setCornerRadius(50f);
        snapBtn.setBackground(snapBg);
        snapBtn.setPadding(26, 14, 26, 14);

        // 2. Save & Process Button (Teal Pill)
        final Button saveBtn = new Button(this);
        saveBtn.setText("⚡ Save & Import");
        saveBtn.setTextColor(Color.WHITE);
        saveBtn.setTextSize(12f);
        android.graphics.drawable.GradientDrawable saveBg = new android.graphics.drawable.GradientDrawable();
        saveBg.setColor(Color.parseColor("#0d9488"));
        saveBg.setCornerRadius(50f);
        saveBtn.setBackground(saveBg);
        saveBtn.setPadding(26, 14, 26, 14);
        android.widget.LinearLayout.LayoutParams saveParams = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        saveParams.setMargins(14, 0, 14, 0);
        saveBtn.setLayoutParams(saveParams);

        // 3. Close Button (Red Circle)
        final Button closeBtn = new Button(this);
        closeBtn.setText("✖");
        closeBtn.setTextColor(Color.WHITE);
        closeBtn.setTextSize(14f);
        android.graphics.drawable.GradientDrawable closeBg = new android.graphics.drawable.GradientDrawable();
        closeBg.setColor(Color.parseColor("#ef4444"));
        closeBg.setCornerRadius(50f);
        closeBtn.setBackground(closeBg);
        closeBtn.setPadding(18, 10, 18, 10);

        // Add views to container
        capsuleLayout.addView(snapBtn);
        capsuleLayout.addView(saveBtn);
        capsuleLayout.addView(closeBtn);

        // Snap Click Action
        snapBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                snapCount++;
                snapBtn.setText("📸 Snap (" + snapCount + ")");
                Toast.makeText(getApplicationContext(), "PhonePe Receipt Snapped into RAM!", Toast.LENGTH_SHORT).show();
            }
        });

        // Save & Import Click Action
        saveBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (snapCount == 0) {
                    Toast.makeText(getApplicationContext(), "Snap a PhonePe receipt first!", Toast.LENGTH_SHORT).show();
                    return;
                }
                Toast.makeText(getApplicationContext(), "Processing " + snapCount + " transactions...", Toast.LENGTH_LONG).show();
                Intent openApp = new Intent(getApplicationContext(), MainActivity.class);
                openApp.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                openApp.putExtra("open_batch_import", true);
                startActivity(openApp);
                stopSelf();
            }
        });

        // Close Click Action
        closeBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(getApplicationContext(), "Floating Snapper closed.", Toast.LENGTH_SHORT).show();
                stopSelf();
            }
        });

        // Touch to drag capsule anywhere on screen
        capsuleLayout.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        return false;
                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (event.getRawX() - initialTouchX);
                        params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        windowManager.updateViewLayout(capsuleLayout, params);
                        return true;
                }
                return false;
            }
        });

        floatingView = capsuleLayout;
        try {
            windowManager.addView(floatingView, params);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (floatingView != null && windowManager != null) {
            try {
                windowManager.removeView(floatingView);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
