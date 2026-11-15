'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  RotateCcw,
  X,
  Flame,
  Database,
  ShieldAlert,
  Film,
  Sparkles,
} from 'lucide-react';
import {
  ResourceCard,
  ResourcesShimmer,
  useOfficialResourcesQuery,
} from '@/features/resources';

type CategoryFilter = 'all' | 'data_repository' | 'case_study' | 'earth_application' | 'background' | 'video';

const CATEGORY_TABS: Array<{ id: CategoryFilter; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'all', label: 'All Resources', icon: BookOpen },
  { id: 'data_repository', label: 'Data Repositories', icon: Database },
  { id: 'case_study', label: 'Mission Case Studies', icon: ShieldAlert },
  { id: 'earth_application', label: 'Earth Applications', icon: Flame },
  { id: 'background', label: 'Science Context', icon: Sparkles },
  { id: 'video', label: 'Videos', icon: Film },
];

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const { data, isLoading, isError, error, refetch, isFetching } = useOfficialResourcesQuery();

  const allItems = useMemo(() => data?.items ?? [], [data]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.kind !== selectedCategory) {
        return false;
      }
      // Text search
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.title.toLowerCase().includes(q);
        const roleMatch = (item.role || '').toLowerCase().includes(q);
        const kindMatch = (item.kind || '').toLowerCase().includes(q);
        const licenseMatch = (item.license || '').toLowerCase().includes(q);
        if (!titleMatch && !roleMatch && !kindMatch && !licenseMatch) {
          return false;
        }
      }
      return true;
    });
  }, [allItems, selectedCategory, searchQuery]);

  const isFiltered = searchQuery.trim().length > 0 || selectedCategory !== 'all';

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <motion.div
      data-testid="research-resources"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 py-2 pb-24"
    >
      {/* Top Header - Single clean line matching Explorer / other pages */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 pb-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#0B2374]" strokeWidth={2.5} />
          <span>Official Challenge Resources</span>
        </h1>
      </div>

      {/* Sticky Search & Category Filter Bar matching Explorer */}
      <div className="sticky top-0 z-30 -mx-3 px-3 sm:-mx-6 sm:px-6 py-3 pb-5 transition-all duration-300">
        <div className="absolute inset-0 bg-[#F8F9FA]/50 backdrop-blur-sm pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,black_85%,transparent)]" />
        <div className="space-y-3">
          {/* Row 1: Search Box + Summary Pill + Reset */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-xl relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3 z-10 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400 group-hover:text-zinc-600 group-focus-within:text-[#0B2374] transition-colors" />
                <div className="w-px h-5 bg-gray-200 group-hover:bg-zinc-300 transition-colors" />
              </div>

              <input
                type="text"
                role="searchbox"
                data-testid="resource-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources by title, category, role, or license..."
                style={{ boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.09)' }}
                className="w-full bg-slate-50/90 border-2 border-white focus:border-[#D4FC02]/40 rounded-3xl py-3.5 sm:py-4 pl-14 pr-12 text-sm sm:text-base font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#D4FC02]/10 transition-all shadow-eatzy-inner hover:shadow-eatzy-inner-hover"
              />

              {searchQuery && (
                <button
                  type="button"
                  data-testid="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center transition-all group/close cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4 text-zinc-600 group-hover/close:rotate-90 transition-transform duration-200" />
                </button>
              )}
            </div>

            {/* Count Pill & Reset Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-gray-200/70 text-xs font-bold text-zinc-700 shadow-2xs">
                <span className="text-[#0B2374] font-extrabold">{filteredItems.length}</span>
                <span className="text-zinc-400">/</span>
                <span>{allItems.length} Resources</span>
              </div>

              {isFiltered && (
                <button
                  type="button"
                  data-testid="reset-resource-filters"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Category Filter Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  data-testid={`category-tab-${tab.id}`}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0B2374] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4FC02]' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      {isLoading ? (
        <ResourcesShimmer />
      ) : filteredItems.length > 0 ? (
        <div data-testid="resources-grid" className="grid gap-5 md:grid-cols-2">
          {filteredItems.map((resource) => (
            <ResourceCard key={resource.resource_id} resource={resource} />
          ))}
        </div>
      ) : (
        <div
          data-testid="resources-empty-state"
          className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center space-y-3"
        >
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No resources matched your filter</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or switching category filters to discover official NASA reference documents.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-2xl bg-[#D4FC02] hover:bg-[#c3e802] text-zinc-950 text-xs font-bold transition-all shadow-2xs"
          >
            Clear Filters
          </button>
        </div>
      )}
    </motion.div>
  );
}