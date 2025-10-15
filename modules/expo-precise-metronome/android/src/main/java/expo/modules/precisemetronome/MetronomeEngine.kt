package expo.modules.precisemetronome

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Handler
import android.os.HandlerThread
import android.os.Process
import java.util.concurrent.atomic.AtomicBoolean

/**
 * High-precision metronome engine using SoundPool with absolute timing.
 *
 * Best practices implemented:
 * 1. SoundPool for low-latency playback
 * 2. Handler.postAtTime() for absolute time scheduling (prevents drift)
 * 3. Dedicated high-priority thread for timing
 * 4. OnLoadCompleteListener to ensure sounds are ready
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
    private var nextBeatIndex: Int = 0

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

        // Load sounds from assets folder
        try {
            val assetManager = context.assets

            // Load click sound from assets
            val clickDescriptor = assetManager.openFd("sounds/click.mp3")
            clickSoundId = soundPool?.load(clickDescriptor, 1) ?: 0
            clickDescriptor.close()

            // Load accent sound from assets
            val accentDescriptor = assetManager.openFd("sounds/accent.mp3")
            accentSoundId = soundPool?.load(accentDescriptor, 1) ?: 0
            accentDescriptor.close()

            android.util.Log.d("MetronomeEngine", "Loading sounds from assets: click=$clickSoundId, accent=$accentSoundId")
        } catch (e: Exception) {
            android.util.Log.e("MetronomeEngine", "Failed to load sounds: ${e.message}")
            e.printStackTrace()
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
        nextBeatIndex = 0

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

        android.util.Log.d("MetronomeEngine", "Starting metronome: bpm=$bpm, soundsLoaded=${soundsLoaded.get()}")

        // Schedule first beat
        scheduleBeat()
    }

    fun stop() {
        isPlaying.set(false)
        metronomeHandler?.removeCallbacksAndMessages(null)
        metronomeThread?.quitSafely()
        metronomeThread = null
        metronomeHandler = null
        nextBeatIndex = 0
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

        val beatIntervalMs = 60_000.0 / bpm

        // Calculate exact beat time based on absolute start time (prevents drift!)
        val exactBeatTimeMs = startTimeMillis + (nextBeatIndex * beatIntervalMs)
        val triggerTimeMillis = (exactBeatTimeMs + 0.5).toLong()  // Round to nearest millisecond

        // Use postAtTime for absolute timing
        metronomeHandler?.postAtTime({
            playBeat()
            nextBeatIndex++
            scheduleBeat()  // Schedule next beat
        }, triggerTimeMillis)
    }

    private fun playBeat() {
        val currentBeatInMeasure = (nextBeatIndex % beatsPerMeasure) + 1
        val isAccent = accentFirstBeat && currentBeatInMeasure == 1

        // Check if sounds are loaded
        if (!soundsLoaded.get()) {
            android.util.Log.w("MetronomeEngine", "Sounds not loaded yet, skipping beat")
            return
        }

        // Play sound
        val soundId = if (isAccent && accentSoundId != 0) {
            accentSoundId
        } else if (clickSoundId != 0) {
            clickSoundId
        } else {
            0
        }

        if (soundId != 0) {
            soundPool?.play(soundId, 1.0f, 1.0f, 1, 0, 1.0f)
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
