import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useEmberStore } from '../../store/useEmberStore';

export interface InteractiveIgniterProps {
  className?: string;
  onIgnite?: () => void;
}

interface SparkParticle {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
}

const REQUIRED_STRIKES = 3;

export const InteractiveIgniter: React.FC<InteractiveIgniterProps> = ({
  className = '',
  onIgnite,
}) => {
  const isIgnited = useEmberStore((state) => state.isIgnited);
  const ignite = useEmberStore((state) => state.ignite);

  const [strikes, setStrikes] = useState<number>(0);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [sparks, setSparks] = useState<SparkParticle[]>([]);
  const nextSparkId = useRef(0);

  const spawnSparks = useCallback(() => {
    const sparkCount = 12;
    const newSparks: SparkParticle[] = [];
    const colors = ['#FFD166', '#FF9F1C', '#FF5400', '#FFE494', '#4CC9F0'];

    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI / 6) + (Math.random() * (Math.PI * 0.7)); // upwards spray
      const distance = 40 + Math.random() * 60;
      const size = 3 + Math.random() * 4;
      const color = colors[Math.floor(Math.random() * colors.length)];

      newSparks.push({
        id: ++nextSparkId.current,
        x: 0,
        y: 0,
        angle,
        distance,
        size,
        color,
      });
    }

    setSparks((prev) => [...prev.slice(-24), ...newSparks]);
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => !newSparks.some((ns) => ns.id === s.id)));
    }, 600);
  }, []);

  const handleStrike = useCallback(() => {
    if (isIgnited) return;

    spawnSparks();
    setWheelRotation((prev) => prev + 120);

    const nextStrikes = strikes + 1;
    setStrikes(nextStrikes);

    if (nextStrikes >= REQUIRED_STRIKES) {
      ignite();
      onIgnite?.();
    }
  }, [isIgnited, strikes, spawnSparks, ignite, onIgnite]);

  const handleSkip = useCallback(() => {
    ignite();
    onIgnite?.();
  }, [ignite, onIgnite]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
        e.preventDefault();
        handleStrike();
      }
    },
    [handleStrike]
  );

  return (
    <div
      data-testid="interactive-igniter"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-100 shadow-2xl backdrop-blur-md outline-none focus:ring-2 focus:ring-amber-500/50 transition-all select-none ${className}`}
    >
      {/* Scientific Disclaimer Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-400 text-[10px] font-mono tracking-wider uppercase mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>ILLUSTRATIVE · SCIENTIFIC VISUALIZATION</span>
      </div>

      {isIgnited ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(255,180,84,0.3)]"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white tracking-wide">
              Ngọn lửa đã được kích hoạt
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              FLAME IGNITED · 1.00g BUOYANCY ACTIVE
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Flint Wheel Visual & Spark Emitter */}
          <div className="relative my-4 flex flex-col items-center">
            {/* Dynamic Sparks */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-0 h-0 pointer-events-none">
              <AnimatePresence>
                {sparks.map((spark) => {
                  const targetX = Math.cos(spark.angle) * spark.distance;
                  const targetY = -Math.sin(spark.angle) * spark.distance;

                  return (
                    <motion.span
                      key={spark.id}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: targetX,
                        y: targetY,
                        opacity: 0,
                        scale: 0.2,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        width: spark.size,
                        height: spark.size,
                        borderRadius: '50%',
                        backgroundColor: spark.color,
                        boxShadow: `0 0 8px ${spark.color}`,
                      }}
                    />
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Tactile Flint Wheel Button */}
            <motion.button
              type="button"
              aria-label="Bánh xe đá lửa (Flint wheel)"
              data-testid="flint-wheel-btn"
              onClick={handleStrike}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="relative group w-24 h-24 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-600 hover:border-amber-400 shadow-lg hover:shadow-amber-500/25 flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              {/* Rotating Gear Pattern */}
              <motion.div
                animate={{ rotate: wheelRotation }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-16 h-16 rounded-full border-2 border-dashed border-slate-500/70 group-hover:border-amber-400/80 flex items-center justify-center bg-slate-900/60"
              >
                <Sparkles className="w-7 h-7 text-amber-400 group-hover:text-amber-300 transition-colors" />
              </motion.div>
              <span className="absolute -bottom-2 text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300">
                STRIKE
              </span>
            </motion.button>
          </div>

          {/* Action Prompt */}
          <div className="text-center my-3 space-y-1">
            <p className="text-sm font-medium text-slate-200">
              Quẹt để đánh lửa (Strike the flint wheel)
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Bấm phím Space hoặc click để tạo tia lửa
            </p>
          </div>

          {/* Strike Progress Meter */}
          <div className="flex items-center gap-2 my-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                  strikes >= step
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            ))}
            <span className="text-[11px] font-mono text-slate-400 ml-1">
              {strikes}/{REQUIRED_STRIKES}
            </span>
          </div>

          {/* Buttons: Strike Primary & Skip Secondary */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-4 w-full">
            <button
              type="button"
              onClick={handleStrike}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-medium text-sm shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Quẹt lửa</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full sm:flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Bỏ qua đánh lửa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
