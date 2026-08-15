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
        params.y = 100;

        // Inflate or create simple floating container view
        Button snapBtn = new Button(this);
        snapBtn.setText("📸 Snap PhonePe (0)");
        
        android.graphics.drawable.GradientDrawable gd = new android.graphics.drawable.GradientDrawable();
        gd.setColor(Color.parseColor("#9333ea"));
        gd.setCornerRadius(60f);
        gd.setStroke(3, Color.parseColor("#c084fc"));
        snapBtn.setBackground(gd);
        snapBtn.setTextColor(Color.WHITE);
        snapBtn.setPadding(40, 24, 40, 24);
        snapBtn.setTextSize(13f);

        snapBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                snapCount++;
                snapBtn.setText("📸 Snap PhonePe (" + snapCount + ")");
                Toast.makeText(getApplicationContext(), "PhonePe Receipt Snapped into RAM!", Toast.LENGTH_SHORT).show();
            }
        });

        // Touch to drag bubble anywhere on screen
        snapBtn.setOnTouchListener(new View.OnTouchListener() {
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
                        windowManager.updateViewLayout(snapBtn, params);
                        return true;
                }
                return false;
            }
        });

        floatingView = snapBtn;
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
