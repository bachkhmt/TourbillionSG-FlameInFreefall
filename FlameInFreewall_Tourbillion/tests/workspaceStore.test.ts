import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from '../src/store/useWorkspaceStore';
import { useAiAssistantStore } from '../src/store/useAiAssistantStore';
import { toastStore } from '../src/components/toast/toast-store';

describe('useWorkspaceStore & Comparison Guardrails', () => {
  beforeEach(() => {
    toastStore.clear();
    useWorkspaceStore.getState().resetWorkspace();
    useAiAssistantStore.getState().resetConversation();
    useAiAssistantStore.getState().setOpen(false);
    useAiAssistantStore.getState().setActiveContextStudyId(null);
  });

  it('initializes with default scenario and empty comparison list', () => {
    const state = useWorkspaceStore.getState();
    expect(state.compareList).toEqual([]);
    expect(state.activeScenario).toBeDefined();
    expect(state.activeScenario.gravity).toBe(0);
    expect(state.activeScenario.name).toContain('ISS');
  });

  it('allows adding up to 3 investigations to comparison list', () => {
    const store = useWorkspaceStore.getState();

    const r1 = store.toggleCompare('bass');
    expect(r1).toBe(true);
    expect(useWorkspaceStore.getState().compareList).toEqual(['bass']);

    const r2 = store.toggleCompare('acme-c-flame');
    expect(r2).toBe(true);
    expect(useWorkspaceStore.getState().compareList).toEqual(['bass', 'acme-c-flame']);

    const r3 = store.toggleCompare('sofie-gel');
    expect(r3).toBe(true);
    expect(useWorkspaceStore.getState().compareList).toEqual(['bass', 'acme-c-flame', 'sofie-gel']);
  });

  it('rejects 4th investigation, caps compare list at 3, and emits warning toast', () => {
    const store = useWorkspaceStore.getState();
    store.toggleCompare('bass');
    store.toggleCompare('acme-c-flame');
    store.toggleCompare('sofie-gel');

    // Attempting to add 4th
    const r4 = store.toggleCompare('flex');
    expect(r4).toBe(false);

    // List must still only have 3 items
    const list = useWorkspaceStore.getState().compareList;
    expect(list.length).toBe(3);
    expect(list).toEqual(['bass', 'acme-c-flame', 'sofie-gel']);

    // Must have emitted a warning toast
    const toasts = toastStore.getToasts();
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0].type).toBe('warning');
    expect(toasts[0].title).toMatch(/Maximum 3|Comparison Limit/i);
  });

  it('removes investigation when toggleCompare is called on an already compared id', () => {
    const store = useWorkspaceStore.getState();
    store.toggleCompare('bass');
    store.toggleCompare('acme-c-flame');
    expect(useWorkspaceStore.getState().compareList).toEqual(['bass', 'acme-c-flame']);

    const removed = store.toggleCompare('bass');
    expect(removed).toBe(true);
    expect(useWorkspaceStore.getState().compareList).toEqual(['acme-c-flame']);
  });

  it('supports clearCompare and removeFromCompare', () => {
    const store = useWorkspaceStore.getState();
    store.toggleCompare('bass');
    store.toggleCompare('acme-c-flame');
    store.removeFromCompare('bass');
    expect(useWorkspaceStore.getState().compareList).toEqual(['acme-c-flame']);

    store.clearCompare();
    expect(useWorkspaceStore.getState().compareList).toEqual([]);
  });

  it('updates scenario parameters and active preset', () => {
    const store = useWorkspaceStore.getState();
    store.updateActiveScenario({ gravity: 0.16, oxygenPct: 30, name: 'Lunar Habitat Lab' });

    const updated = useWorkspaceStore.getState().activeScenario;
    expect(updated.gravity).toBe(0.16);
    expect(updated.oxygenPct).toBe(30);
    expect(updated.name).toBe('Lunar Habitat Lab');
  });

  it('updates and resets active search and categorical filters', () => {
    const store = useWorkspaceStore.getState();
    store.setFilter('search', 'droplet combustion');
    store.setFilter('fuelCategory', 'liquid');
    store.setFilter('gravityRegime', '0g');

    expect(useWorkspaceStore.getState().filters.search).toBe('droplet combustion');
    expect(useWorkspaceStore.getState().filters.fuelCategory).toBe('liquid');

    store.resetFilters();
    expect(useWorkspaceStore.getState().filters.search).toBe('');
    expect(useWorkspaceStore.getState().filters.fuelCategory).toBe('all');
  });
});

describe('useAiAssistantStore', () => {
  beforeEach(() => {
    useAiAssistantStore.getState().resetConversation();
    useAiAssistantStore.getState().setOpen(false);
    useAiAssistantStore.getState().setActiveContextStudyId(null);
  });

  it('toggles chat drawer and tracks active context study ID', () => {
    const store = useAiAssistantStore.getState();
    expect(store.isOpen).toBe(false);

    store.toggleOpen();
    expect(useAiAssistantStore.getState().isOpen).toBe(true);

    store.setActiveContextStudyId('bass-ii');
    expect(useAiAssistantStore.getState().activeContextStudyId).toBe('bass-ii');

    store.setOpen(false);
    expect(useAiAssistantStore.getState().isOpen).toBe(false);
  });

  it('keeps one server session conversation and resets the tab token', () => {
    const store = useAiAssistantStore.getState();
    const message = (id: string, role: 'user' | 'assistant') => ({
      id,
      role,
      createdAt: '2026-11-14T00:00:00Z',
      answer: {
        state: 'answered' as const,
        text: id,
        origin: 'real',
        reviewStatus: 'unreviewed',
        providerVersion: 'nasa-extractive-v2',
        corpusVersion: 'c',
        citations: [],
      },
    });
    sessionStorage.setItem('flameguard.chat.session.v1', '11111111-1111-4111-8111-111111111111');
    store.appendMessages('s-1', [message('u1', 'user'), message('a1', 'assistant')]);
    store.appendMessages('s-1', [message('u2', 'user'), message('a2', 'assistant')]);
    expect(useAiAssistantStore.getState().messages.map((m) => m.id)).toEqual(['u1', 'a1', 'u2', 'a2']);

    // A different session never splices into the previous conversation.
    store.appendMessages('s-2', [message('u3', 'user')]);
    expect(useAiAssistantStore.getState().messages.map((m) => m.id)).toEqual(['u3']);

    store.resetConversation();
    expect(useAiAssistantStore.getState().messages).toEqual([]);
    expect(useAiAssistantStore.getState().sessionId).toBeNull();
    expect(sessionStorage.getItem('flameguard.chat.session.v1')).toBeNull();
  });
});
