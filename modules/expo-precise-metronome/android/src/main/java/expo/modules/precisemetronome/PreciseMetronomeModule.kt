package expo.modules.precisemetronome

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PreciseMetronomeModule : Module() {
  private var metronomeEngine: MetronomeEngine? = null

  override fun definition() = ModuleDefinition {
    Name("PreciseMetronome")

    Events("onBeat")

    Function("start") { bpm: Int, beatsPerMeasure: Int, accentFirstBeat: Boolean ->
      if (metronomeEngine == null) {
        metronomeEngine = MetronomeEngine(appContext.reactContext!!) { beatNumber, isAccent, timestamp ->
          sendEvent("onBeat", mapOf(
            "beatNumber" to beatNumber,
            "isAccent" to isAccent,
            "timestamp" to timestamp
          ))
        }
      }
      metronomeEngine?.start(bpm, beatsPerMeasure, accentFirstBeat)
    }

    Function("stop") {
      metronomeEngine?.stop()
    }

    Function("setBpm") { bpm: Int ->
      metronomeEngine?.setBpm(bpm)
    }

    Function("isPlaying") {
      metronomeEngine?.isPlaying() ?: false
    }

    OnDestroy {
      metronomeEngine?.release()
      metronomeEngine = null
    }
  }
}
