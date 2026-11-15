import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  DualAtmosphereDial,
  EmberStoryOverlay,
  useEmberStore,
} from '@/features/ember-zero';

describe('Task 3 - Ember Zero Atmospheric Dials & Story Overlay', () => {
  beforeEach(() => {
    useEmberStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DualAtmosphereDial Component', () => {
    it('renders both Breathing Dial (ppO2) and Fire Flammability Dial (O2 concentration)', () => {
      render(<DualAtmosphereDial />);
      expect(screen.getByTestId('dual-atmosphere-dial')).toBeInTheDocument();
      expect(screen.getByTestId('breathing-dial')).toBeInTheDocument();
      expect(screen.getByTestId('flammability-dial')).toBeInTheDocument();

      // Check breathing dial title / labels
      expect(screen.getByText(/áp suất riêng phần/i)).toBeInTheDocument();
      expect(screen.getByText(/ppO₂/i)).toBeInTheDocument();

      // Check flammability dial title / labels
      expect(screen.getByText(/chỉ số bắt lửa/i)).toBeInTheDocument();
      expect(screen.getAllByText(/nồng độ o₂/i).length).toBeGreaterThan(0);
    });

    it('at 21% O2 / 101.3 kPa (Earth preset), calculates ppO2 ~21.3 kPa (Normoxic, Green)', () => {
      render(<DualAtmosphereDial />);
      
      // Default or Earth preset: 21% O2 / 101.3 kPa => ppO2 ~ 21.3 kPa
      expect(screen.getByText(/21\.3/)).toBeInTheDocument();
      expect(screen.getByText(/Normoxic/i)).toBeInTheDocument();
      const breathingBadge = screen.getByTestId('breathing-status-badge');
      expect(breathingBadge.textContent).toMatch(/Normoxic|An toàn/i);

      // Flammability baseline
      const flammabilityIndex = screen.getByTestId('flammability-index');
      expect(flammabilityIndex.textContent).toMatch(/1\.0x/i);
    });

    it('at 34% O2 / 56 kPa (Lunar Habitat preset), ppO2 is ~19.0 kPa (Normoxic) while flammability is CRITICAL / HIGH FLAMMABILITY', () => {
      render(<DualAtmosphereDial />);

      // Switch to Lunar Habitat preset
      const lunarBtn = screen.getByRole('button', { name: /Habitat|Mặt Trăng|56\s*kPa/i });
      fireEvent.click(lunarBtn);

      // ppO2 = 56.0 * 0.34 = 19.04 kPa (~19.0 kPa)
      expect(screen.getByText(/19\.0/)).toBeInTheDocument();
      const breathingBadge = screen.getByTestId('breathing-status-badge');
      expect(breathingBadge.textContent).toMatch(/Normoxic/i);

      // Flammability index is flagged as CRITICAL / HIGH FLAMMABILITY (Amber/Red)
      const flammabilityBadge = screen.getByTestId('flammability-status-badge');
      expect(flammabilityBadge.textContent).toMatch(/CRITICAL|NGUY CƠ CAO|HIGH/i);
      expect(screen.getAllByText(/2\.4x/i).length).toBeGreaterThan(0);
    });

    it('renders the punchline quote: "Bạn thở vẫn thấy ổn. Ngọn lửa thì không."', () => {
      render(<DualAtmosphereDial />);
      expect(screen.getByText(/Bạn thở vẫn thấy ổn\. Ngọn lửa thì không\./i)).toBeInTheDocument();
    });

    it('has preset toggle buttons that update useEmberStore oxygenPct', () => {
      render(<DualAtmosphereDial />);
      expect(useEmberStore.getState().oxygenPct).toBe(21.0);

      const lunarBtn = screen.getByRole('button', { name: /Habitat|Mặt Trăng|56\s*kPa/i });
      fireEvent.click(lunarBtn);
      expect(useEmberStore.getState().oxygenPct).toBe(34.0);

      const earthBtn = screen.getByRole('button', { name: /Trái Đất|101/i });
      fireEvent.click(earthBtn);
      expect(useEmberStore.getState().oxygenPct).toBe(21.0);
    });

    it('supports interactive slider to adjust O2 percentage', () => {
      render(<DualAtmosphereDial />);
      const slider = screen.getByLabelText(/điều chỉnh nồng độ o₂/i);
      
      fireEvent.change(slider, { target: { value: '28' } });
      expect(useEmberStore.getState().oxygenPct).toBe(28);
    });
  });

  describe('EmberStoryOverlay Component', () => {
    it('renders with data-testid="ember-story-overlay" and editorial serif typography', () => {
      render(<EmberStoryOverlay />);
      const overlay = screen.getByTestId('ember-story-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('shows prologue text when scene is prologue or scene0-dark', () => {
      render(<EmberStoryOverlay scene="scene0-dark" />);
      expect(screen.getByText(/Trước khi có trọng lực/i)).toBeInTheDocument();
      expect(screen.getByText(/Chạm để đánh lửa/i)).toBeInTheDocument();
      expect(screen.getByText(/GRAVITY:\s*1\.00G/i)).toBeInTheDocument();
    });

    it('shows prologue text with simplified scene name "prologue"', () => {
      render(<EmberStoryOverlay scene="prologue" as any />);
      expect(screen.getByText(/Trước khi có trọng lực/i)).toBeInTheDocument();
      expect(screen.getByText(/Chạm để đánh lửa/i)).toBeInTheDocument();
    });

    it('shows 1.00g Earth flame text when scene is strike or scene1-weight', () => {
      render(<EmberStoryOverlay scene="scene1-weight" />);
      expect(screen.getByText(/Ngọn Lửa Trái Đất/i)).toBeInTheDocument();
      expect(screen.getByText(/ống khói đối lưu/i)).toBeInTheDocument();
      expect(screen.getAllByText(/1\.00g/i).length).toBeGreaterThan(0);
    });

    it('shows 0.00g freefall text ("Lực nổi biến mất", "khối cầu xanh") when scene is drop or scene2-drop', () => {
      render(<EmberStoryOverlay scene="scene2-drop" />);
      expect(screen.getAllByText(/Lực nổi biến mất/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/khối cầu xanh/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/BUOYANCY:\s*0\.00g/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/DIFFUSION-LIMITED/i).length).toBeGreaterThan(0);
    });

    it('shows atmospheric paradox punchline when scene is atmosphere or scene3-quiet/scene4-oxygen', () => {
      render(<EmberStoryOverlay scene="scene4-oxygen" />);
      expect(screen.getByText(/Bạn thở vẫn thấy ổn\. Ngọn lửa thì không\./i)).toBeInTheDocument();
      expect(screen.getAllByText(/DIFFUSION-LIMITED/i).length).toBeGreaterThan(0);
    });

    it('displays monospace telemetry metadata tags', () => {
      render(<EmberStoryOverlay scene="scene2-drop" />);
      const tags = screen.getAllByTestId('telemetry-tag');
      expect(tags.length).toBeGreaterThan(0);
      expect(screen.getAllByText(/BUOYANCY:\s*0\.00g/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/DIFFUSION-LIMITED/i).length).toBeGreaterThan(0);
    });

    it('reacts dynamically to useEmberStore activeScene when scene prop is omitted', async () => {
      render(<EmberStoryOverlay />);
      // Initial activeScene is 'scene0-dark'
      expect(screen.getByText(/Trước khi có trọng lực/i)).toBeInTheDocument();

      // Progress to drop (0.23 -> scene2-drop)
      await act(async () => {
        useEmberStore.getState().setProgress(0.23);
      });
      expect(screen.getAllByText(/Lực nổi biến mất/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/khối cầu xanh/i).length).toBeGreaterThan(0);

      // Progress to oxygen depletion / atmosphere paradox (0.45 -> scene4-oxygen)
      await act(async () => {
        useEmberStore.getState().setProgress(0.45);
      });
      expect(screen.getByText(/Bạn thở vẫn thấy ổn\. Ngọn lửa thì không\./i)).toBeInTheDocument();
    });
  });
});
