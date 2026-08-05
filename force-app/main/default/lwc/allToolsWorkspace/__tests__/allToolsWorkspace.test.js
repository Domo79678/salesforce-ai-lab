import { createElement } from "@lwc/engine-dom";
import AllToolsWorkspace from "c/allToolsWorkspace";

describe("c-all-tools-workspace", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("shows available tools before collapsed planned tools", () => {
    const element = createElement("c-all-tools-workspace", {
      is: AllToolsWorkspace
    });
    document.body.appendChild(element);

    expect(element.shadowRoot.textContent).toContain("Available Workspaces");
    expect(element.shadowRoot.textContent).toContain("Org Knowledge");
    expect(
      element.shadowRoot.querySelector("lightning-accordion-section").label
    ).toBe("Coming Soon");
    expect(
      element.shadowRoot.querySelector("lightning-progress-bar")
    ).toBeNull();
  });

  it("uses the shared workspace navigation contract", () => {
    const element = createElement("c-all-tools-workspace", {
      is: AllToolsWorkspace
    });
    const handler = jest.fn();
    element.addEventListener("workspacenavigate", handler);
    document.body.appendChild(element);

    element.shadowRoot.querySelector("lightning-button").click();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ moduleName: expect.any(String) })
      })
    );
  });
});
