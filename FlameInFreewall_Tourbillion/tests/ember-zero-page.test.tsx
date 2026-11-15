import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  EarthImpactShowcase,
  MissionBriefCTA,
  DebugHUD,
  EmberZeroExperience,
  useEmberStore,
} from '@/features/ember-zero';

describe('Task 5 - Ember Zero Act III & Page Integration', () => {
  beforeEach(() => {
    useEmberStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('EarthImpactShowcase Component', () => {
    it('renders container with data-testid="earth-impact-showcase"', () => {
      render(<EarthImpactShowcase />);
      expect(screen.getByTestId('earth-impact-showcase')).toBeInTheDocument();
    });

    it('displays the 3 spinoff applications with verified details', () => {
      render(<EarthImpactShowcase />);
      const container = screen.getByTestId('earth-impact-showcase');

      // 1) Van phun sương dập lửa không rò rỉ (Zero-leak water mist valve)
      expect(container.textContent).toMatch(/van phun sương|zero-leak water mist/i);
      expect(container.textContent).toMatch(/tàu ngầm|data center|trung tâm dữ liệu/i);

      // 2) Cảm biến khói quang phổ sớm (Early optical smoke sensor)
      expect(container.textContent).toMatch(/cảm biến khói quang phổ|early optical smoke sensor/i);
      expect(container.textContent).toMatch(/hầm mỏ|mining|kho lưu trữ|storage/i);

      // 3) Thiết bị dưỡng khí thế hệ mới cho lính cứu hỏa (Next-gen firefighter breathing apparatus)
      expect(container.textContent).toMatch(/thiết bị dưỡng khí|lính cứu hỏa|breathing apparatus|firefighter/i);
    });

    it('mentions NASA heritage / di sản khoa học vũ trụ', () => {
      render(<EarthImpactShowcase />);
      const container = screen.getByTestId('earth-impact-showcase');
      expect(container.textContent).toMatch(/nasa|di sản khoa học vũ trụ|heritage|psi/i);
    });
  });

  describe('MissionBriefCTA Component', () => {
    it('renders container with data-testid="mission-brief-cta"', () => {
      render(<MissionBriefCTA />);
      expect(screen.getByTestId('mission-brief-cta')).toBeInTheDocument();
    });

    it('displays CTA buttons linking to /dashboard (or /mission) and /explorer', () => {
      render(<MissionBriefCTA />);
      
      const dashboardLink = screen.getByRole('link', { name: /trung tâm điều khiển|mission control|dashboard|mission/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink.getAttribute('href')).toMatch(/\/dashboard|\/mission/);

      const explorerLink = screen.getByRole('link', { name: /khám phá 20 nghiên cứu|20 studies|explorer/i });
      expect(explorerLink).toBeInTheDocument();
      expect(explorerLink.getAttribute('href')).toBe('/explorer');
    });

    it('provides 60-second guided tour button that toggles auto-tour state', () => {
      const onToggleTour = vi.fn();
      render(<MissionBriefCTA onToggleTour={onToggleTour} isAutoTourActive={false} />);

      const tourBtn = screen.getByRole('button', { name: /tour 60 giây|60-second|guided tour/i });
      expect(tourBtn).toBeInTheDocument();

      fireEvent.click(tourBtn);
      expect(onToggleTour).toHaveBeenCalledTimes(1);
    });

    it('clicking reset/re-ignite calls reset() on useEmberStore', () => {
      // Set some non-default store values
      useEmberStore.getState().setProgress(0.65);
      useEmberStore.getState().ignite();
      expect(useEmberStore.getState().progress).toBe(0.65);
      expect(useEmberStore.getState().isIgnited).toBe(true);

      render(<MissionBriefCTA />);
      const resetBtn = screen.getByRole('button', { name: /bật lại ngọn lửa|re-ignite|reset|thực hiện lại/i });
      expect(resetBtn).toBeInTheDocument();

      fireEvent.click(resetBtn);

      expect(useEmberStore.getState().progress).toBe(0);
      expect(useEmberStore.getState().isIgnited).toBe(false);
    });
  });

  describe('DebugHUD Component', () => {
    it('does not render or is hidden when isDebugOpen is false', () => {
      expect(useEmberStore.getState().isDebugOpen).toBe(false);
      render(<DebugHUD />);
      expect(screen.queryByTestId('debug-hud')).not.toBeInTheDocument();
    });

    it('renders and displays progress (%), gravity (g), oxygen (%), and activeScene when isDebugOpen is true', () => {
      act(() => {
        useEmberStore.getState().toggleDebug();
        useEmberStore.getState().setProgress(0.35);
        useEmberStore.getState().setOxygenPct(20.9);
      });
      expect(useEmberStore.getState().isDebugOpen).toBe(true);

      render(<DebugHUD />);
      const hud = screen.getByTestId('debug-hud');
      expect(hud).toBeInTheDocument();

      expect(hud.textContent).toMatch(/35(\.0)?%/); // progress 35%
      expect(hud.textContent).toMatch(/0(\.00)?g/); // microgravity at 0.35
      expect(hud.textContent).toMatch(/20\.9%/);    // oxygen
      expect(hud.textContent).toMatch(/scene3-quiet/i); // activeScene
    });

    it('stays off in production builds: no key listener, no panel', () => {
      vi.stubEnv('NODE_ENV', 'production');
      try {
        render(<DebugHUD />);
        fireEvent.keyDown(window, { key: 'd' });
        expect(useEmberStore.getState().isDebugOpen).toBe(false);
        act(() => useEmberStore.getState().toggleDebug());
        expect(screen.queryByTestId('debug-hud')).not.toBeInTheDocument();
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it('toggles debug HUD visibility on pressing keyboard "d"', () => {
      render(<DebugHUD />);
      expect(useEmberStore.getState().isDebugOpen).toBe(false);

      fireEvent.keyDown(window, { key: 'd' });
      expect(useEmberStore.getState().isDebugOpen).toBe(true);

      fireEvent.keyDown(window, { key: 'D' });
      expect(useEmberStore.getState().isDebugOpen).toBe(false);
    });
  });

  describe('EmberZeroExperience Component', () => {
    it('renders container with data-testid="ember-zero-experience"', () => {
      render(<EmberZeroExperience />);
      expect(screen.getByTestId('ember-zero-experience')).toBeInTheDocument();
    });

    it('renders header bar with FlameGuard AI × Ember Zero title', () => {
      render(<EmberZeroExperience />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header.textContent).toMatch(/FlameGuard\s*AI\s*[×x]\s*Ember\s*Zero/i);
    });

    it('renders audio ambient mute/unmute button that toggles useEmberStore.toggleMute()', () => {
      render(<EmberZeroExperience />);
      const initialMuted = useEmberStore.getState().isMuted;

      const audioBtn = screen.getByRole('button', { name: /âm thanh|audio|sound|mute|unmute/i });
      expect(audioBtn).toBeInTheDocument();

      fireEvent.click(audioBtn);
      expect(useEmberStore.getState().isMuted).toBe(!initialMuted);
    });

    it('renders Acts I, II, and III components', () => {
      render(<EmberZeroExperience />);
      // Act I
      expect(screen.getByTestId('interactive-igniter')).toBeInTheDocument();
      expect(screen.getByTestId('procedural-flame-canvas')).toBeInTheDocument();
      
      // Act II
      expect(screen.getByTestId('lab-lights-transition')).toBeInTheDocument();
      expect(screen.getByTestId('value-reveal-deck')).toBeInTheDocument();

      // Act III
      expect(screen.getByTestId('earth-impact-showcase')).toBeInTheDocument();
      expect(screen.getByTestId('mission-brief-cta')).toBeInTheDocument();
    });
  });
});
