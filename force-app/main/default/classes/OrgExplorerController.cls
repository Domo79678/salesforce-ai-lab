public with sharing class OrgExplorerController {
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> describeObject(String objectApiName) {
        Map<String, Object> result = new Map<String, Object>();

        Schema.SObjectType objType = Schema.getGlobalDescribe().get(objectApiName);

        if (objType == null) {
            result.put('found', false);
            result.put('message', 'Object not found: ' + objectApiName);
            return result;
        }

        Schema.DescribeSObjectResult describeResult = objType.getDescribe();

        result.put('found', true);
        result.put('label', describeResult.getLabel());
        result.put('apiName', describeResult.getName());
        result.put('custom', describeResult.isCustom());
        result.put('fieldCount', describeResult.fields.getMap().size());
        result.put('relationshipCount', describeResult.getChildRelationships().size());
        result.put('createable', describeResult.isCreateable());
        result.put('updateable', describeResult.isUpdateable());
        result.put('deletable', describeResult.isDeletable());
        result.put('queryable', describeResult.isQueryable());

        List<Map<String, Object>> fields = new List<Map<String, Object>>();

        for (String fieldName : describeResult.fields.getMap().keySet()) {
            Schema.DescribeFieldResult fieldDescribe =
                describeResult.fields.getMap().get(fieldName).getDescribe();

            Map<String, Object> fieldInfo = new Map<String, Object>();

            fieldInfo.put('label', fieldDescribe.getLabel());
            fieldInfo.put('apiName', fieldDescribe.getName());
            fieldInfo.put('type', String.valueOf(fieldDescribe.getType()));
            fieldInfo.put('custom', fieldDescribe.isCustom());
            fieldInfo.put('required', !fieldDescribe.isNillable());
            fieldInfo.put('createable', fieldDescribe.isCreateable());
            fieldInfo.put('updateable', fieldDescribe.isUpdateable());
            fieldInfo.put('calculated', fieldDescribe.isCalculated());
            fieldInfo.put('unique', fieldDescribe.isUnique());
            fieldInfo.put('externalId', fieldDescribe.isExternalId());

            fields.add(fieldInfo);
        }

        result.put('fields', fields);

        return result;
    }
}