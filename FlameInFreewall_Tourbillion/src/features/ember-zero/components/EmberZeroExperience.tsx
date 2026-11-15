import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Terminal, ArrowRight, Play, Pause } from 'lucide-react';
import { useEmberStore } from '../store/useEmberStore';

// Act I Components
import { InteractiveIgniter } from './act1-flame/InteractiveIgniter';
import { ProceduralFlameCanvas } from './act1-flame/ProceduralFlameCanvas';
import { FloatingPropsLayer } from './act1-flame/FloatingPropsLayer';
import { DualAtmosphereDial } from './act1-flame/DualAtmosphereDial';
import { EmberStoryOverlay } from './story/EmberStoryOverlay';

// Act II Components
import { LabLightsTransition } from './act2-machine/LabLightsTransition';
import { ValueRevealDeck } from './act2-machine/ValueRevealDeck';
import { InteractiveGapDemo } from './act2-machine/InteractiveGapDemo';
import { LockedPredictiveDemo } from './act2-machine/LockedPredictiveDemo';

// Act III Components
import { EarthImpactShowcase } from './act3-unknown/EarthImpactShowcase';
import { MissionBriefCTA } from './act3-unknown/MissionBriefCTA';
import { DebugHUD } from './DebugHUD';

export interface EmberZeroExperienceProps {
  className?: string;
}

