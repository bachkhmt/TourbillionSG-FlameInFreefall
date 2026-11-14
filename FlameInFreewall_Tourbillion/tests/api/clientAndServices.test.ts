import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiClientError, apiGet, apiPost, apiRequest, buildQueryString, http } from '@/api/client';
import {
  getHealth,
  getReady,
  getCatalogCapabilities,
  listInvestigations,
  getInvestigationById,
  getInvestigationBySlug,
  getInvestigationTags,
  listInvestigationRuns,
  listRunConditions,
  listRunMeasurements,
  listInvestigationMeasurements,
  listInvestigationSources,
  listInvestigationClaims,
  listClaimSources,
  getDashboardSummary,
  compareInvestigations,
  ApiClientError as BarrelApiClientError,
} from '@/api/services';
import type { InvestigationFilterParamsDto, InvestigationListParamsDto } from '@/api/dto';
import {
  makeApiErrorEnvelopeDto,
  makeCapabilitiesDto,
  makeClaimDto,
  makeClaimSourceDto,
  makeComparisonDto,
  makeConditionDto,
  makeDashboardDto,
  makeInvestigationDetailDto,
  makeInvestigationDto,
  makeMeasurementDto,
  makeObservationDto,
  makePageDto,
  makeRunDto,
  makeSourceDto,
  makeTagDto,
} from '../fixtures/backendFixtures';

function makeOkResponse(
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
  statusText = 'OK'
): AxiosResponse {
  return {
    data,
    status,
    statusText,
    headers: {},
    config,
  };
}

function makeHttpError(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
  statusText = ''
): AxiosError {
  const response: AxiosResponse = {
    data,
    status,
    statusText,
    headers: {},
    config,
  };
  return new AxiosError(
    statusText || `Request failed with status code ${status}`,
    status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    response
  );
}

