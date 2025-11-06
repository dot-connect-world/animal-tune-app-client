const { EventEmitter } = require('expo-modules-core');
const NativePitchDetectorModule = require('./NativePitchDetectorModule');

const emitter = new EventEmitter(NativePitchDetectorModule);

function init(config = {}) {
  return NativePitchDetectorModule.init(config);
}

function start() {
  return NativePitchDetectorModule.start();
}

function stop() {
  return NativePitchDetectorModule.stop();
}

function isRecording() {
  return NativePitchDetectorModule.isRecording();
}

function addListener(callback) {
  return emitter.addListener('onPitchDetected', callback);
}

module.exports = {
  init,
  start,
  stop,
  isRecording,
  addListener,
};
