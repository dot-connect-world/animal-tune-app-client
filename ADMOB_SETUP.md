# AdMob 환경변수 설정 가이드

이 프로젝트는 Google AdMob을 환경변수로 관리합니다.

## 🚀 빠른 시작

### 1️⃣ `.env` 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 실제 AdMob ID를 입력하세요:

```bash
# .env 파일 복사
cp .env.example .env
```

그리고 `.env` 파일을 열어서 실제 값으로 교체:

```bash
# .env
ADMOB_ANDROID_APP_ID=ca-app-pub-1234567890~0987654321
ADMOB_IOS_APP_ID=ca-app-pub-1234567890~0987654321
ADMOB_ANDROID_BANNER_ID=ca-app-pub-1234567890/1111111111
ADMOB_IOS_BANNER_ID=ca-app-pub-1234567890/2222222222
```

### 2️⃣ EAS Secrets 등록 (iOS 원격 빌드용)

iOS를 EAS로 빌드할 경우, EAS에 환경변수를 등록해야 합니다:

```bash
# EAS에 Secret 등록
eas secret:create --scope project --name ADMOB_ANDROID_APP_ID --value YOUR_ACTUAL_VALUE
eas secret:create --scope project --name ADMOB_IOS_APP_ID --value YOUR_ACTUAL_VALUE
eas secret:create --scope project --name ADMOB_ANDROID_BANNER_ID --value YOUR_ACTUAL_VALUE
eas secret:create --scope project --name ADMOB_IOS_BANNER_ID --value YOUR_ACTUAL_VALUE

# 등록 확인
eas secret:list
```

### 3️⃣ 빌드

#### Android (로컬 빌드)
```bash
npm run device-android-clear
```

#### iOS (EAS 원격 빌드)
```bash
eas build --platform ios --profile preview
```

---

## 📋 AdMob ID 확인 방법

### App ID 확인:
1. [AdMob Console](https://apps.admob.com/) 접속
2. **Apps** 메뉴 클릭
3. 앱 선택
4. **App settings** → **App ID** 확인
   - Android: `ca-app-pub-xxxxxxxx~xxxxxxxx`
   - iOS: `ca-app-pub-xxxxxxxx~xxxxxxxx`

### Ad Unit ID 확인:
1. AdMob Console에서 앱 선택
2. **Ad units** 메뉴 클릭
3. 배너 광고 유닛 선택
4. **Ad unit ID** 복사
   - Android Banner: `ca-app-pub-xxxxxxxx/yyyyyyyyyy`
   - iOS Banner: `ca-app-pub-xxxxxxxx/yyyyyyyyyy`

---

## 🔒 보안 참고사항

- ✅ `.env` 파일은 `.gitignore`에 포함되어 GitHub에 업로드되지 않습니다
- ✅ `.env.example`은 템플릿으로 GitHub에 업로드됩니다 (실제 값 없음)
- ✅ EAS Secrets는 암호화되어 Expo 서버에 저장됩니다

---

## 🎯 새 앱 만들 때 워크플로우

```bash
# 1. 프로젝트 복사
cp -r animal-tune new-app
cd new-app

# 2. .env 파일 수정 (새 AdMob ID 입력)
vim .env

# 3. EAS Secrets 등록 (iOS 빌드용)
eas secret:create --scope project --name ADMOB_IOS_APP_ID --value NEW_VALUE

# 4. 빌드
npm run device-android-clear
```

---

## 🐛 트러블슈팅

### 환경변수가 undefined로 나올 때:

1. **Metro 재시작** (필수!)
   ```bash
   # Metro 완전 종료 후 재시작
   rm -rf node_modules/.cache
   npm start -- --reset-cache
   ```

2. **타입스크립트 서버 재시작**
   - VSCode: `Cmd + Shift + P` → "TypeScript: Restart TS Server"

3. **빌드 캐시 클리어**
   ```bash
   npm run device-android-clear
   ```

### EAS 빌드 시 환경변수 오류:

```bash
# Secret이 제대로 등록되었는지 확인
eas secret:list

# Secret 재등록
eas secret:delete --name ADMOB_IOS_APP_ID
eas secret:create --scope project --name ADMOB_IOS_APP_ID --value YOUR_VALUE
```

---

## 📚 참고 자료

- [Google AdMob Console](https://apps.admob.com/)
- [EAS Build Environment Variables](https://docs.expo.dev/build-reference/variables/)
- [react-native-google-mobile-ads Docs](https://github.com/invertase/react-native-google-mobile-ads)