describe('Task 8: Axios Transport, Interceptors, Typed Client & All 16 Endpoint Services', () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const originalAdapter = http.defaults.adapter;
  let adapterMock: ReturnType<typeof vi.fn<AxiosAdapter>>;
  let capturedConfigs: InternalAxiosRequestConfig[];

  function getCapturedUrl(index: number): string {
    return http.getUri(capturedConfigs[index]);
  }

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
    capturedConfigs = [];
    adapterMock = vi.fn<AxiosAdapter>();
    http.defaults.adapter = async (config) => {
      capturedConfigs.push(config);
      return adapterMock(config);
    };
  });

  afterEach(() => {
    http.defaults.adapter = originalAdapter;
    vi.useRealTimers();
    if (originalBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
    }
  });

  describe('buildQueryString & paramsSerializer', () => {
    it('returns empty string when params are undefined, empty, or blank', () => {
      expect(buildQueryString()).toBe('');
      expect(buildQueryString({})).toBe('');
      expect(
        buildQueryString({
          q: undefined,
          platform: null,
          material: '',
          gravityRaw: '   ',
        })
      ).toBe('');
    });

    it('serializes defined camelCase params including 0 and false', () => {
      const qs = buildQueryString({
        q: 'microgravity flame',
        gravityRaw: '0g',
        offset: 0,
        limit: 20,
        includeAll: false,
        ignored: '',
      });
      expect(qs).toBe(
        '?q=microgravity+flame&gravityRaw=0g&offset=0&limit=20&includeAll=false'
      );
    });

    it('configures Axios paramsSerializer to drop blank/null/undefined keys', async () => {
      adapterMock.mockImplementationOnce(async (config) =>
        makeOkResponse(config, { status: 'ok', service: 'flameguard-api' })
      );

      await http.get('/investigations', {
        params: { q: 'soot', platform: '', material: null, gravityRaw: undefined, offset: 0 },
      });

      expect(getCapturedUrl(0)).toBe('http://127.0.0.1:8000/api/v1/investigations?q=soot&offset=0');
    });
  });

  describe('Axios instance, request/response interceptors & ApiClientError', () => {
    it('exports ApiClientError from services barrel and disables withCredentials', () => {
      expect(BarrelApiClientError).toBe(ApiClientError);
      expect(http.defaults.withCredentials).toBe(false);
    });

    it('normalizes path, updates dynamic baseURL, and omits Content-Type on GET', async () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = '/api/proxy/api/v1/';
      adapterMock.mockImplementationOnce(async (config) =>
        makeOkResponse(config, { status: 'ok', service: 'flameguard-api' })
      );

      const result = await apiRequest<{ status: string }>('health');
      expect(result.status).toBe('ok');

      const config = capturedConfigs[0];
      expect(config.baseURL).toBe('/api/proxy/api/v1');
      expect(getCapturedUrl(0)).toBe('/api/proxy/api/v1/health');
      expect(config.method).toBe('get');
      expect(config.withCredentials).toBe(false);
      expect(config.headers.get('Accept')).toBe('application/json');
      expect(config.headers.has('Content-Type')).toBe(false);
      expect(config.data).toBeUndefined();
    });

    it('attaches Content-Type: application/json when request body is present', async () => {
      const dto = makeComparisonDto();
      adapterMock.mockImplementationOnce(async (config) => makeOkResponse(config, dto));

      const result = await apiPost<typeof dto>('/compare', {
        investigationIds: ['inv-1', 'inv-2'],
      });

      expect(result.comparability).toBe('not_established');
      const config = capturedConfigs[0];
      expect(config.method).toBe('post');
      expect(config.headers.get('Accept')).toBe('application/json');
      expect(config.headers.get('Content-Type')).toBe('application/json');
      expect(JSON.parse(config.data as string)).toEqual({
        investigationIds: ['inv-1', 'inv-2'],
      });
    });

    it('supports apiGet helper with query params', async () => {
      adapterMock.mockImplementationOnce(async (config) =>
        makeOkResponse(config, makePageDto([makeInvestigationDto()]))
      );

      await apiGet('/investigations', { q: 'pmma', limit: 5, ignored: '  ' });
      expect(getCapturedUrl(0)).toBe('http://127.0.0.1:8000/api/v1/investigations?q=pmma&limit=5');
    });

    it('maps 404 ENTITY_NOT_FOUND envelope into ApiClientError', async () => {
      const envelope = makeApiErrorEnvelopeDto({
        error: {
          code: 'ENTITY_NOT_FOUND',
          message: 'Investigation not found',
          fields: ['investigationId'],
          supportedValues: [],
        },
      });
      adapterMock.mockImplementationOnce(async (config) => {
        throw makeHttpError(config, 404, envelope, 'Not Found');
      });

      await expect(apiRequest('/investigations/missing-id')).rejects.toMatchObject({
        name: 'ApiClientError',
        status: 404,
        code: 'ENTITY_NOT_FOUND',
        message: 'Investigation not found',
        fields: ['investigationId'],
        supportedValues: [],
        context: envelope.context,
      });
    });

    it('maps 422 UNSUPPORTED_CAPABILITY preserving supportedValues', async () => {
      const envelope = makeApiErrorEnvelopeDto({
        error: {
          code: 'UNSUPPORTED_CAPABILITY',
          message: 'Unsupported sort key',
          fields: ['sort'],
          supportedValues: ['title-asc', 'runs-desc'],
        },
      });
      adapterMock.mockImplementationOnce(async (config) => {
        throw makeHttpError(config, 422, envelope, 'Unprocessable Entity');
      });

      await expect(apiRequest('/investigations?sort=newest')).rejects.toMatchObject({
        status: 422,
        code: 'UNSUPPORTED_CAPABILITY',
        fields: ['sort'],
        supportedValues: ['title-asc', 'runs-desc'],
      });
    });

    it('maps /ready 503 ReadyDto into DATA_UNAVAILABLE ApiClientError', async () => {
      adapterMock.mockImplementationOnce(async (config) => {
        throw makeHttpError(
          config,
          503,
          { status: 'unavailable', service: 'flameguard-api', database: 'unavailable' },
          'Service Unavailable'
        );
      });

      await expect(getReady()).rejects.toMatchObject({
        status: 503,
        code: 'DATA_UNAVAILABLE',
        message: 'Database unavailable',
        fields: ['database'],
        supportedValues: [],
      });
    });

    it('maps non-JSON HTTP error responses to HTTP_ERROR', async () => {
      adapterMock.mockImplementationOnce(async (config) => {
        throw makeHttpError(config, 502, 'Bad Gateway', 'Bad Gateway');
      });

      await expect(apiRequest('/health')).rejects.toMatchObject({
        status: 502,
        code: 'HTTP_ERROR',
        message: 'Bad Gateway',
        fields: [],
        supportedValues: [],
      });
    });

    it('maps ERR_NETWORK errors to NETWORK_ERROR with status 0', async () => {
      adapterMock.mockImplementationOnce(async (config) => {
        throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
      });

      await expect(apiRequest('/health')).rejects.toMatchObject({
        status: 0,
        code: 'NETWORK_ERROR',
        fields: [],
        supportedValues: [],
      });
    });

    it('maps ECONNABORTED timeout to REQUEST_TIMEOUT with status 0', async () => {
      adapterMock.mockImplementationOnce(async (config) => {
        throw new AxiosError('timeout of 15ms exceeded', AxiosError.ECONNABORTED, config);
      });

      await expect(apiRequest('/health', { timeoutMs: 15 })).rejects.toMatchObject({
        status: 0,
        code: 'REQUEST_TIMEOUT',
        message: 'Request timed out',
      });
    });

    it('maps ERR_CANCELED / AbortSignal abort to NETWORK_ERROR with status 0', async () => {
      const external = new AbortController();
      adapterMock.mockImplementationOnce((config) => {
        return new Promise((_resolve, reject) => {
          const signal = config.signal as AbortSignal | undefined;
          signal?.addEventListener(
            'abort',
            () => reject(new AxiosError('canceled', AxiosError.ERR_CANCELED, config)),
            { once: true }
          );
        });
      });

      const promise = apiRequest('/health', { signal: external.signal, timeoutMs: 5000 });
      external.abort();

      await expect(promise).rejects.toMatchObject({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Request was aborted',
      });
    });
  });

  describe('All 16 Endpoint Services', () => {
    it('calls health and readiness endpoints', async () => {
      adapterMock
        .mockImplementationOnce(async (config) =>
          makeOkResponse(config, { status: 'ok', service: 'flameguard-api' })
        )
        .mockImplementationOnce(async (config) =>
          makeOkResponse(config, { status: 'ready', service: 'flameguard-api', database: 'ok' })
        );

      const health = await getHealth();
      const ready = await getReady();

      expect(health.status).toBe('ok');
      expect(ready.database).toBe('ok');
      expect(getCapturedUrl(0)).toBe('http://127.0.0.1:8000/api/v1/health');
      expect(getCapturedUrl(1)).toBe('http://127.0.0.1:8000/api/v1/ready');
    });

    it('calls all 5 catalog endpoints with encoded path segments and camelCase query keys', async () => {
      const caps = makeCapabilitiesDto();
      const invPage = makePageDto([makeInvestigationDto()]);
      const detail = makeInvestigationDetailDto();
      const tagPage = makePageDto([makeTagDto()]);

      adapterMock
        .mockImplementationOnce(async (config) => makeOkResponse(config, caps))
        .mockImplementationOnce(async (config) => makeOkResponse(config, invPage))
        .mockImplementationOnce(async (config) => makeOkResponse(config, detail))
        .mockImplementationOnce(async (config) => makeOkResponse(config, detail))
        .mockImplementationOnce(async (config) => makeOkResponse(config, tagPage));

      await getCatalogCapabilities();
      await listInvestigations({
        q: 'methane',
        platform: 'ISS',
        gravityRaw: '0g',
        sort: 'title-asc',
        offset: 10,
        limit: 25,
        fuel: 'should-be-stripped',
      } as unknown as InvestigationListParamsDto);
      await getInvestigationById('id/with space');
      await getInvestigationBySlug('slug/with space');
      await getInvestigationTags('inv/1', { offset: 0, limit: 50 });

      expect(getCapturedUrl(0)).toBe('http://127.0.0.1:8000/api/v1/catalog/capabilities');
      expect(getCapturedUrl(1)).toBe(
        'http://127.0.0.1:8000/api/v1/investigations?q=methane&platform=ISS&gravityRaw=0g&sort=title-asc&offset=10&limit=25'
      );
      expect(getCapturedUrl(2)).toBe(
        'http://127.0.0.1:8000/api/v1/investigations/id%2Fwith%20space'
      );
      expect(getCapturedUrl(3)).toBe(
        'http://127.0.0.1:8000/api/v1/investigations/by-slug/slug%2Fwith%20space'
      );
      expect(getCapturedUrl(4)).toBe(
        'http://127.0.0.1:8000/api/v1/investigations/inv%2F1/tags?offset=0&limit=50'
      );
    });

    it('calls all 4 runs and measurements endpoints', async () => {
      adapterMock
        .mockImplementationOnce(async (config) =>
          makeOkResponse(config, makePageDto([makeRunDto()]))
        )
        .mockImplementationOnce(async (config) =>
          makeOkResponse(config, makePageDto([makeConditionDto()]))
        )
        .mockImplementationOnce(async (config) =>
          makeOkResponse(config, makePageDto([makeMeasurementDto()]))
        )
        .mockImplementationOnce(async (config) =>
          makeOkResponse(config, makePageDto([makeObservationDto()]))
        );

      await listInvestigationRuns('inv/1', { offset: 0, limit: 10 });
      await listRunConditions('run/1', { offset: 5, limit: 15 });
      await listRunMeasurements('run/1', { offset: 0, limit: 20 });
      await listInvestigationMeasurements('inv/1', { offset: 20, limit: 40 });

      expect(getCapturedUrl(0)).toBe(
        'http://127.0.0.1:8000/api/v1/investigations/inv%2F1/runs?offset=0&limit=10'
      );
      expect(getCapturedUrl(1)).toBe(
        'http://127.0.0.1:8000/api/v1/runs/run%2F1/conditions?offset=5&limit=15'
      );
      expect(getCapturedUrl(2)).toBe(
        'http://127.0.0.1:8000/api/v1/runs/run%2F1/measurements?offset=0&limit=20'
      );
      expect(getCapturedUrl(3)).toBe(
        'http://127.0.0.1:8000/api/v1/investigations/inv%2F1/measurements?offset=20&limit=40'
      );
    });

    it('calls all 3 evidence endpoints', async () => {
      adapterMock
        .mockImplementationOnce(async (config) =>
          makeOkResponse(config, makePageDto([makeSourceDto()]))
        )
        .mockImplementationOnce(async (config) =>
          makeOkResponse(config, makePageDto([makeClaimDto()]))
        )
        .mockImplementationOnce(async (config) =>
          makeOkResponse(config, makePageDto([makeClaimSourceDto()]))
        );

      await listInvestigationSources('inv/1', { offset: 0, limit: 20 });
      await listInvestigationClaims('inv/1', { offset: 0, limit: 20 });
      await listClaimSources('claim/1', { offset: 1, limit: 5 });

      expect(getCapturedUrl(0)).toBe(
        'http://127.0.0.1:8000/api/v1/investigations/inv%2F1/sources?offset=0&limit=20'
      );
      expect(getCapturedUrl(1)).toBe(
        'http://127.0.0.1:8000/api/v1/investigations/inv%2F1/claims?offset=0&limit=20'
      );
      expect(getCapturedUrl(2)).toBe(
        'http://127.0.0.1:8000/api/v1/claims/claim%2F1/sources?offset=1&limit=5'
      );
    });

    it('calls getDashboardSummary with ONLY the 9 valid filter keys', async () => {
      adapterMock.mockImplementationOnce(async (config) =>
        makeOkResponse(config, makeDashboardDto())
      );

      await getDashboardSummary({
        q: 'soot',
        platform: 'ISS',
        material: 'PMMA',
        gravityRaw: '0g',
        tag: 'flame-spread',
        purpose: 'safety',
        sourceType: 'paper',
        evidenceStatus: 'verified',
        reviewStatus: 'curated',
        sort: 'title-asc',
        offset: 0,
        limit: 10,
        fuel: 'methane',
        facility: 'ZARM',
        gravity: 'microgravity',
        category: 'combustion',
      } as unknown as InvestigationFilterParamsDto);

      expect(getCapturedUrl(0)).toBe(
        'http://127.0.0.1:8000/api/v1/dashboard/summary?q=soot&platform=ISS&material=PMMA&gravityRaw=0g&tag=flame-spread&purpose=safety&sourceType=paper&evidenceStatus=verified&reviewStatus=curated'
      );
    });

    describe('compareInvestigations', () => {
      it('validates 2 to 3 distinct non-empty IDs locally without calling Axios adapter', async () => {
        await expect(compareInvestigations({ investigationIds: [] })).rejects.toMatchObject({
          status: 422,
          code: 'INVALID_REQUEST',
          fields: ['investigationIds'],
        });
        await expect(compareInvestigations({ investigationIds: ['only-one'] })).rejects.toMatchObject({
          status: 422,
          code: 'INVALID_REQUEST',
        });
        await expect(
          compareInvestigations({ investigationIds: ['id-1', '   '] })
        ).rejects.toMatchObject({
          status: 422,
          code: 'INVALID_REQUEST',
        });
        await expect(
          compareInvestigations({ investigationIds: ['id-1', 'id-1'] })
        ).rejects.toMatchObject({
          status: 422,
          code: 'INVALID_REQUEST',
        });
        await expect(
          compareInvestigations({ investigationIds: ['id-1', 'id-2', 'id-1'] })
        ).rejects.toMatchObject({
          status: 422,
          code: 'INVALID_REQUEST',
        });
        await expect(
          compareInvestigations({ investigationIds: ['1', '2', '3', '4'] })
        ).rejects.toMatchObject({
          status: 422,
          code: 'INVALID_REQUEST',
        });

        expect(adapterMock).not.toHaveBeenCalled();
      });

      it('POSTs trimmed investigationIds and optional pagination to /compare', async () => {
        const dto = makeComparisonDto();
        adapterMock.mockImplementationOnce(async (config) => makeOkResponse(config, dto));

        const result = await compareInvestigations({
          investigationIds: [' inv-1 ', 'inv-2'],
          observationOffset: 0,
          observationLimit: 10,
        });

        expect(result.comparability).toBe('not_established');
        const config = capturedConfigs[0];
        expect(getCapturedUrl(0)).toBe('http://127.0.0.1:8000/api/v1/compare');
        expect(config.method).toBe('post');
        expect(config.headers.get('Accept')).toBe('application/json');
        expect(config.headers.get('Content-Type')).toBe('application/json');
        expect(JSON.parse(config.data as string)).toEqual({
          investigationIds: ['inv-1', 'inv-2'],
          observationOffset: 0,
          observationLimit: 10,
        });
      });

      it('forwards backend 422 error envelope from POST /compare', async () => {
        const envelope = makeApiErrorEnvelopeDto({
          error: {
            code: 'ENTITY_NOT_FOUND',
            message: 'Unknown investigation id',
            fields: ['investigationIds'],
            supportedValues: [],
          },
        });
        adapterMock.mockImplementationOnce(async (config) => {
          throw makeHttpError(config, 422, envelope, 'Unprocessable Entity');
        });

        await expect(
          compareInvestigations({ investigationIds: ['inv-1', 'inv-missing'] })
        ).rejects.toMatchObject({
          status: 422,
          code: 'ENTITY_NOT_FOUND',
          fields: ['investigationIds'],
        });
      });
    });
  });
});
