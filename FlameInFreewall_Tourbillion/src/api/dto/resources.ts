export interface ChallengeResourceDto {
  source_document_id?: string | null;
  resource_id: string;
  title: string;
  source_url: string;
  source_scope?: string;
  investigation_id?: string | null;
  license?: string | null;
  status?: string;
  indexed?: boolean;
  kind?: string;
  role?: string;
}

export interface ChallengeResourcePageDto {
  isFallback?: boolean;
  items: ChallengeResourceDto[];
  total?: number;
}
