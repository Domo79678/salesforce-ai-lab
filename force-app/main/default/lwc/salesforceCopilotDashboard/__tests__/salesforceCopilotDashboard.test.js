import { createElement } from "@lwc/engine-dom";
import SalesforceCopilotDashboard from "c/salesforceCopilotDashboard";

const flushPromises = () => Promise.resolve();

describe("c-salesforce-copilot-dashboard", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders the Mission Control hierarchy and nonduplicated primary actions", () => {
    const element = createElement("c-salesforce-copilot-dashboard", {
      is: SalesforceCopilotDashboard
    });
    document.body.appendChild(element);

    const labels = [
      ...element.shadowRoot.querySelectorAll(".action-card lightning-button")
    ].map((button) => button.label);

    expect(labels).toEqual(["Explore Org", "Troubleshoot an Issue"]);
    expect(
      element.shadowRoot.querySelector("c-daily-brief-summary")
    ).toBeTruthy();
    expect(element.shadowRoot.querySelector("c-admin-task-center")).toBeNull();
    expect(element.shadowRoot.textContent).toContain(
      "Featured planning workspace"
    );
    expect(
      [...element.shadowRoot.querySelectorAll("lightning-button")].find(
        (button) => button.label === "Start Planning"
      )
    ).toBeTruthy();
    expect(
      element.shadowRoot.querySelector("lightning-progress-bar")
    ).toBeNull();
    expect(element.shadowRoot.textContent).not.toContain("Explain Metadata");

    const sections = [
      ...element.shadowRoot.querySelectorAll(
        ".dashboard-section, .featured-planning"
      )
    ];
    expect(sections[0].querySelector("c-daily-brief-summary")).toBeTruthy();
    expect(sections[1].textContent).toContain("Org Health Snapshot");
    expect(sections[2].textContent).toContain("Featured planning workspace");
  });

  it("launches Ask Before You Build and preserves Back navigation", async () => {
    const element = createElement("c-salesforce-copilot-dashboard", {
      is: SalesforceCopilotDashboard
    });
    document.body.appendChild(element);

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Start Planning")
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
    expect(header.textContent).toContain("High Priority");
    expect(header.textContent).toContain("2");
    expect(header.textContent).toContain("Recommended Actions");
    expect(header.textContent).toContain("3");
    expect(header.textContent).toContain("Last Analysis");
    expect(header.textContent).not.toContain("Modules");
    expect(header.textContent).not.toContain("Metadata");
    expect(element.shadowRoot.textContent).not.toContain("Recent Activity");
    expect(element.shadowRoot.textContent).not.toContain("Verified History");
  });

  it("renders the required compact registry destinations without duplicates", () => {
    const element = createElement("c-salesforce-copilot-dashboard", {
      is: SalesforceCopilotDashboard
    });
    document.body.appendChild(element);

    const workspaceLinks = [
      ...element.shadowRoot.querySelectorAll(".workspace-link")
    ];
    const labels = workspaceLinks.map((link) =>
      link.querySelector("h3").textContent.trim()
    );
    expect(labels).toEqual([
      "Knowledge Center",
      "Explain This",
      "Automation Advisor",
      "Flow Intelligence"
    ]);
    expect(labels).not.toContain("Daily Brief");
    expect(labels).not.toContain("Ask Before You Build");
  });

  it("moves the catalog and diagnostics behind dedicated actions", async () => {
    const element = createElement("c-salesforce-copilot-dashboard", {
      is: SalesforceCopilotDashboard
    });
    document.body.appendChild(element);

    const buttons = [
      ...element.shadowRoot.querySelectorAll("lightning-button")
    ];
    buttons.find((button) => button.label === "View All Tools").click();
    await flushPromises();
    expect(
      element.shadowRoot.querySelector("c-copilot-workspace-router").currentView
    ).toBe("allTools");

    element.shadowRoot
      .querySelector("c-copilot-workspace-router")
      .dispatchEvent(new CustomEvent("backtodashboard"));
    await flushPromises();

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Open Developer Tools")
      .click();
    await flushPromises();
    expect(
      element.shadowRoot.querySelector("c-copilot-workspace-router").currentView
    ).toBe("developerTools");
  });
});
