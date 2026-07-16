/*
 * testPlanEngine.js
 *
 * Shared test-plan generator for Salesforce Copilot.
 *
 * Produces structured testing guidance for:
 * - Flows
 * - Validation Rules
 * - Formula Fields
 * - Custom Fields
 * - Apex
 * - Permission Sets
 * - Duplicate Rules
 * - Record Types
 * - Reports
 * - Dashboards
 * - Queues
 * - Roles
 * - Sharing Rules
 *
 * This engine is deterministic and reusable across:
 * - Explain This
 * - Change Impact Analyzer
 * - Deployment Readiness
 * - Flow Intelligence
 * - Troubleshooting Assistant
 * - Documentation Generator
 */

const ARTIFACT_TYPES = Object.freeze({
    FLOW: 'flow',
    VALIDATION_RULE: 'validationRule',
    FORMULA: 'formula',
    CUSTOM_FIELD: 'customField',
    APEX: 'apex',
    PERMISSION_SET: 'permissionSet',
    DUPLICATE_RULE: 'duplicateRule',
    RECORD_TYPE: 'recordType',
    REPORT: 'report',
    DASHBOARD: 'dashboard',
    QUEUE: 'queue',
    ROLE: 'role',
    SHARING_RULE: 'sharingRule',
    UNKNOWN: 'unknown'
});

export function buildTestPlan({
    artifactType = ARTIFACT_TYPES.UNKNOWN,
    artifactName = '',
    metadata = {},
    dependencies = [],
    risks = [],
    context = {}
} = {}) {
    const normalizedType =
        normalizeArtifactType(artifactType);

    const basePlan =
        createBaseTestPlan({
            artifactType: normalizedType,
            artifactName,
            metadata,
            dependencies,
            risks,
            context
        });

    const specializedPlan =
        buildSpecializedPlan(
            normalizedType,
            {
                artifactName,
                metadata,
                dependencies,
                risks,
                context
            }
        );

    return {
        ...basePlan,
        ...specializedPlan,
        summary:
            buildTestSummary(
                normalizedType,
                artifactName
            )
    };
}

export function buildFlowTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType: ARTIFACT_TYPES.FLOW
    });
}

export function buildValidationRuleTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.VALIDATION_RULE
    });
}

export function buildFormulaTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.FORMULA
    });
}

export function buildCustomFieldTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.CUSTOM_FIELD
    });
}

export function buildApexTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.APEX
    });
}

export function buildPermissionSetTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.PERMISSION_SET
    });
}

export function buildDuplicateRuleTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.DUPLICATE_RULE
    });
}

export function buildRecordTypeTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.RECORD_TYPE
    });
}

export function buildReportTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.REPORT
    });
}

export function buildDashboardTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.DASHBOARD
    });
}

export function buildQueueTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.QUEUE
    });
}

export function buildRoleTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.ROLE
    });
}

export function buildSharingRuleTestPlan(options = {}) {
    return buildTestPlan({
        ...options,
        artifactType:
            ARTIFACT_TYPES.SHARING_RULE
    });
}

function createBaseTestPlan({
    artifactType,
    artifactName,
    metadata,
    dependencies,
    risks,
    context
}) {
    return {
        artifactType,
        artifactName:
            artifactName ||
            'Unnamed Salesforce Artifact',

        objective:
            `Validate that ${artifactName || 'the Salesforce artifact'} works as intended without introducing access, data, automation, reporting, or deployment regressions.`,

        prerequisites: [
            'Confirm the latest version is deployed to the test environment.',
            'Identify the intended business outcome.',
            'Prepare representative test users.',
            'Prepare representative records and data.',
            'Document expected results before testing.',
            'Identify known dependencies and risks.'
        ],

        positiveTests: [],

        negativeTests: [],

        permissionTests: [
            'Test with a System Administrator.',
            'Test with a representative standard user.',
            'Test with a restricted user where applicable.',
            'Verify object permissions.',
            'Verify field-level security.',
            'Verify record-level access.'
        ],

        bulkTests: [
            'Test a single record.',
            'Test multiple records in one transaction.',
            'Test representative bulk volume.',
            'Confirm no partial or duplicate processing occurs.'
        ],

        regressionTests: [
            'Verify existing business processes still work.',
            'Verify related automation still works.',
            'Verify reports and dashboards still return expected results.',
            'Verify integrations still succeed.',
            'Verify existing users retain appropriate access.'
        ],

        deploymentTests: [
            'Validate in a sandbox before production.',
            'Run regression testing after deployment.',
            'Verify permissions and assignments after deployment.',
            'Confirm rollback steps are available.',
            'Document actual results.'
        ],

        evidenceToCapture: [
            'Screenshots',
            'Record IDs',
            'Debug output',
            'Error messages',
            'Expected result',
            'Actual result',
            'Tester name',
            'Test date'
        ],

        dependencies:
            normalizeArray(dependencies),

        risks:
            normalizeArray(risks),

        metadata:
            metadata || {},

        context:
            context || {}
    };
}

