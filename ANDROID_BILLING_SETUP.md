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
