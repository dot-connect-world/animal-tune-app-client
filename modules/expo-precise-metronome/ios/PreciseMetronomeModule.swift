import ExpoModulesCore

public class PreciseMetronomeModule: Module {
  private var metronomeEngine: MetronomeEngine?

  public func definition() -> ModuleDefinition {
    Name("PreciseMetronome")

    Events("onBeat")

    Function("start") { (bpm: Int, beatsPerMeasure: Int, accentFirstBeat: Bool) in
      if metronomeEngine == nil {
        metronomeEngine = MetronomeEngine { [weak self] beatNumber, isAccent, timestamp in
          self?.sendEvent("onBeat", [
            "beatNumber": beatNumber,
            "isAccent": isAccent,
            "timestamp": timestamp
          ])
        }
      }
      metronomeEngine?.start(bpm: bpm, beatsPerMeasure: beatsPerMeasure, accentFirstBeat: accentFirstBeat)
    }

    Function("stop") {
      metronomeEngine?.stop()
    }

    Function("setBpm") { (bpm: Int) in
      metronomeEngine?.setBpm(newBpm: bpm)
    }

    Function("isPlaying") { () -> Bool in
      return metronomeEngine?.isPlaying() ?? false
    }

    OnDestroy {
      metronomeEngine?.release()
      metronomeEngine = nil
    }
  }
}
