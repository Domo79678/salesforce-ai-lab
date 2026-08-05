import { createElement } from "@lwc/engine-dom";
import OrgKnowledgeViewer from "c/orgKnowledgeViewer";
import { runOrgKnowledgeAnalysis } from "../analysisRunner";

jest.mock("../analysisRunner", () => ({
  runOrgKnowledgeAnalysis: jest.fn(),
  getPrimaryErrorMessage: jest.fn(() => "Analysis failed")
}));

const ANALYSIS_RESULT = {
  success: true,
  generatedAt: "2026-08-05T15:26:00.000Z",
  organization: { name: "Portable Test Org" },
  health: {
    overallScore: 84,
    status: "Needs Attention",
    categories: [{ category: "Documentation", score: 62, riskLevel: "High" }]
  },
  deploymentReadiness: { score: 93, status: "Ready", blockers: [] },
  dashboardMetrics: {
    orgHealthScore: 84,
    orgHealthStatus: "Needs Attention",
    deploymentReadinessScore: 93,
    deploymentReadinessStatus: "Ready",
    totalFindings: 2,
    blockingFindings: 0,
    lowestCategory: "Documentation",
    lowestCategoryScore: 62,
    highestRiskCategory: "Documentation",
    highestRiskLevel: "High"
  },
  metadataCounts: { objects: 25, fields: 483 },
  findings: [
    {
      id: "finding-1",
      title: "Document ownership",
      summary: "Ownership is not documented.",
      severity: "High",
      category: "Documentation",
      entityApiName: "Account"
    },
    {
      id: "finding-2",
      title: "Review field usage",
      summary: "Confirm whether the field is still required.",
      severity: "Medium",
      category: "Data Model",
      entityApiName: "Account.Legacy__c"
    }
  ],
  recommendations: [],
  dailyBrief: { priorities: [] }
};

