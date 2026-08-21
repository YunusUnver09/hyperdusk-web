import React, { useEffect, useRef } from 'react';
import { gameEngine } from '../game/engine';

interface BattlefieldCanvasProps {
  combo: number;
}

export const BattlefieldCanvasComponent: React.FC<BattlefieldCanvasProps> = ({ combo }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      gameEngine.battlefield.setCanvas(canvasRef.current);
    }

    const handleResize = () => {
      gameEngine.battlefield.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="battlefield-wrapper">
      <canvas ref={canvasRef} className="battlefield-canvas" />

      {/* Floating Combo Counter Banner */}
      {combo >= 2 && (
        <div key={combo} className="combo-floating-badge">
          <span className="combo-count">x{combo}</span>
          <span className="combo-subtitle">
            {combo >= 5 ? 'ULTRA COMBO!' : combo >= 3 ? 'SUPER CHAIN!' : 'KOMBO!'}
          </span>
        </div>
      )}
    </div>
  );
};

export const BattlefieldCanvas = React.memo(BattlefieldCanvasComponent);
