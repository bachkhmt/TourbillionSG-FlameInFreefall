import type {
  DescriptiveDto,
  StudyOverviewDto,
} from "@/api/services/evidenceNavigation";
export const descriptiveFixture: DescriptiveDto = {
  selection: {},
  selectionSemantics:
    "All source records within selected investigations; not condition-matched records.",
  investigationCount: 1,
  recordCount: 3,
  investigationDistribution: [
    {
      investigationId: "TEST_ONLY",
      psiId: "PSI-TEST",
      slug: "test-only",
      title: "TEST_ONLY",
      count: 3,
    },
  ],
  materialDistribution: [
    { label: "TEST_ONLY fuel", count: 2 },
    { label: "not recorded", count: 1 },
  ],
  gravityDistribution: [
    { label: "microgravity", count: 2 },
    { label: "unknown", count: 1 },
  ],
  missingMaterial: 1,
  missingGravity: 1,
  missingOxygen: 1,
  missingPressure: 1,
  oxygenRecordCount: 2,
  incompatibleConditions: 0,
  conditionPoints: [
    {
      runId: "TEST_ONLY_A",
      investigationId: "TEST_ONLY",
      slug: "test-only",
      oxygenPct: "21",
      oxygenBasis: "mole_percent",
      pressurePsi: "14.7",
      pressureUnit: "psia",
      oxygenMeaning: "chamber",
    },
  ],
  platforms: ["International Space Station (ISS)", "Cygnus Spacecraft"],
  gravities: ["microgravity", "unknown"],
  context: {
    collectionId: "TEST_ONLY",
    origin: "synthetic",
    reviewState: "unreviewed",
    caveats: [],
  },
};
export const overviewFixture: StudyOverviewDto = {
  investigationId: "TEST_ONLY",
  sourceRevision: "TEST_ONLY",
  passages: [],
  context: descriptiveFixture.context,
};
