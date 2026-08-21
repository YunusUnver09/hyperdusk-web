import React from 'react';
import type { UIState } from '../game/types';
import { gameEngine } from '../game/engine';
import { Orbit, Zap, ShieldAlert } from 'lucide-react';

interface SpecialAbilitiesProps {
  uiState: UIState;
}

export const SpecialAbilitiesComponent: React.FC<SpecialAbilitiesProps> = ({ uiState }) => {
  const { abilitiesReady } = uiState;

  return (
    <div className="special-abilities-bar">
      {/* Ability 1: Orbital Strike */}
      <button
        className={`ability-btn ${abilitiesReady.orbital ? 'ready' : ''}`}
        onClick={() => gameEngine.useOrbitalStrike()}
        disabled={!abilitiesReady.orbital}
        title="Tüm şeritleri yok eden yörünge lazeri (80 Enerji)"
      >
        <Orbit size={18} color={abilitiesReady.orbital ? '#00f3ff' : '#64748b'} />
        <span className="ability-name">YÖRÜNGE DARBESİ</span>
        <span className="ability-cost">80 ENERJİ</span>
      </button>

      {/* Ability 2: EMP Nova */}
      <button
        className={`ability-btn ${abilitiesReady.emp ? 'ready' : ''}`}
        onClick={() => gameEngine.useEmpNova()}
        disabled={!abilitiesReady.emp}
        title="Tüm düşmanları dondurur ve şoklar (50 Enerji)"
      >
        <Zap size={18} color={abilitiesReady.emp ? '#ffd000' : '#64748b'} />
        <span className="ability-name">EMP ŞOK DALGASI</span>
        <span className="ability-cost">50 ENERJİ</span>
      </button>

      {/* Ability 3: Shield Overcharge */}
      <button
        className={`ability-btn ${abilitiesReady.shieldOvercharge ? 'ready' : ''}`}
        onClick={() => gameEngine.useShieldOvercharge()}
        disabled={!abilitiesReady.shieldOvercharge}
        title="Kalkanı hızla onarır ve güçlendirir (40 Enerji)"
      >
        <ShieldAlert size={18} color={abilitiesReady.shieldOvercharge ? '#00ff88' : '#64748b'} />
        <span className="ability-name">AŞIRI KALKAN</span>
        <span className="ability-cost">40 ENERJİ</span>
      </button>
    </div>
  );
};

export const SpecialAbilities = React.memo(SpecialAbilitiesComponent);
