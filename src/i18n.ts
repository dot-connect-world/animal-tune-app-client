import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import ko from './locales/ko.json';
import en from './locales/en.json';

// 시스템 언어 감지
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
    },
    lng: deviceLanguage, // 시스템 언어 사용
    fallbackLng: 'en', // 지원하지 않는 언어일 경우 영어로 폴백
    interpolation: {
      escapeValue: false, // React는 XSS 방지를 자체적으로 처리
    },
    compatibilityJSON: 'v4', // i18next 최신 버전 호환성
  });

export default i18n;
