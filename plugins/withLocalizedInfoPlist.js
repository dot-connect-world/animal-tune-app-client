const {
  withXcodeProject,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// InfoPlist.strings 파일 내용
const EN_INFOPLIST_STRINGS = `/*
  InfoPlist.strings
  AnimalTune (English)
*/

/* Microphone permission */
"NSMicrophoneUsageDescription" = "Allow Animal Tune to access your microphone for guitar tuning.";

/* App Tracking Transparency permission */
"NSUserTrackingUsageDescription" = "This identifier will be used to deliver personalized ads to you.";
`;

const KO_INFOPLIST_STRINGS = `/*
  InfoPlist.strings
  AnimalTune (Korean)
*/

/* Microphone permission */
"NSMicrophoneUsageDescription" = "기타 튜닝을 위해 마이크 권한이 필요합니다.";

/* App Tracking Transparency permission */
"NSUserTrackingUsageDescription" = "이 식별자는 맞춤형 광고를 제공하는 데 사용됩니다.";
`;

function withLocalizedInfoPlist(config) {
  return withXcodeProject(config, async (xcodeConfig) => {
    const projectRoot = xcodeConfig.modRequest.platformProjectRoot;
    const projectName = xcodeConfig.modRequest.projectName || 'AnimalTune';

    // 로케일 디렉토리 생성
    const enDir = path.join(projectRoot, projectName, 'en.lproj');
    const koDir = path.join(projectRoot, projectName, 'ko.lproj');

    if (!fs.existsSync(enDir)) {
      fs.mkdirSync(enDir, { recursive: true });
    }
    if (!fs.existsSync(koDir)) {
      fs.mkdirSync(koDir, { recursive: true });
    }

    // InfoPlist.strings 파일 생성
    fs.writeFileSync(path.join(enDir, 'InfoPlist.strings'), EN_INFOPLIST_STRINGS);
    fs.writeFileSync(path.join(koDir, 'InfoPlist.strings'), KO_INFOPLIST_STRINGS);

    // Xcode 프로젝트에 파일 추가
    const project = xcodeConfig.modResults;

    // en.lproj/InfoPlist.strings 추가
    const enFile = project.addResourceFile(
      'en.lproj/InfoPlist.strings',
      { variantGroup: true },
      project.getFirstTarget().uuid
    );

    // ko.lproj/InfoPlist.strings 추가
    const koFile = project.addResourceFile(
      'ko.lproj/InfoPlist.strings',
      { variantGroup: true },
      project.getFirstTarget().uuid
    );

    return xcodeConfig;
  });
}

module.exports = createRunOncePlugin(withLocalizedInfoPlist, 'with-localized-infoplist');
