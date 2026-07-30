import { createElement } from "@lwc/engine-dom";
import AdminTaskCenter from "c/adminTaskCenter";

const ANALYSIS = {
  success: true,
  dashboardMetrics: {
    orgHealthScore: 82,
    orgHealthStatus: "Attention Needed"
  },
  deploymentReadiness: {
    riskLevel: "Medium",
    approvalRecommendation: "Complete targeted testing before deployment."
  },
  recommendations: [
    {
      id: "automation-risk",
      title: "Review active Flow",
      action: "Inspect the Flow before changing it.",
      priority: "High",
      category: "Automation",
      entityType: "Flow"
    },
    {
      id: "object-description",
      title: "Document the object",
      action: "Add missing business context.",
      priority: "Medium",
      category: "Documentation",
      entityType: "Object"
    }
  ]
};

describe("c-admin-task-center", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders deterministic recommendations and routes each card", async () => {
    const element = createElement("c-admin-task-center", {
      is: AdminTaskCenter
    });
    element.analysisResult = ANALYSIS;
    const handler = jest.fn();
    element.addEventListener("workspacenavigate", handler);
    document.body.appendChild(element);
    await Promise.resolve();

    const buttons = [
      ...element.shadowRoot.querySelectorAll("lightning-button")
    ];
    const flowButton = buttons.find(
      (button) => button.dataset.module === "flowIntelligence"
    );
    expect(flowButton).toBeTruthy();
    expect(element.shadowRoot.textContent).toContain("Today’s Admin Brief");
    expect(element.shadowRoot.querySelectorAll(".task-row")).toHaveLength(1);

    flowButton.click();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ moduleName: "flowIntelligence" })
      })
    );
  });

  it("publishes metadata and analysis status to the compact hero", async () => {
    const element = createElement("c-admin-task-center", {
      is: AdminTaskCenter
    });
    element.analysisResult = ANALYSIS;
    const handler = jest.fn();
    element.addEventListener("adminbriefstatus", handler);
    document.body.appendChild(element);
    await Promise.resolve();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          metadataStatus: "Shared metadata",
          analysisStatus: "Deterministic analysis ready",
          healthScore: 82,
          healthStatus: "Attention Needed",
          riskLevel: "Medium",
          riskNotice: "Complete targeted testing before deployment."
        }
      })
    );
  });
});
