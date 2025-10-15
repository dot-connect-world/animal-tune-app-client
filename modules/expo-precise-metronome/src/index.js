const { EventEmitter } = require('expo-modules-core');
const PreciseMetronomeModule = require('./PreciseMetronomeModule');

const emitter = new EventEmitter(PreciseMetronomeModule);

function start(config) {
  return PreciseMetronomeModule.start(
    config.bpm,
    config.beatsPerMeasure || 4,
    config.accentFirstBeat !== false
  );
}

function stop() {
  return PreciseMetronomeModule.stop();
}

function setBpm(bpm) {
  return PreciseMetronomeModule.setBpm(bpm);
}

function isPlaying() {
  return PreciseMetronomeModule.isPlaying();
}

function addBeatListener(listener) {
  return emitter.addListener('onBeat', listener);
}

module.exports = {
  start,
  stop,
  setBpm,
  isPlaying,
  addBeatListener,
};
