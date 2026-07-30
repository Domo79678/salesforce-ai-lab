import { createElement } from "@lwc/engine-dom";
import CopilotWorkspaceRouter from "c/copilotWorkspaceRouter";

describe("c-copilot-workspace-router", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("preserves navigation back to the dashboard", () => {
    const element = createElement("c-copilot-workspace-router", {
      is: CopilotWorkspaceRouter
    });
    const handler = jest.fn();
    element.addEventListener("backtodashboard", handler);
    document.body.appendChild(element);

    element.shadowRoot.querySelector("lightning-button").click();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("returns contextual launches to the originating workspace", () => {
    const element = createElement("c-copilot-workspace-router", {
      is: CopilotWorkspaceRouter
    });
    element.workspaceContext = { sourceWorkspace: "dailyBrief" };
    const handler = jest.fn();
    element.addEventListener("workspacenavigate", handler);
    document.body.appendChild(element);

    element.shadowRoot.querySelector("lightning-button").click();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { destination: "dailyBrief", context: null }
      })
    );
  });

  it("shows an explicit unavailable state for an unregistered route", async () => {
    const element = createElement("c-copilot-workspace-router", {
      is: CopilotWorkspaceRouter
    });
    element.currentView = "unregisteredWorkspace";
    document.body.appendChild(element);
    await Promise.resolve();
    await Promise.resolve();

    expect(element.shadowRoot.textContent).toContain(
      "This workspace is not available."
    );
  });
});
