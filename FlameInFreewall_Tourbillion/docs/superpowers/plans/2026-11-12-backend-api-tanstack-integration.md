# FlameGuard AI Backend API & TanStack Query Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect `FlameInFreewall_Tourbillion` cleanly to all 16 endpoints of `flameguard-ai-backend` (`/api/v1`) using an industry-standard layered frontend architecture: strict TypeScript DTOs, typed HTTP client, modular endpoint services, pure DTO-to-Domain mappers, `@tanstack/react-query` hooks with loading/error/retry states, and honest scientific provenance/unavailability UI handling.

**Architecture:**
- **DTO Layer (`src/api/dto/`)**: Exact TypeScript representations of Pydantic `ApiModel` wire contracts (`camelCase`, `DecimalString`, `UnavailableFields`, `ContextDto`, pagination envelopes, and `ApiErrorDto`) matching `flameguard-ai-backend/app/schemas/api/models.py`.
- **HTTP Client & Services (`src/api/client.ts`, `src/api/services/`)**: Typed `fetch` wrapper with base URL config (`NEXT_PUBLIC_API_BASE_URL`), `AbortController` timeouts, strict `camelCase` query-param serialization (omitting empty/undefined values), structured `ApiClientError` (`404`/`422`/`503`/`500`), and domain-grouped service functions covering all 16 backend endpoints.
- **Mapper Layer (`src/api/mappers/`, `src/types/api.ts`)**: Pure stateless functions transforming wire DTOs into clean frontend domain models, safely parsing `DecimalString`, exposing typed `FieldAvailabilityMap`, preserving `context.caveats`, and surfacing `contextMismatch` / `unavailableFields` without fabricating unverified values.
- **Query & Hook Layer (`src/providers/QueryProvider.tsx`, `src/hooks/api/`)**: Centralized `QueryClientProvider`, hierarchical `queryKeys`, and domain-specific `useQuery` / `useMutation` hooks managing `isLoading`, `isFetching`, `isError`, `error`, `refetch`, caching, and conditional `enabled` execution.
- **UI & Test Layer (`src/app/(dashboard)/**`, `src/components/**`, `tests/**`)**: Wire Dashboard, Explorer, Study Detail, and Multi-Study Comparison views to TanStack Query hooks with StructPaper loading shimmers, `<ApiErrorBanner />` retry UI, caveat disclosures, and full Vitest unit + component test coverage via `tests/test-utils.tsx` and `tests/fixtures/backendFixtures.ts`.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5.7, `@tanstack/react-query` v5, Zustand 5, Tailwind CSS 4, Vitest 3, `@testing-library/react` 16.

---

## Global Constraints

1. **File Size Limit:** Every newly created or modified source file MUST remain **under 300 lines of code (LOC)** (aim for `< 220` LOC per file). Split cohesive sub-responsibilities if approaching 250 LOC.
2. **Backend Wire Fidelity (`flameguard-ai-backend/app/schemas/api/models.py`):**
   - Base URL env var: `NEXT_PUBLIC_API_BASE_URL` (default `http://127.0.0.1:8000/api/v1`).
   - All query params and request bodies MUST use exact `camelCase` keys (`gravityRaw`, `sourceType`, `evidenceStatus`, `reviewStatus`, `investigationIds`, `observationOffset`, `observationLimit`); never send `snake_case` or unsupported params (`fuel`, `facility`, `gravity`, `category`, `newest`, `code-asc`, `confidence`) to `/api/v1/investigations` or `/api/v1/dashboard/summary` (backend rejects them with `422`).
   - `GET /api/v1/dashboard/summary` accepts ONLY the 9 filter params (`q`, `platform`, `material`, `gravityRaw`, `tag`, `purpose`, `sourceType`, `evidenceStatus`, `reviewStatus`) — never `sort`, `offset`, or `limit`.
   - `POST /api/v1/compare` requires `{ investigationIds: string[], observationOffset?: number, observationLimit?: number }` with 2–3 distinct IDs.
   - `DecimalString` values arrive as decimal strings (`^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$`) and must be parsed safely without `NaN` or precision assumptions.
   - Respect `unavailableFields`, `null` metrics (`verifiedRunCount`, `fuelDistribution`, `facilityDistribution`, `gravityDistribution`, `deltas`, `highlights`), `comparability: "not_established"`, `context.caveats`, and `ClaimSource.contextMismatch` honestly in UI rendering — never fabricate missing scientific claims or distributions.
3. **StructPaper UI Rules (Preserved from Prior User Instructions):**
   - Light StructPaper palette (`#F8F9FA`, `#FFFFFF`, `bg-gray-200/50`, `#0B2374`, `#D4FC02`).
   - **NO `font-mono` classes** in components.
   - **NO `backdrop-blur-md`** on `ExplorerFiltersBar.tsx`.
   - **NO emerald green accents** where StructPaper lime (`#D4FC02`) or navy (`#0B2374`) belongs.
