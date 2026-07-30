import { createElement } from "@lwc/engine-dom";
import DeveloperToolsWorkspace from "c/developerToolsWorkspace";

describe("c-developer-tools-workspace", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("relocates the required technical diagnostics", () => {
    const element = createElement("c-developer-tools-workspace", {
      is: DeveloperToolsWorkspace
    });
    document.body.appendChild(element);

    const text = element.shadowRoot.textContent;
    expect(text).toContain("Diagnostics");
    expect(text).toContain("Source Coverage");
    expect(text).toContain("Metadata Cache");
    expect(text).toContain("Services");
    expect(text).toContain("Registry");
    expect(text).toContain("Routing Diagnostics");
    expect(text).toContain("Verified History");
    expect(
      element.shadowRoot.querySelector("c-org-context-viewer")
    ).toBeTruthy();
  });
});
