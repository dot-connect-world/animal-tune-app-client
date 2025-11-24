import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface VersionInfo {
  latestVersion: string;
  minRequiredVersion: string;
  updateMessage: string;
  forceUpdate: boolean;
  storeUrl: {
    ios: string;
    android: string;
  };
}

export interface VersionCheckResult {
  needsUpdate: boolean;
  forceUpdate: boolean;
  storeUrl: string;
}

const VERSION_JSON_URL = 'https://dot-connect-world.github.io/animal-tune-app-client/version.json';

/**
 * 버전 문자열을 숫자 배열로 변환 (예: "1.0.7" -> [1, 0, 7])
 */
function parseVersion(version: string): number[] {
  return version.split('.').map(num => parseInt(num, 10));
}

/**
 * 두 버전을 비교
 * @returns 1: v1 > v2, -1: v1 < v2, 0: v1 === v2
 */
function compareVersions(v1: string, v2: string): number {
  const v1Parts = parseVersion(v1);
  const v2Parts = parseVersion(v2);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  return 0;
}

/**
 * 버전 체크를 수행하고 업데이트 필요 여부 반환
 */
export async function checkVersion(): Promise<VersionCheckResult | null> {
  try {
    // 현재 앱 버전 가져오기
    const currentVersion = Constants.expoConfig?.version || '1.0.0';

    // version.json fetch
    const response = await fetch(VERSION_JSON_URL, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch version.json:', response.status);
      return null;
    }

    const versionInfo: VersionInfo = await response.json();

    // 플랫폼별 스토어 URL
    const storeUrl = Platform.OS === 'ios'
      ? versionInfo.storeUrl.ios
      : versionInfo.storeUrl.android;

    // 강제 업데이트 필요 여부 체크 (현재 버전 < 최소 필수 버전)
    const needsForceUpdate = compareVersions(currentVersion, versionInfo.minRequiredVersion) < 0;

    // 일반 업데이트 필요 여부 체크 (현재 버전 < 최신 버전)
    const needsUpdate = compareVersions(currentVersion, versionInfo.latestVersion) < 0;

    // 강제 업데이트이거나, forceUpdate 플래그가 true인 경우
    const forceUpdate = needsForceUpdate || versionInfo.forceUpdate;

    console.log('Version Check Result:', {
      currentVersion,
      latestVersion: versionInfo.latestVersion,
      minRequiredVersion: versionInfo.minRequiredVersion,
      needsUpdate,
      forceUpdate,
    });

    return {
      needsUpdate: needsUpdate || needsForceUpdate,
      forceUpdate,
      storeUrl,
    };
  } catch (error) {
    console.error('Version check failed:', error);
    return null;
  }
}
