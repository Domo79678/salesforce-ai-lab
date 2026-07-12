/**
 * OrgContextController
 *
 * Shared backend service for Salesforce Copilot.
 *
 * Provides live Salesforce org context including:
 * - Organization and current-user information
 * - Searchable, limited object inventory
 * - Object-level capabilities
 * - Field metadata
 * - Relationships
 * - Record types
 *
 * Version: 1.1
 */
public with sharing class OrgContextController {

    private static final String SERVICE_VERSION = '1.1';
    private static final String API_VERSION = '66.0';

    private static final Integer DEFAULT_OBJECT_LIMIT = 100;
    private static final Integer MAXIMUM_OBJECT_LIMIT = 200;

    /**
     * Returns a high-level summary of the current Salesforce org.
     */
    @AuraEnabled(cacheable=true)
    public static OrgSummary getOrgSummary() {
        OrgSummary summary = new OrgSummary();

        summary.serviceVersion = SERVICE_VERSION;
        summary.apiVersion = API_VERSION;
        summary.organizationId = UserInfo.getOrganizationId();
        summary.organizationName = UserInfo.getOrganizationName();
        summary.userId = UserInfo.getUserId();
        summary.userName = UserInfo.getName();
        summary.userEmail = UserInfo.getUserEmail();
        summary.profileId = UserInfo.getProfileId();
        summary.locale = UserInfo.getLocale();
        summary.timeZone = UserInfo.getTimeZone().getID();

        Map<String, Schema.SObjectType> globalDescribe =
            Schema.getGlobalDescribe();

        Integer totalObjects = 0;
        Integer standardObjects = 0;
        Integer customObjects = 0;
        Integer queryableObjects = 0;
        Integer accessibleObjects = 0;

        for (
            Schema.SObjectType objectType :
            globalDescribe.values()
        ) {
            Schema.DescribeSObjectResult objectDescribe =
                objectType.getDescribe();

            if (objectDescribe.isDeprecatedAndHidden()) {
                continue;
            }

            totalObjects++;

            if (objectDescribe.isCustom()) {
                customObjects++;
            } else {
                standardObjects++;
            }

            if (objectDescribe.isQueryable()) {
                queryableObjects++;
            }

            if (objectDescribe.isAccessible()) {
                accessibleObjects++;
            }
        }

        summary.totalObjects = totalObjects;
        summary.standardObjects = standardObjects;
        summary.customObjects = customObjects;
        summary.queryableObjects = queryableObjects;
        summary.accessibleObjects = accessibleObjects;

        return summary;
    }

    /**
     * Returns a filtered and limited object inventory.
     *
     * The method intentionally avoids returning every object in the org
     * because large orgs can expose thousands of platform objects.
     */
    @AuraEnabled(cacheable=true)
    public static List<ObjectInfo> getObjects(
        String searchTerm,
        Integer maxResults
    ) {
        Integer resultLimit = normalizeResultLimit(maxResults);

        String normalizedSearchTerm =
            String.isBlank(searchTerm)
                ? ''
                : searchTerm.trim().toLowerCase();

        Map<String, Schema.SObjectType> globalDescribe =
            Schema.getGlobalDescribe();

        List<String> matchingApiNames =
            new List<String>();

        for (String apiName : globalDescribe.keySet()) {
            Schema.DescribeSObjectResult objectDescribe =
                globalDescribe.get(apiName).getDescribe();

            if (!isUsefulInventoryObject(objectDescribe)) {
                continue;
            }

            if (
                !matchesObjectSearch(
                    objectDescribe,
                    normalizedSearchTerm
                )
            ) {
                continue;
            }

            matchingApiNames.add(apiName);
        }

        matchingApiNames.sort();

        List<ObjectInfo> objects =
            new List<ObjectInfo>();

        Integer numberToReturn = Math.min(
            resultLimit,
            matchingApiNames.size()
        );

        for (
            Integer index = 0;
            index < numberToReturn;
            index++
        ) {
            String apiName = matchingApiNames[index];

            Schema.DescribeSObjectResult objectDescribe =
                globalDescribe.get(apiName).getDescribe();

            objects.add(
                buildObjectInfo(objectDescribe)
            );
        }

        return objects;
    }

    /**
     * Returns detailed metadata for one Salesforce object.
     */
    @AuraEnabled(cacheable=true)
    public static ObjectContext getObjectContext(
        String objectApiName
    ) {
        Schema.SObjectType objectType =
            resolveObjectType(objectApiName);

        Schema.DescribeSObjectResult objectDescribe =
            objectType.getDescribe();

        if (!objectDescribe.isAccessible()) {
            throw new AuraHandledException(
                'You do not have access to the Salesforce object "' +
                objectDescribe.getName() +
                '".'
            );
        }

        ObjectContext context = new ObjectContext();

        context.apiName = objectDescribe.getName();
        context.label = objectDescribe.getLabel();
        context.pluralLabel = objectDescribe.getLabelPlural();
        context.keyPrefix = objectDescribe.getKeyPrefix();
        context.custom = objectDescribe.isCustom();
        context.queryable = objectDescribe.isQueryable();
        context.searchable = objectDescribe.isSearchable();
        context.createable = objectDescribe.isCreateable();
        context.updateable = objectDescribe.isUpdateable();
        context.deletable = objectDescribe.isDeletable();
        context.accessible = objectDescribe.isAccessible();

        context.fields =
            buildFieldInfo(objectDescribe);

        context.recordTypes =
            buildRecordTypeInfo(objectDescribe);

        context.fieldCount =
            context.fields.size();

        context.recordTypeCount =
            context.recordTypes.size();

        context.relationshipCount =
            countRelationshipFields(context.fields);

        return context;
    }

    /**
     * Returns accessible field metadata for one object.
     */
    @AuraEnabled(cacheable=true)
    public static List<FieldInfo> getObjectFields(
        String objectApiName
    ) {
        Schema.SObjectType objectType =
            resolveObjectType(objectApiName);

        Schema.DescribeSObjectResult objectDescribe =
            objectType.getDescribe();

        if (!objectDescribe.isAccessible()) {
            throw new AuraHandledException(
                'You do not have access to the Salesforce object "' +
                objectDescribe.getName() +
                '".'
            );
        }

        return buildFieldInfo(objectDescribe);
    }

    /**
     * Returns record types available for one object.
     */
    @AuraEnabled(cacheable=true)
    public static List<RecordTypeContext> getRecordTypes(
        String objectApiName
    ) {
        Schema.SObjectType objectType =
            resolveObjectType(objectApiName);

        Schema.DescribeSObjectResult objectDescribe =
            objectType.getDescribe();

        if (!objectDescribe.isAccessible()) {
            throw new AuraHandledException(
                'You do not have access to the Salesforce object "' +
                objectDescribe.getName() +
                '".'
            );
        }

        return buildRecordTypeInfo(objectDescribe);
    }

    private static ObjectInfo buildObjectInfo(
        Schema.DescribeSObjectResult objectDescribe
    ) {
        ObjectInfo objectInfo = new ObjectInfo();

        objectInfo.apiName = objectDescribe.getName();
        objectInfo.label = objectDescribe.getLabel();
        objectInfo.pluralLabel =
            objectDescribe.getLabelPlural();
        objectInfo.keyPrefix =
            objectDescribe.getKeyPrefix();
        objectInfo.custom =
            objectDescribe.isCustom();
        objectInfo.queryable =
            objectDescribe.isQueryable();
        objectInfo.searchable =
            objectDescribe.isSearchable();
        objectInfo.createable =
            objectDescribe.isCreateable();
        objectInfo.updateable =
            objectDescribe.isUpdateable();
        objectInfo.deletable =
            objectDescribe.isDeletable();
        objectInfo.accessible =
            objectDescribe.isAccessible();
        objectInfo.hasRecordTypes =
            objectDescribe.getRecordTypeInfos().size() > 1;

        return objectInfo;
    }

    private static Boolean isUsefulInventoryObject(
        Schema.DescribeSObjectResult objectDescribe
    ) {
        if (objectDescribe.isDeprecatedAndHidden()) {
            return false;
        }

        if (!objectDescribe.isAccessible()) {
            return false;
        }

        if (!objectDescribe.isQueryable()) {
            return false;
        }

        String apiName =
            objectDescribe.getName();

        if (apiName.endsWith('ChangeEvent')) {
            return false;
        }

        if (apiName.endsWith('__Share')) {
            return false;
        }

        if (apiName.endsWith('__History')) {
            return false;
        }

        if (apiName.endsWith('__Feed')) {
            return false;
        }

        return true;
    }

    private static Boolean matchesObjectSearch(
        Schema.DescribeSObjectResult objectDescribe,
        String searchTerm
    ) {
        if (String.isBlank(searchTerm)) {
            return true;
        }

        String apiName =
            objectDescribe.getName().toLowerCase();

        String label =
            objectDescribe.getLabel().toLowerCase();

        String pluralLabel =
            objectDescribe
                .getLabelPlural()
                .toLowerCase();

        return (
            apiName.contains(searchTerm) ||
            label.contains(searchTerm) ||
            pluralLabel.contains(searchTerm)
        );
    }

    private static Integer normalizeResultLimit(
        Integer requestedLimit
    ) {
        if (
            requestedLimit == null ||
            requestedLimit <= 0
        ) {
            return DEFAULT_OBJECT_LIMIT;
        }

        return Math.min(
            requestedLimit,
            MAXIMUM_OBJECT_LIMIT
        );
    }

    /**
     * Resolves an object API name safely and case-insensitively.
     */
    private static Schema.SObjectType resolveObjectType(
        String objectApiName
    ) {
        if (String.isBlank(objectApiName)) {
            throw new AuraHandledException(
                'Enter a Salesforce object API name.'
            );
        }

        String requestedName =
            objectApiName.trim();

        Map<String, Schema.SObjectType> globalDescribe =
            Schema.getGlobalDescribe();

        if (globalDescribe.containsKey(requestedName)) {
            return globalDescribe.get(requestedName);
        }

        for (String apiName : globalDescribe.keySet()) {
            if (
                apiName.equalsIgnoreCase(requestedName)
            ) {
                return globalDescribe.get(apiName);
            }
        }

        throw new AuraHandledException(
            'The Salesforce object "' +
            requestedName +
            '" was not found in this org.'
        );
    }

    /**
     * Builds field metadata visible to the current user.
     */
    private static List<FieldInfo> buildFieldInfo(
        Schema.DescribeSObjectResult objectDescribe
    ) {
        Map<String, Schema.SObjectField> fieldMap =
            objectDescribe.fields.getMap();

        List<String> fieldApiNames =
            new List<String>(fieldMap.keySet());

        fieldApiNames.sort();

        List<FieldInfo> fields =
            new List<FieldInfo>();

        for (String fieldApiName : fieldApiNames) {
            Schema.DescribeFieldResult fieldDescribe =
                fieldMap.get(fieldApiName).getDescribe();

            if (!fieldDescribe.isAccessible()) {
                continue;
            }

            FieldInfo fieldInfo = new FieldInfo();

            fieldInfo.apiName =
                fieldDescribe.getName();
            fieldInfo.label =
                fieldDescribe.getLabel();
            fieldInfo.dataType =
                String.valueOf(fieldDescribe.getType());
            fieldInfo.length =
                fieldDescribe.getLength();
            fieldInfo.precision =
                fieldDescribe.getPrecision();
            fieldInfo.scale =
                fieldDescribe.getScale();
            fieldInfo.accessible =
                fieldDescribe.isAccessible();
            fieldInfo.createable =
                fieldDescribe.isCreateable();
            fieldInfo.updateable =
                fieldDescribe.isUpdateable();
            fieldInfo.required =
                !fieldDescribe.isNillable() &&
                !fieldDescribe.isDefaultedOnCreate();
            fieldInfo.custom =
                fieldDescribe.isCustom();
            fieldInfo.calculated =
                fieldDescribe.isCalculated();
            fieldInfo.unique =
                fieldDescribe.isUnique();
            fieldInfo.externalId =
                fieldDescribe.isExternalId();
            fieldInfo.autoNumber =
                fieldDescribe.isAutoNumber();
            fieldInfo.relationshipName =
                fieldDescribe.getRelationshipName();
            fieldInfo.referenceTo =
                getReferenceObjectNames(fieldDescribe);

            fields.add(fieldInfo);
        }

        return fields;
    }

    /**
     * Builds record-type metadata available to the current user.
     */
    private static List<RecordTypeContext>
        buildRecordTypeInfo(
            Schema.DescribeSObjectResult objectDescribe
        ) {
        List<RecordTypeContext> recordTypes =
            new List<RecordTypeContext>();

        for (
            Schema.RecordTypeInfo recordTypeInfo :
            objectDescribe.getRecordTypeInfos()
        ) {
            if (!recordTypeInfo.isAvailable()) {
                continue;
            }

            RecordTypeContext context =
                new RecordTypeContext();

            context.recordTypeId =
                recordTypeInfo.getRecordTypeId();
            context.name =
                recordTypeInfo.getName();
            context.developerName =
                recordTypeInfo.getDeveloperName();
            context.available =
                recordTypeInfo.isAvailable();
            context.master =
                recordTypeInfo.isMaster();
            context.defaultRecordType =
                recordTypeInfo
                    .isDefaultRecordTypeMapping();

            recordTypes.add(context);
        }

        return recordTypes;
    }

    private static List<String> getReferenceObjectNames(
        Schema.DescribeFieldResult fieldDescribe
    ) {
        List<String> referenceNames =
            new List<String>();

        for (
            Schema.SObjectType referenceType :
            fieldDescribe.getReferenceTo()
        ) {
            referenceNames.add(
                referenceType.getDescribe().getName()
            );
        }

        referenceNames.sort();

        return referenceNames;
    }

    private static Integer countRelationshipFields(
        List<FieldInfo> fields
    ) {
        Integer relationshipCount = 0;

        for (FieldInfo fieldInfo : fields) {
            if (
                fieldInfo.referenceTo != null &&
                !fieldInfo.referenceTo.isEmpty()
            ) {
                relationshipCount++;
            }
        }

        return relationshipCount;
    }

    public class OrgSummary {
        @AuraEnabled
        public String serviceVersion { get; set; }

        @AuraEnabled
        public String apiVersion { get; set; }

        @AuraEnabled
        public String organizationId { get; set; }

        @AuraEnabled
        public String organizationName { get; set; }

        @AuraEnabled
        public String userId { get; set; }

        @AuraEnabled
        public String userName { get; set; }

        @AuraEnabled
        public String userEmail { get; set; }

        @AuraEnabled
        public String profileId { get; set; }

        @AuraEnabled
        public String locale { get; set; }

        @AuraEnabled
        public String timeZone { get; set; }

        @AuraEnabled
        public Integer totalObjects { get; set; }

        @AuraEnabled
        public Integer standardObjects { get; set; }

        @AuraEnabled
        public Integer customObjects { get; set; }

        @AuraEnabled
        public Integer queryableObjects { get; set; }

        @AuraEnabled
        public Integer accessibleObjects { get; set; }
    }

    public class ObjectInfo {
        @AuraEnabled
        public String apiName { get; set; }

        @AuraEnabled
        public String label { get; set; }

        @AuraEnabled
        public String pluralLabel { get; set; }

        @AuraEnabled
        public String keyPrefix { get; set; }

        @AuraEnabled
        public Boolean custom { get; set; }

        @AuraEnabled
        public Boolean queryable { get; set; }

        @AuraEnabled
        public Boolean searchable { get; set; }

        @AuraEnabled
        public Boolean createable { get; set; }

        @AuraEnabled
        public Boolean updateable { get; set; }

        @AuraEnabled
        public Boolean deletable { get; set; }

        @AuraEnabled
        public Boolean accessible { get; set; }

        @AuraEnabled
        public Boolean hasRecordTypes { get; set; }
    }

    public class ObjectContext {
        @AuraEnabled
        public String apiName { get; set; }

        @AuraEnabled
        public String label { get; set; }

        @AuraEnabled
        public String pluralLabel { get; set; }

        @AuraEnabled
        public String keyPrefix { get; set; }

        @AuraEnabled
        public Boolean custom { get; set; }

        @AuraEnabled
        public Boolean queryable { get; set; }

        @AuraEnabled
        public Boolean searchable { get; set; }

        @AuraEnabled
        public Boolean createable { get; set; }

        @AuraEnabled
        public Boolean updateable { get; set; }

        @AuraEnabled
        public Boolean deletable { get; set; }

        @AuraEnabled
        public Boolean accessible { get; set; }

        @AuraEnabled
        public Integer fieldCount { get; set; }

        @AuraEnabled
        public Integer relationshipCount { get; set; }

        @AuraEnabled
        public Integer recordTypeCount { get; set; }

        @AuraEnabled
        public List<FieldInfo> fields { get; set; }

        @AuraEnabled
        public List<RecordTypeContext>
            recordTypes { get; set; }
    }

    public class FieldInfo {
        @AuraEnabled
        public String apiName { get; set; }

        @AuraEnabled
        public String label { get; set; }

        @AuraEnabled
        public String dataType { get; set; }

        @AuraEnabled
        public Integer length { get; set; }

        @AuraEnabled
        public Integer precision { get; set; }

        @AuraEnabled
        public Integer scale { get; set; }

        @AuraEnabled
        public Boolean accessible { get; set; }

        @AuraEnabled
        public Boolean createable { get; set; }

        @AuraEnabled
        public Boolean updateable { get; set; }

        @AuraEnabled
        public Boolean required { get; set; }

        @AuraEnabled
        public Boolean custom { get; set; }

        @AuraEnabled
        public Boolean calculated { get; set; }

        @AuraEnabled
        public Boolean unique { get; set; }

        @AuraEnabled
        public Boolean externalId { get; set; }

        @AuraEnabled
        public Boolean autoNumber { get; set; }

        @AuraEnabled
        public String relationshipName { get; set; }

        @AuraEnabled
        public List<String> referenceTo { get; set; }
    }

    public class RecordTypeContext {
        @AuraEnabled
        public String recordTypeId { get; set; }

        @AuraEnabled
        public String name { get; set; }

        @AuraEnabled
        public String developerName { get; set; }

        @AuraEnabled
        public Boolean available { get; set; }

        @AuraEnabled
        public Boolean master { get; set; }

        @AuraEnabled
        public Boolean defaultRecordType { get; set; }
    }
}