import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { DockPillButton } from '@/components/layout/DockPillButton';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('Sidebar Navigation Dock & Layout System', () => {
  it('renders Studio between Mission and Resources in the sticky dock', () => {
    const { container } = render(<Sidebar />);

    // Sticky dock container check
    const aside = container.querySelector('aside');
    expect(aside).toBeTruthy();
    expect(aside?.className).toContain('sticky');
    expect(aside?.className).toContain('self-start');
    expect(aside?.className).toContain('top-3');
    expect(aside?.className).toContain('ml-3.5');

    const links = Array.from(aside?.querySelectorAll('a') ?? []);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/dashboard',
      '/explorer',
      '/mission',
      '/predictive-lab',
      '/studio',
      '/resources',
    ]);

    expect(screen.getByLabelText(/Research Dashboard/i)).toBeTruthy();
    expect(screen.getByLabelText(/Experiment Explorer/i)).toBeTruthy();
    expect(screen.getByLabelText(/Mission Scenario/i)).toBeTruthy();
    expect(screen.getByLabelText(/Predictive Lab/i)).toBeTruthy();
    expect(screen.getByLabelText(/3D Flame Studio/i)).toBeTruthy();
    expect(screen.getByLabelText(/Official Resources/i)).toBeTruthy();

    // No settings
    expect(screen.queryByLabelText(/Settings/i)).toBeNull();
    expect(screen.queryByLabelText(/Cài đặt/i)).toBeNull();
    expect(screen.queryByTestId('nav-pill-settings')).toBeNull();
  });

  it('renders Studio in the same order in the mobile menu', () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByRole('button', { name: 'Open mobile navigation menu' }));

    const menu = within(screen.getByTestId('mobile-drawer-backdrop'));
    const routes = menu.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(routes).toEqual([
      '/dashboard',
      '/explorer',
      '/mission',
      '/predictive-lab',
      '/studio',
      '/resources',
      'https://psi.nasa.gov/',
    ]);
  });

  it('DockPillButton applies light glass inactive styling and electric lime active styling', () => {
    const { rerender } = render(
      <DockPillButton
        icon={<span>ICON</span>}
        label="Test Pill"
        isExpanded={true}
        active={false}
      />
    );

    const inactiveBtn = screen.getByRole('button', { name: 'Test Pill' });
    expect(inactiveBtn.className).toContain('bg-white/80');
    expect(inactiveBtn.className).toContain('shadow-[0_0_14px_rgba(0,0,0,0.08),0_0_3px_rgba(0,0,0,0.04)]');
    expect(inactiveBtn.className).toContain('text-zinc-700');
    expect(inactiveBtn.className).toContain('border-white/80');

    rerender(
      <DockPillButton
        icon={<span>ICON</span>}
        label="Test Pill"
        isExpanded={true}
        active={true}
      />
    );

    const activeBtn = screen.getByRole('button', { name: 'Test Pill' });
    expect(activeBtn.className).toContain('bg-[#D4FC02]');
    expect(activeBtn.className).toContain('border-4');
    expect(activeBtn.className).toContain('border-lime-200');
    expect(activeBtn.className).toContain('shadow-[0_0_18px_rgba(212,252,2,0.40)]');
    expect(activeBtn.className).toContain('text-zinc-950');
  });

  it('Header renders light theme background and Space Apps badge with navy background and lime text', () => {
    render(<Header />);

    const header = screen.getByTestId('app-header');
    expect(header.className).toContain('bg-white/80');
    expect(header.className).toContain('backdrop-blur-md');
    expect(header.className).toContain('border-b');
    expect(header.className).toContain('border-gray-100/80');
    expect(header.className).toContain('text-[#1A1A1A]');

    const badge = screen.getByText('NASA Space Apps 2026');
    expect(badge.className).toContain('bg-[#0B2374]');
    expect(badge.className).toContain('text-[#D4FC02]');
  });

  it('BottomNav renders light theme dock with 4 tabs and no settings', () => {
    render(<BottomNav />);

    const bottomNav = screen.getByTestId('bottom-nav');
    const innerContainer = bottomNav.querySelector('div');
    expect(innerContainer?.className).toContain('bg-white/90');
    expect(innerContainer?.className).toContain('border-gray-100');
    expect(innerContainer?.className).toContain('text-zinc-700');

    expect(screen.getByTestId('bottom-nav-dashboard')).toBeTruthy();
    expect(screen.getByTestId('bottom-nav-explorer')).toBeTruthy();
    expect(screen.getByTestId('bottom-nav-mission')).toBeTruthy();
    expect(screen.getByTestId('bottom-nav-resources')).toBeTruthy();
    expect(screen.queryByTestId('bottom-nav-settings')).toBeNull();
  });
});
