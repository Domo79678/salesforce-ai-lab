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

    const discoveryValues = {
      desiredOutcome: "Reduce case escalation response time.",
      currentProcess: "Managers review escalated cases manually.",
      stakeholders: "Service operations, Service managers",
      successMetrics: "Cases reviewed within two business hours"
    };
    Object.entries(discoveryValues).forEach(([fieldName, value]) => {
      const field = element.shadowRoot.querySelector(
        `lightning-textarea[data-field="${fieldName}"]`
      );
      field.value = value;
      field.dispatchEvent(new CustomEvent("change"));
    });

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Review Before Building")
      .click();
    await Promise.resolve();

    expect(element.shadowRoot.textContent).toContain("Salesforce Flow");
    expect(element.shadowRoot.textContent).toContain("Ready to Design");
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

  it("teaches discovery and withholds a tool for incomplete requirements", async () => {
    const element = createElement("c-ask-before-you-build", {
      is: AskBeforeYouBuild
    });
    document.body.appendChild(element);

    element.shadowRoot
      .querySelector("lightning-combobox")
      .dispatchEvent(new CustomEvent("change", { detail: { value: "Flow" } }));
    const textarea =
      element.shadowRoot.querySelectorAll("lightning-textarea")[0];
    textarea.value =
      "Automatically remind sales reps when leads have not been contacted.";
    textarea.dispatchEvent(new CustomEvent("change"));
    element.shadowRoot.querySelector("lightning-checkbox-group").dispatchEvent(
      new CustomEvent("change", {
        detail: { value: ["Sales users"] }
      })
    );

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Review Before Building")
      .click();
    await Promise.resolve();

    expect(element.shadowRoot.textContent).toContain("Consultant Lens");
    expect(element.shadowRoot.textContent).toContain("Discovery Needed");
    expect(element.shadowRoot.textContent).toContain("Who owns the lead?");
    expect(element.shadowRoot.textContent).toContain(
      "What qualifies as contact?"
    );
    expect(element.shadowRoot.textContent).not.toContain("Salesforce Flow");
  });
});
