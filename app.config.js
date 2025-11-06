require('dotenv').config({ path: __dirname + '/.env' });

module.exports = {
  expo: {
    name: "Animal Tune",
    slug: "animal-tune",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/dog-icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/dog-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    plugins: [
      [
        "expo-audio",
        {
          microphonePermission: "Allow Animal Tune to access your microphone for guitar tuning."
        }
      ],
      "expo-font",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: process.env.ADMOB_ANDROID_APP_ID,
          iosAppId: process.env.ADMOB_IOS_APP_ID,
          userTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you."
        }
      ],
      "./plugins/withNativePitchDetector"
    ],
    ios: {
      bundleIdentifier: "site.praytogether.AnimalTune",
      supportsTablet: true,
      buildNumber: "2",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/dog-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.INTERNET"
      ],
      package: "site.praytogether.AnimalTune",
      versionCode: 2,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    assetBundlePatterns: [
      "**/*"
    ],
    web: {
      favicon: "./assets/dog-icon.png"
    },
    extra: {
      eas: {
        projectId: "5d73d682-c7d6-40d7-b226-0d84f30ff2a6"
      }
    }
  }
};
