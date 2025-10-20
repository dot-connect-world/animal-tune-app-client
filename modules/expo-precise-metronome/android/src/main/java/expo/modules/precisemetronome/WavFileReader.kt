package expo.modules.precisemetronome

import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Simple WAV file reader that extracts PCM audio data.
 * Supports standard WAV format (PCM encoding).
 */
class WavFileReader(inputStream: InputStream) {
    val sampleRate: Int
    val channels: Int
    val bitsPerSample: Int
    val pcmData: ShortArray

    init {
        val buffer = inputStream.readBytes()
        inputStream.close()

        // Parse WAV header
        val byteBuffer = ByteBuffer.wrap(buffer).order(ByteOrder.LITTLE_ENDIAN)

        // Validate RIFF header
        val riff = String(buffer, 0, 4)
        if (riff != "RIFF") {
            throw IllegalArgumentException("Not a valid WAV file: missing RIFF header")
        }

        // Skip file size (4 bytes)
        byteBuffer.position(8)

        // Validate WAVE format
        val wave = String(buffer, 8, 4)
        if (wave != "WAVE") {
            throw IllegalArgumentException("Not a valid WAV file: missing WAVE format")
        }

        byteBuffer.position(12)

        // Find fmt chunk
        var fmtFound = false
        var dataOffset = 0
        var dataSize = 0
        var parsedSampleRate = 0
        var parsedChannels = 0
        var parsedBitsPerSample = 0

        while (byteBuffer.position() < buffer.size - 8) {
            val chunkId = String(buffer, byteBuffer.position(), 4)
            byteBuffer.position(byteBuffer.position() + 4)
            val chunkSize = byteBuffer.int

            when (chunkId) {
                "fmt " -> {
                    val fmtStart = byteBuffer.position()

                    val audioFormat = byteBuffer.short.toInt()
                    if (audioFormat != 1) {
                        throw IllegalArgumentException("Only PCM format is supported (format: $audioFormat)")
                    }

                    parsedChannels = byteBuffer.short.toInt()
                    parsedSampleRate = byteBuffer.int
                    byteBuffer.int // byte rate
                    byteBuffer.short // block align
                    parsedBitsPerSample = byteBuffer.short.toInt()

                    fmtFound = true
                    byteBuffer.position(fmtStart + chunkSize)
                }
                "data" -> {
                    dataOffset = byteBuffer.position()
                    dataSize = chunkSize
                    break
                }
                else -> {
                    // Skip unknown chunk
                    byteBuffer.position(byteBuffer.position() + chunkSize)
                }
            }
        }

        if (!fmtFound) {
            throw IllegalArgumentException("fmt chunk not found in WAV file")
        }

        if (dataOffset == 0) {
            throw IllegalArgumentException("data chunk not found in WAV file")
        }

        // Assign to val properties
        this.sampleRate = parsedSampleRate
        this.channels = parsedChannels
        this.bitsPerSample = parsedBitsPerSample

        // Read PCM data as 16-bit samples
        val numSamples = dataSize / 2
        val samples = ShortArray(numSamples)

        byteBuffer.position(dataOffset)
        for (i in 0 until numSamples) {
            samples[i] = byteBuffer.short
        }

        this.pcmData = samples

        android.util.Log.d("WavFileReader",
            "Loaded WAV: ${pcmData.size} samples, $sampleRate Hz, $channels ch, $bitsPerSample bits")
    }

    /**
     * Convert stereo to mono by averaging channels
     */
    fun toMono(): ShortArray {
        if (channels == 1) return pcmData

        val monoSamples = pcmData.size / channels
        val mono = ShortArray(monoSamples)

        for (i in 0 until monoSamples) {
            var sum = 0
            for (ch in 0 until channels) {
                sum += pcmData[i * channels + ch]
            }
            mono[i] = (sum / channels).toShort()
        }

        return mono
    }
}
