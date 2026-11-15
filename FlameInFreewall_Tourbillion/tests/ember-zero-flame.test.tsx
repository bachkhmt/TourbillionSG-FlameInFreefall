import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  InteractiveIgniter,
  ProceduralFlameCanvas,
  FloatingPropsLayer,
} from '@/features/ember-zero';
import { useEmberStore } from '@/features/ember-zero/store/useEmberStore';

describe('Act I - Ember Zero Flame Components', () => {
  beforeEach(() => {
    useEmberStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('InteractiveIgniter', () => {
    it('renders flint strike trigger and buttons', () => {
      render(<InteractiveIgniter />);
      expect(screen.getByTestId('interactive-igniter')).toBeInTheDocument();
      expect(screen.getByTestId('flint-wheel-btn')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /quẹt/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bỏ qua/i })).toBeInTheDocument();
    });

    it('displays ILLUSTRATIVE scientific disclaimer badge', () => {
      render(<InteractiveIgniter />);
      expect(screen.getByText(/ILLUSTRATIVE/i)).toBeInTheDocument();
    });

    it('clicking "Bỏ qua đánh lửa" immediately ignites the flame and calls onIgnite', () => {
      const onIgniteMock = vi.fn();
      render(<InteractiveIgniter onIgnite={onIgniteMock} />);
      expect(useEmberStore.getState().isIgnited).toBe(false);

      const skipBtn = screen.getByRole('button', { name: /bỏ qua/i });
      fireEvent.click(skipBtn);

      expect(useEmberStore.getState().isIgnited).toBe(true);
      expect(onIgniteMock).toHaveBeenCalledTimes(1);
    });

    it('clicking strike button 3 times ignites the flame', () => {
      const onIgniteMock = vi.fn();
      render(<InteractiveIgniter onIgnite={onIgniteMock} />);
      expect(useEmberStore.getState().isIgnited).toBe(false);

      const strikeBtn = screen.getByRole('button', { name: /quẹt/i });
      fireEvent.click(strikeBtn);
      expect(useEmberStore.getState().isIgnited).toBe(false);

      fireEvent.click(strikeBtn);
      expect(useEmberStore.getState().isIgnited).toBe(false);

      fireEvent.click(strikeBtn);
      expect(useEmberStore.getState().isIgnited).toBe(true);
      expect(onIgniteMock).toHaveBeenCalledTimes(1);
    });

    it('clicking tactile flint wheel button 3 times also ignites the flame', () => {
      render(<InteractiveIgniter />);
      expect(useEmberStore.getState().isIgnited).toBe(false);

      const wheelBtn = screen.getByTestId('flint-wheel-btn');
      fireEvent.click(wheelBtn);
      fireEvent.click(wheelBtn);
      fireEvent.click(wheelBtn);

      expect(useEmberStore.getState().isIgnited).toBe(true);
    });

    it('supports direct ignite button or shows ignited state when already ignited', () => {
      useEmberStore.getState().ignite();
      render(<InteractiveIgniter />);
      expect(useEmberStore.getState().isIgnited).toBe(true);
      expect(screen.getByTestId('interactive-igniter')).toBeInTheDocument();
      expect(screen.getByText(/FLAME IGNITED/i)).toBeInTheDocument();
    });

    it('supports keyboard space and enter press to strike', () => {
      render(<InteractiveIgniter />);
      const igniter = screen.getByTestId('interactive-igniter');
      
      fireEvent.keyDown(igniter, { key: ' ', code: 'Space' });
      fireEvent.keyDown(igniter, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(igniter, { key: ' ', code: 'Space' });

      expect(useEmberStore.getState().isIgnited).toBe(true);
    });
  });

  describe('FloatingPropsLayer', () => {
    it('renders with data-testid="floating-props-layer"', () => {
      render(<FloatingPropsLayer />);
      expect(screen.getByTestId('floating-props-layer')).toBeInTheDocument();
    });

    it('displays water droplet, pencil, matchbox, and paper props', () => {
      render(<FloatingPropsLayer />);
      expect(screen.getByTestId('prop-water-droplet')).toBeInTheDocument();
      expect(screen.getByTestId('prop-pencil')).toBeInTheDocument();
      expect(screen.getByTestId('prop-matchbox')).toBeInTheDocument();
      expect(screen.getByTestId('prop-paper')).toBeInTheDocument();
    });

    it('displays telemetry annotations for freefall drift and gravity status', () => {
      render(<FloatingPropsLayer />);
      expect(screen.getByText(/FREEFALL DRIFT/i)).toBeInTheDocument();
      expect(screen.getByText(/BUOYANCY\s*=\s*0/i)).toBeInTheDocument();
      expect(screen.getByText(/SURFACE TENSION DOMINANT/i)).toBeInTheDocument();
      expect(screen.getByTestId('telemetry-gravity')).toBeInTheDocument();
    });

    it('updates telemetry when gravity changes in store', () => {
      render(<FloatingPropsLayer />);
      act(() => {
        useEmberStore.getState().setProgress(0.31); // 0.00g
      });
      expect(screen.getByTestId('telemetry-gravity').textContent).toContain('0.00g');
      expect(screen.getByText(/Sphere/i)).toBeInTheDocument();
    });

    it('displays 1.00g normal teardrop state at progress 0', () => {
      render(<FloatingPropsLayer />);
      expect(screen.getByTestId('telemetry-gravity').textContent).toContain('1.00g');
      expect(screen.getByText(/Teardrop/i)).toBeInTheDocument();
    });
  });

  describe('ProceduralFlameCanvas', () => {
    it('renders <canvas data-testid="procedural-flame-canvas">', () => {
      render(<ProceduralFlameCanvas />);
      const canvas = screen.getByTestId('procedural-flame-canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName.toLowerCase()).toBe('canvas');
    });

    it('handles mounting, resizing, and unmounting gracefully in happy-dom', () => {
      const { unmount } = render(<ProceduralFlameCanvas />);
      
      // Simulate resize
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(screen.getByTestId('procedural-flame-canvas')).toBeInTheDocument();

      // Ensure unmount does not throw or leak animation frame
      expect(() => unmount()).not.toThrow();
    });

    it('renders with custom className or dimensions if provided', () => {
      render(<ProceduralFlameCanvas className="custom-flame-canvas" width={500} height={600} />);
      const canvas = screen.getByTestId('procedural-flame-canvas');
      expect(canvas.className).toContain('custom-flame-canvas');
    });

    it('renders safely when flame is ignited in store at microgravity and varying oxygen', () => {
      useEmberStore.getState().ignite();
      useEmberStore.getState().setProgress(0.4); // 0.00g microgravity
      useEmberStore.getState().setOxygenPct(35.0);

      const { unmount } = render(<ProceduralFlameCanvas />);
      expect(screen.getByTestId('procedural-flame-canvas')).toBeInTheDocument();
      expect(() => unmount()).not.toThrow();
    });
  });
});
