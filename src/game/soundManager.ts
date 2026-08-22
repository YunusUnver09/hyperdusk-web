import { MENU_THEME_TRACK, getLevelConfig } from './levelData';

class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public isMusicMuted: boolean = false;
  public musicVolume: number = 0.75;
  public sfxVolume: number = 0.85;

  // Multi-Track Music Management
  private musicBuffers: Map<string, AudioBuffer> = new Map();
  private currentTrackName: string | null = null;
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
   * Loads and decodes high-quality audio file with in-memory caching
   */
  private async loadMusicBuffer(trackFileName: string): Promise<AudioBuffer | null> {
    if (this.musicBuffers.has(trackFileName)) {
      return this.musicBuffers.get(trackFileName)!;
    }
    const ctx = this.initContext();
    if (!ctx) return null;

    try {
      // Support relative path for both local Vite and GitHub Pages deployment
      const audioUrl = `audio/${trackFileName}`;
      const resp = await fetch(audioUrl);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} fetching ${audioUrl}`);
      }
      const arrayBuffer = await resp.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      this.musicBuffers.set(trackFileName, decoded);
      return decoded;
    } catch (err) {
      console.warn(`Failed to decode audio track '${trackFileName}':`, err);
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
   * Plays a specific sector or menu theme with seamless full-looping (0:00 -> duration)
   */
  public async playMusicTrack(trackFileName: string) {
    const ctx = this.initContext();
    if (!ctx) return;

    // If same track is already active, just un-muffle
    if (this.isMusicPlaying && this.currentTrackName === trackFileName && this.musicSource) {
      this.setMuffled(false);
      return;
    }

    try {
      const buffer = await this.loadMusicBuffer(trackFileName);
      if (!buffer) return;

      this.stopMusicNodes();

      const duration = buffer.duration;

      // Lowpass Filter for Upgrade Muffling Effect
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.isMuffled ? 650 : 20000, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      // Music Master Gain with smooth fade-in
      const gain = ctx.createGain();
      const initialVol = this.isMusicMuted ? 0 : (this.isMuffled ? this.musicVolume * 0.35 : this.musicVolume);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(initialVol, ctx.currentTime + 0.35);

      filter.connect(gain);
      gain.connect(ctx.destination);

      this.musicFilter = filter;
      this.musicGain = gain;

      // Seamless 100% loop: when end is reached, loop directly back to 0:00!
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = duration;
      source.connect(filter);
      source.start(0, 0);

      this.musicSource = source;
      this.currentTrackName = trackFileName;
      this.isMusicPlaying = true;
    } catch (err) {
      console.warn('Error starting music track:', err);
    }
  }

  /**
   * Main Menu & Galaxy Map Theme ("Fractured Space-Time" exclusively)
   */
  public playMenuTheme() {
    this.playMusicTrack(MENU_THEME_TRACK);
  }

  public playMapTheme() {
    this.playMusicTrack(MENU_THEME_TRACK);
  }

  /**
   * Sector Battle Theme (Sectors 1..8)
   */
  public playLevelTheme(levelNumber: number) {
    const config = getLevelConfig(levelNumber);
    this.playMusicTrack(config.musicTrack);
  }

  /**
   * General startMusic fallback
   */
  public startMusic(trackName?: string) {
    if (trackName) {
      this.playMusicTrack(trackName);
    } else {
      this.playMenuTheme();
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
        this.currentTrackName = null;
      }, 320);
    } catch {
      this.stopMusicNodes();
      this.isMusicPlaying = false;
      this.currentTrackName = null;
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
