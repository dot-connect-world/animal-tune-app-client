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
    private var beatCount: Int = 0
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
        // Try to load WAV files from Resources bundle
        guard let bundle = Bundle.main.path(forResource: "ExpoModulesResources", ofType: "bundle"),
              let resourceBundle = Bundle(path: bundle) else {
            print("MetronomeEngine: Resource bundle not found, using fallback sounds")
            loadFallbackSounds()
            return
        }

        // Load click.wav
        if let clickPath = resourceBundle.path(forResource: "click", ofType: "wav") {
            clickBuffer = loadAudioFile(path: clickPath)
            print("MetronomeEngine: Loaded click.wav from resources")
        }

        // Load accent.wav
        if let accentPath = resourceBundle.path(forResource: "accent", ofType: "wav") {
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

        let format = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 1)!
        let frameCount = AVAudioFrameCount(audioFile.length)

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            print("MetronomeEngine: Failed to create buffer")
            return nil
        }

        do {
            // Read and convert to target format
            try audioFile.read(into: buffer)
            print("MetronomeEngine: Loaded \(buffer.frameLength) frames at \(format.sampleRate) Hz")
            return buffer
        } catch {
            print("MetronomeEngine: Failed to read audio file: \(error)")
            return nil
        }
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

        isPlaying = true
        beatCount = 0
        startTime = CACurrentMediaTime()

        playerNode?.play()

        print("MetronomeEngine: Started metronome at \(bpm) BPM")

        scheduleBeat()
        startTimer()
    }

    func stop() {
        isPlaying = false
        timer?.cancel()
        timer = nil
        playerNode?.stop()
        beatCount = 0
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

        // Check every 5ms for precise scheduling
        timer?.schedule(deadline: .now(), repeating: .milliseconds(5))
        timer?.setEventHandler { [weak self] in
            self?.checkAndSchedule()
        }
        timer?.resume()
    }

    private func checkAndSchedule() {
        guard isPlaying else { return }

        let beatIntervalSeconds = 60.0 / Double(bpm)
        let lookAheadTime = 0.1 // 100ms look-ahead window

        let currentTime = CACurrentMediaTime()
        let nextBeatTime = startTime + (Double(beatCount) * beatIntervalSeconds)

        // Schedule if within look-ahead window
        if nextBeatTime - currentTime < lookAheadTime {
            scheduleBeat()
        }
    }

    private func scheduleBeat() {
        guard isPlaying, let playerNode = playerNode else { return }

        let beatIntervalSeconds = 60.0 / Double(bpm)
        let exactBeatTime = startTime + (Double(beatCount) * beatIntervalSeconds)

        let currentBeatInMeasure = (beatCount % beatsPerMeasure) + 1
        let isAccent = accentFirstBeat && currentBeatInMeasure == 1

        // Select buffer
        guard let buffer = isAccent ? accentBuffer : clickBuffer else {
            print("MetronomeEngine: Buffer not available")
            return
        }

        // Calculate precise playback time
        let currentTime = CACurrentMediaTime()
        let deltaSeconds = max(0, exactBeatTime - currentTime)

        // Create AVAudioTime for precise scheduling
        let outputFormat = playerNode.outputFormat(forBus: 0)
        let sampleTime = AVAudioTime(hostTime: mach_absolute_time())

        // Calculate future host time in nanoseconds
        let delayInNanos = UInt64(deltaSeconds * 1_000_000_000)
        let playTime = AVAudioTime(hostTime: sampleTime.hostTime + delayInNanos)

        // Schedule buffer at exact time
        playerNode.scheduleBuffer(buffer, at: playTime, options: [], completionHandler: nil)

        print(String(format: "MetronomeEngine: Beat %d (%d/%d) scheduled at %.3fs, isAccent: %@",
                    beatCount + 1, currentBeatInMeasure, beatsPerMeasure, exactBeatTime, isAccent ? "true" : "false"))

        // Notify JavaScript on main thread
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.onBeat(currentBeatInMeasure, isAccent, Int64(Date().timeIntervalSince1970 * 1000))
        }

        beatCount += 1
    }

    func release() {
        stop()
        audioEngine?.stop()
        audioEngine = nil
        playerNode = nil
        print("MetronomeEngine: Released resources")
    }
}
