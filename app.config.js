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

// BANNER_ID: production 빌드 또는 로컬 빌드(EAS_BUILD_PROFILE이 없을 때)에서 사용
const isProduction = process.env.EAS_BUILD_PROFILE === 'production';
const isLocalBuild = !process.env.EAS_BUILD_PROFILE; // 로컬 빌드 감지

console.log('🔍 [app.config.js] DEBUG:');
console.log('  EAS_BUILD_PROFILE:', process.env.EAS_BUILD_PROFILE);
console.log('  isProduction:', isProduction);
console.log('  isLocalBuild:', isLocalBuild);

// production 빌드이거나 로컬 빌드일 때 Banner ID 사용 (개발 빌드가 아닌 경우)
const shouldUseProdBannerId = isProduction || isLocalBuild;

const admobAndroidBannerId = shouldUseProdBannerId
  ? (process.env.ADMOB_ANDROID_BANNER_ID || '') : '';
const admobIosBannerId = shouldUseProdBannerId
  ? (process.env.ADMOB_IOS_BANNER_ID || '') : '';

console.log('  admobIosBannerId:', admobIosBannerId);
console.log('  admobAndroidBannerId:', admobAndroidBannerId);


  const expoVersion = '1.0.14';
  const iosVersion = '16';
  const androidVersion = 15;


module.exports = {
  expo: {
    name: "Animal Tune",
    slug: "animal-tune",
    version: expoVersion,
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
      buildNumber: iosVersion,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // SKAdNetwork IDs for AdMob (iOS 14.5+ 광고 추적 필수)
        SKAdNetworkItems: [
          { SKAdNetworkIdentifier: "cstr6suwn9.skadnetwork" }, // Google
          { SKAdNetworkIdentifier: "4fzdc2evr5.skadnetwork" }, // Google
          { SKAdNetworkIdentifier: "4pfyvq9l8r.skadnetwork" },
          { SKAdNetworkIdentifier: "2fnua5tdw4.skadnetwork" },
          { SKAdNetworkIdentifier: "ydx93a7ass.skadnetwork" },
          { SKAdNetworkIdentifier: "5a6flpkh64.skadnetwork" },
          { SKAdNetworkIdentifier: "p78axxw29g.skadnetwork" },
          { SKAdNetworkIdentifier: "v72qych5uu.skadnetwork" },
          { SKAdNetworkIdentifier: "ludvb6z3bs.skadnetwork" },
          { SKAdNetworkIdentifier: "cp8zw746q7.skadnetwork" },
          { SKAdNetworkIdentifier: "3sh42y64q3.skadnetwork" },
          { SKAdNetworkIdentifier: "c6k4g5qg8m.skadnetwork" },
          { SKAdNetworkIdentifier: "s39g8k73mm.skadnetwork" },
          { SKAdNetworkIdentifier: "3qy4746246.skadnetwork" },
          { SKAdNetworkIdentifier: "f38h382jlk.skadnetwork" },
          { SKAdNetworkIdentifier: "hs6bdukanm.skadnetwork" },
          { SKAdNetworkIdentifier: "prcb7njmu6.skadnetwork" },
          { SKAdNetworkIdentifier: "v4nxqhlyqp.skadnetwork" },
          { SKAdNetworkIdentifier: "wzmmz9fp6w.skadnetwork" },
          { SKAdNetworkIdentifier: "yclnxrl5pm.skadnetwork" },
          { SKAdNetworkIdentifier: "t38b2kh725.skadnetwork" },
          { SKAdNetworkIdentifier: "7ug5zh24hu.skadnetwork" },
          { SKAdNetworkIdentifier: "gta9lk7p23.skadnetwork" },
          { SKAdNetworkIdentifier: "vutu7akeur.skadnetwork" },
          { SKAdNetworkIdentifier: "y5ghdn5j9k.skadnetwork" },
          { SKAdNetworkIdentifier: "n6fk4nfna4.skadnetwork" },
          { SKAdNetworkIdentifier: "v9wttpbfk9.skadnetwork" },
          { SKAdNetworkIdentifier: "n38lu8286q.skadnetwork" },
          { SKAdNetworkIdentifier: "47vhws6wlr.skadnetwork" },
          { SKAdNetworkIdentifier: "kbd757ywx3.skadnetwork" },
          { SKAdNetworkIdentifier: "9t245vhmpl.skadnetwork" },
          { SKAdNetworkIdentifier: "eh6m2bh4zr.skadnetwork" },
          { SKAdNetworkIdentifier: "a2p9lx4jpn.skadnetwork" },
          { SKAdNetworkIdentifier: "22mmun2rn5.skadnetwork" },
          { SKAdNetworkIdentifier: "4468km3ulz.skadnetwork" },
          { SKAdNetworkIdentifier: "ecpz2srf59.skadnetwork" },
          { SKAdNetworkIdentifier: "ppxm28t8ap.skadnetwork" },
          { SKAdNetworkIdentifier: "uw77j35x4d.skadnetwork" },
          { SKAdNetworkIdentifier: "mlmmfzh3r3.skadnetwork" },
          { SKAdNetworkIdentifier: "578prtvx9j.skadnetwork" },
          { SKAdNetworkIdentifier: "4dzt52r2t5.skadnetwork" },
          { SKAdNetworkIdentifier: "e5fvkxwrpn.skadnetwork" },
          { SKAdNetworkIdentifier: "8c4e2ghe7u.skadnetwork" },
          { SKAdNetworkIdentifier: "zq492l623r.skadnetwork" },
          { SKAdNetworkIdentifier: "3rd42ekr43.skadnetwork" },
          { SKAdNetworkIdentifier: "3qcr597p9d.skadnetwork" }
        ]
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
      versionCode: androidVersion,
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
