import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MissionResearch } from '@/features/mission/components/MissionResearch';
import { apiPost } from '@/api/client';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
vi.mock('@/api/client', () => ({ apiPost: vi.fn() }));
const response = { workflowId: 'prevention', revision: 'TEST_REVISION', rows: [], citations: [], method: ['TEST ONLY method'], limitations: [], nextSteps: [] };
beforeEach(() => { useWorkspaceStore.getState().resetWorkspace(); vi.mocked(apiPost).mockReset(); });
afterEach(cleanup);
it('waits for explicit action and sends every condition to the backend', async () => {
 vi.mocked(apiPost).mockResolvedValue(response); render(<MissionResearch />);
 expect(apiPost).not.toHaveBeenCalled(); fireEvent.click(screen.getByText('Analyze evidence'));
 await screen.findByText(/No investigations classified/);
 expect(apiPost).toHaveBeenCalledWith('/mission/research', expect.objectContaining({ workflowId: 'prevention', scenario: expect.objectContaining({oxygenBasis:'volume_percent', material:'PMMA'}) }), expect.anything());
});
it('shows failures without manufacturing evidence', async () => {
 vi.mocked(apiPost).mockRejectedValue(new Error('503 unavailable')); render(<MissionResearch />); fireEvent.click(screen.getByText('Analyze evidence'));
 expect((await screen.findByRole('alert')).textContent).toContain('No sample results');
 expect(screen.queryByText(/related investigations/)).toBeNull();
});
it('discards late responses after a target edit', async () => {
 let done!: (v: unknown) => void;
 vi.mocked(apiPost).mockImplementation(() => new Promise(resolve => { done = resolve; }));
 render(<MissionResearch />); fireEvent.click(screen.getByText('Analyze evidence'));
 fireEvent.change(screen.getByLabelText('Research purpose'), {target:{value:'detection'}});
 done(response); await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
 expect(screen.queryByText(/TEST_REVISION/)).toBeNull();
});
it('clears previous results after an airflow edit', async () => {
 vi.mocked(apiPost).mockResolvedValue(response); render(<MissionResearch />); fireEvent.click(screen.getByText('Analyze evidence'));
 await screen.findByText(/No investigations classified/);
 useWorkspaceStore.getState().updateActiveScenario({ airflowVelocity: 10 });
 await waitFor(() => expect(screen.queryByText(/No investigations classified/)).toBeNull());
});
