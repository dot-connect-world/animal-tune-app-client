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

// BANNER_ID는 production 빌드에서만 필수
const isProduction = process.env.EAS_BUILD_PROFILE === 'production';
const admobAndroidBannerId = isProduction
  ? requireEnv('ADMOB_ANDROID_BANNER_ID') :  '';
const admobIosBannerId = isProduction
  ? requireEnv('ADMOB_IOS_BANNER_ID') : '';

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
        "expo-tracking-transparency",
        {
          userTrackingPermission: "This identifier will be used to deliver personalized ads to you."
        }
      ],
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: admobAndroidAppId,
          iosAppId: admobIosAppId
        }
      ],
      "./plugins/withNativePitchDetector",
      // "./plugins/withLocalizedInfoPlist" // 임시 비활성화
    ],
    ios: {
      bundleIdentifier: "site.praytogether.AnimalTune",
      supportsTablet: true,
      buildNumber: "4",
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
