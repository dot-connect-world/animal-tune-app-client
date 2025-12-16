import Foundation
import AVFoundation

/**
 * Ultra-precise metronome engine using iOS AVAudioEngine with real audio files.
 *
 * Key improvements:
 * 1. AVAudioEngine with AVAudioPlayerNode for sample-accurate timing
 * 2. Real WAV files instead of generated tones for better sound quality
 * 3. CACurrentMediaTime() for drift-free timing
 * 4. High-priority DispatchQueue for consistent scheduling
 * 5. Sample-level precision matching Android implementation
 */
class MetronomeEngine {
    private var isPlaying: Bool = false
    private var bpm: Int = 120
    private var beatsPerMeasure: Int = 4
    private var accentFirstBeat: Bool = true

    // Audio engine
    private var audioEngine: AVAudioEngine?
    private var playerNode: AVAudioPlayerNode?
    private var clickBuffer: AVAudioPCMBuffer?
    private var accentBuffer: AVAudioPCMBuffer?

    // Timing
    private var startTime: Double = 0
    private var nextBeatIndex: Int = 0
    private var timer: DispatchSourceTimer?
    private let timerQueue = DispatchQueue(label: "com.animaltune.metronome", qos: .userInteractive)

    // Callback
    private let onBeat: (Int, Bool, Int64) -> Void

    init(onBeat: @escaping (Int, Bool, Int64) -> Void) {
        self.onBeat = onBeat
        setupAudioEngine()
        loadSoundFiles()
    }

    private func setupAudioEngine() {
        // Configure AVAudioSession for playback and recording simultaneously
        // This allows metronome to play while tuner is recording
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
            try audioSession.setActive(true)
            print("MetronomeEngine: AVAudioSession configured for playAndRecord")
        } catch {
            print("MetronomeEngine: Failed to configure AVAudioSession: \(error)")
        }

        audioEngine = AVAudioEngine()
        playerNode = AVAudioPlayerNode()

        guard let audioEngine = audioEngine, let playerNode = playerNode else { return }

        audioEngine.attach(playerNode)

