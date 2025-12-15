# AdMob 배너 광고 문제 해결 - @env Import 이슈

## 문제 상황

### 증상
- ✅ `npx expo run:ios --device`: 광고 정상 작동
- ❌ `eas build --local` → TestFlight: 광고 표시 안 됨
- ✅ Android 프로덕션 빌드: 광고 정상 작동
- ❌ iOS 프로덕션 빌드: 광고 표시 안 됨

### AdMob 대시보드
- iOS 요청 수: 0
- Android 요청 수: 정상

## 원인 분석

### @env Import의 문제점

```typescript
// 기존 코드 (문제 있음)
import { ADMOB_IOS_BANNER_ID } from '@env';

const resolvedIosBannerId = manifestIosBannerId || ADMOB_IOS_BANNER_ID || '';
```

#### 왜 문제인가?

**1. @env import는 babel-plugin-react-native-dotenv에 의존**

```javascript
// babel.config.js
plugins: [
  ['module:react-native-dotenv', {
    moduleName: '@env',
    path: '.env',
    safe: false,
    allowUndefined: true,
  }],
]
```

**2. EAS 빌드 프로세스**

```
EAS Build (프로덕션)
  ↓
1. app.config.js 실행
   - require('dotenv').config() 성공 ✅
   - .env 파일 읽음
   - Banner ID를 expo-constants로 주입
   ↓
2. JavaScript 번들링 (Metro/Webpack)
   - babel-plugin-react-native-dotenv 실행
   - .env 파일 접근 시도
   - ❌ 실패! .env 파일을 찾을 수 없음
   - import { ADMOB_IOS_BANNER_ID } from '@env' → undefined
```

**3. 빌드 로그 증거**

```bash
# app.config.js 실행 시
🔍 [app.config.js] DEBUG:
  admobIosBannerId: ca-app-pub-3306112973611341/4648576079  ✅

# JavaScript 번들링 시
[dotenv@17.2.3] injecting env (0) from .env  ❌
# ↑ (0) = 0개의 환경 변수 주입됨!
```

### npx expo run vs eas build 차이

| 구분 | npx expo run:ios | eas build --local |
|------|------------------|-------------------|
| JavaScript 번들러 | Metro (개발 모드) | Production 번들러 |
| .env 파일 접근 | ✅ 가능 (Metro가 직접 접근) | ❌ 불가능 (빌드 시점에 미포함) |
| @env import | ✅ 정상 작동 | ❌ undefined |
| expo-constants | ✅ 정상 작동 | ✅ 정상 작동 |

### Android는 왜 작동했나?

**가설 1: Android 빌드 타이밍**
- Android를 먼저 빌드했고, 그때는 다른 설정이었을 가능성
- 또는 Android는 로컬에서 `npx expo run:android`로 테스트했을 가능성

**가설 2: Fallback 차이**
```typescript
const resolvedIosBannerId = manifestIosBannerId || ADMOB_IOS_BANNER_ID || '';
```
- `manifestIosBannerId`가 iOS에서는 비어있었지만
- Android에서는 값이 있었을 수 있음

## 해결 방법

### Before: @env에 의존

```typescript
import { ADMOB_ANDROID_BANNER_ID, ADMOB_IOS_BANNER_ID } from '@env';

// 문제: EAS 빌드에서 @env import가 undefined
const resolvedIosBannerId = manifestIosBannerId || ADMOB_IOS_BANNER_ID || '';
```

### After: expo-constants만 사용

```typescript
// @env import 제거!

// expo-constants에서만 가져오기
const resolvedIosBannerId = manifestIosBannerId || '';
const resolvedAndroidBannerId = manifestAndroidBannerId || '';
```

## 작동 원리

### 전체 플로우

```
1. 빌드 시점 (.env 읽기)
   ↓
   app.config.js
   - require('dotenv').config({ path: '.env' })
   - process.env.ADMOB_IOS_BANNER_ID 읽기
   ↓
   app.json / expo-constants에 주입
   {
     extra: {
       admob: {
         iosBannerId: "ca-app-pub-xxx/yyy"
       }
     }
   }
   ↓
   Native 앱 설정에 포함됨 (Info.plist 등)

2. 런타임 (앱 실행 시)
   ↓
   AdBanner.tsx
   - Constants.expoConfig?.extra?.admob
   - Banner ID 가져오기 ✅
   - AdMob 광고 요청 성공!
```

### expo-constants가 안전한 이유

**1. 빌드 타임에 값이 고정됨**
```javascript
// app.config.js (빌드 시 실행)
const admobIosBannerId = process.env.ADMOB_IOS_BANNER_ID;

module.exports = {
  expo: {
    extra: {
      admob: {
        iosBannerId: admobIosBannerId  // 값이 여기서 고정됨
      }
    }
  }
}
```

**2. Native 설정에 포함됨**
- iOS: Info.plist, Expo.plist 등
- Android: strings.xml 등
- 런타임에 Constants.expoConfig로 접근 가능

**3. JavaScript 번들과 무관**
- babel plugin에 의존하지 않음
- .env 파일 접근 불필요
- 모든 빌드 타입에서 동일하게 작동

## 교훈

### 환경 변수 사용 가이드

| 방법 | 빌드 타임 | 런타임 | EAS Build | 추천 |
|------|----------|--------|-----------|------|
| @env import | ❌ | ✅ | ❌ | ❌ 비추천 |
| expo-constants | ✅ | ✅ | ✅ | ✅ 추천 |
| EAS Secrets + eas.json | ✅ | ✅ | ✅ | ✅ 추천 |

### Best Practice

**1. 네이티브 설정이 필요한 값 (App ID, Bundle ID 등)**
```javascript
// app.config.js
module.exports = {
  expo: {
    ios: {
      bundleIdentifier: process.env.BUNDLE_ID
    }
  }
}
```

**2. JavaScript에서 사용할 값 (API Keys, Banner IDs 등)**
```javascript
// app.config.js
module.exports = {
  expo: {
    extra: {
      apiKey: process.env.API_KEY,
      admob: {
        iosBannerId: process.env.ADMOB_IOS_BANNER_ID
      }
    }
  }
}
```

```typescript
// JavaScript
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.apiKey;
const bannerId = Constants.expoConfig?.extra?.admob?.iosBannerId;
```

**3. @env import는 사용하지 않기**
```typescript
// ❌ 피하기
import { API_KEY } from '@env';

// ✅ 대신 사용
import Constants from 'expo-constants';
const apiKey = Constants.expoConfig?.extra?.apiKey;
```

## 관련 파일

### 주요 수정 파일
- `src/components/AdBanner.tsx`: @env import 제거, expo-constants만 사용
- `app.config.js`: Banner ID를 extra에 주입 (이미 되어있었음)

### 설정 파일
- `babel.config.js`: react-native-dotenv 플러그인 (제거해도 됨)
- `.env`: 환경 변수 저장
- `eas.json`: EAS 빌드 설정

## 참고 자료

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Expo Constants](https://docs.expo.dev/versions/latest/sdk/constants/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [react-native-dotenv Issues](https://github.com/goatandsheep/react-native-dotenv/issues)

## 결론

**문제:** `@env` import는 EAS 빌드의 JavaScript 번들링 시점에 `.env` 파일에 접근할 수 없어 `undefined`가 됨

**해결:** `expo-constants`를 통해 `app.config.js`에서 주입한 값만 사용

**결과:** 모든 빌드 환경(로컬, EAS, 개발, 프로덕션)에서 일관되게 작동

---

작성일: 2025-12-15
작성자: Claude Code Assistant
