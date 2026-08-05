@IsTest
private class OrgContextControllerTest {
  @IsTest
  static void getOrgSummaryReportsCurrentContextAndConsistentCounts() {
    OrgContextController.OrgSummary summary = OrgContextController.getOrgSummary();

    System.assertEquals('1.1', summary.serviceVersion);
    System.assertEquals('66.0', summary.apiVersion);
    System.assertEquals(UserInfo.getOrganizationId(), summary.organizationId);
    System.assertEquals(UserInfo.getUserId(), summary.userId);
    System.assertEquals(UserInfo.getProfileId(), summary.profileId);
    System.assertNotEquals(null, summary.organizationName);
    System.assertNotEquals(null, summary.timeZone);
    System.assert(summary.totalObjects > 0);
    System.assertEquals(
      summary.totalObjects,
      summary.standardObjects + summary.customObjects
    );
    System.assert(summary.queryableObjects <= summary.totalObjects);
    System.assert(summary.accessibleObjects <= summary.totalObjects);
  }

  @IsTest
  static void getObjectsFiltersResultsAndHonorsRequestedLimit() {
    List<OrgContextController.ObjectInfo> limited = OrgContextController.getObjects(
      null,
      1
    );
    System.assertEquals(1, limited.size());
    assertObjectInfoIsPopulated(limited[0]);

    List<OrgContextController.ObjectInfo> matches = OrgContextController.getObjects(
      'User',
      200
    );
    System.assert(
      !matches.isEmpty(),
      'User search should find standard metadata.'
    );
    for (OrgContextController.ObjectInfo item : matches) {
      String searchableText = (item.apiName +
        ' ' +
        item.label +
        ' ' +
        item.pluralLabel)
        .toLowerCase();
      System.assert(searchableText.contains('user'));
      assertObjectInfoIsPopulated(item);
    }

    List<OrgContextController.ObjectInfo> noMatches = OrgContextController.getObjects(
      'DefinitelyNoObjectMatchesThisValue987654321',
      10
    );
    System.assertEquals(0, noMatches.size());
  }

  @IsTest
  static void objectDetailMethodsReturnAccessibleUserMetadata() {
    OrgContextController.ObjectContext context = OrgContextController.getObjectContext(
      'user'
    );

    System.assertEquals('User', context.apiName);
    System.assertEquals(true, context.accessible);
    System.assert(context.fieldCount > 0);
    System.assertEquals(context.fieldCount, context.fields.size());
    System.assertEquals(context.recordTypeCount, context.recordTypes.size());
    System.assert(context.relationshipCount >= 0);

    List<OrgContextController.FieldInfo> fields = OrgContextController.getObjectFields(
      'User'
    );
    System.assertEquals(context.fieldCount, fields.size());
    for (OrgContextController.FieldInfo field : fields) {
      System.assertEquals(true, field.accessible);
      System.assertNotEquals(null, field.apiName);
      System.assertNotEquals(null, field.dataType);
      System.assertNotEquals(null, field.referenceTo);
    }

    List<OrgContextController.RecordTypeContext> recordTypes = OrgContextController.getRecordTypes(
      'User'
    );
    System.assertEquals(context.recordTypeCount, recordTypes.size());
    for (OrgContextController.RecordTypeContext recordType : recordTypes) {
      System.assertEquals(true, recordType.available);
      System.assertNotEquals(null, recordType.recordTypeId);
    }
  }

  @IsTest
  static void detailMethodsRejectBlankAndUnknownObjectNames() {
    assertObjectContextFails(null);
    assertObjectContextFails('   ');
    assertObjectContextFails('Definitely_Not_A_Real_Object__c');
    assertObjectFieldsFail('Definitely_Not_A_Real_Object__c');
    assertRecordTypesFail('Definitely_Not_A_Real_Object__c');
  }

  private static void assertObjectInfoIsPopulated(
    OrgContextController.ObjectInfo item
  ) {
    System.assertNotEquals(null, item.apiName);
    System.assertNotEquals(null, item.label);
    System.assertEquals(true, item.accessible);
  }

  private static void assertObjectContextFails(String objectApiName) {
    try {
      OrgContextController.getObjectContext(objectApiName);
      System.assert(false, 'Expected an AuraHandledException.');
    } catch (AuraHandledException expected) {
      System.assertNotEquals(null, expected);
    }
  }

  private static void assertObjectFieldsFail(String objectApiName) {
    try {
      OrgContextController.getObjectFields(objectApiName);
      System.assert(false, 'Expected an AuraHandledException.');
    } catch (AuraHandledException expected) {
      System.assertNotEquals(null, expected);
    }
  }

  private static void assertRecordTypesFail(String objectApiName) {
    try {
      OrgContextController.getRecordTypes(objectApiName);
      System.assert(false, 'Expected an AuraHandledException.');
    } catch (AuraHandledException expected) {
      System.assertNotEquals(null, expected);
    }
  }
}
