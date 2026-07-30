import { LightningElement } from "lwc";
import {
  COPILOT_CORE_VERSION,
  getCacheDiagnostics,
  getMetadataSnapshotDiagnostics
} from "c/copilotCore";
import { COPILOT_MODULES, getLiveModuleCount } from "c/copilotModuleRegistry";

export default class DeveloperToolsWorkspace extends LightningElement {
  refreshKey = 0;

  get snapshotDiagnostics() {
    return {
      ...getMetadataSnapshotDiagnostics(),
      refreshKey: this.refreshKey
    };
  }

  get cacheDiagnostics() {
    return {
      ...getCacheDiagnostics(),
      refreshKey: this.refreshKey
    };
  }

  get metadataStatus() {
    return this.snapshotDiagnostics.status || "Unavailable";
  }

  get coverageStatus() {
    return this.snapshotDiagnostics.coverage?.status || "Not calculated";
  }

  get cacheStatus() {
    return this.snapshotDiagnostics.cached
      ? `${this.cacheDiagnostics.size} active cache entries`
      : "No shared snapshot cached";
  }

  get serviceStatus() {
    return `Copilot Core ${COPILOT_CORE_VERSION}`;
  }

  get registryStatus() {
    return `${getLiveModuleCount()} available · ${COPILOT_MODULES.length} registered`;
  }

  get routingRows() {
    return COPILOT_MODULES.map((moduleDefinition) => ({
      ...moduleDefinition,
      routeStatus: moduleDefinition.disabled ? "Unavailable" : "Registered"
    }));
  }

  handleRefreshDiagnostics() {
    this.refreshKey += 1;
  }
}
