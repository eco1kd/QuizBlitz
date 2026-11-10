/**
 * Web Audio API Sound Effects Engine
 * Чистый синтез звуков без внешних mp3-файлов (YAGNI, 0 зависимостей)
 */

class SoundEffectsEngine {
  private ctx: AudioContext | null = null
  public isMuted: boolean = false

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted
    return this.isMuted
  }

  public playClick() {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(480, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(780, this.ctx.currentTime + 0.06)

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.07)

    // Тактильный виброотклик для смартфонов
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12)
    }
  }

  public playTimerTick(isUrgent: boolean = false) {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = isUrgent ? 'square' : 'sine'
    const freq = isUrgent ? 880 : 540
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime)

    const volume = isUrgent ? 0.09 : 0.04
    gain.gain.setValueAtTime(volume, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.09)

    if (isUrgent && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25)
    }
  }

  public playCorrect() {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    // Мажорный триумфальный аккорд: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08)

      const start = this.ctx!.currentTime + idx * 0.08
      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4)

      osc.connect(gain)
      gain.connect(this.ctx!.destination)

      osc.start(start)
      osc.stop(start + 0.42)
    })

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 40])
    }
  }

  public playWrong() {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(240, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.3)

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.35)

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(80)
    }
  }

  public playFanfare() {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    // Фанфары подиума: G4, C5, E5, G5
    const fanfareNotes = [392, 523.25, 659.25, 783.99]
    fanfareNotes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()

      osc.type = 'triangle'
      const start = this.ctx!.currentTime + idx * 0.12
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.18, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + (idx === 3 ? 0.8 : 0.25))

      osc.connect(gain)
      gain.connect(this.ctx!.destination)

      osc.start(start)
      osc.stop(start + (idx === 3 ? 0.85 : 0.28))
    })
  }
}

export const sounds = new SoundEffectsEngine()