4. **Comment Integrity & Scope:** Preserve unrelated existing comments/docstrings. Keep Mission Workbench (`src/lib/gapMatrixEngine.ts`, `rankingEngine.ts`, `predictiveLabEngine.ts`, `ragKnowledgeEngine.ts`) intact (backend Phases 5–7 have no HTTP endpoints yet).
5. **Working Directory:** All frontend commands run inside `c:\Users\OWNER\source\Eatzy\FlameInFreewall_Tourbillion`.

---

## Task 1: TanStack Query Foundation, Config, Error Banner & Test Harness

**Files:**
- Modify: `FlameInFreewall_Tourbillion/package.json` (via `npm install @tanstack/react-query`)
- Create: `FlameInFreewall_Tourbillion/.env.example`
- Create: `FlameInFreewall_Tourbillion/src/api/config.ts`
- Create: `FlameInFreewall_Tourbillion/src/providers/QueryProvider.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/app/layout.tsx`
- Create: `FlameInFreewall_Tourbillion/src/components/ui/ApiErrorBanner.tsx`
- Create: `FlameInFreewall_Tourbillion/tests/test-utils.tsx`
- Create: `FlameInFreewall_Tourbillion/tests/fixtures/backendFixtures.ts`
- Create: `FlameInFreewall_Tourbillion/tests/api/foundation.test.tsx`

- [ ] **Step 1: Install `@tanstack/react-query`**

Run from `FlameInFreewall_Tourbillion`:
```powershell
npm install @tanstack/react-query
```
Expected: `@tanstack/react-query` added to `dependencies` in `package.json`.

- [ ] **Step 2: Create `.env.example` and `src/api/config.ts`**

`FlameInFreewall_Tourbillion/.env.example`:
```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_API_TIMEOUT_MS=10000
```

`FlameInFreewall_Tourbillion/src/api/config.ts`:
```ts
const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
const DEFAULT_API_TIMEOUT_MS = 10000;

/**
 * Returns the normalized backend API base URL without trailing slash.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const base = raw && raw.length > 0 ? raw : DEFAULT_API_BASE_URL;
  return base.replace(/\/+$/, '');
}

/**
 * Returns the HTTP request timeout in milliseconds.
 */
export function getApiTimeoutMs(): number {
  const raw = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_API_TIMEOUT_MS;
}
```

- [ ] **Step 3: Create `src/providers/QueryProvider.tsx` and wire into `src/app/layout.tsx`**

`FlameInFreewall_Tourbillion/src/providers/QueryProvider.tsx`:
```tsx
'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = useState(() => createAppQueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
```

Update `src/app/layout.tsx` to wrap `{children}` inside `<QueryProvider>{children}</QueryProvider>`.

- [ ] **Step 4: Create `src/components/ui/ApiErrorBanner.tsx`**

StructPaper-styled error + retry + supported values banner (no `font-mono`, soft rounded card):
- Accepts `{ title?: string; error: unknown; onRetry?: () => void; isRetrying?: boolean; className?: string; testId?: string }`.
- Extracts structured `code`, `message`, `fields`, `supportedValues`, and `context.caveats` if error matches `{ code, message, fields?, supportedValues?, status? }`, falling back to `error.message` or generic message.
- Displays a retry button when `onRetry` is provided.

- [ ] **Step 5: Create `tests/test-utils.tsx` and `tests/fixtures/backendFixtures.ts`**

`tests/test-utils.tsx`:
- Exports `createTestQueryClient()` (`retry: false`, `gcTime: Infinity`) and `renderWithQuery(ui, options?)` wrapping in `<QueryClientProvider>`.

`tests/fixtures/backendFixtures.ts`:
- Exports deterministic factory helpers (`makeContextDto`, `makeTagDto`, `makeInvestigationDto`, `makeInvestigationDetailDto`, `makeRunDto`, `makeConditionDto`, `makeMeasurementDto`, `makeObservationDto`, `makeSourceDto`, `makeClaimDto`, `makeClaimSourceDto`, `makeDashboardDto`, `makeComparisonDto`, `makeCapabilitiesDto`, `makePageDto`) grounded on `flameguard-ai-backend/data/demo/phase4-v1.json` and `models.py` contracts.

- [ ] **Step 6: Write `tests/api/foundation.test.tsx`, run tests, commit**

Write failing test first for `getApiBaseUrl`, `getApiTimeoutMs`, `QueryProvider`, and `ApiErrorBanner` (with retry click + structured error code/supportedValues display), verify fail -> implement -> run `npx vitest run tests/api/foundation.test.tsx` -> commit:
```powershell
git -C FlameInFreewall_Tourbillion add package.json package-lock.json .env.example src/api/config.ts src/providers/QueryProvider.tsx src/app/layout.tsx src/components/ui/ApiErrorBanner.tsx tests/test-utils.tsx tests/fixtures/backendFixtures.ts tests/api/foundation.test.tsx
git -C FlameInFreewall_Tourbillion commit -m "feat(api): add TanStack Query provider, config, error banner, and test harness"
```

---

## Task 2: Backend Wire DTO Types (`src/api/dto/*`)

