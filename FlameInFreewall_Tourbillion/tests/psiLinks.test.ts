import { describe, expect, it } from 'vitest';
import { browserSourceUrl, psiInvestigationUrl } from '@/lib/psiLinks';

const STORED =
  'https://psi.nasa.gov/geode-py/ws/studies/PSI-69/download?file=PSI-69_Experimental+table_FLEX.csv&version=1&redirect=false';

describe('browserSourceUrl', () => {
  it('drops redirect=false so NASA answers with a 302 to the file instead of the URL as text', () => {
    expect(browserSourceUrl(STORED)).toBe(
      'https://psi.nasa.gov/geode-py/ws/studies/PSI-69/download?file=PSI-69_Experimental+table_FLEX.csv&version=1'
    );
  });

  it('keeps every other parameter, including encoded file names and versions', () => {
    const url = 'https://psi.nasa.gov/geode-py/ws/studies/PSI-21/download?redirect=false&file=A%26B+%28raw%29.csv&version=3';
    const out = new URL(browserSourceUrl(url)!);
    expect(out.searchParams.get('redirect')).toBeNull();
    expect(out.searchParams.get('file')).toBe('A&B (raw).csv');
    expect(out.searchParams.get('version')).toBe('3');
  });

  it('leaves non-download, other-host, redirecting and invalid URLs unchanged', () => {
    for (const url of [
      'https://psi.nasa.gov/geode-py/ws/studies/PSI-69/download?file=a.csv&redirect=true',
      'https://psi.nasa.gov/geode-py/ws/studies/PSI-69/download?file=a.csv',
      'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69?redirect=false',
      'https://evil.example/geode-py/ws/studies/PSI-69/download?redirect=false',
      'http://psi.nasa.gov/geode-py/ws/studies/PSI-69/download?redirect=false',
      'https://www.nasa.gov/article',
      'not a url',
    ]) {
      expect(browserSourceUrl(url)).toBe(url);
    }
  });

  it('passes empty values through', () => {
    expect(browserSourceUrl(null)).toBeNull();
    expect(browserSourceUrl(undefined)).toBeNull();
    expect(browserSourceUrl('')).toBeNull();
  });
});

describe('psiInvestigationUrl', () => {
  it('maps a PSI download URL to its public investigation page', () => {
    expect(psiInvestigationUrl(STORED)).toBe('https://psi.nasa.gov/physci/repo/data/investigations/PSI-69');
    expect(psiInvestigationUrl('https://www.nasa.gov/article')).toBeNull();
    expect(psiInvestigationUrl(null)).toBeNull();
  });
});
