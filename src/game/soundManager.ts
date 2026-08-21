import { BGM_DATA_URI } from '../assets/bgmAsset';

class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public isMusicMuted: boolean = false;
  public musicVolume: number = 0.75;
  public sfxVolume: number = 0.85;

  // Music nodes
  private musicBuffer: AudioBuffer | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private isMusicPlaying: boolean = false;
  public isMuffled: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  private initContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      const targetVol = this.isMusicMuted ? 0 : (this.isMuffled ? this.musicVolume * 0.35 : this.musicVolume);
      this.musicGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public toggleMusicMute(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    this.setMusicVolume(this.musicVolume);
    return this.isMusicMuted;
  }

  /**
   * Loads and decodes BGM audio into sample-accurate AudioBuffer
   */
  private async loadMusicBuffer(): Promise<AudioBuffer | null> {
    if (this.musicBuffer) return this.musicBuffer;
    const ctx = this.initContext();
    if (!ctx) return null;

    try {
      // Decode base64 Data URI
      const base64Data = BGM_DATA_URI.split(',')[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      this.musicBuffer = await ctx.decodeAudioData(bytes.buffer);
      return this.musicBuffer;
    } catch (err) {
      console.warn('Failed to decode BGM audio buffer:', err);
      return null;
    }
  }

  private stopMusicNodes() {
    try {
      if (this.musicSource) {
        this.musicSource.stop();
        this.musicSource.disconnect();
        this.musicSource = null;
      }
    } catch {}
  }

  /**
   * Starts background music:
   * 1. Plays from 0:00 to end (Intro plays ONLY once on first start)
   * 2. When it finishes, seamlessly loops from 28.0s to end continuously!
   */
  public async startMusic() {
    const ctx = this.initContext();
    if (!ctx) return;

    if (this.isMusicPlaying && this.musicSource) {
      // Already playing, ensure volume is active
      this.setMuffled(false);
      return;
    }

    try {
      const buffer = await this.loadMusicBuffer();
      if (!buffer) return;

      this.stopMusicNodes();

      const duration = buffer.duration;
      const loopStart = Math.min(Math.max(0, duration - 1), 28.0);

      // Lowpass Filter for Upgrade Muffling Effect
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.isMuffled ? 650 : 20000, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      // Music Master Gain
      const gain = ctx.createGain();
      const initialVol = this.isMusicMuted ? 0 : (this.isMuffled ? this.musicVolume * 0.35 : this.musicVolume);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(initialVol, ctx.currentTime + 0.35);

      // Connect filter -> gain -> destination
      filter.connect(gain);
      gain.connect(ctx.destination);

      this.musicFilter = filter;
      this.musicGain = gain;

      // Standard W3C AudioBufferSourceNode Loop:
      // Starts from offset 0:00 on first play, then wraps to loopStart (28.0s) on every loop iteration!
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = loopStart;
      source.loopEnd = duration;
      source.connect(filter);
      source.start(0, 0);
      this.musicSource = source;

      this.isMusicPlaying = true;
    } catch (err) {
      console.warn('Error starting music:', err);
    }
  }

  /**
   * Stops background music with a soft fade out
   */
  public stopMusic() {
    if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
    try {
      this.musicGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      setTimeout(() => {
        this.stopMusicNodes();
        this.isMusicPlaying = false;
      }, 320);
    } catch {
      this.stopMusicNodes();
      this.isMusicPlaying = false;
    }
  }

  /**
   * Muffles (low-pass filter) and ducks background music during upgrade selection
   */
  public setMuffled(muffled: boolean) {
    this.isMuffled = muffled;
    if (!this.ctx || !this.musicFilter || !this.musicGain) return;

    const now = this.ctx.currentTime;
    if (muffled) {
      // Muffle sound (low-pass down to 650Hz) and lower volume to 35%
      this.musicFilter.frequency.setTargetAtTime(650, now, 0.08);
      const targetVol = this.isMusicMuted ? 0 : this.musicVolume * 0.35;
      this.musicGain.gain.setTargetAtTime(targetVol, now, 0.08);
    } else {
      // Un-muffle sound (filter back to 20,000Hz) and restore full volume
      this.musicFilter.frequency.setTargetAtTime(20000, now, 0.12);
      const targetVol = this.isMusicMuted ? 0 : this.musicVolume;
      this.musicGain.gain.setTargetAtTime(targetVol, now, 0.12);
    }
  }

  // ==========================================
  // SFX SOUND GENERATORS (Web Audio API)
  // ==========================================

  public playGemSwap() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);

      gain.gain.setValueAtTime(0.14 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  public playMatch(combo: number = 1) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const baseFreqs = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 1046.5];
      const noteIndex = Math.min(combo - 1, baseFreqs.length - 1);
      const freq = baseFreqs[Math.max(0, noteIndex)];

      // Lead bell chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.18);

      gain.gain.setValueAtTime(0.24 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.22);

      // Harmonic shimmer
      if (combo >= 2) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, now + 0.03);
        gain2.gain.setValueAtTime(0.18 * this.sfxVolume, now + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.onended = () => {
          try {
            osc2.disconnect();
            gain2.disconnect();
          } catch {}
        };

        osc2.start(now + 0.03);
        osc2.stop(now + 0.25);
      }
    } catch {}
  }

  public playLaser() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  public playCryo() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.15);

      gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  public playElectric() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(680, now + 0.03);
      osc.frequency.setValueAtTime(240, now + 0.06);
      osc.frequency.setValueAtTime(540, now + 0.09);

      gain.gain.setValueAtTime(0.14 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  private noiseBufferSmall: AudioBuffer | null = null;
  private noiseBufferBig: AudioBuffer | null = null;

  private getNoiseBuffer(isBig: boolean): AudioBuffer | null {
    const ctx = this.initContext();
    if (!ctx) return null;
    if (isBig) {
      if (!this.noiseBufferBig) {
        const bufferSize = Math.floor(ctx.sampleRate * 0.4);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        this.noiseBufferBig = buffer;
      }
      return this.noiseBufferBig;
    } else {
      if (!this.noiseBufferSmall) {
        const bufferSize = Math.floor(ctx.sampleRate * 0.2);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        this.noiseBufferSmall = buffer;
      }
      return this.noiseBufferSmall;
    }
  }

  public playExplosion(isBig: boolean = false) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const buffer = this.getNoiseBuffer(isBig);
      if (!buffer) return;

      const now = ctx.currentTime;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isBig ? 350 : 500, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + (isBig ? 0.35 : 0.18));

      const gain = ctx.createGain();
      gain.gain.setValueAtTime((isBig ? 0.38 : 0.22) * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isBig ? 0.35 : 0.18));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.onended = () => {
        try {
          noise.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };

      noise.start(now);
    } catch {}
  }

  public playShieldHit() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      gain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  public playShieldBoost() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  public playOrbitalStrike() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.7);

      gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.75);

      setTimeout(() => this.playExplosion(true), 250);
    } catch {}
  }

  public playEmpWave() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.5);

      gain.gain.setValueAtTime(0.32 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {}
  }

  public playVictory() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const time = ctx.currentTime + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.28 * this.sfxVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {}
        };

        osc.start(time);
        osc.stop(time + 0.3);
      });
    } catch {}
  }

  public playGameOver() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [440, 392, 349.23, 261.63];
      notes.forEach((freq, i) => {
        const time = ctx.currentTime + i * 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.22 * this.sfxVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {}
        };

        osc.start(time);
        osc.stop(time + 0.28);
      });
    } catch {}
  }

  public triggerVibrate(pattern: number | number[] = 20) {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }
}

export const soundManager = new SoundManager();
