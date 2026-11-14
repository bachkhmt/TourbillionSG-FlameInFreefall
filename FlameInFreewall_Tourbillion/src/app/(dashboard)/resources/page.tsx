'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  RotateCcw,
  Info,
  Flame,
  ArrowUpRight,
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
      {/* Top Header Sticky with Backdrop Blur */}
      <div className="sticky top-0 z-30 -mx-3 px-3 sm:-mx-6 sm:px-6 py-3 pb-4 transition-all duration-300">
        <div className="absolute inset-0 bg-[#F8F9FA]/50 backdrop-blur-sm pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,black_85%,transparent)]" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4FC02]/30 text-[#0B2374] text-xs font-black uppercase tracking-wider border border-lime-300">
                NASA Space Apps 2026
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Verified Scientific Heritage
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#0B2374]" strokeWidth={2.5} />
              <span>Official Challenge Resources</span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/studio"
              data-testid="resources-studio-link"
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Flame className="w-3.5 h-3.5 text-white" />
              <span>3D Flame Studio</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </div>

      {/* Description & Caveats Banner */}
      <div className="rounded-3xl border-2 border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
          Explore the challenge’s primary data repositories, physical science context, historical mission case studies, and Earth applications.
          Source rights and provenance are displayed per resource. Linked documentation represents verified research context distinct from raw experimental measurement tables.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="font-semibold text-amber-800">
            NASA PSI Registry · 10 Verified Knowledge Domains
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">
            Historical incidents (Apollo 1, Mir) provide fire-safety context; experimental data is cataloged in PSI.
          </span>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, category, role, or license..."
              aria-label="Search official challenge resources"
              data-testid="resource-search-input"
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border-2 border-gray-200/90 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2374] transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {(searchQuery || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={handleReset}
              data-testid="reset-resource-filters"
              className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 border-2 border-gray-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                data-testid={`category-tab-${tab.id}`}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#0B2374] text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#D4FC02]' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-900 font-bold">{filteredItems.length}</strong> of{' '}
          {allItems.length} resources
        </span>
        {isFetching && <span className="text-[#0B2374] font-medium animate-pulse">Syncing registry…</span>}
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
