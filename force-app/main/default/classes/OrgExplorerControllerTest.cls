@IsTest
private class OrgExplorerControllerTest {
  @IsTest
  static void describeObjectReturnsPortableStandardMetadata() {
    Map<String, Object> result = OrgExplorerController.describeObject('User');

    System.assertEquals(true, result.get('found'));
    System.assertEquals('User', result.get('apiName'));
    System.assertNotEquals(null, result.get('label'));
    System.assertEquals(false, result.get('custom'));

    Integer fieldCount = (Integer) result.get('fieldCount');
    List<Map<String, Object>> fields = (List<Map<String, Object>>) result.get(
      'fields'
    );
    System.assert(fieldCount > 0, 'User should expose fields.');
    System.assertEquals(fieldCount, fields.size());

    Map<String, Object> firstField = fields[0];
    System.assertNotEquals(null, firstField.get('apiName'));
    System.assertNotEquals(null, firstField.get('label'));
    System.assertNotEquals(null, firstField.get('type'));
    System.assert(firstField.containsKey('createable'));
    System.assert(firstField.containsKey('updateable'));
  }

  @IsTest
  static void describeObjectHandlesMissingNullAndEmptyNames() {
    String missingName = 'Definitely_Not_A_Real_Object__c';

    Map<String, Object> missing = OrgExplorerController.describeObject(
      missingName
    );
    System.assertEquals(false, missing.get('found'));
    System.assertEquals(
      'Object not found: ' + missingName,
      missing.get('message')
    );

    Map<String, Object> nullName = OrgExplorerController.describeObject(null);
    System.assertEquals(false, nullName.get('found'));
    System.assertEquals('Object not found: null', nullName.get('message'));

    Map<String, Object> emptyName = OrgExplorerController.describeObject('');
    System.assertEquals(false, emptyName.get('found'));
    System.assertEquals('Object not found: ', emptyName.get('message'));
  }
}
