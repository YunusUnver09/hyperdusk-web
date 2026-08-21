import type { Particle, FloatingText, ScreenShake } from './types';

export class ParticleSystem {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public screenShake: ScreenShake = { intensity: 0, duration: 0, timer: 0 };

  private maxParticles = 120;
  private maxFloatingTexts = 18;

  public addParticle(p: Particle) {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift(); // Drop oldest to maintain steady 60fps
    }
    this.particles.push(p);
  }

  public triggerScreenShake(intensity: number, duration: number = 0.25) {
    this.screenShake = {
      intensity: Math.max(this.screenShake.intensity, intensity),
      duration,
      timer: duration
    };
  }

  public addExplosion(x: number, y: number, color: string, count: number = 10, isBig: boolean = false) {
    const pCount = isBig ? Math.min(count * 1.3, 14) : Math.min(count, 8);

    // Core shockwave ring
    this.addParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      size: isBig ? 10 : 5,
      color: '#ffffff',
      alpha: 0.9,
      life: 0,
      maxLife: isBig ? 0.30 : 0.20,
      shape: 'ring'
    });

    // Outer colored ring
    this.addParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      size: isBig ? 7 : 3.5,
      color,
      alpha: 0.8,
      life: 0,
      maxLife: isBig ? 0.38 : 0.24,
      shape: 'ring'
    });

    // Fiery & electric sparks
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 140 + 30) * (isBig ? 1.3 : 1);
      const life = Math.random() * 0.25 + (isBig ? 0.25 : 0.15);
      const size = Math.random() * (isBig ? 4 : 2.5) + 1.5;

      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color: Math.random() > 0.35 ? color : '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: life,
        shape: 'spark'
      });
    }

    // Smoke puffs (reduced to 2 for big, 1 for small)
    for (let i = 0; i < (isBig ? 3 : 1); i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 20 + 8;
      this.addParticle({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 4,
        color: 'rgba(150, 150, 180, 0.35)',
        alpha: 0.45,
        life: 0,
        maxLife: 0.35,
        shape: 'smoke'
      });
    }
  }

  public addLaserImpact(x: number, y: number, color: string, count: number = 4) {
    const pCount = Math.min(count, 5);
    for (let i = 0; i < pCount; i++) {
      const angle = Math.PI * 1.5 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = Math.random() * 110 + 25;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.2 + 1.2,
        color,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 0.16 + 0.08,
        shape: 'spark'
      });
    }
  }

  public addLightningSpark(x1: number, y1: number, x2: number, y2: number, color: string = '#ffd000') {
    const steps = 3;
    let currX = x1;
    let currY = y1;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const targetX = x1 + (x2 - x1) * t + (i === steps ? 0 : (Math.random() - 0.5) * 16);
      const targetY = y1 + (y2 - y1) * t + (i === steps ? 0 : (Math.random() - 0.5) * 12);

      this.addParticle({
        x: (currX + targetX) / 2,
        y: (currY + targetY) / 2,
        vx: 0,
        vy: 0,
        size: Math.hypot(targetX - currX, targetY - currY),
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.10,
        shape: 'glow_line',
        rotation: Math.atan2(targetY - currY, targetX - currX)
      });
      currX = targetX;
      currY = targetY;
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string = '#ffffff', isCrit: boolean = false) {
    if (this.floatingTexts.length >= this.maxFloatingTexts) {
      this.floatingTexts.shift();
    }
    this.floatingTexts.push({
      id: Math.random().toString(36).substring(2, 9),
      x: x + (Math.random() - 0.5) * 12,
      y,
      vy: isCrit ? -45 : -32,
      text,
      color,
      alpha: 1,
      scale: isCrit ? 1.25 : 1.0,
      life: 0,
      maxLife: isCrit ? 0.75 : 0.55,
      isCrit
    });
  }

  public update(dt: number) {
    // Screen shake update
    if (this.screenShake.timer > 0) {
      this.screenShake.timer -= dt;
      if (this.screenShake.timer <= 0) {
        this.screenShake.intensity = 0;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const progress = p.life / p.maxLife;
      p.alpha = 1 - progress;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Gravity/Drag
      if (p.shape === 'smoke') {
        p.size += dt * 10;
        p.vx *= 0.95;
        p.vy *= 0.95;
      } else {
        p.vx *= 0.92;
        p.vy *= 0.92;
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      const progress = ft.life / ft.maxLife;
      ft.alpha = Math.max(0, 1 - progress * progress);
      ft.y += ft.vy * dt;
      ft.vy *= 0.96;
    }
  }

  public getShakeOffset(): { x: number; y: number } {
    if (this.screenShake.timer <= 0 || this.screenShake.intensity <= 0) {
      return { x: 0, y: 0 };
    }
    const currentIntensity = this.screenShake.intensity * (this.screenShake.timer / this.screenShake.duration);
    return {
      x: (Math.random() * 2 - 1) * currentIntensity,
      y: (Math.random() * 2 - 1) * currentIntensity
    };
  }

  public render(ctx: CanvasRenderingContext2D) {
    // 1. Fast Batch Particle Rendering (Zero shadowBlur, minimal save/restore)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.shape === 'circle' || p.shape === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'spark') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size, p.y - p.size * 0.5, p.size * 2, p.size);
      } else if (p.shape === 'ring') {
        const progress = p.life / p.maxLife;
        const currentRadius = p.size + progress * 28;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, (1 - progress) * 2.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'glow_line') {
        // High-performance double stroke without expensive shadow blur
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = p.alpha * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = p.alpha;
        ctx.stroke();
      }
    }

    // 2. High-Performance Floating Damage Texts
    if (this.floatingTexts.length > 0) {
      ctx.font = 'bold 11px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < this.floatingTexts.length; i++) {
        const ft = this.floatingTexts[i];
        ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));

        // High-contrast outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = ft.isCrit ? 3.5 : 2;
        ctx.strokeText(ft.text, ft.x, ft.y);

        // Vibrant crisp fill without Gaussian blur
        ctx.fillStyle = ft.isCrit ? '#ff0055' : ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
    }

    ctx.globalAlpha = 1;
  }

  public clear() {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = { intensity: 0, duration: 0, timer: 0 };
  }
}
