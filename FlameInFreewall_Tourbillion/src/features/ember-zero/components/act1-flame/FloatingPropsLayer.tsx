import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Compass, Wind, Activity } from 'lucide-react';
import { useEmberStore } from '../../store/useEmberStore';

export interface FloatingPropsLayerProps {
  className?: string;
}

export const FloatingPropsLayer: React.FC<FloatingPropsLayerProps> = ({
  className = '',
}) => {
  const gravity = useEmberStore((state) => state.gravity);
  const freefallFactor = 1 - Math.min(1, Math.max(0, gravity));

  // Drift displacements scaled by (1 - gravity)
  const driftY = -70 * freefallFactor;
  const isMicrogravity = gravity <= 0.05;

  return (
    <div
      data-testid="floating-props-layer"
      className={`relative w-full h-full min-h-[450px] overflow-hidden pointer-events-none select-none ${className}`}
    >
      {/* Telemetry HUD Header */}
      <div className="absolute top-4 inset-x-4 flex flex-wrap items-center justify-between gap-3 z-10 pointer-events-auto">
        {/* Gravity Telemetry readout */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 backdrop-blur-md shadow-lg">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] font-mono text-slate-400">GRAVITY:</span>
          <span
            data-testid="telemetry-gravity"
            className="text-xs font-mono font-bold text-cyan-300 tracking-wider"
          >
            {gravity.toFixed(2)}g
          </span>
        </div>

        {/* Dynamic Telemetry Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-[10px] font-mono tracking-wider shadow-sm">
            <Wind className="w-3 h-3 text-cyan-400" />
            <span>FREEFALL DRIFT</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 text-[10px] font-mono tracking-wider shadow-sm">
            <Compass className="w-3 h-3 text-amber-400" />
            <span>BUOYANCY = 0</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-[10px] font-mono tracking-wider shadow-sm">
            <Droplets className="w-3 h-3 text-indigo-400" />
            <span>SURFACE TENSION DOMINANT</span>
          </div>
        </div>
      </div>

      {/* Floating Laboratory Props Canvas Layer */}
      <div className="relative w-full h-full flex items-center justify-center p-8">
        {/* Prop 1: Water Droplet */}
        <motion.div
          data-testid="prop-water-droplet"
          animate={{
            y: driftY * 0.9,
            x: -80 - 15 * freefallFactor,
            rotate: 10 * freefallFactor,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 45 }}
          className="absolute left-[15%] top-[35%] flex flex-col items-center group pointer-events-auto cursor-default"
        >
          {/* Liquid droplet visual morphing between teardrop and sphere */}
          <div
            style={{
              borderRadius: isMicrogravity
                ? '50%'
                : '50% 50% 50% 50% / 65% 65% 35% 35%',
            }}
            className="w-12 h-14 bg-gradient-to-tr from-cyan-600/70 via-sky-400/80 to-blue-300/90 border border-cyan-200/50 shadow-[0_0_20px_rgba(56,189,248,0.5)] backdrop-blur-sm transition-all duration-700 relative overflow-hidden"
          >
            {/* Specular highlight */}
            <div className="absolute top-1.5 left-2 w-3.5 h-4 rounded-full bg-white/70 blur-[0.5px] transform -rotate-12" />
          </div>
          <span className="mt-2 text-[10px] font-mono text-cyan-300 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-800/50">
            Water Droplet ({isMicrogravity ? 'Sphere' : 'Teardrop'})
          </span>
        </motion.div>

        {/* Prop 2: Wooden Pencil */}
        <motion.div
          data-testid="prop-pencil"
          animate={{
            y: driftY * 1.15,
            x: 70 + 20 * freefallFactor,
            rotate: -25 * freefallFactor,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 40 }}
          className="absolute right-[18%] top-[28%] flex flex-col items-center pointer-events-auto cursor-default"
        >
          <div className="w-36 h-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-sm border border-amber-600 shadow-md relative flex items-center">
            {/* Eraser and ferrule */}
            <div className="w-4 h-full bg-rose-400 rounded-l-sm" />
            <div className="w-2 h-full bg-slate-400 border-x border-slate-500" />
            <div className="flex-1 text-[7px] font-mono text-slate-800 px-2 truncate tracking-widest uppercase">
              HB #2 LAB
            </div>
            {/* Sharpened tip */}
            <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[14px] border-l-amber-200 relative">
              <div className="absolute -left-[14px] -top-[3px] w-0 h-0 border-y-[3px] border-y-transparent border-l-[6px] border-l-slate-800" />
            </div>
          </div>
          <span className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            Pencil (Drift: {(freefallFactor * 100).toFixed(0)}%)
          </span>
        </motion.div>

        {/* Prop 3: Matchbox */}
        <motion.div
          data-testid="prop-matchbox"
          animate={{
            y: driftY * 0.8,
            x: -120 + 10 * freefallFactor,
            rotate: 18 * freefallFactor,
          }}
          transition={{ type: 'spring', damping: 22, stiffness: 50 }}
          className="absolute left-[22%] bottom-[25%] flex flex-col items-center pointer-events-auto cursor-default"
        >
          <div className="w-16 h-10 bg-slate-800 border border-slate-600 rounded shadow-lg p-1 relative flex flex-col justify-between">
            <div className="w-full h-2 bg-red-700/80 rounded-t-sm flex items-center justify-center">
              <span className="text-[6px] font-mono text-white tracking-widest">
                FLAMEGUARD
              </span>
            </div>
            <div className="h-2.5 w-full bg-amber-900/60 rounded-sm border border-amber-800 flex items-center justify-center">
              <span className="text-[6px] font-mono text-amber-300">STRIKER</span>
            </div>
          </div>
          <span className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            Matchbox
          </span>
        </motion.div>

        {/* Prop 4: Research Paper */}
        <motion.div
          data-testid="prop-paper"
          animate={{
            y: driftY * 1.3,
            x: 110 - 15 * freefallFactor,
            rotate: 14 * freefallFactor,
          }}
          transition={{ type: 'spring', damping: 18, stiffness: 35 }}
          className="absolute right-[24%] bottom-[20%] flex flex-col items-center pointer-events-auto cursor-default"
        >
          <div className="w-20 h-28 bg-slate-100/90 text-slate-900 rounded p-2 shadow-2xl border border-slate-300 flex flex-col gap-1.5 backdrop-blur-sm">
            <div className="h-1.5 w-10 bg-slate-700 rounded-sm" />
            <div className="space-y-1">
              <div className="h-1 w-full bg-slate-400/80 rounded-sm" />
              <div className="h-1 w-5/6 bg-slate-400/80 rounded-sm" />
              <div className="h-1 w-full bg-slate-400/80 rounded-sm" />
              <div className="h-1 w-3/4 bg-slate-400/80 rounded-sm" />
            </div>
            <div className="mt-auto h-5 w-full border border-dashed border-cyan-600/50 rounded flex items-center justify-center bg-cyan-50/50">
              <span className="text-[6px] font-mono text-cyan-800">NASA 1997 MSL-1</span>
            </div>
          </div>
          <span className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            Research Paper
          </span>
        </motion.div>
      </div>

      {/* Ambient Freefall Status Bar */}
      <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>MICROGRAVITY LAB ENVIRONMENT</span>
        <span>
          STATUS: {isMicrogravity ? 'PURE DIFFUSION / NO BUOYANCY' : 'BUOYANT CONVECTION DOMINANT'}
        </span>
      </div>
    </div>
  );
};
