package expo.modules.precisemetronome

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.SoundPool
import android.os.Handler
import android.os.HandlerThread
import android.os.Process
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.max

/**
 * High-precision metronome engine using native Android timing.
 *
 * Best practices implemented:
 * 1. Dedicated high-priority thread for timing
 * 2. System.nanoTime() for precise measurements
 * 3. SoundPool for low-latency audio playback
 * 4. Absolute time scheduling to prevent drift
 */
class MetronomeEngine(
    private val context: Context,
    private val onBeat: (beatNumber: Int, isAccent: Boolean, timestamp: Long) -> Unit
) {
    private val isPlaying = AtomicBoolean(false)
    private var bpm: Int = 120
    private var beatsPerMeasure: Int = 4
    private var accentFirstBeat: Boolean = true

    // High-priority thread for timing
    private var metronomeThread: HandlerThread? = null
    private var metronomeHandler: Handler? = null

    // SoundPool for low-latency playback
    private var soundPool: SoundPool? = null
    private var clickSoundId: Int = 0
    private var accentSoundId: Int = 0
    private val soundsLoaded = AtomicBoolean(false)
    private var loadedSoundCount = 0

    // Timing state
    private var startTimeMillis: Long = 0
    private var beatCount: Int = 0

    init {
        initializeSoundPool()
    }

    private fun initializeSoundPool() {
        val attributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build()

        soundPool = SoundPool.Builder()
            .setMaxStreams(4)
            .setAudioAttributes(attributes)
            .build()

        // Set up load complete listener
        soundPool?.setOnLoadCompleteListener { _, sampleId, status ->
            if (status == 0) {
                loadedSoundCount++
                android.util.Log.d("MetronomeEngine", "Sound loaded: $sampleId ($loadedSoundCount/2)")

                // Mark as ready when both sounds are loaded
                if (loadedSoundCount >= 2) {
                    soundsLoaded.set(true)
                    android.util.Log.d("MetronomeEngine", "All sounds loaded successfully")
                }
            } else {
                android.util.Log.e("MetronomeEngine", "Failed to load sound: $sampleId, status: $status")
            }
        }

        // Load sounds from res/raw
        try {
            val resources = context.resources
            val packageName = context.packageName

            val clickResId = resources.getIdentifier("click", "raw", packageName)
            val accentResId = resources.getIdentifier("accent", "raw", packageName)

            if (clickResId != 0) {
                clickSoundId = soundPool?.load(context, clickResId, 1) ?: 0
            }

            if (accentResId != 0) {
                accentSoundId = soundPool?.load(context, accentResId, 1) ?: 0
            }
        } catch (e: Exception) {
            android.util.Log.e("MetronomeEngine", "Failed to load sounds: ${e.message}")
        }
    }

    fun start(bpm: Int, beatsPerMeasure: Int, accentFirstBeat: Boolean) {
        if (isPlaying.get()) {
            stop()
        }

        this.bpm = bpm
        this.beatsPerMeasure = beatsPerMeasure
        this.accentFirstBeat = accentFirstBeat

        isPlaying.set(true)
        beatCount = 0

        // Create high-priority thread
        metronomeThread = HandlerThread(
            "MetronomeThread",
            Process.THREAD_PRIORITY_URGENT_AUDIO
        ).apply {
            start()
        }

        metronomeHandler = Handler(metronomeThread!!.looper)

        // Record absolute start time using uptimeMillis
        startTimeMillis = android.os.SystemClock.uptimeMillis()

        // Schedule first beat immediately
        scheduleBeat()
    }

    fun stop() {
        isPlaying.set(false)
        metronomeHandler?.removeCallbacksAndMessages(null)
        metronomeThread?.quitSafely()
        metronomeThread = null
        metronomeHandler = null
        beatCount = 0
    }

    fun setBpm(newBpm: Int) {
        if (!isPlaying.get()) {
            this.bpm = newBpm
            return
        }

        // Restart with new BPM to avoid timing issues
        val currentBeatsPerMeasure = this.beatsPerMeasure
        val currentAccentFirstBeat = this.accentFirstBeat
        stop()
        start(newBpm, currentBeatsPerMeasure, currentAccentFirstBeat)
    }

    fun isPlaying(): Boolean = isPlaying.get()

    private fun scheduleBeat() {
        if (!isPlaying.get()) return

        // Calculate beat interval in milliseconds (using double for precision)
        val beatIntervalMs = 60_000.0 / bpm

        // Calculate exact beat time based on absolute start time (prevents drift!)
        val exactBeatTimeMillis = startTimeMillis + (beatCount * beatIntervalMs)

        // Use absolute time for postAtTime (no relative delay calculation needed!)
        val triggerTimeMillis = exactBeatTimeMillis.toLong()

        metronomeHandler?.postAtTime({
            playBeat()
            beatCount++  // Increment BEFORE scheduling next beat
            scheduleBeat() // Schedule next beat
        }, triggerTimeMillis)
    }

    private fun playBeat() {
        val currentBeatInMeasure = (beatCount % beatsPerMeasure) + 1
        val isAccent = accentFirstBeat && currentBeatInMeasure == 1

        // Check if sounds are loaded
        if (!soundsLoaded.get()) {
            android.util.Log.w("MetronomeEngine", "Sounds not loaded yet, skipping beat $currentBeatInMeasure")
        }

        // Play sound (with fallback)
        val soundId = if (isAccent && accentSoundId != 0) {
            accentSoundId
        } else if (clickSoundId != 0) {
            clickSoundId
        } else {
            0
        }

        if (soundId != 0 && soundsLoaded.get()) {
            soundPool?.play(soundId, 1.0f, 1.0f, 1, 0, 1.0f)
        } else {
            // Fallback: Generate beep using ToneGenerator
            try {
                val toneGen = android.media.ToneGenerator(
                    android.media.AudioManager.STREAM_MUSIC,
                    android.media.ToneGenerator.MAX_VOLUME
                )
                val tone = if (isAccent) {
                    android.media.ToneGenerator.TONE_PROP_BEEP2
                } else {
                    android.media.ToneGenerator.TONE_PROP_BEEP
                }
                toneGen.startTone(tone, 50)
                toneGen.release()
            } catch (e: Exception) {
                android.util.Log.e("MetronomeEngine", "Failed to play tone: ${e.message}")
            }
        }

        // Notify JavaScript
        onBeat(currentBeatInMeasure, isAccent, System.currentTimeMillis())
    }

    fun release() {
        stop()
        soundPool?.release()
        soundPool = null
    }
}
