import { createElement } from "@lwc/engine-dom";
import OrgHealthSummaryMetrics from "c/orgHealthSummaryMetrics";

const CARDS = [
  {
    id: "critical",
    label: "Critical",
    value: 2,
    iconName: "utility:error",
    cardClass: "metric-card metric-card-critical"
  },
  {
    id: "high",
    label: "High Risk",
    value: 3,
    iconName: "utility:warning",
    cardClass: "metric-card metric-card-high"
  },
  {
    id: "blocking",
    label: "Blockers",
    value: 0,
    iconName: "utility:block_visitor",
    cardClass: "metric-card metric-card-blocking"
  },
  {
    id: "recommendations",
    label: "Actions",
    value: 4,
    iconName: "utility:light_bulb",
    cardClass: "metric-card metric-card-recommendation"
  }
];

describe("c-org-health-summary-metrics", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders the supplied summary cards in order", () => {
    const element = createElement("c-org-health-summary-metrics", {
      is: OrgHealthSummaryMetrics
    });

    element.cards = CARDS;
    document.body.appendChild(element);

    const cards = element.shadowRoot.querySelectorAll(".metric-card");

    expect(cards).toHaveLength(4);
    expect(
      [...cards].map((card) => card.querySelector("span").textContent.trim())
    ).toEqual(["Critical", "High Risk", "Blockers", "Actions"]);
    expect(
      [...cards].map((card) => card.querySelector("strong").textContent.trim())
    ).toEqual(["2", "3", "0", "4"]);
  });

  it("preserves card variants and icon properties", () => {
    const element = createElement("c-org-health-summary-metrics", {
      is: OrgHealthSummaryMetrics
    });

    element.cards = CARDS;
    document.body.appendChild(element);

    const cards = element.shadowRoot.querySelectorAll(".metric-card");
    const icons = element.shadowRoot.querySelectorAll("lightning-icon");

    expect(cards[0].classList.contains("metric-card-critical")).toBe(true);
    expect(cards[3].classList.contains("metric-card-recommendation")).toBe(
      true
    );
    expect(icons[0].iconName).toBe("utility:error");
    expect(icons[3].alternativeText).toBe("Actions");
  });

  it("renders an empty grid when no cards are supplied", () => {
    const element = createElement("c-org-health-summary-metrics", {
      is: OrgHealthSummaryMetrics
    });

    document.body.appendChild(element);

    expect(element.shadowRoot.querySelectorAll(".metric-card")).toHaveLength(0);
  });
});