function buildSpecializedPlan(
    artifactType,
    options
) {
    switch (artifactType) {
        case ARTIFACT_TYPES.FLOW:
            return createFlowPlan(options);

        case ARTIFACT_TYPES.VALIDATION_RULE:
            return createValidationRulePlan(
                options
            );

        case ARTIFACT_TYPES.FORMULA:
            return createFormulaPlan(options);

        case ARTIFACT_TYPES.CUSTOM_FIELD:
            return createCustomFieldPlan(
                options
            );

        case ARTIFACT_TYPES.APEX:
            return createApexPlan(options);

        case ARTIFACT_TYPES.PERMISSION_SET:
            return createPermissionSetPlan(
                options
            );

        case ARTIFACT_TYPES.DUPLICATE_RULE:
            return createDuplicateRulePlan(
                options
            );

        case ARTIFACT_TYPES.RECORD_TYPE:
            return createRecordTypePlan(
                options
            );

        case ARTIFACT_TYPES.REPORT:
            return createReportPlan(options);

        case ARTIFACT_TYPES.DASHBOARD:
            return createDashboardPlan(
                options
            );

        case ARTIFACT_TYPES.QUEUE:
            return createQueuePlan(options);

        case ARTIFACT_TYPES.ROLE:
            return createRolePlan(options);

        case ARTIFACT_TYPES.SHARING_RULE:
            return createSharingRulePlan(
                options
            );

        default:
            return createGenericPlan(options);
    }
}

function createFlowPlan() {
    return {
        positiveTests: [
            'Confirm the active Flow version runs.',
            'Create a record that meets entry criteria.',
            'Update a record that meets entry criteria.',
            'Verify every expected element executes.',
            'Verify expected records are created or updated.',
            'Verify notifications and actions complete.',
            'Verify fault paths are not triggered during the successful scenario.'
        ],

        negativeTests: [
            'Create a record that does not meet entry criteria.',
            'Update a record that should not qualify.',
            'Test missing required values.',
            'Test null values.',
            'Test empty collections.',
            'Test failed data operations.',
            'Confirm fault paths handle errors appropriately.'
        ],

        permissionTests: [
            'Test as a System Administrator.',
            'Test as the intended running user.',
            'Test as a restricted user.',
            'Verify object permissions.',
            'Verify field-level security.',
            'Verify record-level access.',
            'Verify access to related records.'
        ],

        bulkTests: [
            'Test one qualifying record.',
            'Test multiple qualifying records.',
            'Test up to 200 records in one transaction when relevant.',
            'Verify no SOQL or DML limit failures.',
            'Verify no duplicate record creation.',
            'Verify no repeated or recursive execution.'
        ],

        regressionTests: [
            'Verify related Flows still work.',
            'Verify Validation Rules still behave correctly.',
            'Verify Apex triggers still succeed.',
            'Verify reports and dashboards still display expected results.',
            'Verify integrations still process affected records.',
            'Verify no existing automation order conflicts were introduced.'
        ]
    };
}

function createValidationRulePlan() {
    return {
        positiveTests: [
            'Save a record that should pass validation.',
            'Verify valid users can complete the business process.',
            'Verify the rule allows all intended exceptions.'
        ],

        negativeTests: [
            'Save a record that should fail validation.',
            'Verify the correct error message appears.',
            'Verify the error appears at the intended field or page location.',
            'Test boundary conditions.',
            'Test blank and null values.',
            'Test different record types.'
        ],

        permissionTests: [
            'Test as the affected business user.',
            'Test as a System Administrator.',
            'Test any intended bypass permission.',
            'Verify integrations and automation users are handled correctly.'
        ],

        bulkTests: [
            'Test bulk updates with valid data.',
            'Test bulk updates with invalid data.',
            'Verify failed records are clearly identified.',
            'Confirm valid records are not blocked incorrectly.'
        ],

        regressionTests: [
            'Verify existing imports still work.',
            'Verify Flows and Apex updates still work.',
            'Verify integrations still work.',
            'Verify the rule does not block unrelated business processes.'
        ]
    };
}

