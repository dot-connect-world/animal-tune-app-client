export type NativePitchDetectorConfig = {
  bufferSize?: number;
  minVolume?: number;
  sampleRate?: number;
};

export type NativePitchDetectorEvent = {
  pitch: number;
};

export type NativePitchDetectorEventCallback = (event: NativePitchDetectorEvent) => void;

export type PitchyConfig = NativePitchDetectorConfig;
export type PitchyEvent = NativePitchDetectorEvent;
export type PitchyEventCallback = NativePitchDetectorEventCallback;

declare const NativePitchDetector: {
  init(config?: NativePitchDetectorConfig): Promise<void> | void;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRecording(): Promise<boolean>;
  addListener(callback: NativePitchDetectorEventCallback): { remove: () => void };
};

export default NativePitchDetector;