const RUNNER_RESULT = {
  success: true,
  analysisResult: ANALYSIS_RESULT,
  organization: { name: "Portable Test Org" },
  objectInventory: Array.from({ length: 100 }, (_, index) => ({
    apiName: `Object${index}__c`
  })),
  connectedObjectNames: ["Account"],
  coverage: {
    inventoryObjectCount: 100,
    detailedObjectCount: 25,
    failedObjectCount: 0
  },
  timing: {
    startedAt: "2026-08-05T15:25:58.500Z",
    completedAt: "2026-08-05T15:26:00.000Z",
    durationMilliseconds: 1500
  },
  warnings: []
};

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-org-knowledge-viewer", () => {
  beforeEach(() => {
    runOrgKnowledgeAnalysis.mockResolvedValue(RUNNER_RESULT);
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  async function createViewer(scanMode) {
    const element = createElement("c-org-knowledge-viewer", {
      is: OrgKnowledgeViewer
    });
    if (scanMode) element.scanMode = scanMode;
    document.body.appendChild(element);
    await flushPromises();
    return element;
  }

  it("renders connected-org identity, scan status, and compact knowledge snapshot", async () => {
    const element = await createViewer("Standard");
    const text = element.shadowRoot.textContent;

    expect(text).toContain("Org Knowledge");
    expect(text).toContain("Portable Test Org");
    expect(text).toContain("Live Salesforce metadata");
    expect(text).toContain("Standard");
    expect(text).toContain("1.50 seconds");

    const snapshot = element.shadowRoot.querySelector(".knowledge-snapshot");
    expect(snapshot.textContent).toContain("84/100");
    expect(snapshot.textContent).toContain("25 / 100");
    expect(snapshot.textContent).toContain("2");
    expect(snapshot.textContent).toContain("0 blocking");
    expect(snapshot.textContent).toContain("93/100");
  });

  it("uses existing analysis values in What We Know and supported consumers", async () => {
    const element = await createViewer();
    const insights = element.shadowRoot.querySelector(".what-we-know");
    expect(insights.textContent).toContain("Documentation");
    expect(insights.textContent).toContain("High");
    expect(insights.textContent).toContain("483 fields analyzed");

    const reuse = element.shadowRoot.querySelector(".shared-engine-panel");
    expect(reuse.textContent).toContain("Used Across Your Workspace");
    expect(reuse.textContent).toContain("Explain This");
    expect(reuse.textContent).toContain("Change Impact");
    expect(reuse.textContent).toContain("Deployment Readiness");
  });

  it("keeps refresh and the public scanMode contract functional", async () => {
    const element = await createViewer("Quick");
    expect(runOrgKnowledgeAnalysis).toHaveBeenLastCalledWith(
      expect.objectContaining({ scanMode: "Quick" })
    );

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Refresh Knowledge")
      .click();
    await flushPromises();
    expect(runOrgKnowledgeAnalysis).toHaveBeenCalledTimes(2);
  });

  it("selects the existing Findings and Metadata Coverage tabs", async () => {
    const element = await createViewer();
    const tabset = element.shadowRoot.querySelector("lightning-tabset");
    const buttons = [
      ...element.shadowRoot.querySelectorAll("lightning-button")
    ];

    buttons.find((button) => button.label === "Review Findings →").click();
    await flushPromises();
    expect(tabset.activeTabValue).toBe("findings");

    buttons.find((button) => button.label === "Explore Coverage →").click();
    await flushPromises();
    expect(tabset.activeTabValue).toBe("coverage");
  });

  it("renders a compact Findings investigation hierarchy", async () => {
    const element = await createViewer();
    const summary = element.shadowRoot.querySelector(".findings-summary");
    expect(summary.textContent).toContain("2");
    expect(summary.textContent).toContain("High / Critical");
    expect(summary.textContent).toContain("1");
    expect(summary.textContent).toContain("0");

    const attention = element.shadowRoot.querySelector(".attention-section");
    expect(attention.textContent).toContain("Documentation");
    expect(attention.textContent).toContain("Data Model");

    const startHere = element.shadowRoot.querySelector(".start-here");
    expect(startHere.textContent).toContain("Start Here: Documentation");

    const disclosures = [
      ...element.shadowRoot.querySelectorAll(".finding-disclosures details")
    ];
    expect(disclosures).toHaveLength(2);
    expect(disclosures.every((item) => item.open === false)).toBe(true);
    expect(element.shadowRoot.textContent).toContain("Document ownership");
  });

  it("preserves contextual Explain This navigation for a finding", async () => {
    const element = await createViewer();
    const handler = jest.fn();
    element.addEventListener("workspacenavigate", handler);

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find(
        (button) =>
          button.label === "Explain This →" && button.dataset.id === "finding-1"
      )
      .click();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          moduleName: "explainThis",
          context: expect.objectContaining({
            sourceWorkspace: "knowledgeCenter",
            sourceType: "finding",
            findingId: "finding-1",
            title: "Document ownership",
            severity: "High",
            entityApiName: "Account"
          })
        })
      })
    );
  });

  it("filters findings safely and renders a concise empty result", async () => {
    const element = await createViewer();
    const search = [
      ...element.shadowRoot.querySelectorAll(".finding-filters lightning-input")
    ].find((input) => input.label === "Search findings");
    search.value = "not present";
    search.dispatchEvent(new CustomEvent("change"));
    await flushPromises();
    expect(element.shadowRoot.textContent).toContain(
      "No findings match the current explorer filters."
    );
  });

  it("fails safely when optional analysis values are missing", async () => {
    runOrgKnowledgeAnalysis.mockResolvedValue({
      ...RUNNER_RESULT,
      analysisResult: { success: true },
      organization: null,
      objectInventory: [],
      coverage: {}
    });
    const element = await createViewer();
    expect(element.shadowRoot.textContent).toContain("Unknown Organization");
    expect(
      element.shadowRoot.querySelector(".knowledge-snapshot")
    ).not.toBeNull();
  });
});