        // Connect to output with sample-accurate format
        let format = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 1)!
        audioEngine.connect(playerNode, to: audioEngine.mainMixerNode, format: format)

        // Start engine
        do {
            try audioEngine.start()
            print("MetronomeEngine: Audio engine started successfully")
        } catch {
            print("MetronomeEngine: Failed to start audio engine: \(error)")
        }
    }

    private func loadSoundFiles() {
        let resourceBundleName = "ExpoPreciseMetronomeResources"

        let bundleCandidates: [Bundle?] = [
            {
                let bundle = Bundle(for: PreciseMetronomeModule.self)
                if let url = bundle.url(forResource: resourceBundleName, withExtension: "bundle") {
                    return Bundle(url: url)
                }
                return nil
            }(),
            {
                if let url = Bundle.main.url(forResource: resourceBundleName, withExtension: "bundle") {
                    return Bundle(url: url)
                }
                return nil
            }()
        ]

        guard let bundle = bundleCandidates.compactMap({ $0 }).first else {
            print("MetronomeEngine: Resource bundle '\(resourceBundleName)' not found, using fallback sounds")
            loadFallbackSounds()
            return
        }

        // Load click.wav
        if let clickPath = bundle.path(forResource: "click", ofType: "wav") {
            clickBuffer = loadAudioFile(path: clickPath)
            print("MetronomeEngine: Loaded click.wav from resources")
        }

        // Load accent.wav
        if let accentPath = bundle.path(forResource: "accent", ofType: "wav") {
            accentBuffer = loadAudioFile(path: accentPath)
            print("MetronomeEngine: Loaded accent.wav from resources")
        }

        // Fallback if files not found
        if clickBuffer == nil || accentBuffer == nil {
            print("MetronomeEngine: WAV files not found, using fallback sounds")
            loadFallbackSounds()
        }
    }

    private func loadAudioFile(path: String) -> AVAudioPCMBuffer? {
        let fileURL = URL(fileURLWithPath: path)

        guard let audioFile = try? AVAudioFile(forReading: fileURL) else {
            print("MetronomeEngine: Failed to load audio file at \(path)")
            return nil
        }

        let sourceFormat = audioFile.processingFormat
        let sourceFrameCount = AVAudioFrameCount(audioFile.length)

        guard let sourceBuffer = AVAudioPCMBuffer(pcmFormat: sourceFormat, frameCapacity: sourceFrameCount) else {
            print("MetronomeEngine: Failed to create source buffer")
            return nil
        }

        do {
            try audioFile.read(into: sourceBuffer)
        } catch {
            print("MetronomeEngine: Failed to read audio file: \(error)")
            return nil
        }

        let targetFormat = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 1)!

        let needsConversion = sourceFormat.channelCount != targetFormat.channelCount ||
            abs(sourceFormat.sampleRate - targetFormat.sampleRate) > .ulpOfOne

        guard needsConversion else {
            print("MetronomeEngine: Loaded \(sourceBuffer.frameLength) frames at \(sourceFormat.sampleRate) Hz (no conversion needed)")
            return sourceBuffer
        }

        guard let converter = AVAudioConverter(from: sourceFormat, to: targetFormat) else {
            print("MetronomeEngine: Failed to create audio converter")
            sourceBuffer.frameLength = sourceBuffer.frameCapacity
            return sourceBuffer
        }

        let estimatedFrameCapacity = AVAudioFrameCount(Double(sourceBuffer.frameLength) * targetFormat.sampleRate / sourceFormat.sampleRate) + 1
        guard let convertedBuffer = AVAudioPCMBuffer(pcmFormat: targetFormat, frameCapacity: estimatedFrameCapacity) else {
            print("MetronomeEngine: Failed to create converted buffer")
            return sourceBuffer
        }

        var hasProvidedBuffer = false
        let inputBlock: AVAudioConverterInputBlock = { _, outStatus in
            if hasProvidedBuffer {
                outStatus.pointee = .endOfStream
                return nil
            }
            hasProvidedBuffer = true
            outStatus.pointee = .haveData
            return sourceBuffer
        }

        var conversionError: NSError?
        converter.convert(to: convertedBuffer, error: &conversionError, withInputFrom: inputBlock)

        if let conversionError {
            print("MetronomeEngine: Conversion failed with error: \(conversionError)")
            return sourceBuffer
        }

        print("MetronomeEngine: Converted audio to \(targetFormat.sampleRate) Hz, \(targetFormat.channelCount) channel(s)")
        return convertedBuffer
    }

    private func loadFallbackSounds() {
        // Generate simple click tones as fallback
        clickBuffer = generateClickSound(frequency: 1000, duration: 0.005, amplitude: 0.3)
        accentBuffer = generateClickSound(frequency: 800, duration: 0.008, amplitude: 0.4)
        print("MetronomeEngine: Generated fallback click sounds")
    }

    private func generateClickSound(frequency: Double, duration: Double, amplitude: Float) -> AVAudioPCMBuffer? {
        let sampleRate = 48000.0
        let frameCount = AVAudioFrameCount(sampleRate * duration)
        let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            return nil
        }

        buffer.frameLength = frameCount

        // Generate sine wave with envelope
        guard let channelData = buffer.floatChannelData else { return nil }

        for frame in 0..<Int(frameCount) {
            let t = Double(frame) / sampleRate
            let envelope = 1.0 - (Double(frame) / Double(frameCount)) // Linear decay
            let value = Float(sin(2.0 * .pi * frequency * t) * envelope * Double(amplitude))
            channelData[0][frame] = value
        }

        return buffer
    }

    func start(bpm: Int, beatsPerMeasure: Int, accentFirstBeat: Bool) {
        stop()

        self.bpm = bpm
        self.beatsPerMeasure = beatsPerMeasure
        self.accentFirstBeat = accentFirstBeat

        guard let playerNode = playerNode else {
            print("MetronomeEngine: Player node unavailable")
            return
        }

        if audioEngine?.isRunning == false {
            do {
                try audioEngine?.start()
            } catch {
                print("MetronomeEngine: Failed to restart audio engine: \(error)")
            }
        }

        isPlaying = true
        let beatInterval = 60.0 / Double(bpm)
        let initialLeadTime = min(0.3, beatInterval * 0.75)
        startTime = CACurrentMediaTime() + initialLeadTime
        nextBeatIndex = 0

        playerNode.stop()
        playerNode.reset()
        playerNode.play()

        timerQueue.async { [weak self] in
            self?.scheduleBeatsIfNeeded()
        }
        startTimer()

        print("MetronomeEngine: Started metronome at \(bpm) BPM")
    }

    func stop() {
        isPlaying = false
        timer?.cancel()
        timer = nil
        playerNode?.stop()
        playerNode?.reset()
        nextBeatIndex = 0
        print("MetronomeEngine: Stopped metronome")
    }

    func setBpm(newBpm: Int) {
        if !isPlaying {
            self.bpm = newBpm
            return
        }

        // Restart with new BPM
        let currentBeatsPerMeasure = self.beatsPerMeasure
        let currentAccentFirstBeat = self.accentFirstBeat
        stop()
        start(bpm: newBpm, beatsPerMeasure: currentBeatsPerMeasure, accentFirstBeat: currentAccentFirstBeat)
    }

    func getIsPlaying() -> Bool {
        return isPlaying
    }

    private func startTimer() {
        timer = DispatchSource.makeTimerSource(queue: timerQueue)
        timer?.schedule(deadline: .now(), repeating: .milliseconds(10), leeway: .milliseconds(1))
        timer?.setEventHandler { [weak self] in
            self?.scheduleBeatsIfNeeded()
        }
        timer?.resume()
    }

    private func scheduleBeatsIfNeeded() {
        guard isPlaying else { return }

        let beatIntervalSeconds = 60.0 / Double(bpm)
        let lookAheadTime = max(0.5, beatIntervalSeconds * 1.5)
        let maxCatchUpLag = 0.05

        while isPlaying {
            let beatTime = startTime + (Double(nextBeatIndex) * beatIntervalSeconds)
            let remaining = beatTime - CACurrentMediaTime()

            if remaining < -maxCatchUpLag {
                // We've fallen behind—skip this beat to realign.
                nextBeatIndex += 1
                continue
            }

            if remaining > lookAheadTime {
                break
            }

            scheduleBeat(beatIndex: nextBeatIndex, remaining: remaining)
            nextBeatIndex += 1
        }
    }

    private func scheduleBeat(beatIndex: Int, remaining: Double) {
        guard isPlaying, let playerNode = playerNode else { return }

        let beatNumber = (beatIndex % beatsPerMeasure) + 1
        let isAccent = accentFirstBeat && beatNumber == 1

        guard let buffer = isAccent ? accentBuffer : clickBuffer else {
            print("MetronomeEngine: Buffer not available")
            return
        }

        let delaySeconds = max(0, remaining)
        let hostDelay = AVAudioTime.hostTime(forSeconds: delaySeconds)
        let playTime = AVAudioTime(hostTime: mach_absolute_time() &+ hostDelay)

        playerNode.scheduleBuffer(buffer, at: playTime, options: [], completionHandler: nil)

        let eventTimestampMs = Int64((Date().timeIntervalSince1970 + delaySeconds) * 1000.0)
        let delayNanoseconds = UInt64(delaySeconds * 1_000_000_000)
        let clampedNanoseconds = min(delayNanoseconds, UInt64(Int.max))
        let deadline = DispatchTime.now() + .nanoseconds(Int(clampedNanoseconds))
        DispatchQueue.main.asyncAfter(deadline: deadline) { [weak self] in
            guard let self = self, self.isPlaying else { return }
            self.onBeat(beatNumber, isAccent, eventTimestampMs)
        }

        #if DEBUG
        print(String(format: "MetronomeEngine: Global beat %d (measure beat %d) scheduled %.3fs ahead (accent=%@)",
                     beatIndex + 1,
                     beatNumber,
                     delaySeconds,
                     isAccent ? "true" : "false"))
        #endif
    }

    func release() {
        stop()
        audioEngine?.stop()
        audioEngine = nil
        playerNode = nil
        print("MetronomeEngine: Released resources")
    }
}
