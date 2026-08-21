import type { GemType } from './types';
import { GEM_ELEMENTS, DEFAULT_ACTIVE_CORES, ALL_CRUSH_CORES } from './constants';

class CoreManager {
  private unlockedCores: Set<GemType> = new Set(DEFAULT_ACTIVE_CORES);
  private activeCores: GemType[] = [...DEFAULT_ACTIVE_CORES];
  private coreFragments: number = 0;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      // 1. Load unlocked cores
      const savedUnlocked = localStorage.getItem('crush_space_unlocked_cores');
      if (savedUnlocked) {
        const parsed: string[] = JSON.parse(savedUnlocked);
        const validList = parsed.filter(t => ALL_CRUSH_CORES.includes(t as GemType)) as GemType[];
        this.unlockedCores = new Set([...DEFAULT_ACTIVE_CORES, ...validList]);
      } else {
        this.unlockedCores = new Set(DEFAULT_ACTIVE_CORES);
      }

      // 2. Load active loadout
      const savedActive = localStorage.getItem('crush_space_active_cores');
      if (savedActive) {
        const parsed: string[] = JSON.parse(savedActive);
        const validActive = parsed.filter(t => this.unlockedCores.has(t as GemType)) as GemType[];
        if (validActive.length === 6) {
          this.activeCores = validActive;
        } else {
          this.activeCores = [...DEFAULT_ACTIVE_CORES];
        }
      } else {
        this.activeCores = [...DEFAULT_ACTIVE_CORES];
      }

      // 3. Load core fragments
      const savedFragments = localStorage.getItem('crush_space_core_fragments');
      if (savedFragments) {
        const val = parseInt(savedFragments, 10);
        this.coreFragments = Math.max(1200, isNaN(val) ? 1200 : val);
        this.saveFragments();
      } else {
        this.coreFragments = 1200; // Starter gift fragments!
        this.saveFragments();
      }
    } catch {
      this.unlockedCores = new Set(DEFAULT_ACTIVE_CORES);
      this.activeCores = [...DEFAULT_ACTIVE_CORES];
      this.coreFragments = 1200;
    }
  }

  private saveUnlocked() {
    try {
      localStorage.setItem('crush_space_unlocked_cores', JSON.stringify(Array.from(this.unlockedCores)));
    } catch {}
  }

  private saveActive() {
    try {
      localStorage.setItem('crush_space_active_cores', JSON.stringify(this.activeCores));
    } catch {}
  }

  private saveFragments() {
    try {
      localStorage.setItem('crush_space_core_fragments', this.coreFragments.toString());
    } catch {}
  }

  public getUnlockedCores(): GemType[] {
    return Array.from(this.unlockedCores);
  }

  public isCoreUnlocked(type: GemType): boolean {
    return this.unlockedCores.has(type);
  }

  public getActiveCores(): GemType[] {
    return [...this.activeCores];
  }

  public getFragments(): number {
    return this.coreFragments;
  }

  public addFragments(amount: number) {
    if (amount <= 0) return;
    this.coreFragments += amount;
    this.saveFragments();
  }

  public spendFragments(amount: number): boolean {
    if (this.coreFragments < amount || amount <= 0) return false;
    this.coreFragments -= amount;
    this.saveFragments();
    return true;
  }

  public unlockCore(type: GemType): boolean {
    if (this.unlockedCores.has(type)) return true;
    const config = GEM_ELEMENTS[type];
    if (!config) return false;

    if (this.spendFragments(config.unlockCost)) {
      this.unlockedCores.add(type);
      this.saveUnlocked();
      return true;
    }
    return false;
  }

  public setActiveCores(newActive: GemType[]): boolean {
    // Must be exactly 6 unique unlocked cores
    const unique = Array.from(new Set(newActive));
    if (unique.length !== 6) return false;

    for (const c of unique) {
      if (!this.unlockedCores.has(c)) return false;
    }

    this.activeCores = unique;
    this.saveActive();
    return true;
  }
}

export const coreManager = new CoreManager();