export const EmberZeroExperience: React.FC<EmberZeroExperienceProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoTour, setIsAutoTour] = useState(false);
  const autoTourAnimRef = useRef<number | null>(null);

  const progress = useEmberStore((state) => state.progress);
  const isMuted = useEmberStore((state) => state.isMuted);
  const isDebugOpen = useEmberStore((state) => state.isDebugOpen);
  const setProgress = useEmberStore((state) => state.setProgress);
  const toggleMute = useEmberStore((state) => state.toggleMute);
  const toggleDebug = useEmberStore((state) => state.toggleDebug);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Web Audio Drone Synthesizer safely
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Low frequency drone oscillator (55Hz A1)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, ctx.currentTime);

      // Lowpass filter for deep space hum
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, ctx.currentTime);

      // Master ambient gain
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gainNodeRef.current = gain;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
    } catch {
      // Graceful fallback if Web Audio is unsupported or restricted
    }

    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Sync mute state with AudioContext Gain
  useEffect(() => {
    if (!audioCtxRef.current || !gainNodeRef.current) return;

    try {
      if (audioCtxRef.current.state === 'suspended' && !isMuted) {
        audioCtxRef.current.resume();
      }

      const targetGain = isMuted ? 0 : 0.05;
      gainNodeRef.current.gain.setTargetAtTime(
        targetGain,
        audioCtxRef.current.currentTime,
        0.1
      );
    } catch {
      // Audio operation error safe catch
    }
  }, [isMuted]);

  // Window Scroll Listener mapping window scroll to progress
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (isAutoTour) return; // Let auto-tour control progress if active

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            const currentScroll = window.scrollY;
            const ratio = Math.max(0, Math.min(1, currentScroll / totalHeight));
            useEmberStore.getState().setProgress(ratio);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isAutoTour]);

  // 60-Second Guided Tour loop
  const handleToggleAutoTour = useCallback(() => {
    setIsAutoTour((prev) => {
      const next = !prev;
      if (!next && autoTourAnimRef.current) {
        cancelAnimationFrame(autoTourAnimRef.current);
        autoTourAnimRef.current = null;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isAutoTour || typeof window === 'undefined') {
      if (autoTourAnimRef.current) {
        cancelAnimationFrame(autoTourAnimRef.current);
        autoTourAnimRef.current = null;
      }
      return;
    }

    const duration = 60000; // 60s
    let startTime: number | null = null;
    const initialProgress = useEmberStore.getState().progress;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const p = Math.min(1, initialProgress + (elapsed / duration) * (1 - initialProgress));

      useEmberStore.getState().setProgress(p);

      // Scroll window smoothly to match progress
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        window.scrollTo({
          top: p * totalHeight,
          behavior: 'auto',
        });
      }

      if (p < 1) {
        autoTourAnimRef.current = requestAnimationFrame(step);
      } else {
        setIsAutoTour(false);
      }
    };

    autoTourAnimRef.current = requestAnimationFrame(step);

    return () => {
      if (autoTourAnimRef.current) {
        cancelAnimationFrame(autoTourAnimRef.current);
      }
    };
  }, [isAutoTour]);

  return (
    <div
      ref={containerRef}
      id="ember-zero-experience"
      data-testid="ember-zero-experience"
      className={`relative w-full min-h-screen bg-[#07080B] text-[#F2EFE8] font-sans selection:bg-[#D4FC02] selection:text-zinc-950 overflow-x-hidden ${className}`}
    >
      {/* Fixed Header Bar */}
      <header
        role="banner"
        className="fixed top-0 left-0 right-0 z-40 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-white/10 bg-[#07080B]/80 backdrop-blur-md transition-colors"
      >
        {/* Brand & Project Identity */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D4FC02] animate-pulse" />
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white">
              FlameGuard AI
            </span>
            <span className="font-mono text-xs text-white/50">×</span>
            <span className="font-mono text-xs sm:text-sm font-semibold text-[#4CC9F0] tracking-wider uppercase">
              Ember Zero
            </span>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* 60s Tour Header Button */}
          <button
            type="button"
            onClick={handleToggleAutoTour}
            aria-label={isAutoTour ? 'Dừng tour tự động 60s' : 'Khởi động tour 60s'}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold tracking-wider transition-colors cursor-pointer ${
              isAutoTour
                ? 'bg-[#D4FC02] text-[#07080B]'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {isAutoTour ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoTour ? 'Dừng Tour' : 'Tour 60s'}</span>
          </button>

          {/* Audio Ambient Toggle Button */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Bật âm thanh môi trường' : 'Tắt âm thanh môi trường'}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white/60" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#D4FC02]" />
            )}
          </button>

          {/* Debug HUD Toggle */}
          <button
            type="button"
            onClick={toggleDebug}
            aria-label="Bật Debug HUD (Phím D)"
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDebugOpen
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-white/5 hover:bg-white/15 text-white/70 border-white/10'
            }`}
          >
            <Terminal className="w-4 h-4" />
          </button>

          {/* Fast Link to Mission Control */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0B2374] hover:bg-[#0B2374]/80 text-[#D4FC02] font-mono text-xs font-bold uppercase tracking-wider transition-colors border border-[#0B2374]"
          >
            <span className="hidden md:inline">Mission Control</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ACT I: CINEMATIC DARK FLAME EXPERIENCE (Progress ~0.00 to 0.52) */}
      <section
        id="act-1-flame-realm"
        className="relative w-full min-h-[140vh] pt-20 flex flex-col items-center justify-start overflow-hidden"
      >
        {/* Background Procedural Flame Simulation Canvas */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <ProceduralFlameCanvas />
        </div>

        {/* Floating Props Layer during Freefall Drop */}
        <FloatingPropsLayer />

        {/* Interactive Igniter Flint Strike Trigger */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 mt-6">
          <InteractiveIgniter />
        </div>

        {/* Dual Atmosphere Oxygen & Pressure Dials */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 mt-10">
          <DualAtmosphereDial />
        </div>

        {/* Editorial Story Typography Overlay */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 mt-12 mb-20">
          <EmberStoryOverlay />
        </div>
      </section>

      {/* ACT II: LAB LIGHTS TRANSITION & VALUE REVEAL DECK (Progress ~0.52 to 0.73) */}
      <section id="act-2-machine-realm" className="relative z-20 w-full">
        {/* Bật Đèn Phòng Thí Nghiệm — Cinematic Theme Dissolve into StructPaper */}
        <LabLightsTransition />

        {/* 6 Value Beats Reveal Deck */}
        <ValueRevealDeck />

        {/* Interactive Gap Matrix Demo */}
        <div className="w-full bg-[#F8F9FA] py-12 px-4 sm:px-6 lg:px-8 border-t border-[#0B2374]/10">
          <div className="max-w-7xl mx-auto">
            <InteractiveGapDemo />
          </div>
        </div>

        {/* Locked Predictive Safety Guard Demo */}
        <div className="w-full bg-[#F8F9FA] pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <LockedPredictiveDemo />
          </div>
        </div>
      </section>

      {/* ACT III: EARTH IMPACT SHOWCASE & MISSION BRIEF CTA (Progress ~0.73 to 1.00) */}
      <section id="act-3-call-realm" className="relative z-30 w-full">
        {/* Spinoff Applications from Space to Earth */}
        <EarthImpactShowcase />

        {/* Launch Mission Brief CTA */}
        <MissionBriefCTA
          onToggleTour={handleToggleAutoTour}
          isAutoTourActive={isAutoTour}
        />
      </section>

      {/* Floating Debug HUD Telemetry Panel */}
      <DebugHUD />
    </div>
  );
};