**Files:**
- Create: `FlameInFreewall_Tourbillion/src/api/dto/common.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/dto/health.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/dto/catalog.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/dto/runs.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/dto/evidence.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/dto/dashboard.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/dto/comparison.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/dto/index.ts`
- Create: `FlameInFreewall_Tourbillion/tests/api/dtoContracts.test.ts`

- [ ] **Step 1: Write failing test `tests/api/dtoContracts.test.ts`**

Tests type-level contracts and runtime error/type guard helpers (`isApiErrorEnvelopeDto`, `isReadyUnavailableDto`, `UNAVAILABLE_FIELD_REASONS`). Verify test fails before implementation.

- [ ] **Step 2: Create DTO modules matching `flameguard-ai-backend/app/schemas/api/models.py` verbatim**

- `common.ts`:
  - `DecimalString = string`
  - `UnavailableReason = 'MISSING_SOURCE_DATA' | 'UNSUPPORTED_MAPPING' | 'VERIFICATION_NOT_ESTABLISHED' | 'SCIENTIFIC_COMPARISON_NOT_APPROVED' | 'NO_DENOMINATOR' | 'ASSET_CONTRACT_PENDING'`
  - `UnavailableFieldsDto = Record<string, UnavailableReason>`
  - `ContextDto = { collectionId: string; origin: 'synthetic' | 'real' | 'unknown'; reviewState: 'unreviewed' | 'curated' | 'unknown'; caveats: string[] }`
  - `CollectionLinkDto = { href: string; total: number }`
  - `PaginationParams = { offset?: number; limit?: number }`
  - `PaginatedPageDto<T> = { items: T[]; total: number; offset: number; limit: number; next: string | null; context: ContextDto }`
  - `ApiErrorCode = 'ENTITY_NOT_FOUND' | 'INVALID_REQUEST' | 'UNSUPPORTED_CAPABILITY' | 'COLLECTION_SCOPE_INVALID' | 'IDENTITY_MAPPING_UNAVAILABLE' | 'DATA_UNAVAILABLE' | 'INTERNAL_ERROR'`
  - `ErrorDetailDto = { code: ApiErrorCode | string; message: string; fields: string[]; supportedValues: string[] }`
  - `ApiErrorEnvelopeDto = { error: ErrorDetailDto; context: ContextDto }`
  - Type guard `isApiErrorEnvelopeDto(value: unknown): value is ApiErrorEnvelopeDto`
- `health.ts`:
  - `HealthDto = { status: string; service: string }`
  - `ReadyDto = { status: 'ready' | 'unavailable' | string; service: string; database: 'ok' | 'unavailable' | string }`
  - `isReadyDto(value: unknown): value is ReadyDto`
- `catalog.ts`:
  - `TagDto = { id: string; slug: string; label: string; category: string | null; context: ContextDto }`
  - `TagPageDto = PaginatedPageDto<TagDto>`
  - `InvestigationDto = { id: string; psiId: string; slug: string | null; title: string; researchPurpose: string | null; platform: string | null; tags: TagPageDto; unavailableFields: UnavailableFieldsDto; context: ContextDto }`
  - `InvestigationDetailDto = InvestigationDto & { runs: CollectionLinkDto; sources: CollectionLinkDto; claims: CollectionLinkDto }`
  - `InvestigationPageDto = PaginatedPageDto<InvestigationDto>`
  - `CatalogSortDto = 'title-asc' | 'runs-desc'`
  - `InvestigationFilterParams` (`q`, `platform`, `material`, `gravityRaw`, `tag`, `purpose`, `sourceType`, `evidenceStatus`, `reviewStatus`)
  - `InvestigationListParams = InvestigationFilterParams & PaginationParams & { sort?: CatalogSortDto }`
  - `CatalogCapabilitiesDto = { supportedFilters: string[]; supportedSorts: string[]; unsupportedFilters: string[]; unsupportedSorts: string[]; unavailableDisplayFields: string[]; maxPageSize: number; context: ContextDto }`
- `runs.ts`:
  - `ConditionDto = { id: string; testRunId: string; variable: string; valueNumeric: DecimalString | null; valueText: string | null; unit: string | null; dataStatus: string; context: ContextDto }`
  - `ConditionPageDto = PaginatedPageDto<ConditionDto>`
  - `MeasurementDto = { id: string; testRunId: string; observable: string; measuredValue: DecimalString | null; unit: string; rawAssetRef: string | null; uncertainty: DecimalString | null; unavailableFields: UnavailableFieldsDto; context: ContextDto }`
  - `MeasurementPageDto = PaginatedPageDto<MeasurementDto>`
  - `RunDto = { id: string; investigationId: string; externalRunKey: string | null; materialType: string | null; sampleGeometry: string | null; gravity: string | null; verification: 'unknown' | string; unavailableFields: UnavailableFieldsDto; conditions: CollectionLinkDto; measurements: CollectionLinkDto; context: ContextDto }`
  - `RunPageDto = PaginatedPageDto<RunDto>`
  - `ObservationDto = { measurement: MeasurementDto; run: RunDto; context: ContextDto }`
  - `ObservationPageDto = PaginatedPageDto<ObservationDto>`
