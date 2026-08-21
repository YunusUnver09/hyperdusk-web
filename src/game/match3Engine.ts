import type { Gem, GemType, SpecialGemType, MatchGroup, MatchResult } from './types';
import { GRID_COLS, GRID_ROWS } from './constants';
import { soundManager } from './soundManager';
import { coreManager } from './coreManager';

let gemUniqueCounter = 0;

function easeOutBack(x: number): number {
  const c1 = 1.35;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function easeOutQuad(x: number): number {
  return 1 - (1 - x) * (1 - x);
}

export interface AvailableMove {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  orientation: 'horizontal' | 'vertical';
  sector: 'left' | 'right' | 'both';
  type: GemType;
}

export class Match3Engine {
  public grid: (Gem | null)[][] = [];
  public isProcessing: boolean = false;
  public selectedGem: { row: number; col: number } | null = null;
  public combo: number = 0;
  public hintGem: { row: number; col: number } | null = null;
  private hintTimer: number = 0;

  // Turn counter for 2-turn vertical match guarantee
  public turnCount: number = 0;

  // Event callbacks
  public onMatchProduced?: (result: MatchResult) => void;
  public onGridUpdated?: (grid: (Gem | null)[][], activeGems: Gem[]) => void;
  public onInvalidSwap?: (r1: number, c1: number, r2: number, c2: number) => void;
  public onProcessingStateChange?: (isProcessing: boolean) => void;

  constructor() {
    this.initBoard();
  }

  public getActiveCoreTypes(): GemType[] {
    return coreManager.getActiveCores();
  }

  public getAllGems(): Gem[] {
    const list: Gem[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.grid[r][c]) {
          list.push(this.grid[r][c]!);
        }
      }
    }
    return list;
  }

  public setProcessing(val: boolean) {
    this.isProcessing = val;
    if (this.onProcessingStateChange) {
      this.onProcessingStateChange(val);
    }
  }

  public initBoard() {
    this.grid = [];
    gemUniqueCounter = 0;
    this.combo = 0;
    this.hintGem = null;
    this.hintTimer = 0;
    this.selectedGem = null;
    this.turnCount = 0;
    this.setProcessing(false);

    const activeTypes = this.getActiveCoreTypes();

    for (let r = 0; r < GRID_ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        let type: GemType;
        do {
          type = activeTypes[Math.floor(Math.random() * activeTypes.length)];
        } while (
          (c >= 2 && this.grid[r][c - 1]?.type === type && this.grid[r][c - 2]?.type === type) ||
          (r >= 2 && this.grid[r - 1][c]?.type === type && this.grid[r - 2][c]?.type === type)
        );

        this.grid[r][c] = {
          id: `gem_${++gemUniqueCounter}`,
          type,
          special: 'none',
          row: r,
          col: c,
          startRow: r,
          startCol: c,
          displayRow: r,
          displayCol: c,
          scale: 1,
          alpha: 1,
          isMatched: false,
          isNew: false
        };
      }
    }

    // Ensure tactical sector balance (Left Horizontal >= 1, Right Horizontal >= 1, Total >= 3, Vertical >= 1)
    this.ensureTacticalBoardBalance();
    this.notifyUpdate();
  }

  private notifyUpdate() {
    if (this.onGridUpdated) {
      this.onGridUpdated(this.grid, this.getAllGems());
    }
  }

  /**
   * Promise-based 60 FPS RequestAnimationFrame Tween
   */
  private animateTween(durationMs: number, onFrame: (progress: number) => void): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        onFrame(progress);
        this.notifyUpdate();
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  public update(dt: number) {
    if (!this.isProcessing && !this.selectedGem) {
      this.hintTimer += dt;
      if (this.hintTimer >= 4.0 && !this.hintGem) {
        this.hintTimer = 0;
        const hint = this.findHint();
        if (hint) {
          this.hintGem = hint;
          this.notifyUpdate();
        }
      }
    } else {
      this.hintTimer = 0;
      if (this.hintGem) {
        this.hintGem = null;
        this.notifyUpdate();
      }
    }
  }

  public selectTile(row: number, col: number): boolean {
    if (this.isProcessing) return false;
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;

    this.hintTimer = 0;
    this.hintGem = null;

    if (!this.selectedGem) {
      this.selectedGem = { row, col };
      soundManager.playGemSwap();
      this.notifyUpdate();
      return true;
    }

    const { row: r1, col: c1 } = this.selectedGem;
    const isAdjacent = Math.abs(r1 - row) + Math.abs(c1 - col) === 1;

    if (r1 === row && c1 === col) {
      this.selectedGem = null;
      this.notifyUpdate();
      return true;
    }

    if (isAdjacent) {
      this.selectedGem = null;
      this.trySwap(r1, c1, row, col);
      return true;
    } else {
      this.selectedGem = { row, col };
      soundManager.playGemSwap();
      this.notifyUpdate();
      return true;
    }
  }

  public swipeMove(fromRow: number, fromCol: number, direction: 'up' | 'down' | 'left' | 'right') {
    if (this.isProcessing) return;
    let targetRow = fromRow;
    let targetCol = fromCol;

    if (direction === 'up') targetRow--;
    else if (direction === 'down') targetRow++;
    else if (direction === 'left') targetCol--;
    else if (direction === 'right') targetCol++;

    if (targetRow >= 0 && targetRow < GRID_ROWS && targetCol >= 0 && targetCol < GRID_COLS) {
      this.selectedGem = null;
      this.trySwap(fromRow, fromCol, targetRow, targetCol);
    }
  }

  public async trySwap(r1: number, c1: number, r2: number, c2: number) {
    if (this.isProcessing) return;
    const gem1 = this.grid[r1][c1];
    const gem2 = this.grid[r2][c2];
    if (!gem1 || !gem2) return;

    // 1. Lock user input & increment turn counter
    this.setProcessing(true);
    this.combo = 0;
    this.turnCount++;

    // Setup swap coordinates
    gem1.startRow = r1; gem1.startCol = c1; gem1.row = r2; gem1.col = c2;
    gem2.startRow = r2; gem2.startCol = c2; gem2.row = r1; gem2.col = c1;

    soundManager.playGemSwap();

    // 2. Animate swap glide (220ms)
    await this.animateTween(220, (p) => {
      const ease = easeOutQuad(p);
      gem1.displayRow = gem1.startRow + (gem1.row - gem1.startRow) * ease;
      gem1.displayCol = gem1.startCol + (gem1.col - gem1.startCol) * ease;
      gem2.displayRow = gem2.startRow + (gem2.row - gem2.startRow) * ease;
      gem2.displayCol = gem2.startCol + (gem2.col - gem2.startCol) * ease;
    });

    gem1.displayRow = r2; gem1.displayCol = c2;
    gem2.displayRow = r1; gem2.displayCol = c1;
    this.grid[r1][c1] = gem2;
    this.grid[r2][c2] = gem1;

    // Check for Hyper Cube match with another gem
    if (gem1.special === 'hyper_cube' || gem2.special === 'hyper_cube') {
      const hyperGem = gem1.special === 'hyper_cube' ? gem1 : gem2;
      const targetGem = gem1.special === 'hyper_cube' ? gem2 : gem1;
      await this.executeHyperCube(hyperGem, targetGem);
      return;
    }

    const matches = this.findMatches();
    if (matches.length === 0) {
      // Invalid move -> Revert swap animation
      soundManager.playShieldHit();
      gem1.startRow = r2; gem1.startCol = c2; gem1.row = r1; gem1.col = c1;
      gem2.startRow = r1; gem2.startCol = c1; gem2.row = r2; gem2.col = c2;

      await this.animateTween(220, (p) => {
        const ease = easeOutQuad(p);
        gem1.displayRow = gem1.startRow + (gem1.row - gem1.startRow) * ease;
        gem1.displayCol = gem1.startCol + (gem1.col - gem1.startCol) * ease;
        gem2.displayRow = gem2.startRow + (gem2.row - gem2.startRow) * ease;
        gem2.displayCol = gem2.startCol + (gem2.col - gem2.startCol) * ease;
      });

      gem1.displayRow = r1; gem1.displayCol = c1;
      gem2.displayRow = r2; gem2.displayCol = c2;
      this.grid[r1][c1] = gem1;
      this.grid[r2][c2] = gem2;
      this.notifyUpdate();

      if (this.onInvalidSwap) {
        this.onInvalidSwap(r1, c1, r2, c2);
      }

      this.setProcessing(false);
      return;
    }

    // Valid move -> Start the recursive cascade loop
    await this.runRecursiveCascadeLoop();
  }

  private async executeHyperCube(hyperGem: Gem, targetGem: Gem) {
    const targetType = targetGem.type;
    const matchedGems: Gem[] = [hyperGem];
    const colHits: Record<number, { count: number; type: GemType; specialCount: number }> = {};

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const g = this.grid[r][c];
        if (g && (g.type === targetType || g.id === hyperGem.id)) {
          g.isMatched = true;
          matchedGems.push(g);
          if (!colHits[c]) {
            colHits[c] = { count: 0, type: targetType, specialCount: 0 };
          }
          colHits[c].count++;
        }
      }
    }

    this.combo = 2;
    soundManager.playOrbitalStrike();
    soundManager.triggerVibrate([40, 60, 40, 80]);

    if (this.onMatchProduced) {
      this.onMatchProduced({
        matchGroups: [{
          gems: matchedGems,
          type: targetType,
          matchedColumns: Object.keys(colHits).map(Number),
          count: matchedGems.length
        }],
        totalGemsMatched: matchedGems.length,
        columnHits: colHits,
        combo: this.combo,
        scoreGained: matchedGems.length * 150 * this.combo,
        energyGained: 25
      });
    }

    // Pop animation
    await this.animateTween(200, (p) => {
      for (const g of matchedGems) {
        g.scale = Math.max(0, 1 - p * 1.1);
        g.alpha = Math.max(0, 1 - p);
      }
    });

    this.removeMatchedGems();
    await this.applyGravityAndAnimateFall();
    await this.runRecursiveCascadeLoop();
  }

  /**
   * Recursive Cascade Loop:
   * 1. Detect matches on current grid.
   * 2. If matches exist:
   *    a. Mark gems as matched & play pop animation + audio + battlefield lasers.
   *    b. Animate shrink/pop of matched gems (200ms).
   *    c. Clear matched gems and calculate gravity + spawn new gems at top.
   *    d. Animate smooth physics-based fall slide down with organic bounce (500ms).
   *    e. Pause 120ms for player recognition.
   *    f. Repeat cascade scan!
   * 3. When no matches remain:
   *    a. Ensure tactical sector balance (Left Horizontal >= 1, Right Horizontal >= 1, Total >= 3, 2-turn Vertical >= 1).
   *    b. Unlock input (`setProcessing(false)`).
   */
  private async runRecursiveCascadeLoop() {
    let matchGroups = this.findMatches();

    while (matchGroups.length > 0) {
      this.combo++;
      const colHits: Record<number, { count: number; type: GemType; specialCount: number }> = {};
      let totalGems = 0;
      const specialsToSpawn: { pos: { row: number; col: number }; type: GemType; special: SpecialGemType }[] = [];
      const matchedGemsList: Gem[] = [];

      // Mark matched gems and collect special creations
      for (const group of matchGroups) {
        for (const gem of group.gems) {
          gem.isMatched = true;
          totalGems++;
          matchedGemsList.push(gem);
          if (!colHits[gem.col]) {
            colHits[gem.col] = { count: 0, type: gem.type, specialCount: 0 };
          }
          colHits[gem.col].count++;

          // Check if triggered gem was already special
          if (gem.special === 'column_laser' || gem.special === 'row_laser' || gem.special === 'bomb_cross') {
            colHits[gem.col].specialCount++;
            this.triggerSpecialGemBlast(gem, colHits, matchedGemsList);
          }
        }

        if (group.isSpecialCreation && group.specialType && group.specialPosition) {
          specialsToSpawn.push({
            pos: group.specialPosition,
            type: group.type,
            special: group.specialType
          });
        }
      }

      // Play audio chime and mobile haptics
      soundManager.playMatch(this.combo);
      soundManager.triggerVibrate(this.combo > 2 ? [30, 40, 30] : 25);

      // Dispatch results to Game Engine / Turrets for real-time laser fire!
      if (this.onMatchProduced) {
        this.onMatchProduced({
          matchGroups,
          totalGemsMatched: totalGems,
          columnHits: colHits,
          combo: this.combo,
          scoreGained: totalGems * 60 * this.combo,
          energyGained: Math.min(20, totalGems * 2 + this.combo * 2)
        });
      }

      // 1. Pop & Shrink Animation (200ms)
      await this.animateTween(200, (p) => {
        for (const gem of matchedGemsList) {
          gem.scale = Math.max(0, 1 - p * 1.1);
          gem.alpha = Math.max(0, 1 - p);
        }
      });

      // 2. Remove destroyed gems from board
      this.removeMatchedGems();

      // 3. Spawn new special gem in place if formed
      for (const s of specialsToSpawn) {
        const newSpecGem: Gem = {
          id: `gem_${++gemUniqueCounter}`,
          type: s.type,
          special: s.special,
          row: s.pos.row,
          col: s.pos.col,
          startRow: s.pos.row,
          startCol: s.pos.col,
          displayRow: s.pos.row,
          displayCol: s.pos.col,
          scale: 1.2,
          alpha: 1,
          glow: true,
          isMatched: false,
          isNew: false
        };
        this.grid[s.pos.row][s.pos.col] = newSpecGem;
      }

      // 4. Apply gravity and physically slide down surviving & incoming gems (500ms with organic bounce)
      await this.applyGravityAndAnimateFall();

      // 5. Recognition pause (~120ms) so the player can perceive the newly landed match before it detonates!
      await this.delay(120);

      // 6. Re-scan for new cascade matches formed by falling gems!
      matchGroups = this.findMatches();
    }

    // 7. Enforce Tactical Sector Balance (Left/Right Horizontal >= 1, Total >= 3, 2-turn Vertical >= 1)
    this.ensureTacticalBoardBalance();

    // 8. Unlock input for player
    this.setProcessing(false);
    this.notifyUpdate();
  }

  private triggerSpecialGemBlast(gem: Gem, colHits: Record<number, { count: number; type: GemType; specialCount: number }>, matchedList: Gem[]) {
    if (gem.special === 'column_laser') {
      for (let r = 0; r < GRID_ROWS; r++) {
        const target = this.grid[r][gem.col];
        if (target && !target.isMatched) {
          target.isMatched = true;
          matchedList.push(target);
          colHits[gem.col].count++;
        }
      }
    } else if (gem.special === 'row_laser') {
      for (let c = 0; c < GRID_COLS; c++) {
        const target = this.grid[gem.row][c];
        if (target && !target.isMatched) {
          target.isMatched = true;
          matchedList.push(target);
          if (!colHits[c]) colHits[c] = { count: 0, type: gem.type, specialCount: 0 };
          colHits[c].count++;
        }
      }
    } else if (gem.special === 'bomb_cross') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = gem.row + dr;
          const nc = gem.col + dc;
          if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
            const target = this.grid[nr][nc];
            if (target && !target.isMatched) {
              target.isMatched = true;
              matchedList.push(target);
              if (!colHits[nc]) colHits[nc] = { count: 0, type: gem.type, specialCount: 0 };
              colHits[nc].count++;
            }
          }
        }
      }
    }
  }

  private removeMatchedGems() {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.grid[r][c]?.isMatched) {
          this.grid[r][c] = null;
        }
      }
    }
  }

  /**
   * Calculates gravity fall paths and physically animates all falling gems over 500ms
   */
  private async applyGravityAndAnimateFall() {
    const newGrid: (Gem | null)[][] = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
    const animatedFallingGems: Gem[] = [];

    for (let c = 0; c < GRID_COLS; c++) {
      let targetRow = GRID_ROWS - 1;

      // 1. Move existing surviving gems downwards into empty spaces
      for (let r = GRID_ROWS - 1; r >= 0; r--) {
        const gem = this.grid[r][c];
        if (gem !== null) {
          gem.startRow = gem.displayRow; // Start from its current visual location
          gem.startCol = c;
          gem.row = targetRow; // Target row at bottom
          gem.col = c;
          gem.scale = 1;
          gem.alpha = 1;
          gem.isMatched = false;
          gem.isNew = false;
          newGrid[targetRow][c] = gem;
          animatedFallingGems.push(gem);
          targetRow--;
        }
      }

      // 2. Generate new incoming gems for remaining empty top slots
      const emptyCount = targetRow + 1;
      const activeTypes = this.getActiveCoreTypes();
      for (let r = targetRow; r >= 0; r--) {
        const randomType = activeTypes[Math.floor(Math.random() * activeTypes.length)];
        const spawnRowOffset = -(emptyCount - r); // Spawns above ceiling (-1, -2, -3...)

        const newGem: Gem = {
          id: `gem_${++gemUniqueCounter}`,
          type: randomType,
          special: 'none',
          row: r, // Target final row
          col: c,
          startRow: spawnRowOffset, // Starting animation position above grid
          startCol: c,
          displayRow: spawnRowOffset,
          displayCol: c,
          scale: 1,
          alpha: 1,
          isNew: true,
          isMatched: false
        };

        newGrid[r][c] = newGem;
        animatedFallingGems.push(newGem);
      }
    }

    this.grid = newGrid;

    // 3. Run smooth 60 FPS physics gravity tween (500ms with organic bounce)
    await this.animateTween(500, (p) => {
      const ease = easeOutBack(p);
      for (const g of animatedFallingGems) {
        g.displayRow = g.startRow! + (g.row - g.startRow!) * ease;
        g.displayCol = g.col;
      }
    });

    // 4. Snap to final settled coordinates
    for (const g of animatedFallingGems) {
      g.displayRow = g.row;
      g.startRow = g.row;
      g.displayCol = g.col;
      g.startCol = g.col;
    }
    this.notifyUpdate();
  }

  public findMatches(): MatchGroup[] {
    const matchedSet = new Set<string>();
    const matchGroups: MatchGroup[] = [];

    // Horizontal matches
    for (let r = 0; r < GRID_ROWS; r++) {
      let matchLength = 1;
      for (let c = 0; c < GRID_COLS; c++) {
        const current = this.grid[r][c];
        const next = c < GRID_COLS - 1 ? this.grid[r][c + 1] : null;

        if (current && next && current.type === next.type && current.type !== undefined && !current.isMatched && !next.isMatched) {
          matchLength++;
        } else {
          if (matchLength >= 3 && current && !current.isMatched) {
            const groupGems: Gem[] = [];
            const cols: number[] = [];
            for (let i = 0; i < matchLength; i++) {
              const colIdx = c - i;
              const g = this.grid[r][colIdx];
              if (g) {
                groupGems.push(g);
                cols.push(colIdx);
                matchedSet.add(g.id);
              }
            }

            let specialType: SpecialGemType = 'none';
            let specialPos: { row: number; col: number } | undefined = undefined;

            if (matchLength === 4) {
              specialType = 'column_laser';
              specialPos = { row: r, col: cols[Math.floor(cols.length / 2)] };
            } else if (matchLength >= 5) {
              specialType = 'hyper_cube';
              specialPos = { row: r, col: cols[Math.floor(cols.length / 2)] };
            }

            matchGroups.push({
              gems: groupGems,
              type: current.type,
              specialType,
              specialPosition: specialPos,
              isSpecialCreation: specialType !== 'none',
              matchedColumns: cols,
              count: matchLength
            });
          }
          matchLength = 1;
        }
      }
    }

    // Vertical matches
    for (let c = 0; c < GRID_COLS; c++) {
      let matchLength = 1;
      for (let r = 0; r < GRID_ROWS; r++) {
        const current = this.grid[r][c];
        const next = r < GRID_ROWS - 1 ? this.grid[r + 1][c] : null;

        if (current && next && current.type === next.type && current.type !== undefined && !current.isMatched && !next.isMatched) {
          matchLength++;
        } else {
          if (matchLength >= 3 && current && !current.isMatched) {
            const groupGems: Gem[] = [];
            for (let i = 0; i < matchLength; i++) {
              const rowIdx = r - i;
              const g = this.grid[rowIdx][c];
              if (g) {
                groupGems.push(g);
                matchedSet.add(g.id);
              }
            }

            let specialType: SpecialGemType = 'none';
            let specialPos: { row: number; col: number } | undefined = undefined;

            if (matchLength === 4) {
              specialType = 'row_laser';
              specialPos = { row: r - Math.floor(matchLength / 2), col: c };
            } else if (matchLength >= 5) {
              specialType = 'hyper_cube';
              specialPos = { row: r - Math.floor(matchLength / 2), col: c };
            }

            matchGroups.push({
              gems: groupGems,
              type: current.type,
              specialType,
              specialPosition: specialPos,
              isSpecialCreation: specialType !== 'none',
              matchedColumns: [c],
              count: matchLength
            });
          }
          matchLength = 1;
        }
      }
    }

    return matchGroups;
  }

  /**
   * Analyzes all possible 1-swap moves currently on the board,
   * categorizing them by orientation (horizontal / vertical) and sector (left / right).
   */
  public findDetailedAvailableMoves(): AvailableMove[] {
    const validMoves: AvailableMove[] = [];
    const moveKeySet = new Set<string>();

    const testSwap = (r1: number, c1: number, r2: number, c2: number) => {
      this.swapGemsInGrid(r1, c1, r2, c2);
      const matches = this.findMatches();
      this.swapGemsInGrid(r1, c1, r2, c2);

      if (matches.length > 0) {
        for (const m of matches) {
          const isHorizontal = m.gems.length >= 2 && m.gems[0].row === m.gems[1].row;
          const cols = m.matchedColumns;
          const isLeft = cols.every(c => c < 4);
          const isRight = cols.every(c => c >= 4);
          const sector: 'left' | 'right' | 'both' = isLeft ? 'left' : (isRight ? 'right' : 'both');

          const key = `${Math.min(r1, r2)}_${Math.min(c1, c2)}_${Math.max(r1, r2)}_${Math.max(c1, c2)}_${isHorizontal ? 'H' : 'V'}`;
          if (!moveKeySet.has(key)) {
            moveKeySet.add(key);
            validMoves.push({
              r1,
              c1,
              r2,
              c2,
              orientation: isHorizontal ? 'horizontal' : 'vertical',
              sector,
              type: m.type
            });
          }
        }
      }
    };

    // Check horizontal adjacent swaps
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS - 1; c++) {
        testSwap(r, c, r, c + 1);
      }
    }

    // Check vertical adjacent swaps
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS - 1; r++) {
        testSwap(r, c, r + 1, c);
      }
    }

    return validMoves;
  }

  /**
   * Tactical Board Balance Rules:
   * 1. Sol Kanat (Cols 0..3) her zaman en az 1 adet yatay 3'lü hamlesi içermeli.
   * 2. Sağ Kanat (Cols 4..7) her zaman en az 1 adet yatay 3'lü hamlesi içermeli.
   * 3. 2 turda bir (turnCount % 2 === 0) her iki kanatta da en az birer tane dikey 3'lü hamlesi bulunmalı.
   * 4. Toplamda tüm tahtada her zaman en az 3 geçerli hamle bulunmalı.
   */
  public ensureTacticalBoardBalance() {
    let moves = this.findDetailedAvailableMoves();
    let leftHorizontal = moves.filter(m => (m.sector === 'left' || m.sector === 'both') && m.orientation === 'horizontal');
    let rightHorizontal = moves.filter(m => (m.sector === 'right' || m.sector === 'both') && m.orientation === 'horizontal');
    let leftVertical = moves.filter(m => (m.sector === 'left' || m.sector === 'both') && m.orientation === 'vertical');
    let rightVertical = moves.filter(m => (m.sector === 'right' || m.sector === 'both') && m.orientation === 'vertical');

    const checkVertical = (this.turnCount % 2 === 0);

    let needsAdjustment = (
      leftHorizontal.length < 1 ||
      rightHorizontal.length < 1 ||
      moves.length < 3 ||
      (checkVertical && (leftVertical.length < 1 || rightVertical.length < 1))
    );

    if (!needsAdjustment) return;

    let iterations = 0;
    while (needsAdjustment && iterations < 8) {
      iterations++;

      // 1. Sol Kanat Yatay Eşleşme Eksikse Tohumla
      if (leftHorizontal.length < 1) {
        this.plantTacticalPattern('left', 'horizontal');
      }

      // 2. Sağ Kanat Yatay Eşleşme Eksikse Tohumla
      if (rightHorizontal.length < 1) {
        this.plantTacticalPattern('right', 'horizontal');
      }

      // 3. 2 Turda Bir Dikey Eşleşme Garantisi
      if (checkVertical) {
        if (leftVertical.length < 1) {
          this.plantTacticalPattern('left', 'vertical');
        }
        if (rightVertical.length < 1) {
          this.plantTacticalPattern('right', 'vertical');
        }
      }

      // 4. Genel Hamle Sayısı < 3 ise ekstra tohum ekle
      moves = this.findDetailedAvailableMoves();
      if (moves.length < 3) {
        this.plantTacticalPattern('left', 'horizontal');
        this.plantTacticalPattern('right', 'horizontal');
      }

      // Önceden oluşan kazara 3'lüleri düzelt (pre-matches clean)
      this.fixInstantPreMatches();

      // Tekrar doğrula
      moves = this.findDetailedAvailableMoves();
      leftHorizontal = moves.filter(m => (m.sector === 'left' || m.sector === 'both') && m.orientation === 'horizontal');
      rightHorizontal = moves.filter(m => (m.sector === 'right' || m.sector === 'both') && m.orientation === 'horizontal');
      leftVertical = moves.filter(m => (m.sector === 'left' || m.sector === 'both') && m.orientation === 'vertical');
      rightVertical = moves.filter(m => (m.sector === 'right' || m.sector === 'both') && m.orientation === 'vertical');

      needsAdjustment = (
        leftHorizontal.length < 1 ||
        rightHorizontal.length < 1 ||
        moves.length < 3 ||
        (checkVertical && (leftVertical.length < 1 || rightVertical.length < 1))
      );
    }
  }

  /**
   * Plants a potential 1-swap match pattern in the given sector without creating an active 3-in-a-row.
   */
  private plantTacticalPattern(sector: 'left' | 'right', orientation: 'horizontal' | 'vertical') {
    const activeTypes = this.getActiveCoreTypes();
    const targetType = activeTypes[Math.floor(Math.random() * activeTypes.length)];
    const otherTypes = activeTypes.filter(t => t !== targetType);
    const fillerType = otherTypes[Math.floor(Math.random() * otherTypes.length)];

    if (orientation === 'horizontal') {
      // Choose row [1..6] and starting column in sector
      const row = Math.floor(Math.random() * 6) + 1;
      const startCol = sector === 'left' ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 2) + 4; // 0,1 or 4,5

      // Pattern: [target, target, filler] with target directly above/below the filler cell!
      if (this.grid[row] && this.grid[row][startCol] && this.grid[row][startCol + 1] && this.grid[row][startCol + 2]) {
        this.grid[row][startCol]!.type = targetType;
        this.grid[row][startCol + 1]!.type = targetType;
        this.grid[row][startCol + 2]!.type = fillerType;

        // Place target directly above or below the 3rd cell so 1 swap creates horizontal 3-in-a-row!
        const swapRow = row > 3 ? row - 1 : row + 1;
        if (this.grid[swapRow] && this.grid[swapRow][startCol + 2]) {
          this.grid[swapRow][startCol + 2]!.type = targetType;
        }
      }
    } else {
      // Vertical orientation: choose starting row [0..4] and col in sector
      const startRow = Math.floor(Math.random() * 4) + 1;
      const col = sector === 'left' ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 3) + 4; // 1..3 or 4..6

      // Pattern: [target] at row, [target] at row+1, [filler] at row+2 with target at adjacent col!
      if (
        this.grid[startRow] && this.grid[startRow][col] &&
        this.grid[startRow + 1] && this.grid[startRow + 1][col] &&
        this.grid[startRow + 2] && this.grid[startRow + 2][col]
      ) {
        this.grid[startRow][col]!.type = targetType;
        this.grid[startRow + 1][col]!.type = targetType;
        this.grid[startRow + 2][col]!.type = fillerType;

        // Place target adjacent (col-1 or col+1) at startRow+2
        const swapCol = col > 4 ? col - 1 : col + 1;
        if (this.grid[startRow + 2] && this.grid[startRow + 2][swapCol]) {
          this.grid[startRow + 2][swapCol]!.type = targetType;
        }
      }
    }
  }

  /**
   * Fixes any unintended 3-in-a-row matches that might have formed passively.
   */
  private fixInstantPreMatches() {
    const activeTypes = this.getActiveCoreTypes();
    let matches = this.findMatches();
    let loops = 0;
    while (matches.length > 0 && loops < 10) {
      loops++;
      for (const m of matches) {
        // Change the middle gem to a non-matching type
        const targetGem = m.gems[Math.floor(m.gems.length / 2)];
        if (targetGem && this.grid[targetGem.row][targetGem.col]) {
          const forbidden = new Set<GemType>([m.type]);
          const available = activeTypes.filter(t => !forbidden.has(t));
          this.grid[targetGem.row][targetGem.col]!.type = available[Math.floor(Math.random() * available.length)];
        }
      }
      matches = this.findMatches();
    }
  }

  public hasValidMoves(): boolean {
    return this.findDetailedAvailableMoves().length > 0;
  }

  private swapGemsInGrid(r1: number, c1: number, r2: number, c2: number) {
    const temp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = temp;

    if (this.grid[r1][c1]) {
      this.grid[r1][c1]!.row = r1;
      this.grid[r1][c1]!.col = c1;
      this.grid[r1][c1]!.displayRow = r1;
      this.grid[r1][c1]!.displayCol = c1;
    }
    if (this.grid[r2][c2]) {
      this.grid[r2][c2]!.row = r2;
      this.grid[r2][c2]!.col = c2;
      this.grid[r2][c2]!.displayRow = r2;
      this.grid[r2][c2]!.displayCol = c2;
    }
  }

  public findHint(): { row: number; col: number } | null {
    const moves = this.findDetailedAvailableMoves();
    if (moves.length > 0) {
      return { row: moves[0].r1, col: moves[0].c1 };
    }
    return null;
  }

  public async shuffleBoard() {
    this.setProcessing(true);
    const allGems: Gem[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.grid[r][c]) allGems.push(this.grid[r][c]!);
      }
    }

    // Shuffle elements
    for (let i = allGems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tempType = allGems[i].type;
      allGems[i].type = allGems[j].type;
      allGems[j].type = tempType;
    }

    this.ensureTacticalBoardBalance();
    this.notifyUpdate();
    await this.delay(200);
    this.setProcessing(false);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
