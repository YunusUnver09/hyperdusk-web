import React, { useState } from 'react';
import type { GemType } from '../game/types';
import { GEM_ELEMENTS, DEFAULT_ACTIVE_CORES } from '../game/constants';
import { coreManager } from '../game/coreManager';
import { gameEngine } from '../game/engine';
import { soundManager } from '../game/soundManager';
import {
  Flame,
  Snowflake,
  Zap,
  Orbit,
  Bomb,
  Shield,
  Sun,
  Atom,
  Clock,
  Biohazard,
  Radio,
  Activity,
  Anchor,
  Copy,
  Compass,
  Bug,
  Disc,
  Satellite,
  Star,
  ShieldCheck,
  X,
  Plus,
  Minus,
  Check,
  RotateCcw,
  Cpu,
  Sparkles,
  Info
} from 'lucide-react';

interface CoreEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoreEngineModal: React.FC<CoreEngineModalProps> = ({ isOpen, onClose }) => {
  const [activeSlots, setActiveSlots] = useState<(GemType | null)[]>(() => {
    const active = coreManager.getActiveCores();
    // Fill to 6 slots
    const slots: (GemType | null)[] = [...active];
    while (slots.length < 6) slots.push(null);
    return slots;
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const unlockedCores = coreManager.getUnlockedCores();
  // Equipped set
  const equippedSet = new Set(activeSlots.filter(Boolean) as GemType[]);
  // Inventory cores (unlocked and NOT currently in activeSlots)
  const inventoryCores = unlockedCores.filter(type => !equippedSet.has(type));

  const renderCoreIcon = (type: GemType, size: number = 18) => {
    switch (type) {
      case 'plasma': return <Flame size={size} color="#ffffff" />;
      case 'cryo': return <Snowflake size={size} color="#ffffff" />;
      case 'electric': return <Zap size={size} color="#ffffff" />;
      case 'void': return <Orbit size={size} color="#ffffff" />;
      case 'explosive': return <Bomb size={size} color="#ffffff" />;
      case 'nano': return <Shield size={size} color="#ffffff" />;
      case 'solaris': return <Sun size={size} color="#ffffff" />;
      case 'antimatter': return <Atom size={size} color="#ffffff" />;
      case 'chronos': return <Clock size={size} color="#ffffff" />;
      case 'toxic': return <Biohazard size={size} color="#ffffff" />;
      case 'gravity': return <Radio size={size} color="#ffffff" />;
      case 'vampiric': return <Activity size={size} color="#ffffff" />;
      case 'prism': return <Sparkles size={size} color="#ffffff" />;
      case 'anchor': return <Anchor size={size} color="#ffffff" />;
      case 'echo': return <Copy size={size} color="#ffffff" />;
      case 'wormhole': return <Compass size={size} color="#ffffff" />;
      case 'parasite': return <Bug size={size} color="#ffffff" />;
      case 'static_web': return <Disc size={size} color="#ffffff" />;
      case 'orbital_drone': return <Satellite size={size} color="#ffffff" />;
      case 'supernova': return <Star size={size} color="#ffffff" />;
      case 'deflector': return <ShieldCheck size={size} color="#ffffff" />;
      default: return <Sparkles size={size} color="#ffffff" />;
    }
  };

  // Remove a core from active slots -> returns to inventory automatically
  const handleRemoveFromSlot = (slotIndex: number) => {
    soundManager.playGemSwap();
    const newSlots = [...activeSlots];
    const removedType = newSlots[slotIndex];
    newSlots[slotIndex] = null;
    setActiveSlots(newSlots);

    if (removedType) {
      setNotificationMsg(`${GEM_ELEMENTS[removedType].turkishName} slottan çıkarıldı ve envantere döndü.`);
      setTimeout(() => setNotificationMsg(null), 2500);
    }
  };

  // Equip a core from inventory into first available empty slot
  const handleEquipFromInventory = (type: GemType) => {
    soundManager.playGemSwap();
    const firstEmptyIndex = activeSlots.findIndex(s => s === null);
    if (firstEmptyIndex === -1) {
      setNotificationMsg('Tüm 6 yuva dolu! Önce bir çekirdeği çıkarmanız gerekir.');
      setTimeout(() => setNotificationMsg(null), 2500);
      return;
    }

    const newSlots = [...activeSlots];
    newSlots[firstEmptyIndex] = type;
    setActiveSlots(newSlots);

    setNotificationMsg(`${GEM_ELEMENTS[type].turkishName} aktif savaşa eklendi.`);
    setTimeout(() => setNotificationMsg(null), 2500);
  };

  // Reset to default 6 starter cores
  const handleResetToDefault = () => {
    soundManager.playGemSwap();
    setActiveSlots([...DEFAULT_ACTIVE_CORES]);
    setNotificationMsg('Varsayılan 6 çekirdek dizilimi yüklendi.');
    setTimeout(() => setNotificationMsg(null), 2500);
  };

  // Save & Apply Loadout
  const handleSaveAndApply = () => {
    const validCores = activeSlots.filter(Boolean) as GemType[];
    if (validCores.length !== 6) {
      soundManager.playShieldHit();
      setNotificationMsg('Savaşa başlamak için tam 6 Crush Core seçilmelidir!');
      setTimeout(() => setNotificationMsg(null), 3000);
      return;
    }

    if (coreManager.setActiveCores(validCores)) {
      soundManager.playVictory();
      gameEngine.match3.initBoard();
      gameEngine.syncUIState(true);
      onClose();
    }
  };

  const equippedCount = activeSlots.filter(Boolean).length;
  const isLoadoutComplete = equippedCount === 6;

  return (
    <div className="modal-overlay engine-modal-overlay" onClick={onClose}>
      <div className="engine-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="engine-modal-header">
          <div className="engine-title-box">
            <div className="engine-title-badge">
              <Cpu size={16} color="#00f3ff" />
              <span>ÇEKİRDEK MOTORU</span>
            </div>
            <h2 className="engine-title-main">Aktif 6'lı Savaş Dizilimi & Envanter</h2>
          </div>

          <button className="modal-close-btn" onClick={onClose} title="Kapat">
            <X size={20} />
          </button>
        </div>

        {/* Informational notification banner */}
        {notificationMsg && (
          <div className="engine-alert-banner">
            <Info size={15} />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Section 1: Active 6 Core Sockets (Upper Half) */}
        <div className="engine-section active-deck-section">
          <div className="section-header-row">
            <div className="section-title-wrap">
              <span className="section-title">AKTİF ÇEKİRDEKLER ({equippedCount}/6)</span>
              <span className="section-sub">Eşleşmelerde tahtaya düşecek olan 6 çekirdek</span>
            </div>
            <button className="engine-reset-btn" onClick={handleResetToDefault} title="Varsayılana Dön">
              <RotateCcw size={13} />
              <span>VARSAYILAN</span>
            </button>
          </div>

          <div className="active-slots-grid">
            {activeSlots.map((type, idx) => {
              const core = type ? GEM_ELEMENTS[type] : null;

              if (!core) {
                return (
                  <div key={`empty_slot_${idx}`} className="core-slot empty">
                    <div className="empty-slot-icon">
                      <Plus size={20} color="rgba(0, 243, 255, 0.4)" />
                    </div>
                    <span className="slot-label">YUVA {idx + 1}</span>
                    <span className="slot-hint">Boş Yuva</span>
                  </div>
                );
              }

              return (
                <div
                  key={`active_slot_${idx}_${core.type}`}
                  className="core-slot filled"
                  style={{
                    borderColor: core.color,
                    boxShadow: `0 0 14px ${core.glowColor}`
                  }}
                >
                  {/* Sphere Core */}
                  <div
                    className="core-slot-sphere"
                    style={{
                      background: `linear-gradient(135deg, ${core.gradient[0]}, ${core.gradient[1]})`
                    }}
                  >
                    {renderCoreIcon(core.type, 22)}
                  </div>

                  <span className="core-slot-name">{core.turkishName}</span>
                  <span className="core-slot-type" style={{ color: core.color }}>
                    {core.turretType}
                  </span>

                  {/* Remove Button (Returns to inventory) */}
                  <button
                    className="core-remove-btn"
                    onClick={() => handleRemoveFromSlot(idx)}
                    title={`${core.turkishName} çıkar ve envantere gönder`}
                  >
                    <Minus size={13} />
                    <span>Çıkar</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Inventory Cores (Bottom Half) */}
        <div className="engine-section inventory-section">
          <div className="section-header-row">
            <span className="section-title">ÇEKİRDEK ENVANTERİ ({inventoryCores.length})</span>
            <span className="section-sub">Açılmış ve yedekte bekleyen çekirdekler</span>
          </div>

          {inventoryCores.length === 0 ? (
            <div className="empty-inventory-state">
              <Sparkles size={24} color="#64748b" />
              <span>Tüm açık Crush Core'lar şu an aktif yuvalarda takılı!</span>
              <small>Daha fazla çekirdek açmak için Çekirdek Ocağı'nı ziyaret edin.</small>
            </div>
          ) : (
            <div className="inventory-cores-grid">
              {inventoryCores.map((type) => {
                const core = GEM_ELEMENTS[type];
                return (
                  <div
                    key={`inv_${type}`}
                    className="inventory-core-item"
                    onClick={() => handleEquipFromInventory(type)}
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div
                      className="inv-core-sphere"
                      style={{
                        background: `linear-gradient(135deg, ${core.gradient[0]}, ${core.gradient[1]})`,
                        boxShadow: `0 0 10px ${core.glowColor}`
                      }}
                    >
                      {renderCoreIcon(type, 18)}
                    </div>

                    <div className="inv-core-text">
                      <span className="inv-core-name">{core.turkishName}</span>
                      <span className="inv-core-desc">{core.description}</span>
                    </div>

                    <button className="inv-equip-btn">
                      <Plus size={14} />
                      <span>KUŞAN</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="engine-modal-footer">
          <button className="engine-cancel-btn" onClick={onClose}>
            VAZGEÇ
          </button>

          <button
            className={`engine-apply-btn ${isLoadoutComplete ? 'active' : 'disabled'}`}
            disabled={!isLoadoutComplete}
            onClick={handleSaveAndApply}
          >
            <Check size={18} />
            <span>
              {isLoadoutComplete ? 'KAYDET & DİZİLİMİ UYGULA' : `6 ÇEKİRDEK GEREKLİ (${equippedCount}/6)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
