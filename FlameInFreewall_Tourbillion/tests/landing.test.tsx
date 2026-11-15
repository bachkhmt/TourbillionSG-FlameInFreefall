import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  LandingHero,
  KurzgesagtFlameScene,
  AtmosphericPhysics,
  CoreIntelligenceSection,
  MissionControlCTA,
  LandingFooter,
} from '@/features/landing';
import LandingPage from '../src/app/(landing)/page';

// Mock next/navigation if needed
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('Kurzgesagt Art Style Landing Page (/)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LandingHero Component', () => {
    it('renders the Royal Navy space navigation bar with brand logo and links', () => {
      render(<LandingHero />);
      const navbar = screen.getByTestId('landing-navbar');
      expect(navbar).toBeDefined();
      expect(navbar.className).toContain('bg-[#0B2374]');
      expect(screen.getByText('Tourbillion')).toBeDefined();
      expect(screen.getByText('SG')).toBeDefined();
      expect(screen.getByText('Flame Physics')).toBeDefined();
      expect(screen.getByText('Lunar Flammability Paradox')).toBeDefined();
    });

    it('renders all 3 primary workspace action buttons with correct href targets', () => {
      render(<LandingHero />);
      const workspaceLink = screen.getByRole('link', { name: /Enter Research Workspace/i });
      expect(workspaceLink.getAttribute('href')).toBe('/dashboard');

      const explorerLink = screen.getByRole('link', { name: /Explore 24 PSI Studies/i });
      expect(explorerLink.getAttribute('href')).toBe('/explorer');

      const scenarioLink = screen.getByRole('link', { name: /Run Scenario Simulation/i });
      expect(scenarioLink.getAttribute('href')).toBe('/mission');
    });

    it('displays the 4 key telemetry overview badges', () => {
      render(<LandingHero />);
      expect(screen.getByText('24 Studies')).toBeDefined();
      expect(screen.getByText('1,926 Runs')).toBeDefined();
      expect(screen.getByText('0g vs 1g')).toBeDefined();
      expect(screen.getByText('0 < g < 1')).toBeDefined();
    });
  });

  describe('KurzgesagtFlameScene Component', () => {
    it('renders side-by-side Earth 1g vs ISS 0g comparison chambers by default', () => {
      render(<KurzgesagtFlameScene />);
      expect(screen.getByTestId('side-by-side-grid')).toBeDefined();
      expect(screen.getByText(/Earth 1.00g Terrestrial Flame/i)).toBeDefined();
      expect(screen.getByText(/ISS 0.00g Microgravity Flame/i)).toBeDefined();
      expect(screen.getByText(/Spherical Diffusion/i)).toBeDefined();
      expect(screen.getByText(/Buoyant Plume/i)).toBeDefined();
    });

    it('displays physical combustion metrics for both Earth and ISS flame chambers', () => {
      render(<KurzgesagtFlameScene />);
      expect(screen.getByText('0.25 (Teardrop)')).toBeDefined();
      expect(screen.getByText('0.98 (Spherical)')).toBeDefined();
      expect(screen.getByText('~1,760 K')).toBeDefined();
      expect(screen.getByText('~1,420 K')).toBeDefined();
      expect(screen.getByText('~10.0 Hz')).toBeDefined();
      expect(screen.getByText('0.4 Hz (Steady)')).toBeDefined();
    });

    it('renders the NASA PSI physics discovery takeaway callout card', () => {
      render(<KurzgesagtFlameScene />);
      expect(
        screen.getByText(/Why ISS Flames Burn Longer & Cooler/i)
      ).toBeDefined();
    });
  });

  describe('AtmosphericPhysics Component', () => {
    it('renders the Lunar Flammability Paradox section', () => {
      render(<AtmosphericPhysics />);
      expect(screen.getByTestId('atmospheric-physics')).toBeDefined();
      expect(screen.getByRole('heading', { name: /The Moon Base Trap/i })).toBeDefined();
    });

    it('calculates equal breathing partial pressure (3.06 psia) for Artemis Moon Base by default', () => {
      render(<AtmosphericPhysics />);
      expect(screen.getByText('3.06 psia')).toBeDefined();
      expect(screen.getByText('7.14 psia')).toBeDefined();
      expect(screen.getByText('Extreme Flammability Risk')).toBeDefined();
      expect(screen.getByText(/2.3x Spread Rate/i)).toBeDefined();
    });

    it('switches atmospheric presets to Earth Sea-Level baseline', () => {
      render(<AtmosphericPhysics />);
      const earthTab = screen.getByTestId('atmo-tab-earth');
      fireEvent.click(earthTab);

      // Earth has 3.09 psia ppO2, 1.0x spread multiplier, Nominal risk
      expect(screen.getByText('3.09 psia')).toBeDefined();
      expect(screen.getByText('11.61 psia')).toBeDefined();
      expect(screen.getByText('Nominal')).toBeDefined();
      expect(screen.getByText(/1.0x Spread Rate/i)).toBeDefined();
    });

    it('switches to EVA Spacesuit garment condition with extreme flammability', () => {
      render(<AtmosphericPhysics />);
      const evaTab = screen.getByTestId('atmo-tab-eva');
      fireEvent.click(evaTab);

      expect(screen.getByText('2.45 psia')).toBeDefined();
      expect(screen.getByText(/2.8x Spread Rate/i)).toBeDefined();
    });
  });

  describe('MissionControlCTA Component', () => {
    it('renders all three mission pillar cards linking to workspace routes', () => {
      render(<MissionControlCTA />);
      expect(screen.getByTestId('card-dashboard')).toBeDefined();
      expect(screen.getByTestId('card-explorer')).toBeDefined();
      expect(screen.getByTestId('card-mission')).toBeDefined();

      const dashboardBtn = screen.getByTestId('cta-btn-dashboard');
      expect(dashboardBtn.getAttribute('href')).toBe('/dashboard');

      const explorerBtn = screen.getByTestId('cta-btn-explorer');
      expect(explorerBtn.getAttribute('href')).toBe('/explorer');

      const missionBtn = screen.getByTestId('cta-btn-mission');
      expect(missionBtn.getAttribute('href')).toBe('/mission');
    });
  });

  describe('LandingFooter Component', () => {
    it('renders NASA Space Apps 2026 credits and official PSI links', () => {
      render(<LandingFooter />);
      expect(screen.getByTestId('landing-footer')).toBeDefined();
      expect(
        screen.getByText(/NASA Space Apps Challenge 2026: Flame in Freefall/i)
      ).toBeDefined();
      expect(screen.getByText('NASA PSI Repository')).toBeDefined();
      expect(screen.getByText('Space Apps Challenge 2026')).toBeDefined();
    });

    it('explains research scope without promoting prediction or safety certification', () => {
      render(<LandingFooter />);
      const disclaimer = screen.getByTestId('safety-disclaimer');
      expect(disclaimer).toBeDefined();
      expect(
        screen.getByText(/Research scope & limitations/i)
      ).toBeDefined();
      expect(
        screen.getByText(/Research relevance is not a fire-risk probability/i)
      ).toBeDefined();
    });
  });

  describe('CoreIntelligenceSection Component', () => {
    it('renders all 3 core innovation cards beyond raw NASA data', () => {
      render(<CoreIntelligenceSection />);
      expect(screen.getByTestId('core-intelligence-section')).toBeDefined();
      expect(screen.getByTestId('contribution-card-harmonization')).toBeDefined();
      expect(screen.getByTestId('contribution-card-gap-matrix')).toBeDefined();
      expect(screen.getByTestId('contribution-card-guarded-physics')).toBeDefined();
      expect(screen.getByText(/Cross-Study Data Harmonization/i)).toBeDefined();
      expect(screen.getByText(/Evidence Gap Matrix Engine/i)).toBeDefined();
      expect(screen.getByText(/Guarded Predictive Physics/i)).toBeDefined();
    });

    it('displays the synchronized 24 studies and 1,926 empirical runs telemetry', () => {
      render(<CoreIntelligenceSection />);
      expect(screen.getByText('24 Studies / 1,926 Empirical Runs')).toBeDefined();
      expect(screen.getByText('6-D Deterministic Gap Matrix')).toBeDefined();
      expect(screen.getByText(/Moon \(0\.16g\) & Mars \(0\.38g\) CRITICAL GAPS/i)).toBeDefined();
    });
  });

  describe('Full Landing Page Integration', () => {
    it('assembles all sections smoothly within the main landing route', () => {
      render(<LandingPage />);
      expect(screen.getByTestId('landing-hero')).toBeDefined();
      expect(screen.getByTestId('kurzgesagt-flame-scene')).toBeDefined();
      expect(screen.getByTestId('atmospheric-physics')).toBeDefined();
      expect(screen.getByTestId('core-intelligence-section')).toBeDefined();
      expect(screen.getByTestId('mission-control-cta')).toBeDefined();
      expect(screen.getByTestId('landing-footer')).toBeDefined();
    });
  });
});