function createFormulaPlan() {
    return {
        positiveTests: [
            'Test representative input values.',
            'Verify expected output.',
            'Test each logical branch.',
            'Test different record types.',
            'Verify currency, number, and date formatting.'
        ],

        negativeTests: [
            'Test blank inputs.',
            'Test null related records.',
            'Test unexpected picklist values.',
            'Test divide-by-zero conditions.',
            'Test boundary values.',
            'Test invalid or incomplete source data.'
        ],

        permissionTests: [
            'Verify users can see all referenced fields.',
            'Verify field-level security does not produce misleading results.',
            'Test as a restricted user.'
        ],

        bulkTests: [
            'Verify formula output across multiple records.',
            'Test reports using the formula field.',
            'Test list views and exports using the formula field.'
        ],

        regressionTests: [
            'Verify dependent reports still work.',
            'Verify automation using the formula output still works.',
            'Verify related formula fields still return expected values.',
            'Verify integrations consuming the formula field still work.'
        ]
    };
}

function createCustomFieldPlan() {
    return {
        positiveTests: [
            'Create a record with a valid field value.',
            'Update the field.',
            'Verify the field appears on intended layouts.',
            'Verify the field appears for intended record types.',
            'Verify reports and list views can use the field.'
        ],

        negativeTests: [
            'Leave the field blank.',
            'Enter an invalid value.',
            'Test maximum length.',
            'Test restricted picklist behavior.',
            'Test duplicate values when unique.',
            'Test invalid related records when the field is a lookup.'
        ],

        permissionTests: [
            'Verify visible and editable access for intended users.',
            'Verify hidden or read-only access for restricted users.',
            'Verify object access.',
            'Verify field-level security.'
        ],

        bulkTests: [
            'Test data import.',
            'Test mass update.',
            'Test API insert and update.',
            'Test upsert when the field is an external ID.'
        ],

        regressionTests: [
            'Verify dependent Flows still work.',
            'Verify Validation Rules still work.',
            'Verify formulas still work.',
            'Verify reports and dashboards still work.',
            'Verify integrations still work.'
        ]
    };
}

function createApexPlan() {
    return {
        positiveTests: [
            'Test expected input.',
            'Test expected business outcome.',
            'Verify related records are created or updated correctly.',
            'Verify expected asynchronous work completes.'
        ],

        negativeTests: [
            'Test null inputs.',
            'Test missing related records.',
            'Test invalid data.',
            'Test DML failures.',
            'Test query assumptions.',
            'Test handled and unhandled exceptions.'
        ],

        permissionTests: [
            'Test with intended user permissions.',
            'Verify sharing behavior.',
            'Verify CRUD and field-level security behavior.',
            'Verify integration-user access when applicable.'
        ],

        bulkTests: [
            'Test one record.',
            'Test 200 records.',
            'Verify no SOQL-in-loop behavior.',
            'Verify no DML-in-loop behavior.',
            'Verify CPU, heap, and recursion stay within limits.',
            'Test asynchronous behavior where applicable.'
        ],

        regressionTests: [
            'Run all related Apex tests.',
            'Run local tests.',
            'Verify code coverage remains sufficient.',
            'Verify dependent Flows still work.',
            'Verify integrations still work.',
            'Verify no trigger-order issues were introduced.'
        ]
    };
}

function createPermissionSetPlan() {
    return {
        positiveTests: [
            'Assign the Permission Set to an intended user.',
            'Verify the user can perform the intended action.',
            'Verify object access.',
            'Verify field access.',
            'Verify Apex class access.',
            'Verify tab and app access.'
        ],

        negativeTests: [
            'Test a user without the Permission Set.',
            'Verify restricted actions remain unavailable.',
            'Verify the Permission Set does not grant broader access than intended.'
        ],

        permissionTests: [
            'Compare baseline and assigned-user access.',
            'Review Permission Set Groups.',
            'Review muting permissions.',
            'Review license compatibility.'
        ],

        bulkTests: [
            'Assign to multiple representative users.',
            'Verify no assignment errors occur.',
            'Verify user-license compatibility.'
        ],

        regressionTests: [
            'Verify existing users retain expected access.',
            'Verify sensitive fields remain protected.',
            'Verify Sharing Rules and OWD still behave correctly.'
        ]
    };
}

