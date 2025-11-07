require('dotenv').config({ path: __dirname + '/.env' });

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[config] Missing required environment variable: ${key}.`);
  }
  return value;
};

const admobAndroidAppId = requireEnv('ADMOB_ANDROID_APP_ID');
const admobIosAppId = requireEnv('ADMOB_IOS_APP_ID');
const admobAndroidBannerId = requireEnv('ADMOB_ANDROID_BANNER_ID');
const admobIosBannerId = requireEnv('ADMOB_IOS_BANNER_ID');

module.exports = {
  expo: {
    name: "Animal Tune",
    slug: "animal-tune",
    version: "1.0.2",
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
          androidAppId: admobAndroidAppId,
          iosAppId: admobIosAppId,
          userTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you."
        }
      ],
      "./plugins/withNativePitchDetector"
    ],
    ios: {
      bundleIdentifier: "site.praytogether.AnimalTune",
      supportsTablet: true,
      buildNumber: "3",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/dog-icon.png",
        backgroundColor: "#ffffff"
      },
      manifestPlaceholders: {
        ADMOB_ANDROID_APP_ID: admobAndroidAppId,
      },
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.INTERNET"
      ],
      package: "site.praytogether.AnimalTune",
      versionCode: 3,
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
      },
      admob: {
        androidAppId: admobAndroidAppId,
        iosAppId: admobIosAppId,
        androidBannerId: admobAndroidBannerId,
        iosBannerId: admobIosBannerId,
      }
    }
  }
};
