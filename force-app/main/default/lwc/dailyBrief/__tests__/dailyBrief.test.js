import { createElement } from "@lwc/engine-dom";
import DailyBrief from "c/dailyBrief";
import { loadDailyBriefOperations } from "c/dailyBriefService";

jest.mock(
  "c/copilotCore",
  () => ({
    DATA_SOURCE_LABELS: {
      unavailable: "Salesforce Metadata Unavailable"
    },
    DATA_SOURCE_TYPES: {
      UNAVAILABLE: "unavailable"
    },
    DEFAULT_SNAPSHOT_OPTIONS: {}
  }),
  { virtual: true }
);

jest.mock(
  "c/dailyBriefService",
  () => ({
    loadDailyBriefOperations: jest.fn()
  }),
  { virtual: true }
);

const SNAPSHOT = {
  success: true,
  sourceLabel: "Live Salesforce Metadata — Partial Coverage",
  retrievedAt: "2026-07-30T14:30:00.000Z",
  organization: {
    userName: "Jordan Lee"
  },
  coverage: {
    label: "Partial Coverage",
    selectedObjectCount: 6,
    inventoryObjectCount: 125
  }
};

const ANALYSIS = {
  success: true,
  dashboardMetrics: {
    orgHealthScore: 88,
    orgHealthStatus: "Healthy",
    deploymentReadinessStatus: "Review"
  },
  deploymentReadiness: {
    status: "Review",
    approvalRecommendation: "Complete targeted testing before deployment.",
    requiredTests: [
      "Review unresolved findings",
      "Document the release decision"
    ]
  },
  findings: [
    {
      id: "documentation-1",
      category: "Documentation",
      title: "Document required fields"
    }
  ],
  recommendations: [
    {
      id: "recommendation-1",
      title: "Document required fields",
      action: "Confirm ownership and business purpose.",
      priority: "High",
      category: "Documentation",
      moduleName: "explainThis"
    }
  ],
  dailyBrief: {
    headline: "2 Org Health findings are available for review.",
    orgHealth: {
      score: 88,
      status: "Healthy"
    },
    findings: {
      top: [
        {
          id: "finding-1",
          title: "Review required fields"
        }
      ]
    },
    priorities: [
      {
        rank: 1,
        title: "Document required fields",
        action: "Confirm ownership and business purpose.",
        priority: "high",
        category: "Documentation",
        moduleName: "explainThis"
      }
    ]
  }
};

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-daily-brief", () => {
  beforeEach(() => {
    loadDailyBriefOperations.mockResolvedValue({
      metadataSnapshot: SNAPSHOT,
      analysisResult: ANALYSIS
    });
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }

    jest.clearAllMocks();
  });

  it("renders the shared snapshot and Daily Brief analysis", async () => {
    const element = createElement("c-daily-brief", {
      is: DailyBrief
    });

    document.body.appendChild(element);
    await flushPromises();

    const text = element.shadowRoot.textContent;

    expect(loadDailyBriefOperations).toHaveBeenCalledTimes(1);
    expect(text).toContain("Jordan Lee");
    expect(text).toContain("Healthy");
    expect(text).toContain("Partial Coverage");
    expect(text).toContain("Document required fields");
    expect(text).toContain("Review required fields");
    expect(text).toContain("Documentation Gaps");
    expect(text).toContain("Deployment Readiness");
    expect(text).toContain("End-of-Day Checklist");
    expect(
      element.shadowRoot.querySelector("c-admin-task-center")
    ).toBeTruthy();
    expect(text).not.toContain("Domonique");
    expect(text).not.toContain("84%");
  });

  it("routes the suggested workspace through shared recommendation routing", async () => {
    const element = createElement("c-daily-brief", {
      is: DailyBrief
    });
    const handler = jest.fn();

    element.addEventListener("workspacenavigate", handler);
    document.body.appendChild(element);
    await flushPromises();

    const button = [
      ...element.shadowRoot.querySelectorAll("lightning-button")
    ].find((candidate) => candidate.label === "Open Recommended Workspace");

    button.click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual(
      expect.objectContaining({
        moduleName: "explainThis",
        context: expect.objectContaining({
          sourceWorkspace: "dailyBrief",
          sourceType: "priority",
          title: "Document required fields"
        })
      })
    );
  });

  it("shows an actionable error when the shared snapshot fails", async () => {
    loadDailyBriefOperations.mockRejectedValue(
      new Error("Snapshot unavailable")
    );

    const element = createElement("c-daily-brief", {
      is: DailyBrief
    });

    document.body.appendChild(element);
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain("Snapshot unavailable");
    expect(element.shadowRoot.querySelector('[role="alert"]')).not.toBeNull();
  });
});