function createDuplicateRulePlan() {
    return {
        positiveTests: [
            'Create a clearly unique record.',
            'Update an existing unique record.',
            'Verify legitimate records are allowed.'
        ],

        negativeTests: [
            'Create an exact duplicate.',
            'Create a near duplicate.',
            'Test blank matching fields.',
            'Test formatting differences.',
            'Test fuzzy matching behavior.',
            'Verify allow-versus-block behavior.'
        ],

        permissionTests: [
            'Test a user who can see the matching record.',
            'Test a user who cannot see the matching record.',
            'Test integration-user behavior.'
        ],

        bulkTests: [
            'Test bulk imports.',
            'Test API inserts.',
            'Test Data Loader behavior.',
            'Verify failed duplicate records are identifiable.'
        ],

        regressionTests: [
            'Verify existing integrations still work.',
            'Verify legitimate records are not blocked.',
            'Verify duplicate reports still return expected records.'
        ]
    };
}

function createRecordTypePlan() {
    return {
        positiveTests: [
            'Create a record using the record type.',
            'Verify correct page layout.',
            'Verify correct picklist values.',
            'Verify correct business process.',
            'Verify correct default values.'
        ],

        negativeTests: [
            'Test a user without record-type access.',
            'Test invalid picklist values.',
            'Test missing required fields.',
            'Test unsupported business-process values.'
        ],

        permissionTests: [
            'Verify profile access.',
            'Verify Permission Set access.',
            'Verify default record type.',
            'Verify page-layout assignment.'
        ],

        bulkTests: [
            'Test import with record type ID.',
            'Test API creation.',
            'Test updates across multiple record types.'
        ],

        regressionTests: [
            'Verify Flows handle the record type.',
            'Verify Validation Rules handle the record type.',
            'Verify reports and dashboards include the correct records.',
            'Verify integrations map record types correctly.'
        ]
    };
}

function createReportPlan() {
    return {
        positiveTests: [
            'Verify expected records appear.',
            'Verify filters return correct data.',
            'Verify groupings and summaries.',
            'Verify formulas.',
            'Verify export behavior.'
        ],

        negativeTests: [
            'Verify excluded records remain excluded.',
            'Test empty-result scenarios.',
            'Test date-boundary conditions.',
            'Test missing or blank field values.'
        ],

        permissionTests: [
            'Test as the report owner.',
            'Test as a standard user.',
            'Verify folder access.',
            'Verify field-level security.',
            'Verify record-level visibility.'
        ],

        bulkTests: [
            'Test with representative data volume.',
            'Verify performance.',
            'Verify row limits and export behavior.'
        ],

        regressionTests: [
            'Verify dependent dashboards still work.',
            'Verify subscriptions still work.',
            'Verify scheduled reports still run.'
        ]
    };
}

function createDashboardPlan() {
    return {
        positiveTests: [
            'Refresh the dashboard.',
            'Verify each component returns expected data.',
            'Verify filters.',
            'Verify chart labels and summaries.',
            'Verify mobile and desktop layouts.'
        ],

        negativeTests: [
            'Test no-data scenarios.',
            'Test failed source reports.',
            'Test invalid filters.',
            'Test stale data.'
        ],

        permissionTests: [
            'Test as the running user.',
            'Test as a standard user.',
            'Verify folder access.',
            'Verify source-report access.'
        ],

        bulkTests: [
            'Test with representative data volume.',
            'Verify refresh performance.'
        ],

        regressionTests: [
            'Verify all source reports still work.',
            'Verify subscriptions and scheduled refreshes.',
            'Verify dynamic-dashboard behavior.'
        ]
    };
}

