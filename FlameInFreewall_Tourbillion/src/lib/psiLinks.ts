/**
 * Browser-facing links for NASA PSI sources.
 *
 * Stored `sourceUrl`s keep the acquisition URL exactly (provenance). PSI download URLs were
 * captured with `redirect=false`, which makes NASA answer `200 text/html` containing a
 * short-lived S3 URL as plain text instead of redirecting to the file. Opening that in a
 * browser shows the URL, not the data, so links shown to people drop only that parameter;
 * NASA then answers with a 302 to the file.
 */
const PSI_DOWNLOAD = /^https:\/\/psi\.nasa\.gov\/geode-py\/ws\/studies\/(PSI-\d+)\/download(?:\?|$)/i;

/** URL to put in an `href`: PSI downloads without `redirect=false`; anything else unchanged. */
export function browserSourceUrl(sourceUrl: string | null | undefined): string | null {
  if (!sourceUrl) return null;
  if (!PSI_DOWNLOAD.test(sourceUrl)) return sourceUrl;
  const [base, query = ''] = sourceUrl.split('?', 2);
  const kept = query.split('&').filter((part) => part.toLowerCase() !== 'redirect=false');
  return kept.length && kept.some(Boolean) ? `${base}?${kept.join('&')}` : base;
}

/** Public PSI investigation page for a PSI download URL, or null for other sources. */
export function psiInvestigationUrl(sourceUrl: string | null | undefined): string | null {
  const study = sourceUrl?.match(PSI_DOWNLOAD);
  return study ? `https://psi.nasa.gov/physci/repo/data/investigations/${study[1]}` : null;
}
