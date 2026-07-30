import { createElement } from "@lwc/engine-dom";
import AskBeforeYouBuild from "c/askBeforeYouBuild";

describe("c-ask-before-you-build", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("requires the guided workflow inputs", async () => {
    const element = createElement("c-ask-before-you-build", {
      is: AskBeforeYouBuild
    });
    document.body.appendChild(element);

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Review Before Building")
      .click();
    await Promise.resolve();

    expect(element.shadowRoot.textContent).toContain(
      "Select a change type and describe the business problem."
    );
  });

  it("renders deterministic consultant guidance and related routes", async () => {
    const element = createElement("c-ask-before-you-build", {
      is: AskBeforeYouBuild
    });
    document.body.appendChild(element);

    const combobox = element.shadowRoot.querySelector("lightning-combobox");
    combobox.dispatchEvent(
      new CustomEvent("change", { detail: { value: "Flow" } })
    );

    const textarea = element.shadowRoot.querySelector("lightning-textarea");
    textarea.value = "Notify service managers when a case escalates.";
    textarea.dispatchEvent(new CustomEvent("change"));

    const users = element.shadowRoot.querySelector("lightning-checkbox-group");
    users.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: ["Service users", "Managers"] }
      })
    );

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Review Before Building")
      .click();
    await Promise.resolve();

    expect(element.shadowRoot.textContent).toContain("Salesforce Flow");
    expect(element.shadowRoot.textContent).toContain(
      "Consultant Considerations"
    );

    const handler = jest.fn();
    element.addEventListener("workspacenavigate", handler);
    element.shadowRoot
      .querySelector('lightning-button[data-module="flowIntelligence"]')
      .click();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { moduleName: "flowIntelligence" }
      })
    );
  });
});
