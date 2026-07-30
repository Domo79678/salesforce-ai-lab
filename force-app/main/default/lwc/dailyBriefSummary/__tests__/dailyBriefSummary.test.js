import { createElement } from "@lwc/engine-dom";
import DailyBriefSummary from "c/dailyBriefSummary";

const RESULT = {
  metadataSnapshot: {
    sourceLabel: "Live Salesforce Metadata",
    retrievedAt: "2026-07-30T14:30:00.000Z"
  },
  analysisResult: {
    success: true,
    generatedAt: "2026-07-30T14:31:00.000Z",
    recommendations: [
      {
        id: "priority",
        priority: "High",
        title: "Review automation risk",
        action: "Inspect the highest-risk Flow.",
        category: "Automation"
      },
      {
        id: "action-1",
        priority: "Medium",
        title: "Review metadata coverage",
        category: "Metadata Coverage"
      },
      {
        id: "action-2",
        priority: "Low",
        title: "Document an object",
        category: "Documentation"
      },
      {
        id: "action-3",
        priority: "Low",
        title: "Review org health",
        category: "Org Health"
      }
    ],
    dailyBrief: {
      priorities: [{}, {}, {}, {}]
    },
    dashboardMetrics: {
      orgHealthScore: 84,
      orgHealthStatus: "Review"
    },
    deploymentReadiness: {
      riskLevel: "Medium",
      approvalRecommendation: "Complete targeted testing."
    }
  }
};

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-daily-brief-summary", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders a compact operational preview and publishes shared status", async () => {
    const element = createElement("c-daily-brief-summary", {
      is: DailyBriefSummary
    });
    element.operationsResult = RESULT;
    const handler = jest.fn();
    element.addEventListener("briefstatus", handler);
    document.body.appendChild(element);
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain("1 High Priority");
    expect(element.shadowRoot.textContent).toContain("3 Recommended Actions");
    expect(element.shadowRoot.textContent).toContain("Top priority");
    expect(element.shadowRoot.textContent).toContain("Review automation risk");
    expect(element.shadowRoot.textContent).toContain(
      "Review metadata coverage"
    );
    expect(element.shadowRoot.textContent).toContain(
      "Complete targeted testing."
    );
    expect(element.shadowRoot.querySelector("c-admin-task-center")).toBeNull();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          healthScore: 84,
          healthStatus: "Review",
          highPriorityCount: 1,
          recommendedActionCount: 3,
          analysisTimestamp: "2026-07-30T14:31:00.000Z"
        })
      })
    );
  });

  it("routes to the existing Daily Brief workspace", async () => {
    const element = createElement("c-daily-brief-summary", {
      is: DailyBriefSummary
    });
    element.operationsResult = RESULT;
    const handler = jest.fn();
    element.addEventListener("workspacenavigate", handler);
    document.body.appendChild(element);
    await flushPromises();

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "View Full Daily Brief")
      .click();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { moduleName: "dailyBrief" }
      })
    );
  });

  it("routes recommendation actions through the shared workspace event", async () => {
    const element = createElement("c-daily-brief-summary", {
      is: DailyBriefSummary
    });
    element.operationsResult = RESULT;
    const handler = jest.fn();
    element.addEventListener("workspacenavigate", handler);
    document.body.appendChild(element);
    await flushPromises();

    element.shadowRoot
      .querySelector('[data-module="flowIntelligence"]')
      .click();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ moduleName: "flowIntelligence" })
      })
    );
  });
});
