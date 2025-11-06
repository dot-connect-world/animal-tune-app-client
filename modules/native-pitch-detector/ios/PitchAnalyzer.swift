import Foundation

enum PitchAnalyzer {
  static func autoCorrelate(
    buffer: [Double],
    length: Int,
    sampleRate: Double,
    minVolume: Double
  ) -> Double {
    guard length > 0 else {
      return -1.0
    }

    var rms = 0.0
    for i in 0..<length {
      let value = buffer[i]
      rms += value * value
    }

    rms = sqrt(rms / Double(length))
    guard rms > 0 else {
      return -1.0
    }

    let decibel = 20.0 * log10(rms)
    if decibel.isNaN || decibel < minVolume {
      return -1.0
    }

    var r1 = 0
    var r2 = length - 1
    let threshold = 0.2

    for i in 0..<(length / 2) {
      if fabs(buffer[i]) < threshold {
        r1 = i
        break
      }
    }

    if r1 >= length - 1 {
      return -1.0
    }

    for i in 1..<(length / 2) {
      if fabs(buffer[length - i]) < threshold {
        r2 = length - i
        break
      }
    }

    if r2 <= r1 {
      return -1.0
    }

    let slicedLength = r2 - r1
    if slicedLength < 3 {
      return -1.0
    }

    var autocorrelation = [Double](repeating: 0.0, count: slicedLength)

    for i in 0..<slicedLength {
      var sum = 0.0
      var j = 0
      while j + i < slicedLength {
        sum += buffer[r1 + j] * buffer[r1 + j + i]
        j += 1
      }
      autocorrelation[i] = sum
    }

    var d = 0
    while d + 1 < slicedLength && autocorrelation[d] > autocorrelation[d + 1] {
      d += 1
    }

    if d >= slicedLength - 2 {
      return -1.0
    }

    var maxValue = autocorrelation[d]
    var maxPosition = d

    if d + 1 >= slicedLength {
      return -1.0
    }

    for i in d..<slicedLength {
      let value = autocorrelation[i]
      if value > maxValue {
        maxValue = value
        maxPosition = i
      }
    }

    if maxPosition <= 0 || maxPosition >= slicedLength - 1 {
      return -1.0
    }

    let x1 = autocorrelation[maxPosition - 1]
    let x2 = autocorrelation[maxPosition]
    let x3 = autocorrelation[maxPosition + 1]

    let a = (x1 + x3 - 2.0 * x2) / 2.0
    let b = (x3 - x1) / 2.0

    var t0 = Double(maxPosition)
    if a != 0 {
      t0 -= b / (2.0 * a)
    }

    if t0 <= 0.0 {
      return -1.0
    }

    return sampleRate / t0
  }
}