- `evidence.ts`:
  - `SourceDto = { id: string; investigationId: string; sourceUrl: string; doi: string | null; documentType: string; version: string | null; ingestionStatus: string; context: ContextDto }`
  - `SourcePageDto = PaginatedPageDto<SourceDto>`
  - `ClaimSourceDto = { id: string; claimId: string; source: SourceDto; testRunId: string | null; runInvestigationId: string | null; sourceLocator: string; sourceExcerpt: string | null; contextMismatch: boolean; context: ContextDto }`
  - `ClaimSourcePageDto = PaginatedPageDto<ClaimSourceDto>`
  - `ClaimDto = { id: string; claimText: string; evidenceStatus: string; reviewStatus: string; limitation: string | null; createdAt: string; sources: ClaimSourcePageDto; context: ContextDto }`
  - `ClaimPageDto = PaginatedPageDto<ClaimDto>`
- `dashboard.ts`:
  - `SourceCoverageDto = { numerator: number; denominator: number; ratio: DecimalString | null }`
  - `DashboardDto = { selection: Record<string, string>; investigationCount: number; runCount: number; claimCount: number; sourceCount: number; verifiedRunCount: null; sourceCoverage: SourceCoverageDto; fuelDistribution: null; facilityDistribution: null; gravityDistribution: null; featuredInvestigations: InvestigationDto[]; unavailableFields: UnavailableFieldsDto; context: ContextDto }`
- `comparison.ts`:
  - `ComparisonRequestDto = { investigationIds: string[]; observationOffset?: number; observationLimit?: number }`
  - `ComparisonStudyDto = { investigation: InvestigationDto; observations: ObservationPageDto; context: ContextDto }`
  - `ComparisonDto = { studies: ComparisonStudyDto[]; deltas: null; highlights: null; comparability: 'not_established' | string; unavailableFields: UnavailableFieldsDto; context: ContextDto }`
- `index.ts`: Barrel re-exporting all DTO files.

- [ ] **Step 3: Run tests, verify TypeScript passes, commit**

```powershell
npx vitest run tests/api/dtoContracts.test.ts
git -C FlameInFreewall_Tourbillion add src/api/dto tests/api/dtoContracts.test.ts
git -C FlameInFreewall_Tourbillion commit -m "feat(api): define backend Phase 4 DTO TypeScript contracts"
```

---

## Task 3: Typed HTTP Client & All 16 Endpoint Services

**Files:**
- Create: `FlameInFreewall_Tourbillion/src/api/client.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/services/healthService.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/services/catalogService.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/services/runsService.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/services/evidenceService.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/services/dashboardService.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/services/comparisonService.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/services/index.ts`
- Create: `FlameInFreewall_Tourbillion/tests/api/clientAndServices.test.ts`

- [ ] **Step 1: Write failing unit test `tests/api/clientAndServices.test.ts`**

Tests with mocked `globalThis.fetch`:
- `buildQueryString`: serializes defined non-empty params (`camelCase`), drops `undefined` / `null` / `''`.
- All 16 endpoints resolve to exact HTTP method, URL path (`/health`, `/ready`, `/catalog/capabilities`, `/investigations`, `/investigations/by-slug/...`, `/investigations/{id}`, `/investigations/{id}/tags`, `/investigations/{id}/runs`, `/runs/{runId}/conditions`, `/runs/{runId}/measurements`, `/investigations/{id}/measurements`, `/investigations/{id}/sources`, `/investigations/{id}/claims`, `/claims/{claimId}/sources`, `/dashboard/summary`, `POST /compare`), encoding path segments via `encodeURIComponent`.
- `getDashboardSummary` sends ONLY the 9 filter params (strips nothing extra because interface omits `sort`/`offset`/`limit` and service explicitly whitelists them).
- `compareInvestigations` throws client-side `ApiClientError` (`INVALID_REQUEST`) if `< 2` or `> 3` or duplicate IDs are submitted, or forwards backend `422`.
- Error handling: `404 ENTITY_NOT_FOUND`, `422 UNSUPPORTED_CAPABILITY` (with `fields` and `supportedValues`), `503` on `/ready` (`database: "unavailable"`), network rejection, and abort timeout.

- [ ] **Step 2: Implement `src/api/client.ts`**

Key design:
- `ApiClientError extends Error`: holds `status: number`, `code: string`, `fields: string[]`, `supportedValues: string[]`, `context?: ContextDto`.
- `buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string`
- `apiRequest<T>(path: string, options?: { method?: 'GET' | 'POST'; query?: ...; body?: unknown; signal?: AbortSignal; timeoutMs?: number }): Promise<T>`
- Combines external `signal` with timeout `AbortController` safely.
- Parses JSON safely; throws `ApiClientError` cleanly for non-2xx responses (recognizing `ApiErrorEnvelopeDto`, `/ready` `ReadyDto`, or generic HTTP error text).

- [ ] **Step 3: Implement all 6 domain service modules (`< 80` LOC each)**

