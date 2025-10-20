package expo.modules.precisemetronome

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Process
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread
import kotlin.math.min

/**
 * Ultra-precise metronome engine using AudioTrack for sample-accurate timing.
 *
 * Key improvements over SoundPool:
 * 1. AudioTrack provides sample-accurate playback control
 * 2. Pre-loaded PCM data in memory for zero I/O latency
 * 3. Continuous audio stream with clicks inserted at exact sample positions
 * 4. Low-latency audio path with PERFORMANCE_MODE_LOW_LATENCY
 * 5. Dedicated real-time thread with tight loop for consistent audio generation
 * 6. Frame-accurate timing prevents drift
 */
class MetronomeEngine(
    private val context: Context,
    private val onBeat: (beatNumber: Int, isAccent: Boolean, timestamp: Long) -> Unit
) {
    private val isPlaying = AtomicBoolean(false)
    private var bpm: Int = 120
    private var beatsPerMeasure: Int = 4
    private var accentFirstBeat: Boolean = true

    // Audio configuration
    private val sampleRate = 48000  // Professional audio sample rate
    private val channelConfig = AudioFormat.CHANNEL_OUT_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    private val bytesPerSample = 2  // 16-bit = 2 bytes

    // Pre-loaded click samples
    private var clickSamples: ShortArray? = null
    private var accentSamples: ShortArray? = null
    private val samplesLoaded = AtomicBoolean(false)

    // AudioTrack for playback
    private var audioTrack: AudioTrack? = null

    // Audio generation thread
    private var audioThread: Thread? = null

    // Timing state
    private var nextBeatFrame: Long = 0
    private var currentBeatIndex: Int = 0
    private var framesWritten: Long = 0

    // Track active clicks being played
    private data class ActiveClick(
        val startFrame: Long,
        val samples: ShortArray,
        val beatNumber: Int,
        val isAccent: Boolean
    )
    private val activeClicks = mutableListOf<ActiveClick>()

    init {
        loadClickSamples()
    }

    private fun loadClickSamples() {
        try {
            // Load click sound from res/raw
            val clickResId = context.resources.getIdentifier("click", "raw", context.packageName)
            val clickInputStream = context.resources.openRawResource(clickResId)
            val clickWav = WavFileReader(clickInputStream)
            clickSamples = resampleIfNeeded(clickWav.toMono(), clickWav.sampleRate)

            // Load accent sound from res/raw
            val accentResId = context.resources.getIdentifier("accent", "raw", context.packageName)
            val accentInputStream = context.resources.openRawResource(accentResId)
            val accentWav = WavFileReader(accentInputStream)
            accentSamples = resampleIfNeeded(accentWav.toMono(), accentWav.sampleRate)

            samplesLoaded.set(true)
            android.util.Log.d("MetronomeEngine",
                "Loaded samples: click=${clickSamples?.size}, accent=${accentSamples?.size}")
        } catch (e: Exception) {
            android.util.Log.e("MetronomeEngine", "Failed to load click samples: ${e.message}")
            e.printStackTrace()

            // Fallback: generate simple click sounds
            generateFallbackSounds()
        }
    }

    private fun resampleIfNeeded(samples: ShortArray, sourceSampleRate: Int): ShortArray {
        if (sourceSampleRate == sampleRate) return samples

        // Simple linear interpolation resampling
        val ratio = sourceSampleRate.toDouble() / sampleRate
        val newSize = (samples.size / ratio).toInt()
        val resampled = ShortArray(newSize)

        for (i in 0 until newSize) {
            val srcPos = i * ratio
            val srcIndex = srcPos.toInt()

            if (srcIndex >= samples.size - 1) {
                resampled[i] = samples[samples.size - 1]
            } else {
                val frac = srcPos - srcIndex
                val sample1 = samples[srcIndex].toInt()
                val sample2 = samples[srcIndex + 1].toInt()
                resampled[i] = (sample1 + frac * (sample2 - sample1)).toInt().toShort()
            }
        }

        android.util.Log.d("MetronomeEngine", "Resampled from $sourceSampleRate Hz to $sampleRate Hz")
        return resampled
    }

    private fun generateFallbackSounds() {
        // Generate a simple 1000 Hz click (5ms duration)
        val duration = 0.005 // 5 milliseconds
        val frequency = 1000.0
        val numSamples = (sampleRate * duration).toInt()

        clickSamples = ShortArray(numSamples) { i ->
            val t = i.toDouble() / sampleRate
            val envelope = 1.0 - (i.toDouble() / numSamples) // Linear decay
            (Short.MAX_VALUE * 0.3 * envelope * Math.sin(2 * Math.PI * frequency * t)).toInt().toShort()
        }

        // Generate accent sound (lower pitch, longer)
        val accentFreq = 800.0
        val accentDuration = 0.008
        val accentSamples = (sampleRate * accentDuration).toInt()

        this.accentSamples = ShortArray(accentSamples) { i ->
            val t = i.toDouble() / sampleRate
            val envelope = 1.0 - (i.toDouble() / accentSamples)
            (Short.MAX_VALUE * 0.4 * envelope * Math.sin(2 * Math.PI * accentFreq * t)).toInt().toShort()
        }

        samplesLoaded.set(true)
        android.util.Log.d("MetronomeEngine", "Generated fallback click sounds")
    }

    fun start(bpm: Int, beatsPerMeasure: Int, accentFirstBeat: Boolean) {
        if (isPlaying.get()) {
            stop()
        }

        if (!samplesLoaded.get()) {
            android.util.Log.e("MetronomeEngine", "Cannot start: samples not loaded")
            return
        }

        this.bpm = bpm
        this.beatsPerMeasure = beatsPerMeasure
        this.accentFirstBeat = accentFirstBeat

        isPlaying.set(true)
        currentBeatIndex = 0
        framesWritten = 0

        // Calculate first beat position (add small delay for initialization)
        val initialDelayFrames = sampleRate / 20  // 50ms initial delay
        nextBeatFrame = initialDelayFrames.toLong()

        // Initialize AudioTrack
        initializeAudioTrack()

        // Start audio generation thread
        startAudioThread()

        android.util.Log.d("MetronomeEngine", "Started metronome: bpm=$bpm, beatInterval=${60.0/bpm}s")
    }

    private fun initializeAudioTrack() {
        val minBufferSize = AudioTrack.getMinBufferSize(
            sampleRate,
            channelConfig,
            audioFormat
        )

        // Use small buffer for low latency (100ms)
        val bufferSizeFrames = sampleRate / 10
        val bufferSize = bufferSizeFrames * bytesPerSample

        val attributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .setFlags(AudioAttributes.FLAG_LOW_LATENCY)
            .build()

        audioTrack = AudioTrack.Builder()
            .setAudioAttributes(attributes)
            .setAudioFormat(
                AudioFormat.Builder()
                    .setSampleRate(sampleRate)
                    .setChannelMask(channelConfig)
                    .setEncoding(audioFormat)
                    .build()
            )
            .setBufferSizeInBytes(maxOf(minBufferSize, bufferSize))
            .setTransferMode(AudioTrack.MODE_STREAM)
            .setPerformanceMode(AudioTrack.PERFORMANCE_MODE_LOW_LATENCY)
            .build()

        audioTrack?.play()

        android.util.Log.d("MetronomeEngine",
            "AudioTrack initialized: bufferSize=$bufferSize bytes (${bufferSizeFrames} frames), minBufferSize=$minBufferSize")
    }

    private fun startAudioThread() {
        audioThread = thread(start = true, name = "MetronomeAudioThread") {
            // Set thread priority to real-time audio
            Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO)

            val bufferFrames = sampleRate / 100  // 10ms chunks for low latency
            val buffer = ShortArray(bufferFrames)

            android.util.Log.d("MetronomeEngine", "Audio thread started")

            while (isPlaying.get()) {
                try {
                    // Fill buffer with audio
                    fillAudioBuffer(buffer)

                    // Write to AudioTrack (blocking)
                    val written = audioTrack?.write(buffer, 0, buffer.size, AudioTrack.WRITE_BLOCKING) ?: 0

                    if (written > 0) {
                        framesWritten += written
                    } else if (written < 0) {
                        android.util.Log.e("MetronomeEngine", "AudioTrack write error: $written")
                        break
                    }
                } catch (e: Exception) {
                    android.util.Log.e("MetronomeEngine", "Error in audio thread: ${e.message}")
                    e.printStackTrace()
                    break
                }
            }

            android.util.Log.d("MetronomeEngine", "Audio thread stopped")
        }
    }

    private fun fillAudioBuffer(buffer: ShortArray) {
        // Clear buffer (silence)
        buffer.fill(0)

        val bufferStartFrame = framesWritten
        val bufferEndFrame = framesWritten + buffer.size

        // Add new clicks that start in this buffer
        while (nextBeatFrame in bufferStartFrame until bufferEndFrame) {
            val currentBeatInMeasure = (currentBeatIndex % beatsPerMeasure) + 1
            val isAccent = accentFirstBeat && currentBeatInMeasure == 1

            // Select appropriate samples
            val samples = if (isAccent && accentSamples != null) {
                accentSamples!!
            } else {
                clickSamples
            }

            if (samples != null) {
                // Add to active clicks
                activeClicks.add(ActiveClick(nextBeatFrame, samples, currentBeatInMeasure, isAccent))

                // Notify callback
                try {
                    onBeat(currentBeatInMeasure, isAccent, System.currentTimeMillis())
                } catch (e: Exception) {
                    android.util.Log.e("MetronomeEngine", "Error in onBeat callback: ${e.message}")
                }

                android.util.Log.d("MetronomeEngine",
                    "Beat ${currentBeatIndex + 1} (${currentBeatInMeasure}/${beatsPerMeasure}) at frame $nextBeatFrame, isAccent=$isAccent")
            }

            // Calculate next beat
            currentBeatIndex++
            val beatIntervalFrames = calculateBeatIntervalFrames()
            nextBeatFrame += beatIntervalFrames
        }

        // Mix all active clicks into this buffer
        val clicksToRemove = mutableListOf<ActiveClick>()
        for (click in activeClicks) {
            val clickStartInBuffer = (click.startFrame - bufferStartFrame).toInt()
            val clickSampleOffset = if (clickStartInBuffer < 0) -clickStartInBuffer else 0
            val bufferOffset = maxOf(0, clickStartInBuffer)

            // Calculate how many samples to copy
            val samplesToMix = min(
                click.samples.size - clickSampleOffset,
                buffer.size - bufferOffset
            )

            if (samplesToMix > 0) {
                // Mix click samples into buffer
                for (i in 0 until samplesToMix) {
                    val bufferIndex = bufferOffset + i
                    val sampleIndex = clickSampleOffset + i

                    val existingSample = buffer[bufferIndex].toInt()
                    val newSample = click.samples[sampleIndex].toInt()
                    val mixed = (existingSample + newSample).coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
                    buffer[bufferIndex] = mixed.toShort()
                }
            }

            // Check if this click is finished
            val clickEndFrame = click.startFrame + click.samples.size
            if (clickEndFrame <= bufferEndFrame) {
                clicksToRemove.add(click)
            }
        }

        // Remove finished clicks
        activeClicks.removeAll(clicksToRemove)
    }

    private fun calculateBeatIntervalFrames(): Long {
        val beatIntervalSeconds = 60.0 / bpm
        return (sampleRate * beatIntervalSeconds).toLong()
    }

    fun stop() {
        isPlaying.set(false)

        // Wait for audio thread to finish
        audioThread?.join(1000)  // Wait max 1 second
        audioThread = null

        audioTrack?.stop()
        audioTrack?.release()
        audioTrack = null

        currentBeatIndex = 0
        framesWritten = 0
        activeClicks.clear()
    }

    fun setBpm(newBpm: Int) {
        if (!isPlaying.get()) {
            this.bpm = newBpm
            return
        }

        // Restart with new BPM
        val currentBeatsPerMeasure = this.beatsPerMeasure
        val currentAccentFirstBeat = this.accentFirstBeat
        stop()
        start(newBpm, currentBeatsPerMeasure, currentAccentFirstBeat)
    }

    fun isPlaying(): Boolean = isPlaying.get()

    fun release() {
        stop()
        clickSamples = null
        accentSamples = null
    }
}
