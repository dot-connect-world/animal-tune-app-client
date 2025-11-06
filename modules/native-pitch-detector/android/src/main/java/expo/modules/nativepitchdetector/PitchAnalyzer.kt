package expo.modules.nativepitchdetector

import kotlin.math.abs
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.sqrt

object PitchAnalyzer {
  fun autoCorrelate(
    buffer: DoubleArray,
    length: Int,
    sampleRate: Double,
    minVolume: Double
  ): Double {
    if (length <= 0) {
      return -1.0
    }

    var rms = 0.0
    for (i in 0 until length) {
      val value = buffer[i]
      rms += value * value
    }

    rms = if (length > 0) sqrt(rms / length) else 0.0
    if (rms <= 0.0) {
      return -1.0
    }

    val decibel = 20.0 * log10(rms)
    if (decibel.isNaN() || decibel < minVolume) {
      return -1.0
    }

    var r1 = 0
    var r2 = length - 1
    val threshold = 0.2

    for (i in 0 until length / 2) {
      if (abs(buffer[i]) < threshold) {
        r1 = i
        break
      }
    }

    for (i in 1 until length / 2) {
      if (abs(buffer[length - i]) < threshold) {
        r2 = length - i
        break
      }
    }

    if (r2 <= r1) {
      return -1.0
    }

    val slicedLength = max(r2 - r1, 0)
    if (slicedLength < 3) {
      return -1.0
    }

    val autocorrelation = DoubleArray(slicedLength)

    for (i in 0 until slicedLength) {
      var sum = 0.0
      var j = 0
      while (j + i < slicedLength) {
        val sample1 = buffer[r1 + j]
        val sample2 = buffer[r1 + j + i]
        sum += sample1 * sample2
        j++
      }
      autocorrelation[i] = sum
    }

    var d = 0
    while (d + 1 < slicedLength && autocorrelation[d] > autocorrelation[d + 1]) {
      d++
    }

    if (d >= slicedLength - 2) {
      return -1.0
    }

    var maxPos = d
    var maxVal = autocorrelation[d]
    for (i in d until slicedLength) {
      val current = autocorrelation[i]
      if (current > maxVal) {
        maxVal = current
        maxPos = i
      }
    }

    if (maxPos <= 0 || maxPos >= slicedLength - 1) {
      return -1.0
    }

    val x1 = autocorrelation[maxPos - 1]
    val x2 = autocorrelation[maxPos]
    val x3 = autocorrelation[maxPos + 1]

    val a = (x1 + x3 - 2 * x2) / 2.0
    val b = (x3 - x1) / 2.0

    var t0 = maxPos.toDouble()
    if (a != 0.0) {
      t0 -= b / (2 * a)
    }

    if (t0 <= 0.0) {
      return -1.0
    }

    return sampleRate / t0
  }
}