- `healthService.ts`: `getHealth(signal?)`, `getReady(signal?)`
- `catalogService.ts`: `getCatalogCapabilities(signal?)`, `listInvestigations(params?, signal?)`, `getInvestigationById(investigationId, signal?)`, `getInvestigationBySlug(slug, signal?)`, `getInvestigationTags(investigationId, pagination?, signal?)`
- `runsService.ts`: `listInvestigationRuns(investigationId, pagination?, signal?)`, `listRunConditions(runId, pagination?, signal?)`, `listRunMeasurements(runId, pagination?, signal?)`, `listInvestigationMeasurements(investigationId, pagination?, signal?)`
- `evidenceService.ts`: `listInvestigationSources(investigationId, pagination?, signal?)`, `listInvestigationClaims(investigationId, pagination?, signal?)`, `listClaimSources(claimId, pagination?, signal?)`
- `dashboardService.ts`: `getDashboardSummary(filters?, signal?)` (explicitly picks only the 9 allowed filter keys!)
- `comparisonService.ts`: `compareInvestigations(payload, signal?)` (validates 2–3 distinct non-empty IDs before POSTing)
- `index.ts`: Barrel export.

- [ ] **Step 4: Run `npx vitest run tests/api/clientAndServices.test.ts`, verify pass, commit**

```powershell
npx vitest run tests/api/clientAndServices.test.ts
git -C FlameInFreewall_Tourbillion add src/api/client.ts src/api/services tests/api/clientAndServices.test.ts
git -C FlameInFreewall_Tourbillion commit -m "feat(api): add typed HTTP client and service modules for all 16 endpoints"
```

---

## Task 4: Frontend API Domain Models & Dedicated Mappers

**Files:**
- Create: `FlameInFreewall_Tourbillion/src/types/api.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/mappers/decimalMapper.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/mappers/contextMapper.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/mappers/investigationMapper.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/mappers/runMapper.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/mappers/evidenceMapper.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/mappers/dashboardMapper.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/mappers/comparisonMapper.ts`
- Create: `FlameInFreewall_Tourbillion/src/api/mappers/index.ts`
- Create: `FlameInFreewall_Tourbillion/tests/api/mappers.test.ts`

- [ ] **Step 1: Define `src/types/api.ts`**

Clean frontend-friendly domain types mapped from backend DTOs:
- `ApiContextMeta` (`collectionId`, `origin`, `reviewState`, `caveats`, `isSynthetic`, `isUnreviewed`)
- `FieldAvailabilityMap` (`Partial<Record<string, UnavailableReason>>`)
- `MappedTag`, `MappedInvestigation`, `MappedInvestigationDetail`, `MappedCatalogCapabilities`
- `MappedCondition`, `MappedMeasurement`, `MappedRun`, `MappedObservation`
- `MappedSource`, `MappedClaimSource`, `MappedClaim`
- `MappedDashboardSummary` (includes numeric `sourceCoverageRatio`, `sourceCoveragePct`, explicit `unavailableFields`, `null` distributions clearly typed as `null`)
- `MappedComparisonStudy` (extracts per-study condition/measurement summaries from `observations` cleanly when numeric values exist, while retaining `comparability: 'not_established' | string`, `deltas: null`, `highlights: null`, `unavailableFields`)
- `MappedPage<T>` (`items`, `total`, `offset`, `limit`, `hasMore`, `next`, `context`)

- [ ] **Step 2: Write failing unit tests `tests/api/mappers.test.ts`**

Tests:
- `parseDecimalString` (`"21.0"` -> `21`, `"-14.75"` -> `-14.75`, `null` -> `null`, invalid `"1e5"` / `"NaN"` -> `null`) & `formatDecimalDisplay`.
- `mapContext` & `isFieldUnavailable` (`isSynthetic`, `isUnreviewed`, `caveats`).
- `mapInvestigationDto` & `mapInvestigationDetailDto` (handles null `slug`/`platform`/`researchPurpose`, exposes `tags`, `unavailableFields`, `runCount`, `sourceCount`, `claimCount`).
- `mapRunDto`, `mapConditionDto`, `mapMeasurementDto`, `mapObservationDto` (parses `DecimalString`, maps `unavailableFields`).
- `mapClaimDto` & `mapClaimSourceDto` (preserves `contextMismatch`, `sourceLocator`, `sourceExcerpt`, `doi`).
- `mapDashboardSummaryDto` (maps KPIs, calculates `sourceCoveragePct` safely even when `denominator === 0` or `ratio === null`, keeps unapproved distributions `null`).
- `mapComparisonDto` (maps studies & observations, derives observed range summaries where measurements exist without fabricating unapproved `deltas`/`highlights`, preserves `comparability`).

- [ ] **Step 3: Implement the 7 pure mapper files (`< 150` LOC each) + `index.ts`**

- [ ] **Step 4: Run `npx vitest run tests/api/mappers.test.ts`, verify pass, commit**

```powershell
npx vitest run tests/api/mappers.test.ts
git -C FlameInFreewall_Tourbillion add src/types/api.ts src/api/mappers tests/api/mappers.test.ts
git -C FlameInFreewall_Tourbillion commit -m "feat(api): add domain models and pure DTO mappers"
```

