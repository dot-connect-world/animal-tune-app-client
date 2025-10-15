import Foundation
import AVFoundation

/**
 * High-precision metronome engine using iOS AVAudioEngine.
 *
 * Best practices implemented:
 * 1. AVAudioEngine with AVAudioPlayerNode for sample-accurate timing
 * 2. CACurrentMediaTime() for precise measurements
 * 3. Dedicated high-priority DispatchQueue
 * 4. Absolute time scheduling to prevent drift
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
    }

    private func setupAudioEngine() {
        audioEngine = AVAudioEngine()
        playerNode = AVAudioPlayerNode()

        guard let audioEngine = audioEngine, let playerNode = playerNode else { return }

        audioEngine.attach(playerNode)

        // Connect to output
        let format = playerNode.outputFormat(forBus: 0)
        audioEngine.connect(playerNode, to: audioEngine.mainMixerNode, format: format)

        // Load sounds (generate simple click tones)
        clickBuffer = generateClickSound(frequency: 1000, duration: 0.01, amplitude: 0.5)
        accentBuffer = generateClickSound(frequency: 1200, duration: 0.01, amplitude: 0.8)

        // Start engine
        do {
            try audioEngine.start()
        } catch {
            print("Failed to start audio engine: \(error)")
        }
    }

    private func generateClickSound(frequency: Double, duration: Double, amplitude: Float) -> AVAudioPCMBuffer? {
        guard let audioEngine = audioEngine else { return nil }

        let sampleRate = audioEngine.mainMixerNode.outputFormat(forBus: 0).sampleRate
        let frameCount = AVAudioFrameCount(sampleRate * duration)

        guard let buffer = AVAudioPCMBuffer(pcmFormat: audioEngine.mainMixerNode.outputFormat(forBus: 0), frameCapacity: frameCount) else {
            return nil
        }

        buffer.frameLength = frameCount

        // Generate sine wave
        let channelCount = Int(buffer.format.channelCount)
        let channels = UnsafeBufferPointer(start: buffer.floatChannelData, count: channelCount)

        for frame in 0..<Int(frameCount) {
            let value = Float(sin(2.0 * .pi * frequency * Double(frame) / sampleRate)) * amplitude
            for channel in 0..<channelCount {
                channels[channel][frame] = value
            }
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

        scheduleBeat()
        startTimer()
    }

    func stop() {
        isPlaying = false
        timer?.cancel()
        timer = nil
        playerNode?.stop()
        beatCount = 0
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

    func isPlaying() -> Bool {
        return isPlaying
    }

    private func startTimer() {
        timer = DispatchSource.makeTimerSource(queue: timerQueue)
        timer?.schedule(deadline: .now(), repeating: .milliseconds(5)) // Check every 5ms (improved from 10ms)
        timer?.setEventHandler { [weak self] in
            self?.checkAndSchedule()
        }
        timer?.resume()
    }

    private func checkAndSchedule() {
        guard isPlaying else { return }

        let beatIntervalSeconds = 60.0 / Double(bpm)
        let lookAheadTime = 0.1 // 100ms look-ahead

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
        let buffer = isAccent ? accentBuffer : clickBuffer

        // Schedule at precise time
        let sampleTime = AVAudioTime(hostTime: mach_absolute_time())
        let deltaSeconds = max(0, exactBeatTime - CACurrentMediaTime())
        let deltaSamples = AVAudioFramePosition(deltaSeconds * playerNode.outputFormat(forBus: 0).sampleRate)

        if let playTime = sampleTime.extrapolateTime(forSeconds: deltaSeconds) {
            playerNode.scheduleBuffer(buffer!, at: playTime, options: [], completionHandler: nil)
        }

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
    }
}
