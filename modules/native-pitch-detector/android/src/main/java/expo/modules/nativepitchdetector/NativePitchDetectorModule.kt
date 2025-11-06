package expo.modules.nativepitchdetector

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.concurrent.thread
import kotlin.math.max

class NativePitchDetectorModule : Module() {
  private var audioRecord: AudioRecord? = null
  private var recordingThread: Thread? = null
  private var isRecording: Boolean = false
  private var isInitialized: Boolean = false

  private var sampleRate: Int = 44100
  private var bufferSizeInShorts: Int = 4096
  private var minVolume: Double = -60.0

  override fun definition() = ModuleDefinition {
    Name("NativePitchDetector")

    Events("onPitchDetected")

    AsyncFunction("init") { config: Map<String, Any?> ->
      minVolume = (config["minVolume"] as? Number)?.toDouble() ?: minVolume
      bufferSizeInShorts = (config["bufferSize"] as? Number)?.toInt() ?: bufferSizeInShorts
      sampleRate = (config["sampleRate"] as? Number)?.toInt() ?: sampleRate

      ensureAudioRecord()
      isInitialized = audioRecord?.state == AudioRecord.STATE_INITIALIZED

      if (!isInitialized) {
        throw PitchDetectorException("AudioRecord 초기화에 실패했습니다.")
      }

      null
    }

    AsyncFunction("start") {
      if (!isInitialized) {
        throw PitchDetectorException("NativePitchDetector가 초기화되지 않았습니다.")
      }
      if (isRecording) {
        return@AsyncFunction false
      }
      startRecording()
      true
    }

    AsyncFunction("stop") {
      if (!isRecording) {
        return@AsyncFunction false
      }
      stopRecording()
      true
    }

    AsyncFunction("isRecording") {
      isRecording
    }

    OnDestroy {
      stopRecording()
      releaseAudioRecord()
    }
  }

  private fun ensureAudioRecord() {
    val current = audioRecord
    if (current != null && current.state == AudioRecord.STATE_INITIALIZED) {
      return
    }

    current?.release()

    val minBufferBytes = AudioRecord.getMinBufferSize(
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT
    )
    val minBufferInShorts = if (minBufferBytes > 0) minBufferBytes / 2 else bufferSizeInShorts

    bufferSizeInShorts = max(bufferSizeInShorts, minBufferInShorts)

    audioRecord = AudioRecord(
      MediaRecorder.AudioSource.MIC,
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
      bufferSizeInShorts * 2
    )
  }

  private fun startRecording() {
    ensureAudioRecord()
    val localAudioRecord = audioRecord ?: throw PitchDetectorException("AudioRecord를 사용할 수 없습니다.")

    val state = localAudioRecord.state
    if (state != AudioRecord.STATE_INITIALIZED) {
      throw PitchDetectorException("AudioRecord 상태가 올바르지 않습니다. (state=$state)")
    }

    localAudioRecord.startRecording()
    isRecording = true

    val shortBuffer = ShortArray(bufferSizeInShorts)
    val doubleBuffer = DoubleArray(bufferSizeInShorts)

    recordingThread = thread(name = "NativePitchDetectorThread", start = true) {
      while (isRecording && !Thread.currentThread().isInterrupted) {
        val read = localAudioRecord.read(shortBuffer, 0, shortBuffer.size)
        if (read <= 0) {
          continue
        }

        for (i in 0 until read) {
          doubleBuffer[i] = shortBuffer[i].toDouble()
        }

        val pitch = PitchAnalyzer.autoCorrelate(
          buffer = doubleBuffer,
          length = read,
          sampleRate = sampleRate.toDouble(),
          minVolume = minVolume
        )

        sendEvent("onPitchDetected", mapOf("pitch" to pitch))
      }
    }
  }

  private fun stopRecording() {
    isRecording = false
    recordingThread?.interrupt()
    recordingThread = null

    audioRecord?.let {
      if (it.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
        try {
          it.stop()
        } catch (_: IllegalStateException) {
          // Ignore stop errors when already stopped
        }
      }
    }
  }

  private fun releaseAudioRecord() {
    audioRecord?.release()
    audioRecord = null
  }

  class PitchDetectorException(message: String) : CodedException(message)
}
