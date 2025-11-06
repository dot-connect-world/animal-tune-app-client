import NativePitchDetector, {
  PitchyConfig,
  PitchyEvent,
  PitchyEventCallback,
} from 'native-pitch-detector';

export type { PitchyConfig, PitchyEvent, PitchyEventCallback };

type ListenerSubscription = {
  remove: () => void;
};

const ensureModule = <T,>(fn: () => T): T => {
  try {
    return fn();
  } catch (error) {
    throw new Error('NativePitchDetector native module is unavailable.');
  }
};

const PitchModule = {
  init: (config?: PitchyConfig) =>
    ensureModule(() => NativePitchDetector.init(config) as Promise<void> | void),
  start: () => ensureModule(() => NativePitchDetector.start()),
  stop: () => ensureModule(() => NativePitchDetector.stop()),
  isRecording: () => ensureModule(() => NativePitchDetector.isRecording()),
  addListener: (callback: PitchyEventCallback): ListenerSubscription =>
    ensureModule(() => NativePitchDetector.addListener(callback)),
};

export default PitchModule;
