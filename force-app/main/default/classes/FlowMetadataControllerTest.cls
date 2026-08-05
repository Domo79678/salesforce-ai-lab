@IsTest
private class FlowMetadataControllerTest {
  @IsTest
  static void getFlowsReturnsAValidMetadataSnapshot() {
    List<FlowMetadataController.FlowContext> flows = FlowMetadataController.getFlows();

    System.assertNotEquals(null, flows);
    System.assert(flows.size() <= 500);
    assertFlowSnapshotsAreConsistent(flows);
  }

  @IsTest
  static void getFlowsByLimitHonorsSmallAndMaximumLimits() {
    List<FlowMetadataController.FlowContext> oneFlow = FlowMetadataController.getFlowsByLimit(
      1
    );
    System.assertNotEquals(null, oneFlow);
    System.assert(oneFlow.size() <= 1);
    assertFlowSnapshotsAreConsistent(oneFlow);

    List<FlowMetadataController.FlowContext> capped = FlowMetadataController.getFlowsByLimit(
      1001
    );
    System.assertNotEquals(null, capped);
    System.assert(capped.size() <= 1000);
  }

  @IsTest
  static void getFlowsByLimitNormalizesNullAndNonPositiveLimits() {
    List<FlowMetadataController.FlowContext> nullLimit = FlowMetadataController.getFlowsByLimit(
      null
    );
    System.assertNotEquals(null, nullLimit);
    System.assert(nullLimit.size() <= 500);

    List<FlowMetadataController.FlowContext> zeroLimit = FlowMetadataController.getFlowsByLimit(
      0
    );
    System.assertNotEquals(null, zeroLimit);
    System.assert(zeroLimit.size() <= 500);
  }

  @IsTest
  static void flowVersionDtoPreservesItsPublicContract() {
    Datetime modifiedAt = Datetime.newInstanceGmt(2026, 1, 2, 3, 4, 5);
    FlowMetadataController.FlowVersionContext version = new FlowMetadataController.FlowVersionContext();
    version.id = 'version-id';
    version.durableId = 'durable-id';
    version.flowDefinitionId = 'definition-id';
    version.label = 'Version label';
    version.description = 'Version description';
    version.status = 'Draft';
    version.versionNumber = 7;
    version.processType = 'Flow';
    version.isTemplate = false;
    version.runInMode = 'SystemModeWithSharing';
    version.lastModifiedDate = modifiedAt;
    version.apiVersion = 66.0;
    version.apiVersionRuntime = 66.0;

    System.assertEquals('version-id', version.id);
    System.assertEquals('durable-id', version.durableId);
    System.assertEquals('definition-id', version.flowDefinitionId);
    System.assertEquals('Version label', version.label);
    System.assertEquals('Version description', version.description);
    System.assertEquals('Draft', version.status);
    System.assertEquals(7, version.versionNumber);
    System.assertEquals('Flow', version.processType);
    System.assertEquals(false, version.isTemplate);
    System.assertEquals('SystemModeWithSharing', version.runInMode);
    System.assertEquals(modifiedAt, version.lastModifiedDate);
    System.assertEquals(66.0, version.apiVersion);
    System.assertEquals(66.0, version.apiVersionRuntime);
  }

  @IsTest
  static void buildVersionContextMapsEveryAvailableMetadataField() {
    FlowVersionView versionRecord = (FlowVersionView) JSON.deserialize(
      '{' +
        '"attributes":{"type":"FlowVersionView"},' +
        '"DurableId":"durable-id",' +
        '"Label":"Mapped flow",' +
        '"Description":"Mapped description",' +
        '"Status":"Draft",' +
        '"VersionNumber":3,' +
        '"ProcessType":"Flow",' +
        '"IsTemplate":false,' +
        '"RunInMode":"SystemModeWithSharing",' +
        '"LastModifiedDate":"2026-01-02T03:04:05.000Z",' +
        '"ApiVersion":66.0,' +
        '"ApiVersionRuntime":66.0' +
        '}',
      FlowVersionView.class
    );

    FlowMetadataController.FlowVersionContext mapped = FlowMetadataController.buildVersionContext(
      versionRecord
    );

    System.assertEquals('durable-id', mapped.durableId);
    System.assertEquals('Mapped flow', mapped.label);
    System.assertEquals('Mapped description', mapped.description);
    System.assertEquals('Draft', mapped.status);
    System.assertEquals(3, mapped.versionNumber);
    System.assertEquals('Flow', mapped.processType);
    System.assertEquals(false, mapped.isTemplate);
    System.assertEquals('SystemModeWithSharing', mapped.runInMode);
    System.assertEquals(
      Datetime.newInstanceGmt(2026, 1, 2, 3, 4, 5),
      mapped.lastModifiedDate
    );
    System.assertEquals(66.0, mapped.apiVersion);
    System.assertEquals(66.0, mapped.apiVersionRuntime);
  }

  private static void assertFlowSnapshotsAreConsistent(
    List<FlowMetadataController.FlowContext> flows
  ) {
    for (FlowMetadataController.FlowContext flow : flows) {
      System.assertNotEquals(null, flow.id);
      System.assertNotEquals(null, flow.apiName);
      System.assertNotEquals(null, flow.label);
      System.assertNotEquals(null, flow.active);
      System.assertNotEquals(null, flow.status);
      System.assertNotEquals(null, flow.versions);
      System.assertEquals(flow.versions.size(), flow.versionCount);

      if (flow.activeVersion != null) {
        System.assertEquals(flow.activeVersionId, flow.activeVersion.id);
      }
      if (flow.latestVersion != null) {
        System.assertEquals(flow.latestVersionId, flow.latestVersion.id);
      }
    }
  }
}
