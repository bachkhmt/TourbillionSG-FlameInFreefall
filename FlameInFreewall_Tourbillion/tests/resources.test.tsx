import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResourcesPage from '@/app/(dashboard)/resources/page';
import { renderWithQuery } from './test-utils';
import { getMockOfficialResources } from '@/api/mockFallback';

vi.mock('@/api/services/resourceService', () => ({
  getOfficialResources: vi.fn(),
}));

import * as resourceService from '@/api/services/resourceService';

describe('Official Resources Page (/resources)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resourceService.getOfficialResources).mockResolvedValue(getMockOfficialResources());
  });

  it('renders official resources header, search input, and categories', () => {
    renderWithQuery(<ResourcesPage />);

    expect(screen.getByText('Official Challenge Resources')).toBeDefined();
    expect(screen.getByTestId('resource-search-input')).toBeDefined();

    // Check category tabs
    expect(screen.getByTestId('category-tab-all')).toBeDefined();
    expect(screen.getByTestId('category-tab-data_repository')).toBeDefined();
    expect(screen.getByTestId('category-tab-case_study')).toBeDefined();
    expect(screen.getByTestId('category-tab-earth_application')).toBeDefined();
  });

  it('renders all default official resources cards in the grid', async () => {
    renderWithQuery(<ResourcesPage />);

    const grid = await screen.findByTestId('resources-grid');
    expect(grid).toBeDefined();

    // Check presence of key NASA challenge resources
    expect(await screen.findByText('PSI Data Repository: Combustion Science')).toBeDefined();
    expect(screen.getByText('Apollo 1')).toBeDefined();
    expect(screen.getByText('Apollo 13')).toBeDefined();
    expect(screen.getByText('25 Years Ago: Fire Aboard Space Station Mir')).toBeDefined();
    expect(screen.getByText("Fireman's Air Tanks")).toBeDefined();
  });

  it('filters resources dynamically by search query', async () => {
    renderWithQuery(<ResourcesPage />);

    await screen.findByTestId('resources-grid');
    const searchInput = screen.getByTestId('resource-search-input');
    fireEvent.change(searchInput, { target: { value: 'Apollo' } });

    // Should match Apollo 1 and Apollo 13
    expect(await screen.findByText('Apollo 1')).toBeDefined();
    expect(screen.getByText('Apollo 13')).toBeDefined();
    // Should NOT match Mir fire or Fireman's tanks
    expect(screen.queryByText('25 Years Ago: Fire Aboard Space Station Mir')).toBeNull();
    expect(screen.queryByText("Fireman's Air Tanks")).toBeNull();
  });

  it('filters resources by category tab', async () => {
    renderWithQuery(<ResourcesPage />);

    await screen.findByTestId('resources-grid');
    const caseStudyTab = screen.getByTestId('category-tab-case_study');
    fireEvent.click(caseStudyTab);

    // Should display case studies
    expect(await screen.findByText('Apollo 1')).toBeDefined();
    expect(screen.getByText('Apollo 13')).toBeDefined();
    expect(screen.getByText('25 Years Ago: Fire Aboard Space Station Mir')).toBeDefined();
    // Should NOT display data repository
    expect(screen.queryByText('PSI Data Repository: Combustion Science')).toBeNull();
  });

  it('shows empty state when no resources match the query and resets cleanly', async () => {
    renderWithQuery(<ResourcesPage />);

    await screen.findByTestId('resources-grid');
    const searchInput = screen.getByTestId('resource-search-input');
    fireEvent.change(searchInput, { target: { value: 'non-existent-xyz-query' } });

    expect(await screen.findByTestId('resources-empty-state')).toBeDefined();
    expect(screen.getByText('No resources matched your filter')).toBeDefined();

    // Click Clear Filters button
    const clearBtn = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearBtn);

    expect(await screen.findByText('PSI Data Repository: Combustion Science')).toBeDefined();
  });
});