function createQueuePlan() {
    return {
        positiveTests: [
            'Create or assign a supported record to the queue.',
            'Verify members can access the record.',
            'Verify ownership behavior.',
            'Verify list views and notifications.'
        ],

        negativeTests: [
            'Test a non-member.',
            'Test unsupported objects.',
            'Test inactive users or groups.',
            'Test invalid assignment behavior.'
        ],

        permissionTests: [
            'Verify queue membership.',
            'Verify object access.',
            'Verify record access.',
            'Verify assignment permissions.'
        ],

        bulkTests: [
            'Assign multiple records.',
            'Verify no ownership or notification failures.'
        ],

        regressionTests: [
            'Verify assignment rules still work.',
            'Verify Flows still work.',
            'Verify reports still reflect queue ownership.'
        ]
    };
}

function createRolePlan() {
    return {
        positiveTests: [
            'Assign a user to the role.',
            'Verify expected upward visibility.',
            'Verify expected manager access.',
            'Verify reports reflect hierarchy behavior.'
        ],

        negativeTests: [
            'Test a user outside the hierarchy.',
            'Verify restricted records remain restricted.',
            'Test private OWD scenarios.'
        ],

        permissionTests: [
            'Verify role hierarchy.',
            'Verify OWD.',
            'Verify Sharing Rules.',
            'Verify manual sharing and teams.'
        ],

        bulkTests: [
            'Test multiple users and record owners.',
            'Verify large record sets remain accessible as intended.'
        ],

        regressionTests: [
            'Verify reports and dashboards.',
            'Verify manager visibility.',
            'Verify sharing remains least-privilege.'
        ]
    };
}

function createSharingRulePlan() {
    return {
        positiveTests: [
            'Create a record that meets sharing criteria.',
            'Verify intended users receive access.',
            'Verify correct access level.'
        ],

        negativeTests: [
            'Create a record that does not meet criteria.',
            'Verify unintended users do not receive access.',
            'Test records before and after criteria changes.'
        ],

        permissionTests: [
            'Verify public group membership.',
            'Verify role membership.',
            'Verify OWD baseline.',
            'Verify read-only versus read/write access.'
        ],

        bulkTests: [
            'Test multiple qualifying records.',
            'Verify recalculation completes.',
            'Verify performance remains acceptable.'
        ],

        regressionTests: [
            'Verify existing sharing remains correct.',
            'Verify reports and dashboards.',
            'Verify integrations and ownership changes.'
        ]
    };
}

function createGenericPlan() {
    return {
        positiveTests: [
            'Test the expected business scenario.',
            'Verify the expected result.'
        ],

        negativeTests: [
            'Test invalid or incomplete inputs.',
            'Verify errors are handled clearly.'
        ]
    };
}

function buildTestSummary(
    artifactType,
    artifactName
) {
    return `Test plan for ${
        artifactName ||
        'the Salesforce artifact'
    } covering positive, negative, permission, bulk, regression, and deployment scenarios for ${artifactType}.`;
}

function normalizeArtifactType(
    artifactType
) {
    const normalized =
        String(artifactType || '')
            .trim()
            .toLowerCase();

    const aliases = {
        flow: ARTIFACT_TYPES.FLOW,
        validationrule:
            ARTIFACT_TYPES.VALIDATION_RULE,
        validation_rule:
            ARTIFACT_TYPES.VALIDATION_RULE,
        formula:
            ARTIFACT_TYPES.FORMULA,
        formulafield:
            ARTIFACT_TYPES.FORMULA,
        customfield:
            ARTIFACT_TYPES.CUSTOM_FIELD,
        field:
            ARTIFACT_TYPES.CUSTOM_FIELD,
        apex:
            ARTIFACT_TYPES.APEX,
        apexclass:
            ARTIFACT_TYPES.APEX,
        trigger:
            ARTIFACT_TYPES.APEX,
        permissionset:
            ARTIFACT_TYPES.PERMISSION_SET,
        duplicaterule:
            ARTIFACT_TYPES.DUPLICATE_RULE,
        recordtype:
            ARTIFACT_TYPES.RECORD_TYPE,
        report:
            ARTIFACT_TYPES.REPORT,
        dashboard:
            ARTIFACT_TYPES.DASHBOARD,
        queue:
            ARTIFACT_TYPES.QUEUE,
        role:
            ARTIFACT_TYPES.ROLE,
        sharingrule:
            ARTIFACT_TYPES.SHARING_RULE
    };

    return aliases[normalized] ||
        ARTIFACT_TYPES.UNKNOWN;
}

function normalizeArray(value) {
    return Array.isArray(value)
        ? [...value]
        : [];
}