'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiPost } from '@/api/client';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import type { ResearchBrief } from '@/types/missionResearch';

const labels = { match: 'Matched', mismatch: 'Different', unknown: 'Unknown', related: 'Related regime' };
const colors = { match: 'bg-blue-50 text-blue-900', mismatch: 'bg-amber-50 text-amber-900', unknown: 'bg-slate-100 text-slate-700', related: 'bg-violet-50 text-violet-900' };

export function MissionResearch() {
  const scenario = useWorkspaceStore(s => s.activeScenario);
  const [purpose, setPurpose] = useState('prevention');
  const [result, setResult] = useState<ResearchBrief | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const signature = JSON.stringify({purpose, scenario});
  const live = useRef(signature); live.current = signature;
  const controller = useRef<AbortController | null>(null);
  const completed = useRef('');
  useEffect(() => {
    controller.current?.abort(); setResult(null); setError(''); setBusy(false);
    return () => controller.current?.abort();
  }, [signature]);
  async function analyze() {
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const submitted = signature;
    setBusy(true); setError(''); setResult(null);
    try {
      const answer = await apiPost<ResearchBrief>('/mission/research', {
        workflowId: purpose,
        question: `Investigations relevant to ${purpose} under the explicit target conditions.`,
        scenario: { oxygenPct: scenario.oxygenPct, oxygenBasis: 'volume_percent',
          pressurePsi: scenario.pressurePsi, gravityG: scenario.gravity,
          airflowCmS: scenario.airflowVelocity, material: scenario.material },
      }, abort.signal);
      if (abort.signal.aborted || live.current !== submitted) return;
      if (answer.workflowId !== purpose) throw new Error('Response does not match the selected purpose.');
      completed.current = submitted; setResult(answer);
    } catch (e) {
      if (!abort.signal.aborted && live.current === submitted)
        setError(e instanceof Error ? e.message : 'Evidence unavailable. Please retry.');
    } finally {
      if (!abort.signal.aborted && live.current === submitted) setBusy(false);
    }
  }
  const shown = completed.current === signature ? result : null;
  return <section className="rounded-3xl bg-white border border-slate-200 p-5 space-y-5" aria-label="Mission API evidence">
    <div className="flex flex-wrap items-end gap-4">
      <label className="text-sm font-bold">Research purpose<select className="block mt-2 rounded-xl border p-2" value={purpose} onChange={e => setPurpose(e.target.value)}>
        <option value="prevention">Prevention</option><option value="detection">Detection</option><option value="suppression">Suppression</option>
      </select></label>
      <button className="rounded-xl bg-[#D4FC02] px-4 py-3 text-sm font-bold disabled:opacity-50" onClick={analyze} disabled={busy}>{busy ? 'Analyzing…' : 'Analyze evidence'}</button>
    </div>
    <p className="text-xs leading-6 text-slate-600">Research lookup, not a safety verdict. O₂ target uses volume percent in the chamber; apparatus streams with a different scope are not treated as matches. Unknown is distinct from different; a microgravity regime is not measured 0g.</p>
    {busy && <p role="status">Reading admitted NASA evidence…</p>}
    {error && <p role="alert" className="text-sm text-red-800">{error} No sample results have been substituted.</p>}
    {!shown && !busy && !error && <p className="text-sm text-slate-500">Choose a purpose and analyze your scenario. Editing conditions clears previous results.</p>}
    {shown && <>
      <p className="text-sm"><b>{shown.rows.length}</b> related investigations · source-checked, independently unreviewed. Release <span title={shown.revision}>{shown.revision.slice(0,12)}</span></p>
      {!shown.rows.length && <p>No investigations classified for this purpose in the connected release.</p>}
      <div className="overflow-x-auto" tabIndex={0} aria-label="Condition comparison table"><table className="w-full text-left text-xs border-separate border-spacing-y-3">
        <caption className="sr-only">Same-record conditions and research relevance</caption>
        <thead><tr><th scope="col">Investigation</th>{['Oxygen','Pressure','Airflow','Gravity','Material'].map(n => <th scope="col" key={n}>{n}</th>)}</tr></thead>
        <tbody>{shown.rows.map(row => <tr key={row.investigationId}>
          <th scope="row" className="pr-4 min-w-32"><Link href={`/explorer/${row.investigationId}`} className="text-[#0B2374] underline">{row.code}</Link><p className="mt-2 font-normal">{row.availability.records} records · {row.availability.independentlyReviewedRecords ?? 'Unknown'} reviewed</p><p className="mt-2 font-normal">{row.record?.externalRunKey ?? 'No admitted record'}</p></th>
          {row.dimensions.length ? row.dimensions.map(d => <td key={d.dimension} className="p-1 align-top"><div className={`rounded-xl p-3 min-w-28 ${colors[d.status]}`}><b>{labels[d.status]}</b><p className="mt-2">{d.observed ?? 'Unknown'} {d.observed != null ? d.unit : ''}</p><p className="mt-1">{d.basis?.replaceAll('_',' ')}</p><p className="mt-2 leading-5">{d.reason}</p></div></td>) : <td colSpan={5}>No source records available for this comparison.</td>}
        </tr>)}</tbody>
      </table></div>
      {shown.rows.map(row => <details key={row.investigationId} className="rounded-xl border p-4 text-sm"><summary className="cursor-pointer font-bold">{row.code} · why relevant, sources & limitations</summary>
        <p className="my-3 text-xs">{row.selectionReason}</p>
        {row.passages.map((p,i) => <p key={i} className="my-3 text-xs leading-6"><b>{p.kind}:</b> {p.text} [{p.citationId}]</p>)}
        {row.record?.observations.map((o,i) => <p key={i} className="my-2 text-xs">Recorded {o.name}: raw {o.raw}; normalized {o.value ?? 'Unknown'} {o.unit}; original unit {o.originalUnit}; {o.status} [{o.citationId}]</p>)}
        {[...row.limitations,...(row.record?.issues ?? [])].map((s,i) => <p key={i} className="my-2 text-xs text-amber-900">{s}</p>)}
      </details>)}
      <details className="text-xs leading-6"><summary className="cursor-pointer font-bold">Method, original references & next steps</summary>{[...shown.method,...shown.limitations,...shown.nextSteps].map((s,i) => <p className="my-2" key={i}>{s}</p>)}{shown.citations.map(c => <p key={c.id} className="my-3 break-words">[{c.id}] <a href={c.source.sourceUrl} target="_blank" rel="noreferrer" className="underline">{c.source.filename}</a> · {c.locator} · study v{c.source.studyVersion}/file v{c.source.fileVersion} · SHA256 {c.source.sha256}</p>)}</details>
    </>}
  </section>;
}
