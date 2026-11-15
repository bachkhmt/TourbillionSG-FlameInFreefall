import React, { act } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ScenarioConfigForm,
} from '@/features/mission';
import MissionPage from '../src/app/(dashboard)/mission/page';
import { useWorkspaceStore, DEFAULT_SCENARIO } from '../src/store/useWorkspaceStore';
import { toastStore } from '../src/components/toast/toast-store';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

expect.extend({
  toBeInTheDocument(received) {
    const pass = Boolean(received);
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to be in document`,
    };
  },
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/mission',
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

describe('Mission Scenario & Evidence Gap Matrix (/mission)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().resetWorkspace();
    toastStore.clear();
    mockSearchParams = new URLSearchParams();
  });

  describe('ScenarioConfigForm Component', () => {
    it('renders planetary presets and interactive configuration controls', () => {
      render(<ScenarioConfigForm />);

      expect(screen.getByTestId('scenario-config-form')).toBeDefined();
      expect(screen.getByTestId('preset-iss-baseline')).toBeDefined();
      expect(screen.getByTestId('preset-artemis-lunar-base')).toBeDefined();
      expect(screen.getByTestId('preset-mars-surface-habitat')).toBeDefined();
      expect(screen.getByTestId('preset-custom-sandbox')).toBeDefined();

      expect(screen.getByTestId('slider-gravity')).toBeDefined();
      expect(screen.getByTestId('slider-oxygen')).toBeDefined();
      expect(screen.getByTestId('slider-pressure')).toBeDefined();
      expect(screen.getByTestId('select-material')).toBeDefined();
      expect(screen.getByTestId('slider-airflow')).toBeDefined();
    });

    it('calculates and displays live Oxygen Partial Pressure (ppO2) telemetry badge', () => {
      // Default: 14.7 psia * 21% = 3.087 psia -> 3.09 psia
      render(<ScenarioConfigForm />);

      const ppo2Badge = screen.getByTestId('badge-ppo2');
      expect(ppo2Badge).toBeDefined();
      expect(ppo2Badge.textContent).toContain('ppO₂: 3.09 psia');
      expect(ppo2Badge.textContent).toContain('Derived value; not a safety rating');
    });

    it('updates ppO2 telemetry when pressure and oxygen sliders change', () => {
      render(<ScenarioConfigForm />);

      const oxygenSlider = screen.getByTestId('slider-oxygen');
      const pressureSlider = screen.getByTestId('slider-pressure');

      // Set 30% O2 and 10.2 psia (Artemis atmosphere: 10.2 * 0.30 = 3.06 psia)
      act(() => {
        fireEvent.change(oxygenSlider, { target: { value: '30' } });
        fireEvent.change(pressureSlider, { target: { value: '10.2' } });
      });

      const ppo2Badge = screen.getByTestId('badge-ppo2');
      expect(ppo2Badge.textContent).toContain('ppO₂: 3.06 psia');
    });

    it('switches scenario parameters when a planetary preset is selected', () => {
      render(<ScenarioConfigForm />);

      const artemisBtn = screen.getByTestId('preset-artemis-lunar-base');
      act(() => {
        fireEvent.click(artemisBtn);
      });

      const active = useWorkspaceStore.getState().activeScenario;
      expect(active.id).toBe('artemis-lunar-base');
      expect(active.gravity).toBe(0.16);
      expect(active.oxygenPct).toBe(30.0);
      expect(active.pressurePsi).toBe(10.2);

      const marsBtn = screen.getByTestId('preset-mars-surface-habitat');
      act(() => {
        fireEvent.click(marsBtn);
      });

      const activeMars = useWorkspaceStore.getState().activeScenario;
      expect(activeMars.id).toBe('mars-surface-habitat');
      expect(activeMars.gravity).toBe(0.38);
      expect(activeMars.material).toBe('Nomex');
    });

    it('updates material selection via dropdown', () => {
      render(<ScenarioConfigForm />);

      const materialSelect = screen.getByTestId('select-material') as HTMLSelectElement;
      act(() => {
        fireEvent.change(materialSelect, { target: { value: 'Nomex' } });
      });

      expect(useWorkspaceStore.getState().activeScenario.material).toBe('Nomex');
    });

    it('updates gravity and airflow sliders', () => {
      render(<ScenarioConfigForm />);

      const gravitySlider = screen.getByTestId('slider-gravity');
      act(() => {
        fireEvent.change(gravitySlider, { target: { value: '0.16' } });
      });
      expect(useWorkspaceStore.getState().activeScenario.gravity).toBe(0.16);

      const airflowSlider = screen.getByTestId('slider-airflow');
      act(() => {
        fireEvent.change(airflowSlider, { target: { value: '12.5' } });
      });
      expect(useWorkspaceStore.getState().activeScenario.airflowVelocity).toBe(12.5);
    });
  });

  describe('MissionPage evidence-only workspace', () => {
    it('renders configuration, condition gaps and related investigations', () => {
      render(<MissionPage />);
      expect(screen.getByTestId('scenario-config-form')).toBeDefined();
      expect(screen.getByRole('region', {name: 'Mission API evidence'})).toBeDefined();
      expect(screen.queryByTestId('ranked-evidence-list')).toBeNull();
      expect(screen.queryByTestId('mission-view-switcher')).toBeNull();
      expect(screen.queryByText(/MODEL ONLINE/)).toBeNull();
    });

    it('keeps legacy prediction URLs on evidence without loading a predictive panel', () => {
      mockSearchParams = new URLSearchParams('view=prediction');
      render(<MissionPage />);
      expect(screen.getByTestId('evidence-view-container')).toBeDefined();
      expect(screen.queryByTestId('predictive-lab-panel')).toBeNull();
      expect(screen.queryByTestId('view-tab-prediction')).toBeNull();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('keeps the selected habitat scenario in the evidence workspace', () => {
      render(<MissionPage />);
      fireEvent.click(screen.getByTestId('preset-artemis-lunar-base'));
      expect(useWorkspaceStore.getState().activeScenario.gravity).toBe(0.16);
      expect(screen.getByText(/a microgravity regime is not measured 0g/)).toBeDefined();
      expect(screen.queryByTestId('ranked-evidence-list')).toBeNull();
    });
  });

  describe('Mission Scenario Light Theme', () => {
    it('renders scenario configuration and gap matrix with light white cards and badges', () => {
      render(<MissionPage />);
      expect(screen.getAllByText(/Mission Scenario/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', {name: 'Analyze evidence'})).toBeDefined();
      expect(screen.getByTestId('mission-workbench')).toBeInTheDocument();
      expect(screen.getByTestId('scenario-config-form')).toBeInTheDocument();
      expect(screen.queryByTestId('condition-gap-matrix')).toBeNull();
      expect(screen.queryByTestId('ranked-evidence-list')).toBeNull();

      const indicator = screen.getByTestId('end-of-list-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator.textContent).toContain('You have reached the end of the mission scenario evidence list');
    });
  });
});
