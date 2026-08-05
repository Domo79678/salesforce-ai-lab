import { createElement } from "@lwc/engine-dom";
import AdminActionCenter from "c/adminActionCenter";

describe("c-admin-action-center", () => {
  afterEach(() => {
    localStorage.clear();
    while (document.body.firstChild)
      document.body.removeChild(document.body.firstChild);
  });

  it("creates and renders an action from recommendation context", () => {
    const element = createElement("c-admin-action-center", {
      is: AdminActionCenter
    });
    element.launchContext = {
      createAction: true,
      actionContext: {
        title: "Review Account automation",
        sourceWorkspace: "Explain This",
        selectedAction: "Confirm dependencies"
      }
    };
    document.body.appendChild(element);
    const text = element.shadowRoot.textContent;
    expect(text).toContain("Review Account automation");
    expect(text).toContain("Needs Review");
    expect(text).toContain("Confirm dependencies");
    expect(text).toContain("browser only");
  });

  it("renders an empty state", () => {
    const element = createElement("c-admin-action-center", {
      is: AdminActionCenter
    });
    document.body.appendChild(element);
    expect(element.shadowRoot.textContent).toContain("No tracked actions yet");
  });
});
