import React, { useEffect } from 'react';
import { X, Activity, Sliders, Flame, RefreshCw } from 'lucide-react';
import { useEmberStore } from '../store/useEmberStore';

export interface DebugHUDProps {
  className?: string;
}

export const DebugHUD: React.FC<DebugHUDProps> = ({ className = '' }) => {
  const isDebugOpen = useEmberStore((state) => state.isDebugOpen);
  const progress = useEmberStore((state) => state.progress);
  const gravity = useEmberStore((state) => state.gravity);
  const oxygenPct = useEmberStore((state) => state.oxygenPct);
  const activeScene = useEmberStore((state) => state.activeScene);
  const isIgnited = useEmberStore((state) => state.isIgnited);
  const isMuted = useEmberStore((state) => state.isMuted);

  const toggleDebug = useEmberStore((state) => state.toggleDebug);
  const setProgress = useEmberStore((state) => state.setProgress);
  const setOxygenPct = useEmberStore((state) => state.setOxygenPct);
  const ignite = useEmberStore((state) => state.ignite);
  const reset = useEmberStore((state) => state.reset);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        useEmberStore.getState().toggleDebug();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isDebugOpen) {
    return null;
  }

  return (
    <aside
      id="debug-hud"
      data-testid="debug-hud"
      role="complementary"
      aria-label="Ember Zero Telemetry HUD"
      className={`fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-zinc-950/90 text-lime-400 font-mono text-xs rounded-xl p-4 border border-lime-500/30 shadow-2xl backdrop-blur-md transition-all ${className}`}
    >
      {/* HUD Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-lime-500/20">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-lime-400 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-white">
            Debug HUD Telemetry
          </span>
        </div>
        <button
          type="button"
          onClick={toggleDebug}
          aria-label="Đóng Debug HUD"
          className="p-1 rounded hover:bg-lime-500/20 text-lime-400 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Telemetry Stats Grid */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center py-0.5 border-b border-lime-500/10">
          <span className="text-zinc-400">Tiến trình (Progress):</span>
          <span className="font-bold text-lime-300">
            {(progress * 100).toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between items-center py-0.5 border-b border-lime-500/10">
          <span className="text-zinc-400">Trọng lực (Gravity):</span>
          <span className="font-bold text-lime-300">
            {gravity.toFixed(2)}g
          </span>
        </div>

        <div className="flex justify-between items-center py-0.5 border-b border-lime-500/10">
          <span className="text-zinc-400">Nồng độ O₂ (Oxygen):</span>
          <span className="font-bold text-lime-300">
            {oxygenPct.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between items-center py-0.5 border-b border-lime-500/10">
          <span className="text-zinc-400">Cảnh hiện tại (Scene):</span>
          <span className="font-bold text-cyan-300">
            {activeScene}
          </span>
        </div>

        <div className="flex justify-between items-center py-0.5 border-b border-lime-500/10">
          <span className="text-zinc-400">Đã châm lửa (Ignited):</span>
          <span className={isIgnited ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
            {isIgnited ? 'TRUE' : 'FALSE'}
          </span>
        </div>

        <div className="flex justify-between items-center py-0.5">
          <span className="text-zinc-400">Âm thanh (Muted):</span>
          <span className="text-zinc-300">
            {isMuted ? 'MUTED' : 'UNMUTED'}
          </span>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="pt-2 border-t border-lime-500/20 space-y-2">
        <div className="text-[10px] uppercase text-zinc-400 tracking-wider">
          Phím tắt: Bấm phím &apos;D&apos; để ẩn/hiện
        </div>

        <div className="grid grid-cols-4 gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => setProgress(0)}
            className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-center transition-colors"
          >
            0%
          </button>
          <button
            type="button"
            onClick={() => setProgress(0.23)}
            className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-center transition-colors"
          >
            Drop
          </button>
          <button
            type="button"
            onClick={() => setProgress(0.35)}
            className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-center transition-colors"
          >
            Sphere
          </button>
          <button
            type="button"
            onClick={() => setProgress(0.65)}
            className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-center transition-colors"
          >
            Moon
          </button>
        </div>

        <div className="flex items-center gap-1 mt-2">
          {!isIgnited ? (
            <button
              type="button"
              onClick={ignite}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded hover:bg-amber-600/50 transition-colors text-[10px]"
            >
              <Flame className="w-3 h-3" />
              <span>Châm lửa</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded hover:bg-zinc-700 transition-colors text-[10px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