---

## Task 5: TanStack Query Keys & Custom API Hooks

**Files:**
- Create: `FlameInFreewall_Tourbillion/src/hooks/api/queryKeys.ts`
- Create: `FlameInFreewall_Tourbillion/src/hooks/api/useHealthQueries.ts`
- Create: `FlameInFreewall_Tourbillion/src/hooks/api/useCatalogQueries.ts`
- Create: `FlameInFreewall_Tourbillion/src/hooks/api/useRunQueries.ts`
- Create: `FlameInFreewall_Tourbillion/src/hooks/api/useEvidenceQueries.ts`
- Create: `FlameInFreewall_Tourbillion/src/hooks/api/useDashboardQueries.ts`
- Create: `FlameInFreewall_Tourbillion/src/hooks/api/useComparisonQueries.ts`
- Create: `FlameInFreewall_Tourbillion/src/hooks/api/index.ts`
- Create: `FlameInFreewall_Tourbillion/tests/api/hooks.test.tsx`

- [ ] **Step 1: Write failing hook tests `tests/api/hooks.test.tsx`**

Using `renderHook` + `QueryClientProvider` from `tests/test-utils.tsx` and mocked service functions (`vi.mock('@/api/services')` or mocked `fetch`):
- `useDashboardSummaryQuery(filters)` transitions `isLoading -> isSuccess` with mapped `MappedDashboardSummary`, and `isError` on rejection with `refetch()` recovery.
- `useInvestigationsQuery(params)` fetches paginated + mapped catalog studies.
- `useInvestigationDetailQuery(idOrSlug)` detects UUID vs slug automatically (`UUID_REGEX` calls `getInvestigationById`, otherwise `getInvestigationBySlug`) and stays disabled when empty!
- `useInvestigationRunsQuery`, `useRunConditionsQuery`, `useRunMeasurementsQuery`, `useInvestigationMeasurementsQuery`, `useInvestigationSourcesQuery`, `useInvestigationClaimsQuery`, `useClaimSourcesQuery` return mapped pages and respect `enabled` when ID is omitted.
- `useComparisonQuery(ids, pagination)` runs `POST /compare` automatically only when `ids.length >= 2 && ids.length <= 3`, plus `useCompareInvestigationsMutation()` works imperatively.
- `useHealthQuery` & `useReadyQuery` work cleanly.

- [ ] **Step 2: Implement `queryKeys.ts` and the 6 hook files (`< 120` LOC each) + `index.ts`**

Notes:
- Every hook accepts standard filter/pagination args plus optional `{ enabled?: boolean }` where useful.
- Uses `select` or maps directly inside `queryFn` via `src/api/mappers/*` so components always receive clean mapped domain models.
- `useInvestigationDetailQuery(idOrSlug)`: helper `isUuid(value)` checks RFC 4122 UUID pattern -> routes to `getInvestigationById` vs `getInvestigationBySlug`.

- [ ] **Step 3: Run `npx vitest run tests/api/hooks.test.tsx`, verify pass, commit**

```powershell
npx vitest run tests/api/hooks.test.tsx
git -C FlameInFreewall_Tourbillion add src/hooks/api tests/api/hooks.test.tsx
git -C FlameInFreewall_Tourbillion commit -m "feat(hooks): add TanStack Query keys and typed API hooks"
```

---

## Task 6: Wire Dashboard & Experiment Explorer to TanStack Query

**Files:**
- Create: `FlameInFreewall_Tourbillion/src/components/dashboard/DashboardShimmer.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/app/(dashboard)/dashboard/page.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/dashboard/KpiStatCards.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/dashboard/CuratedStudiesGrid.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/dashboard/DomainBreakdown.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/app/(dashboard)/explorer/page.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/ExplorerFiltersBar.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/InvestigationCard.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/InvestigationTable.tsx`
- Modify: `FlameInFreewall_Tourbillion/tests/dashboard.test.tsx`
- Modify: `FlameInFreewall_Tourbillion/tests/explorer.test.tsx` (Explorer sections)

- [ ] **Step 1: Read remaining lines of Dashboard & Explorer components being edited**

Before editing, inspect `KpiStatCards.tsx` (lines 81–195), `CuratedStudiesGrid.tsx` (lines 81–240), `DomainBreakdown.tsx` (lines 81–198), `ExplorerFiltersBar.tsx`, `InvestigationCard.tsx`, `InvestigationTable.tsx`, and `explorer/page.tsx` (lines 101–231) so no existing UI detail or StructPaper constraint is accidentally lost.

- [ ] **Step 2: Implement Dashboard integration**

- `DashboardPage` calls `useDashboardSummaryQuery()` (or each component shares/consumes props passed down + fallback hook when rendered standalone so `<KpiStatCards />` / `<CuratedStudiesGrid />` / `<DomainBreakdown />` ALSO work when rendered standalone in unit tests!).
  - Pattern: accept optional `summary?: MappedDashboardSummary`, `isLoading?: boolean`, `error?: unknown`, `onRetry?: () => void`; if `summary` is omitted AND `useDashboardSummaryQuery` is active, fetch seamlessly via the hook. That avoids duplicate concurrent requests on `/dashboard` while keeping standalone component usage 100% reactive!
