# Android Billing Setup Guide

## Overview

This app uses RevenueCat SDK which includes Google Play Billing Library 7.x internally.

## Step 1: Ensure Latest Dependencies

The project uses:
- `@revenuecat/purchases-capacitor@latest` - includes Billing Library 7.x

## Step 2: Add Billing Library (if needed explicitly)

Open `android/app/build.gradle` and ensure the billing client is version 7.0.0+:

```gradle
dependencies {
    // ... other dependencies
    
    // Google Play Billing Library 7.x (RevenueCat includes this, but you can add explicitly)
    implementation 'com.android.billingclient:billing:7.0.0'
    implementation 'com.android.billingclient:billing-ktx:7.0.0'
}

android {
    // Ensure Java 8+ compatibility for Billing Library 7.x
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}
```

## Step 3: Add Required Permissions

Open `android/app/src/main/AndroidManifest.xml` and ensure these permissions are present:

```xml
<uses-permission android:name="com.android.vending.BILLING" />
<uses-permission android:name="android.permission.INTERNET" />
```

## Step 4: Sync and Build

After updating dependencies:

```bash
# Pull latest code
git pull

# Install npm dependencies
npm install

# Sync Capacitor
npx cap sync android

# Clean and rebuild
cd android
./gradlew clean
cd ..

# Run the app
npx cap run android
```

## Google Play Console Setup

### 1. Upload App to Testing Track
- Go to Google Play Console → Your App → Testing → Internal testing
- Create a new release and upload your signed APK/AAB
- Publish the release

### 2. Activate Subscriptions
- Go to Monetize → Products → Subscriptions
- Ensure both `jarify_mo` and `jarify_yr` are **Active**
- Each subscription must have an active Base Plan

### 3. Add License Testers
- Go to Settings → License testing
- Add your Gmail account(s) as testers
- These accounts can make test purchases without being charged

### 4. Install via Play Store
- Get the Internal testing link from Testing → Internal testing → Testers tab
- Share this link with your test Gmail account
- Install the app via this link (NOT via USB/ADB)

## Subscription Product IDs

| Plan | Product ID | Base Plan ID | Offer ID |
|------|------------|--------------|----------|
| Monthly | `jarify_mo` | `jarify-mo` | `jarify-monthly-offer` |
| Yearly | `jarify_yr` | `jarify-yearly-plan` | `jarify-yearly-trial` |

## RevenueCat Configuration

1. Create account at [RevenueCat Dashboard](https://app.revenuecat.com)
2. Add Android app with package: `com.jarify.app`
3. Upload Google Play service account JSON
4. Import products from Google Play
5. Create "Jarify Pro" entitlement
6. Create offering with monthly/yearly packages

## Troubleshooting

### "Item could not be found" Error
1. App must be uploaded to at least Internal Testing track
2. Subscriptions must be Active in Play Console
3. Wait 1-2 hours after publishing for products to sync
4. Package name must match: `com.jarify.app`
5. Install app from Play Store testing link, not ADB

### Billing Library Version Error
1. Ensure `@revenuecat/purchases-capacitor` is latest version
2. Check `android/app/build.gradle` has billing 7.0.0+
3. Run `npx cap sync android` after updating

### Purchase Dialog Not Appearing
1. Ensure Google Play Services is updated on device
2. Clear Google Play Store cache
3. Test with a different Google account

### Authentication Errors
1. Add tester email to License testing in Play Console
2. Ensure test account has a valid payment method added

---

## Google Sign-In Setup (Capgo Social Login)

### Step 1: Full `MainActivity.java`

Replace `android/app/src/main/java/com/jarify/app/MainActivity.java` with the full code below:

```java
package com.jarify.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register Capgo Social Login Plugin
        registerPlugin(SocialLoginPlugin.class);

        Log.d(TAG, "MainActivity created with SocialLogin plugin registered");
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Forward Google Sign-In result to the SocialLogin plugin
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN
                && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {

            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle != null) {
                SocialLoginPlugin plugin = (SocialLoginPlugin) pluginHandle.getInstance();
                plugin.handleGoogleLoginIntent(requestCode, data);
                Log.d(TAG, "Google Sign-In result forwarded to SocialLoginPlugin");
            }
        }
    }
}
```

### Step 2: Add `strings.xml`

Create or update `android/app/src/main/res/values/strings.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Jarify</string>
    <string name="title_activity_main">Jarify</string>
    <string name="package_name">com.jarify.app</string>
    <string name="custom_url_scheme">com.jarify.app</string>
    <string name="server_client_id">467764265978-hupkmmhkn56t71cs1u5mm2p173922408.apps.googleusercontent.com</string>
</resources>
```


### Step 2.5: Splash Screen Background

Update `android/app/src/main/res/values/styles.xml` to set the primary brand color as the window background (prevents white flash):

```xml
<style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
    <item name="android:windowBackground">#3a6cc9</item>
</style>
```

### Step 3: Update `AndroidManifest.xml`


Ensure the following permissions and intent filters are in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="com.android.vending.BILLING" />

<application ...>
    <activity
        android:name=".MainActivity"
        android:exported="true"
        android:launchMode="singleTask">
        
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>

        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="com.jarify.app" />
        </intent-filter>
    </activity>
</application>
```

### Step 4: Sync and Build

```bash
npm install
npx cap sync android
cd android
./gradlew clean
cd ..
npx cap run android
```

> **Note:** Google Sign-In scopes (email, profile, openid, drive.file, drive.appdata) are configured in `capacitor.config.ts` and requested at runtime in `src/lib/googleAuth.ts`. The `MainActivity` implements `ModifiedMainActivityForSocialLoginPlugin` and forwards `onActivityResult` to handle the native Google Sign-In callback properly.
