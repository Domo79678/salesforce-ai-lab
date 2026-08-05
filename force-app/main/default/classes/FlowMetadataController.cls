/**
 * FlowMetadataController
 *
 * Live Salesforce Flow metadata service for Salesforce Copilot.
 *
 * Responsibilities:
 * - retrieve Flow definitions from FlowDefinitionView
 * - retrieve Flow versions from FlowVersionView
 * - connect definitions with active and latest versions
 * - return a normalized contract for Lightning Web Components
 *
 * Version: 1.0
 */
public with sharing class FlowMetadataController {
  private static final Integer DEFAULT_FLOW_LIMIT = 500;
  private static final Integer MAXIMUM_FLOW_LIMIT = 1000;
  private static final Integer MAXIMUM_VERSION_LIMIT = 2000;

  /**
   * Returns live Flow definitions with active and latest
   * version details.
   */
  @AuraEnabled(cacheable=true)
  public static List<FlowContext> getFlows() {
    return getFlowsByLimit(DEFAULT_FLOW_LIMIT);
  }

  /**
   * Returns live Flow definitions using a controlled limit.
   */
  @AuraEnabled(cacheable=true)
  public static List<FlowContext> getFlowsByLimit(Integer maxResults) {
    Integer resultLimit = normalizeResultLimit(maxResults);

    List<FlowDefinitionView> definitions = [
      SELECT Id, ApiName, Label, ActiveVersionId, LatestVersionId
      FROM FlowDefinitionView
      ORDER BY Label
      LIMIT :resultLimit
    ];

    if (definitions.isEmpty()) {
      return new List<FlowContext>();
    }

    Set<Id> definitionIds = new Set<Id>();

    for (FlowDefinitionView definition : definitions) {
      definitionIds.add(definition.Id);
    }

    List<FlowVersionView> versions = [
      SELECT
        Id,
        DurableId,
        FlowDefinitionViewId,
        Label,
        Description,
        Status,
        VersionNumber,
        ProcessType,
        IsTemplate,
        RunInMode,
        LastModifiedDate,
        ApiVersion,
        ApiVersionRuntime
      FROM FlowVersionView
      WHERE FlowDefinitionViewId IN :definitionIds
      ORDER BY FlowDefinitionViewId, VersionNumber DESC
      LIMIT :MAXIMUM_VERSION_LIMIT
    ];

    Map<String, FlowVersionContext> versionsById = new Map<String, FlowVersionContext>();

    Map<Id, List<FlowVersionContext>> versionsByDefinitionId = new Map<Id, List<FlowVersionContext>>();

    for (FlowVersionView versionRecord : versions) {
      FlowVersionContext versionContext = buildVersionContext(versionRecord);

      versionsById.put(String.valueOf(versionRecord.Id), versionContext);

      if (
        !versionsByDefinitionId.containsKey(versionRecord.FlowDefinitionViewId)
      ) {
        versionsByDefinitionId.put(
          versionRecord.FlowDefinitionViewId,
          new List<FlowVersionContext>()
        );
      }

      versionsByDefinitionId
        .get(versionRecord.FlowDefinitionViewId)
        .add(versionContext);
    }

    List<FlowContext> results = new List<FlowContext>();

    for (FlowDefinitionView definition : definitions) {
      FlowContext context = new FlowContext();

      context.id = String.valueOf(definition.Id);

      context.apiName = definition.ApiName;

      context.label = definition.Label;

      context.activeVersionId = definition.ActiveVersionId;

      context.latestVersionId = definition.LatestVersionId;

      context.active = !String.isBlank(definition.ActiveVersionId);

      context.versions = versionsByDefinitionId.containsKey(definition.Id)
        ? versionsByDefinitionId.get(definition.Id)
        : new List<FlowVersionContext>();

      context.versionCount = context.versions.size();

      context.activeVersion = findVersion(
        versionsById,
        definition.ActiveVersionId
      );

      context.latestVersion = findVersion(
        versionsById,
        definition.LatestVersionId
      );

      FlowVersionContext preferredVersion = context.activeVersion != null
        ? context.activeVersion
        : context.latestVersion;

      if (preferredVersion != null) {
        context.status = preferredVersion.status;

        context.versionNumber = preferredVersion.versionNumber;

        context.processType = preferredVersion.processType;

        context.description = preferredVersion.description;

        context.runInMode = preferredVersion.runInMode;

        context.apiVersion = preferredVersion.apiVersion;

        context.apiVersionRuntime = preferredVersion.apiVersionRuntime;

        context.lastModifiedDate = preferredVersion.lastModifiedDate;

        context.isTemplate = preferredVersion.isTemplate;
      } else {
        context.status = context.active ? 'Active' : 'Inactive';

        context.versionNumber = 0;
        context.processType = '';
        context.description = '';
        context.runInMode = '';
        context.apiVersion = null;
        context.apiVersionRuntime = null;
        context.lastModifiedDate = null;
        context.isTemplate = false;
      }

      results.add(context);
    }

    return results;
  }

  @TestVisible
  private static FlowVersionContext buildVersionContext(
    FlowVersionView versionRecord
  ) {
    FlowVersionContext context = new FlowVersionContext();

    context.id = String.valueOf(versionRecord.Id);

    context.durableId = versionRecord.DurableId;

    context.flowDefinitionId = String.valueOf(
      versionRecord.FlowDefinitionViewId
    );

    context.label = versionRecord.Label;

    context.description = versionRecord.Description;

    context.status = versionRecord.Status;

    context.versionNumber = versionRecord.VersionNumber;

    context.processType = versionRecord.ProcessType;

    context.isTemplate = versionRecord.IsTemplate;

    context.runInMode = versionRecord.RunInMode;

    context.lastModifiedDate = versionRecord.LastModifiedDate;

    context.apiVersion = versionRecord.ApiVersion;

    context.apiVersionRuntime = versionRecord.ApiVersionRuntime;

    return context;
  }

  private static FlowVersionContext findVersion(
    Map<String, FlowVersionContext> versionsById,
    String requestedVersionId
  ) {
    if (String.isBlank(requestedVersionId)) {
      return null;
    }

    return versionsById.get(requestedVersionId);
  }

  private static Integer normalizeResultLimit(Integer requestedLimit) {
    if (requestedLimit == null || requestedLimit <= 0) {
      return DEFAULT_FLOW_LIMIT;
    }

    return Math.min(requestedLimit, MAXIMUM_FLOW_LIMIT);
  }

  public class FlowContext {
    @AuraEnabled
    public String id { get; set; }

    @AuraEnabled
    public String apiName { get; set; }

    @AuraEnabled
    public String label { get; set; }

    @AuraEnabled
    public String activeVersionId { get; set; }

    @AuraEnabled
    public String latestVersionId { get; set; }

    @AuraEnabled
    public Boolean active { get; set; }

    @AuraEnabled
    public String status { get; set; }

    @AuraEnabled
    public Integer versionNumber { get; set; }

    @AuraEnabled
    public Integer versionCount { get; set; }

    @AuraEnabled
    public String processType { get; set; }

    @AuraEnabled
    public String description { get; set; }

    @AuraEnabled
    public String runInMode { get; set; }

    @AuraEnabled
    public Decimal apiVersion { get; set; }

    @AuraEnabled
    public Decimal apiVersionRuntime { get; set; }

    @AuraEnabled
    public Datetime lastModifiedDate { get; set; }

    @AuraEnabled
    public Boolean isTemplate { get; set; }

    @AuraEnabled
    public FlowVersionContext activeVersion { get; set; }

    @AuraEnabled
    public FlowVersionContext latestVersion { get; set; }

    @AuraEnabled
    public List<FlowVersionContext> versions { get; set; }
  }

  public class FlowVersionContext {
    @AuraEnabled
    public String id { get; set; }

    @AuraEnabled
    public String durableId { get; set; }

    @AuraEnabled
    public String flowDefinitionId { get; set; }

    @AuraEnabled
    public String label { get; set; }

    @AuraEnabled
    public String description { get; set; }

    @AuraEnabled
    public String status { get; set; }

    @AuraEnabled
    public Integer versionNumber { get; set; }

    @AuraEnabled
    public String processType { get; set; }

    @AuraEnabled
    public Boolean isTemplate { get; set; }

    @AuraEnabled
    public String runInMode { get; set; }

    @AuraEnabled
    public Datetime lastModifiedDate { get; set; }

    @AuraEnabled
    public Decimal apiVersion { get; set; }

    @AuraEnabled
    public Decimal apiVersionRuntime { get; set; }
  }
}
