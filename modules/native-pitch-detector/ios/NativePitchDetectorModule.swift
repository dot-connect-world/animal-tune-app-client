import ExpoModulesCore
import AVFoundation

public class NativePitchDetectorModule: Module {
  private let audioEngine = AVAudioEngine()
  private var isInitialized = false
  private var isRecording = false

  private var minVolume: Double = -80.0  // 데시벨 단위 (-60 ~ -40이 일반적)
  private var bufferSize: AVAudioFrameCount = 4096
  private var sampleRate: Double = 44100.0

  private var disposableBuffer = [Double]()
  private let processingQueue = DispatchQueue(label: "nativePitchDetector.processing")

  private var audioSession: AVAudioSession {
    AVAudioSession.sharedInstance()
  }

  public func definition() -> ModuleDefinition {
    Name("NativePitchDetector")

    Events("onPitchDetected")

    AsyncFunction("init") { (config: [String: Any?]) -> Void? in
      if let minVolumeValue = config["minVolume"] as? Double {
        self.minVolume = minVolumeValue
      }
      if let bufferSizeValue = config["bufferSize"] as? Int, bufferSizeValue > 0 {
        self.bufferSize = AVAudioFrameCount(bufferSizeValue)
      }
      if let sampleRateValue = config["sampleRate"] as? Double, sampleRateValue > 0 {
        self.sampleRate = sampleRateValue
      }

      try self.configureAudioSession()
      try self.prepareAudioEngine()

      self.isInitialized = true
      return nil
    }

    AsyncFunction("start") { () -> Bool in
      guard self.isInitialized else {
        throw PitchDetectorError.notInitialized
      }

      if self.isRecording {
        return false
      }

      try self.startEngine()
      self.isRecording = true
      return true
    }

    AsyncFunction("stop") { () -> Bool in
      guard self.isRecording else {
        return false
      }

      self.stopEngine()
      self.isRecording = false
      return true
    }

    AsyncFunction("isRecording") { () -> Bool in
      self.isRecording
    }

    OnDestroy {
      self.stopEngine()
      self.removeTap()
      self.isRecording = false
      self.isInitialized = false
    }
  }

  private func configureAudioSession() throws {
    try audioSession.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker])
    try audioSession.setActive(true, options: [])
  }

  private func prepareAudioEngine() throws {
    let inputNode = audioEngine.inputNode
    let format = inputNode.inputFormat(forBus: 0)
    sampleRate = format.sampleRate

    removeTap()
    installTap(on: inputNode, format: format)
    audioEngine.prepare()
  }

  private func startEngine() throws {
    if !audioEngine.isRunning {
      try audioEngine.start()
    }
  }

  private func stopEngine() {
    if audioEngine.isRunning {
      audioEngine.stop()
    }
  }

  private func removeTap() {
    audioEngine.inputNode.removeTap(onBus: 0)
  }

  private func installTap(on node: AVAudioInputNode, format: AVAudioFormat) {
    node.installTap(onBus: 0, bufferSize: bufferSize, format: format) { [weak self] buffer, _ in
      guard let self = self else { return }
      guard self.isRecording else { return }
      guard let channelData = buffer.floatChannelData else { return }

      let frameLength = Int(buffer.frameLength)
      if frameLength <= 0 {
        return
      }

      self.processingQueue.async {
        if self.disposableBuffer.count < frameLength {
          self.disposableBuffer = [Double](repeating: 0.0, count: frameLength)
        }

        let channelPointer = channelData[0]
        for i in 0..<frameLength {
          self.disposableBuffer[i] = Double(channelPointer[i])
        }

        let pitch = PitchAnalyzer.autoCorrelate(
          buffer: self.disposableBuffer,
          length: frameLength,
          sampleRate: self.sampleRate,
          minVolume: self.minVolume
        )

        self.sendEvent("onPitchDetected", [
          "pitch": pitch
        ])
      }
    }
  }
}

enum PitchDetectorError: Error {
  case notInitialized
}