- `DashboardShimmer.tsx`: StructPaper shimmer skeletons for the 5 KPI cards, featured study cards, and domain breakdown cards.
- `KpiStatCards.tsx`: Renders live `investigationCount`, `runCount`, `claimCount`, `sourceCoverage` (`numerator / denominator` & ratio), and honest `"Not established"` state for `verifiedRunCount === null` (respecting `unavailableFields`).
- `CuratedStudiesGrid.tsx`: Renders `summary.featuredInvestigations` (API `MappedInvestigation` items) cleanly with study identifier badge (`psiId`), platform, tags, research purpose snippet, `+ Compare`, and `Inspect Study ->` linking to `/explorer/${study.slug ?? study.id}`. Displays provenance/synthetic caveat pill when `summary.context.caveats.length > 0`.
- `DomainBreakdown.tsx`: Shows provenance/collection breakdown when API distributions (`fuelDistribution`, `facilityDistribution`, `gravityDistribution`) are `null`, explicitly surfacing the backend `unavailableFields` reason (`UNSUPPORTED_MAPPING` / `"Unavailable in current PSI scope"`) instead of fake percentages, while rendering distributions automatically if a future phase returns non-null values!
- Dashboard header displays live study count from `summary?.investigationCount`.

- [ ] **Step 3: Implement Explorer integration**

- Update `ExplorerFiltersBar.tsx` + `explorer/page.tsx` (keeping NO `backdrop-blur-md`, NO `font-mono`, StructPaper `#F8F9FA`/`#D4FC02`, `< 300` LOC):
  - Query `useCatalogCapabilitiesQuery()` and `useInvestigationsQuery(params)`.
  - Map filter state directly to backend-supported params:
    - Search `q` (debounced cleanly or immediate state passed to query key)
    - `platform` filter
    - `material` filter
    - `gravityRaw` filter
    - `evidenceStatus` / `reviewStatus` or `tag` filter
    - Supported sorts: `title-asc`, `runs-desc` (never sending unsupported sorts `newest`/`code-asc`/`confidence` or unsupported filters `fuel`/`facility`/`gravity`/`category` to the backend!).
  - Pagination (`offset`, `limit: 20` capped by `capabilities.maxPageSize`) with Previous / Next controls.
  - Loading state renders `InvestigationCardShimmer`; Error state renders `<ApiErrorBanner error={error} onRetry={refetch} />`.
  - Update `InvestigationCard.tsx` and `InvestigationTable.tsx` to accept `MappedInvestigation` cleanly (`id`, `psiId`, `slug`, `title`, `platform`, `researchPurpose`, `tags`, `unavailableFields`, `context`), showing `psiId` + platform + tags + concise purpose + compare toggle + `Inspect Study` link (`/explorer/${inv.slug ?? inv.id}`).

- [ ] **Step 4: Update `tests/dashboard.test.tsx` & `tests/explorer.test.tsx`, run tests, commit**

- Wrap test renders with `renderWithQuery` and mock `@/api/services` (or `globalThis.fetch`) using `tests/fixtures/backendFixtures.ts`.
- Verify loading shimmer, live API data display, unavailable field notice (`verifiedRunCount: null`), and error retry behavior on both Dashboard and Explorer.
- Run `npx vitest run tests/dashboard.test.tsx tests/explorer.test.tsx`, verify pass, commit:
```powershell
git -C FlameInFreewall_Tourbillion add src/components/dashboard src/app/\(dashboard\)/dashboard src/app/\(dashboard\)/explorer/page.tsx src/components/explorer/ExplorerFiltersBar.tsx src/components/explorer/InvestigationCard.tsx src/components/explorer/InvestigationTable.tsx tests/dashboard.test.tsx tests/explorer.test.tsx
git -C FlameInFreewall_Tourbillion commit -m "feat(ui): wire Dashboard and Explorer to TanStack Query backend hooks"
```

---

## Task 7: Wire Study Detail (`/explorer/[id]`) & Multi-Study Comparison Modal + Full Verification

**Files:**
- Modify: `FlameInFreewall_Tourbillion/src/app/(dashboard)/explorer/[id]/page.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/app/(dashboard)/explorer/[id]/StudyDetailClient.tsx`
- Create: `FlameInFreewall_Tourbillion/src/components/explorer/detail/StudyDetailShimmer.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/detail/StudyHeader.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/detail/ChamberOverviewTab.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/detail/TestRunsTable.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/detail/TelemetryPane.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/detail/ClaimsList.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/detail/PsiExportTab.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/ComparisonModal.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/ComparisonMatrixTable.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/ComparisonColumn.tsx`
- Modify: `FlameInFreewall_Tourbillion/src/components/explorer/ParameterDeltaSummary.tsx`
- Modify: `FlameInFreewall_Tourbillion/tests/study-detail.test.tsx`
- Modify: `FlameInFreewall_Tourbillion/tests/comparison.test.tsx`

- [ ] **Step 1: Read the detail & comparison components first**

