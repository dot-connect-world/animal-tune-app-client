const {
  withAppBuildGradle,
  withSettingsGradle,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const MODULE_NAME = 'native-pitch-detector';
const SETTINGS_SNIPPET = `
include ':${MODULE_NAME}'
project(':${MODULE_NAME}').projectDir = new File(rootProject.projectDir, '../modules/${MODULE_NAME}/android')
`.trim();

function withNativePitchDetector(config) {
  config = withSettingsGradle(config, (gradleConfig) => {
    const contents = gradleConfig.modResults.contents;
    if (!contents.includes(SETTINGS_SNIPPET)) {
      gradleConfig.modResults.contents = `${contents.trim()}\n\n${SETTINGS_SNIPPET}\n`;
    }
    return gradleConfig;
  });

  config = withAppBuildGradle(config, (gradleConfig) => {
    const implementationLine = `implementation project(':${MODULE_NAME}')`;
    if (!gradleConfig.modResults.contents.includes(implementationLine)) {
      gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
        /dependencies\s*{/,
        (match) => `${match}\n    ${implementationLine}`
      );
    }
    return gradleConfig;
  });

  return config;
}

module.exports = createRunOncePlugin(withNativePitchDetector, 'with-native-pitch-detector');
