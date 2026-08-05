import { createElement } from "@lwc/engine-dom";
import SalesforceCopilotDashboard from "c/salesforceCopilotDashboard";

const flushPromises = () => Promise.resolve();

describe("c-salesforce-copilot-dashboard", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders the compact Mission Control hierarchy and utility actions", () => {
    const element = createElement("c-salesforce-copilot-dashboard", {
      is: SalesforceCopilotDashboard
    });
    document.body.appendChild(element);

    const labels = [
      ...element.shadowRoot.querySelectorAll(
        ".utility-actions lightning-button"
      )
    ].map((button) => button.label);

    expect(labels).toEqual(["Explore Org", "Troubleshoot", "View All Tools"]);
    expect(
      element.shadowRoot.querySelector("c-daily-brief-summary")
    ).toBeTruthy();
    expect(element.shadowRoot.querySelector("c-admin-task-center")).toBeNull();
    expect(element.shadowRoot.textContent).toContain("Plan a change");
    expect(
      [...element.shadowRoot.querySelectorAll("lightning-button")].find(
        (button) => button.label === "Start Planning →"
      )
    ).toBeTruthy();
    expect(
      element.shadowRoot.querySelector("lightning-progress-bar")
    ).toBeNull();
    expect(element.shadowRoot.textContent).not.toContain("Explain Metadata");

    expect(element.shadowRoot.querySelector(".brief-section")).toBeTruthy();
    expect(element.shadowRoot.querySelector(".status-strip")).toBeTruthy();
    expect(element.shadowRoot.querySelector(".planning-strip")).toBeTruthy();
    expect(element.shadowRoot.querySelector(".utility-actions")).toBeTruthy();
  });

  it("launches Ask Before You Build and preserves Back navigation", async () => {
    const element = createElement("c-salesforce-copilot-dashboard", {
      is: SalesforceCopilotDashboard
    });
    document.body.appendChild(element);

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Start Planning →")
      .click();
    await flushPromises();

    const router = element.shadowRoot.querySelector(
      "c-copilot-workspace-router"
    );
    expect(router.currentView).toBe("askBeforeYouBuild");

    router.dispatchEvent(
      new CustomEvent("backtodashboard", { bubbles: true, composed: true })
    );
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("c-copilot-workspace-router")
    ).toBeNull();
  });

  it("routes both compact Org Health actions to the existing workspace", async () => {
    const element = createElement("c-salesforce-copilot-dashboard", {
      is: SalesforceCopilotDashboard
    });
    document.body.appendChild(element);

    const healthActions = [
      ...element.shadowRoot.querySelectorAll("lightning-button")
    ].filter((button) => button.label === "Review Org Health →");
    expect(healthActions).toHaveLength(2);

    healthActions[0].click();
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("c-copilot-workspace-router").currentView
    ).toBe("orgHealthDashboard");
  });

  it("shows organization state in the header and removes history from Home", async () => {
    const element = createElement("c-salesforce-copilot-dashboard", {
      is: SalesforceCopilotDashboard
    });
    document.body.appendChild(element);

    element.shadowRoot.querySelector("c-daily-brief-summary").dispatchEvent(
      new CustomEvent("briefstatus", {
        detail: {
          healthScore: 84,
          healthStatus: "Review",
          highPriorityCount: 2,
          recommendedActionCount: 3,
          analysisTimestamp: "2026-07-30T14:30:00.000Z",
          riskNotice: "Complete targeted testing."
        }
      })
    );
    await flushPromises();

    const header = element.shadowRoot.querySelector(".hero");
    expect(header.textContent).toContain("Org Health");
    expect(header.textContent).toContain("84/100");
    expect(header.textContent).toContain("Review");
    expect(header.textContent).toContain("High Priority");
    expect(header.textContent).toContain("2");
    expect(header.textContent).toContain("Requires Review");
    expect(header.textContent).toContain("Recommended Actions");
    expect(header.textContent).toContain("3");
    expect(header.textContent).toContain("Open Items");
    expect(header.textContent).toContain("Last Analysis");
    expect(header.textContent).toContain("Current Snapshot");
    expect(header.querySelectorAll(".kpi-card")).toHaveLength(4);
    expect(header.textContent).not.toContain("Modules");
    expect(header.textContent).not.toContain("Metadata");
    expect(element.shadowRoot.textContent).not.toContain("Recent Activity");
    expect(element.shadowRoot.textContent).not.toContain("Verified History");
  });

  it("renders safe KPI fallback values and context before analysis", () => {
    const element = createElement("c-salesforce-copilot-dashboard", {
      is: SalesforceCopilotDashboard
    });
    document.body.appendChild(element);

    const header = element.shadowRoot.querySelector(".hero");
    expect(header.textContent).toContain("Not available");
    expect(header.textContent).toContain("Checking");
    expect(header.textContent).toContain("No Urgent Items");
    expect(header.textContent).toContain("No Open Items");
    expect(header.textContent).toContain("Awaiting Analysis");
  });

  it("removes duplicate catalog and developer links from Mission Control", () => {
    const element = createElement("c-salesforce-copilot-dashboard", {
      is: SalesforceCopilotDashboard
    });
    document.body.appendChild(element);

    expect(element.shadowRoot.querySelector(".workspace-grid")).toBeNull();
    expect(element.shadowRoot.querySelector(".developer-link")).toBeNull();
    expect(element.shadowRoot.textContent).not.toContain("Knowledge Center");
    expect(element.shadowRoot.textContent).not.toContain("Automation Advisor");
    expect(element.shadowRoot.textContent).not.toContain("Flow Intelligence");
    expect(element.shadowRoot.textContent).not.toContain("Developer Tools");
  });

  it.each([
    ["Explore Org", "orgExplorer"],
    ["Troubleshoot", "troubleshootingAssistant"],
    ["View All Tools", "allTools"]
  ])(
    "routes %s through the existing workspace router",
    async (label, route) => {
      const element = createElement("c-salesforce-copilot-dashboard", {
        is: SalesforceCopilotDashboard
      });
      document.body.appendChild(element);

      [...element.shadowRoot.querySelectorAll("lightning-button")]
        .find((button) => button.label === label)
        .click();
      await flushPromises();

      expect(
        element.shadowRoot.querySelector("c-copilot-workspace-router")
          .currentView
      ).toBe(route);
    }
  );
});