Read lines 1–160 of `StudyHeader.tsx`, `ChamberOverviewTab.tsx`, `TestRunsTable.tsx`, `TelemetryPane.tsx`, `ClaimsList.tsx`, `PsiExportTab.tsx`, `ComparisonMatrixTable.tsx`, `ComparisonColumn.tsx`, `ParameterDeltaSummary.tsx`, and remaining lines of `StudyDetailClient.tsx` + `ComparisonModal.tsx` before editing.

- [ ] **Step 2: Wire `StudyDetailClient.tsx` & detail tabs**

- `StudyDetailClient` resolves `id` (accepting either backend UUID or `slug`), runs:
  - `useInvestigationDetailQuery(id)`
  - `useInvestigationRunsQuery(study?.id)`
  - `useInvestigationMeasurementsQuery(study?.id)`
  - `useInvestigationSourcesQuery(study?.id)`
  - `useInvestigationClaimsQuery(study?.id)`
  - `useRunConditionsQuery(selectedRunId)` + `useRunMeasurementsQuery(selectedRunId)` when a run is inspected
- Keep optional `investigation?: MappedInvestigationDetail` prop override only if needed, or seed cleanly in tests via mocked services.
- Loading state shows `<StudyDetailShimmer />`; 404 shows `study-not-found`; other errors show `<ApiErrorBanner error={error} onRetry={refetch} />`.
- `StudyHeader.tsx`: displays `psiId`, `title`, `platform`, `tags`, `context.caveats`, run/source/claim totals (`runsCollection.total`, `sourcesCollection.total`, `claimsCollection.total`), and `+ Compare`.
- `ChamberOverviewTab.tsx`: displays `researchPurpose`, `platform`, tags, `unavailableFields` disclosure table, and `sources` citations (URL, DOI, documentType, ingestionStatus).
- `TestRunsTable.tsx` & `TelemetryPane.tsx`: render `MappedRun` rows (`externalRunKey`, `materialType`, `sampleGeometry`, `gravity`, `verification`), let user select a run to inspect `MappedCondition`s (`variable`, `valueNumeric`/`valueText`, `unit`, `dataStatus`) and `MappedMeasurement`s (`observable`, `measuredValue`, `uncertainty`, `unit`, `unavailableFields`) cleanly with loading/error states and NO `font-mono`.
- `ClaimsList.tsx`: renders `MappedClaim` items (`claimText`, `evidenceStatus`, `reviewStatus`, `limitation`, `createdAt`) and linked `ClaimSource` provenance (`sourceLocator`, `sourceExcerpt`, DOI/URL, plus explicit warning badge when `contextMismatch === true`).
- `PsiExportTab.tsx`: renders study/source export summary from real backend `MappedInvestigationDetail`, `MappedRun[]`, `MappedSource[]`, `MappedClaim[]`.

- [ ] **Step 3: Wire `ComparisonModal.tsx` & comparison subcomponents**

- `ComparisonModal.tsx` queries `useComparisonQuery(compareList, { observationLimit: 100 })` whenever `isOpen && compareList.length >= 2` (if 1 item selected, shows friendly prompt `"Select at least 2 studies to compare"` matching backend contract).
- Loading state shows shimmer skeleton; Error state shows `<ApiErrorBanner error={error} onRetry={refetch} />`.
- `ParameterDeltaSummary.tsx`: honestly displays `comparability: "not_established"` & unavailable deltas notice when `comparison.deltas === null` / `comparison.highlights === null`, plus `context.caveats`.
- `ComparisonMatrixTable.tsx` & `ComparisonColumn.tsx`: display each `MappedComparisonStudy` (study `psiId`, `title`, `platform`, tags, observation count, unique observables & measured range derived directly from `observations.items`, plus explicit `unavailableFields` markers where metadata isn't mapped yet).

- [ ] **Step 4: Update `tests/study-detail.test.tsx`, `tests/explorer.test.tsx` (detail tests), and `tests/comparison.test.tsx`**

- Mock backend services / fetch with `tests/fixtures/backendFixtures.ts`.
- Verify loading shimmers, error retries, UUID/slug resolution, runs/conditions/measurements/claims/sources display, `contextMismatch` warning, and `ComparisonModal` `POST /compare` request + `comparability: "not_established"` rendering.

- [ ] **Step 5: Run full verification suite & LOC audit**

Run in `FlameInFreewall_Tourbillion`:
```powershell
npx tsc --noEmit
npm test
```
Verify:
- `npx tsc --noEmit` exits `0` with zero errors.
- `npm test` (all Vitest test suites) exits `0` with all tests passing and pristine output.
- Check line counts of all modified/created files in `src/` to verify every file stays `< 300 LOC`.
- Check `grep` for prohibited `font-mono` or `backdrop-blur-md` in `ExplorerFiltersBar.tsx` on touched files.

Commit final task:
```powershell
git -C FlameInFreewall_Tourbillion add -A
git -C FlameInFreewall_Tourbillion commit -m "feat(ui): wire Study Detail and Comparison Modal to TanStack Query backend APIs"
```
