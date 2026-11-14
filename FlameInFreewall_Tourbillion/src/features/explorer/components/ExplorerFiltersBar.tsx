'use client';

import React from 'react';
import {
  Search,
  LayoutGrid,
  List,
  RotateCcw,
  X,
  SlidersHorizontal,
  FlaskConical,
} from 'lucide-react';
import type { CatalogSortDto } from '@/api/dto';
import type { MappedCatalogCapabilities } from '@/types/api';
import { CustomSelect, type CustomSelectOption } from '@/components/ui/CustomSelect';

export type PlatformFilterValue = 'all' | 'CIR' | 'MSG' | 'Cygnus' | 'Drop Tower';
export type GravityFilterValue = 'all' | '0g' | 'partial' | '1g';
export type ExplorerSortOption = CatalogSortDto;
export type ViewMode = 'grid' | 'table';

export interface ExplorerFiltersBarProps {
  className?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  platformFilter: PlatformFilterValue;
  onPlatformFilterChange: (platform: PlatformFilterValue) => void;
  materialFilter: string;
  onMaterialFilterChange: (material: string) => void;
  gravityFilter: GravityFilterValue;
  onGravityFilterChange: (g: GravityFilterValue) => void;
  sortBy: ExplorerSortOption;
  onSortChange: (s: ExplorerSortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
  capabilities?: MappedCatalogCapabilities;
}

const PLATFORM_OPTIONS: CustomSelectOption<PlatformFilterValue>[] = [
  { value: 'all', label: 'All Platforms' },
  { value: 'CIR', label: 'CIR (Combustion Rack)' },
  { value: 'MSG', label: 'MSG (Glovebox)' },
  { value: 'Cygnus', label: 'Cygnus (Saffire)' },
  { value: 'Drop Tower', label: 'Drop Tower' },
];

const GRAVITY_OPTIONS: CustomSelectOption<GravityFilterValue>[] = [
  { value: 'all', label: 'All Gravity Regimes' },
  { value: '0g', label: 'Microgravity (0g)' },
  { value: 'partial', label: 'Partial Gravity' },
  { value: '1g', label: 'Terrestrial (1g)' },
];

const SORT_OPTIONS: CustomSelectOption<ExplorerSortOption>[] = [
  { value: 'title-asc', label: 'Sort: Title (A–Z)' },
  { value: 'runs-desc', label: 'Sort: Most Test Runs' },
];

export const ExplorerFiltersBar: React.FC<ExplorerFiltersBarProps> = ({
  className = 'sticky top-0 z-30 space-y-3',
  searchQuery,
  onSearchChange,
  platformFilter,
  onPlatformFilterChange,
  materialFilter,
  onMaterialFilterChange,
  gravityFilter,
  onGravityFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
  onResetFilters,
  capabilities,
}) => {
  const isFiltered =
    searchQuery.trim().length > 0 ||
    platformFilter !== 'all' ||
    materialFilter.trim().length > 0 ||
    gravityFilter !== 'all' ||
    sortBy !== 'title-asc';

  return (
    <div data-testid="explorer-filters-bar" className={className}>
      {/* Row 1: Search Box, Summary Pill, Reset, View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-xl relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3 z-10 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 group-hover:text-zinc-600 group-focus-within:text-[#0B2374] transition-colors" />
            <div className="w-px h-5 bg-gray-200 group-hover:bg-zinc-300 transition-colors" />
          </div>

          <input
            type="text"
            role="searchbox"
            data-testid="explorer-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search investigations by PSI ID, title, or research purpose..."
            style={{ boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.09)' }}
            className="w-full bg-slate-50/90 border-2 border-white focus:border-[#D4FC02]/40 rounded-3xl py-3.5 sm:py-4 pl-14 pr-12 text-sm sm:text-base font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#D4FC02]/10 transition-all shadow-eatzy-inner hover:shadow-eatzy-inner-hover"
          />

          {searchQuery && (
            <button
              type="button"
              data-testid="clear-search-btn"
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center transition-all group/close cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4 text-zinc-600 group-hover/close:rotate-90 transition-transform duration-200" />
            </button>
          )}
        </div>

        {/* View Mode & Reset Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-gray-200/70 text-xs font-bold text-zinc-700 shadow-2xs">
            <span className="text-[#0B2374] font-extrabold">{filteredCount}</span>
            <span className="text-zinc-400">/</span>
            <span>{totalCount} Studies</span>
          </div>

          {isFiltered && (
            <button
              type="button"
              data-testid="reset-filters-btn"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <div className="inline-flex items-center p-1 rounded-2xl bg-white border border-gray-200/70 shadow-2xs">
            <button
              type="button"
              data-testid="view-grid-btn"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-zinc-900 text-white font-bold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-testid="view-table-btn"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-zinc-900 text-white font-bold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Filters Strip (Material, Platform, Gravity) & Sort */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline-block mr-0.5">
            Filters:
          </span>

          {/* Material Filter Pill Input */}
          <div className="relative w-full sm:w-56 group">
            <FlaskConical className="w-3.5 h-3.5 text-zinc-400 group-focus-within:text-[#0B2374] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
            <input
              type="text"
              data-testid="material-filter-input"
              value={materialFilter}
              onChange={(e) => onMaterialFilterChange(e.target.value)}
              placeholder="Material (e.g. PMMA)..."
              aria-label="Filter by Material"
              className="w-full rounded-2xl bg-white border border-gray-200/80 hover:border-gray-300 focus:border-[#0B2374] pl-8.5 pr-7 py-2 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#D4FC02]/30 shadow-2xs transition-all"
            />
            {materialFilter && (
              <button
                type="button"
                onClick={() => onMaterialFilterChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-600 transition-colors cursor-pointer"
                title="Clear material filter"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          <div className="w-44">
            <CustomSelect
              options={PLATFORM_OPTIONS}
              value={platformFilter}
              onChange={onPlatformFilterChange}
              testId="platform-filter-select"
              ariaLabel="Filter by Platform"
              leadingIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />}
            />
          </div>

          <div className="w-44">
            <CustomSelect
              options={GRAVITY_OPTIONS}
              value={gravityFilter}
              onChange={onGravityFilterChange}
              testId="gravity-filter-select"
              ariaLabel="Filter by Gravity Regime"
              leadingIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          {capabilities && (
            <span
              data-testid="catalog-capabilities-hint"
              className="hidden xl:inline-flex text-[11px] font-medium text-zinc-500 px-2.5 py-1 rounded-full bg-white/80 border border-gray-200/60"
            >
              Filters: {capabilities.supportedFilters.join(', ')} · Max {capabilities.maxPageSize}/page
            </span>
          )}

          <div className="w-52">
            <CustomSelect
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={onSortChange}
              testId="sort-by-select"
              ariaLabel="Sort Studies"
              leadingIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
