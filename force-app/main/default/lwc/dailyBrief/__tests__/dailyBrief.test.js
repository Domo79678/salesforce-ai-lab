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
    deploymentReadinessStatus: "Review",
    totalFindings: 2
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
    },
    {
      id: "recommendation-2",
      title: "Add field help text",
      action: "Document what users should enter and why it matters.",
      priority: "Medium",
      category: "Documentation",
      moduleName: "explainThis"
    },
    {
      id: "recommendation-3",
      title: "Confirm release tests",
      action: "Review the required tests before approving deployment.",
      priority: "Medium",
      category: "Deployment",
      moduleName: "orgHealthDashboard"
    },
    {
      id: "recommendation-4",
      title: "Assign documentation ownership",
      action: "Confirm an administrator owns the documentation update.",
      priority: "Low",
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
      total: 2,
      top: [
        {
          id: "finding-1",
          title: "Review required fields",
          summary: "Required field behavior needs administrator review."
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
      },
      {
        rank: 2,
        title: "Add field help text",
        action: "Document what users should enter and why it matters.",
        priority: "medium",
        category: "Documentation",
        moduleName: "explainThis"
      },
      {
        rank: 3,
        title: "Confirm release tests",
        action: "Review the required tests before approving deployment.",
        priority: "medium",
        category: "Deployment",
        moduleName: "orgHealthDashboard"
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
    expect(text).toContain("Jordan");
    expect(text).toContain("Daily Admin Brief");
    expect(text).toContain("Today’s Status");
    expect(text).toContain("Top Priority");
    expect(text).toContain("Recommended Actions");
    expect(text).toContain("Add field help text");
    expect(text).toContain("Operational Readiness");
    expect(text).toContain("More Context");
    expect(text).toContain("Healthy");
    expect(text).toContain("Partial Coverage");
    expect(text).toContain("Document required fields");
    expect(text).toContain("Review required fields");
    expect(text).toContain("Documentation Gaps");
    expect(text).toContain("Deployment Readiness");
    expect(text).toContain("End-of-Day Checklist");
    expect(element.shadowRoot.querySelector("c-admin-task-center")).toBeNull();
    const contextSections = [
      ...element.shadowRoot.querySelectorAll(".more-context details")
    ];
    expect(contextSections).toHaveLength(3);
    expect(contextSections.every((section) => section.open === false)).toBe(
      true
    );
    expect(text).not.toContain("Domonique");
    expect(text).not.toContain("84%");
  });

  it("routes the integrated top-priority workspace action", async () => {
    const element = createElement("c-daily-brief", {
      is: DailyBrief
    });
    const handler = jest.fn();

    element.addEventListener("workspacenavigate", handler);
    document.body.appendChild(element);
    await flushPromises();

    const button = [
      ...element.shadowRoot.querySelectorAll("lightning-button")
    ].find((candidate) => candidate.label === "Explain This →");

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

  it("preserves Explain This navigation from recent findings", async () => {
    const element = createElement("c-daily-brief", {
      is: DailyBrief
    });
    const handler = jest.fn();

    element.addEventListener("workspacenavigate", handler);
    document.body.appendChild(element);
    await flushPromises();

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((candidate) => candidate.label === "Explain This →")
      .click();

    const findingButton = element.shadowRoot.querySelector(
      '.finding-list lightning-button[data-id="finding-1"]'
    );
    findingButton.click();

    expect(handler.mock.calls[1][0].detail).toEqual(
      expect.objectContaining({
        moduleName: "explainThis",
        context: expect.objectContaining({ sourceType: "finding" })
      })
    );
  });

  it("derives a safe presentation name from display-name data", async () => {
    loadDailyBriefOperations.mockResolvedValue({
      metadataSnapshot: {
        ...SNAPSHOT,
        organization: { userName: "Domonique VibeForce" }
      },
      analysisResult: ANALYSIS
    });
    const element = createElement("c-daily-brief", {
      is: DailyBrief
    });

    document.body.appendChild(element);
    await flushPromises();

    expect(element.shadowRoot.querySelector("h1").textContent).toContain(
      ", Domonique"
    );
    expect(element.shadowRoot.textContent).not.toContain("VibeForce");
  });

  it("renders safe fallback content when optional analysis data is missing", async () => {
    loadDailyBriefOperations.mockResolvedValue({
      metadataSnapshot: { success: true, organization: {} },
      analysisResult: { success: true, dailyBrief: {} }
    });
    const element = createElement("c-daily-brief", {
      is: DailyBrief
    });

    document.body.appendChild(element);
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain(
      "Salesforce Administrator"
    );
    expect(element.shadowRoot.textContent).toContain("Not available");
    expect(element.shadowRoot.textContent).toContain(
      "No priority was generated"
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
