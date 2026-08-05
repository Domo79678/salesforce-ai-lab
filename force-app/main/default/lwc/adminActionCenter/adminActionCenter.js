import { api, LightningElement } from "lwc";
import {
  ACTION_STATUSES,
  RISK_DISPOSITIONS,
  createAction,
  getActions,
  updateAction
} from "c/adminActionService";

export default class AdminActionCenter extends LightningElement {
  _launchContext;
  actions = [];
  selectedId;
  draft = {};
  message = "";

  @api
  get launchContext() {
    return this._launchContext;
  }
  set launchContext(value) {
    this._launchContext = value;
  }

  connectedCallback() {
    if (this._launchContext?.createAction) {
      const created = createAction(this._launchContext.actionContext || {});
      this.selectedId = created.id;
      this.message = "Action created with status Needs Review.";
    }
    this.refresh();
  }

  get hasActions() {
    return this.actions.length > 0;
  }
  get hasSelection() {
    return Boolean(this.selectedId);
  }
  get statusOptions() {
    return ACTION_STATUSES.map((value) => ({ label: value, value }));
  }
  get riskOptions() {
    return RISK_DISPOSITIONS.map((value) => ({ label: value, value }));
  }

  refresh() {
    this.actions = getActions().map((action) => ({
      ...action,
      sourceLabel: action.objectApiName
        ? `${action.sourceWorkspace} · ${action.objectApiName}`
        : action.sourceWorkspace,
      buttonVariant: action.id === this.selectedId ? "brand" : "neutral"
    }));
    if (this.selectedId) {
      this.draft = {
        ...this.actions.find((item) => item.id === this.selectedId)
      };
    }
  }

  handleOpen(event) {
    this.selectedId = event.currentTarget.dataset.id;
    this.message = "";
    this.refresh();
  }
  handleChange(event) {
    this.draft = { ...this.draft, [event.target.name]: event.detail.value };
  }
  handleSave() {
    updateAction(this.selectedId, this.draft);
    this.message = "Action updated.";
    this.refresh();
  }
}
