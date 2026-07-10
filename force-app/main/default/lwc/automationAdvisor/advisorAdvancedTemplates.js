/*
 * advisorAdvancedTemplates.js
 *
 * Builds detailed recommendations for specialized Salesforce solutions.
 *
 * Supported recommendation types:
 * - Formula Field
 * - Roll-Up Summary Field
 * - Matching Rule and Duplicate Rule
 * - Platform Event
 * - Invocable Apex
 * - Requirement Clarification
 */

import { RECOMMENDATION_TYPES } from './advisorRules';

export function buildAdvancedRecommendation(
    type,
    requirement,
    parsedRequirement,
    ruleResult = {}
) {
    let recommendation;

    switch (type) {
        case RECOMMENDATION_TYPES.FORMULA_FIELD:
            recommendation = createFormulaField(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.ROLLUP_SUMMARY:
            recommendation = createRollupSummary(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.DUPLICATE_MANAGEMENT:
            recommendation = createDuplicateManagement(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.PLATFORM_EVENT:
            recommendation = createPlatformEvent(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.INVOCABLE_APEX:
            recommendation = createInvocableApex(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.CLARIFICATION:
            recommendation = createClarificationResponse(
                requirement,
                parsedRequirement
            );
            break;

        default:
            recommendation = createClarificationResponse(
                requirement,
                parsedRequirement
            );
            break;
    }

    return applyRuleDetails(recommendation, ruleResult);
}

function createBaseRecommendation(
    requirement,
    parsedRequirement
) {
    return {
        requirement,
        parsedRequirement,

        solution: '',
        solutionIcon: 'utility:settings',
        summary: '',

        confidence: '90%',
        status: 'Recommended',
        complexity: 'Medium',
        estimatedBuildTime: '1–2 hours',
        maintenanceLevel: 'Admin-friendly',
        recommendedTiming:
            parsedRequirement?.timing || 'To be confirmed',

        matchedRule: '',
        ruleReasons: [],

        whyThisFits: [],
        architectureSteps: [],
        risks: [],
        testCases: [],
        acceptanceCriteria: [],
        buildChecklist: [],
        deploymentChecklist:
            createDefaultDeploymentChecklist(),
        rollbackPlan:
            createDefaultRollbackPlan(),
        alternatives: [],

        userStory: '',
        interviewAnswer: ''
    };
}

function applyRuleDetails(recommendation, ruleResult) {
    if (!ruleResult) {
        return recommendation;
    }

    if (typeof ruleResult.confidence === 'number') {
        recommendation.confidence =
            `${ruleResult.confidence}%`;
    }

    recommendation.matchedRule =
        ruleResult.matchedRule || '';

    recommendation.ruleReasons =
        Array.isArray(ruleResult.reasons)
            ? [...ruleResult.reasons]
            : [];

    return recommendation;
}

function createFormulaField(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution = 'Formula Field';
    recommendation.solutionIcon = 'utility:formula';

    recommendation.summary =
        'Use a Formula Field when Salesforce should calculate and display a value dynamically without storing the result through automation.';

    recommendation.confidence = '94%';
    recommendation.complexity = 'Low';
    recommendation.estimatedBuildTime =
        '15–30 minutes';
    recommendation.maintenanceLevel =
        'Admin-friendly';
    recommendation.recommendedTiming =
        'Calculated dynamically when viewed, queried, or reported';

    recommendation.userStory =
        `As a Salesforce user, I want Salesforce to ${requirement.toLowerCase()} so that I can see accurate information without performing a manual calculation.`;

    recommendation.whyThisFits = [
        'The requirement describes a calculated or derived value.',
        'Formula Fields recalculate automatically when source data changes.',
        'No Flow execution or additional database update is required.',
        'The solution is declarative and easy to maintain.',
        'The value can be displayed in records, reports, and list views.'
    ];

    recommendation.architectureSteps = [
        'Confirm that the value should calculate dynamically rather than be stored historically.',
        'Choose the correct formula return type.',
        'Identify the source fields.',
        'Write and validate the formula.',
        'Handle blank values and edge cases.',
        'Review cross-object references.',
        'Add a clear field description and help text.',
        'Configure field-level security.',
        'Add the field to required layouts and reports.',
        'Test expected, blank, negative, and boundary values.'
    ];

    recommendation.risks = [
        'Complex formulas may become difficult to maintain.',
        'Cross-object formulas can create dependency and performance concerns.',
        'Formula compile-size and relationship limits must be considered.',
        'Users may not see correct results if they lack access to source data.',
        'Formula Fields do not preserve a historical snapshot of the calculated value.'
    ];

    recommendation.testCases = [
        'Expected source values return the correct result.',
        'Blank source values are handled correctly.',
        'Date boundaries calculate correctly.',
        'Negative and zero values behave correctly.',
        'Cross-object data displays correctly.',
        'Reports and list views show the expected result.',
        'Restricted users see only authorized information.'
    ];

    recommendation.acceptanceCriteria = [
        'The formula returns the expected data type.',
        'The value recalculates automatically when source data changes.',
        'Blank and boundary cases are handled.',
        'The field is visible only to intended users.',
        'Reports and list views display the expected value.',
        'No unnecessary Flow or Apex automation is introduced.'
    ];

    recommendation.buildChecklist = [
        'Confirm the value does not need to be stored historically.',
        'Choose the return type.',
        'Identify source fields.',
        'Write the formula.',
        'Handle blanks and edge cases.',
        'Add description and help text.',
        'Review field-level security.',
        'Add the field to layouts.',
        'Test reports and user interfaces.'
    ];

    recommendation.alternatives = [
        {
            name: 'Before-Save Flow',
            recommendation:
                'Use when the value must be stored',
            reason:
                'Use a Before-Save Flow when the calculation must be written into a persistent field for integrations, auditing, or historical reporting.'
        },
        {
            name: 'Roll-Up Summary Field',
            recommendation:
                'Use for supported parent-child aggregation',
            reason:
                'A Roll-Up Summary Field is more appropriate for COUNT, SUM, MIN, or MAX aggregation across master-detail records.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected a Formula Field because the requirement is to calculate and display a value dynamically. This avoids unnecessary automation and keeps the value current whenever the source data changes.';

    return recommendation;
}

function createRollupSummary(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Roll-Up Summary Field';

    recommendation.solutionIcon =
        'utility:summary';

    recommendation.summary =
        'Use a Roll-Up Summary Field when a master-detail parent record must count, sum, find the minimum, or find the maximum of related child records.';

    recommendation.confidence = '91%';
    recommendation.complexity = 'Low';
    recommendation.estimatedBuildTime =
        '15–30 minutes';
    recommendation.maintenanceLevel =
        'Admin-friendly';
    recommendation.recommendedTiming =
        'Automatically recalculated from related child records';

    recommendation.userStory =
        `As a Salesforce user, I want Salesforce to ${requirement.toLowerCase()} so that I can see the aggregate value directly on the parent record.`;

    recommendation.whyThisFits = [
        'The requirement describes parent-level aggregation.',
        'Salesforce provides native COUNT, SUM, MIN, and MAX functions.',
        'The result updates automatically as child records change.',
        'No Flow or Apex is required when the relationship supports native roll-ups.'
    ];

    recommendation.architectureSteps = [
        'Confirm that the relationship is master-detail.',
        'Identify the parent object.',
        'Identify the child object.',
        'Choose COUNT, SUM, MIN, or MAX.',
        'Select the child field when required.',
        'Add filter criteria if only certain child records qualify.',
        'Configure field-level security and page layouts.',
        'Test child creation, update, deletion, and reparenting behavior.'
    ];

    recommendation.risks = [
        'Native Roll-Up Summary Fields require a master-detail relationship.',
        'Some field types cannot be aggregated.',
        'Lookup relationships require a different approach.',
        'Filtered roll-ups may produce unexpected results if criteria are unclear.',
        'Large child-record volumes should be tested.'
    ];

    recommendation.testCases = [
        'A qualifying child record is created.',
        'A qualifying child record is updated.',
        'A qualifying child record is deleted.',
        'A child enters the roll-up criteria.',
        'A child leaves the roll-up criteria.',
        'A child is reparented where allowed.',
        'The parent value recalculates correctly.'
    ];

    recommendation.acceptanceCriteria = [
        'The parent value reflects all qualifying child records.',
        'Child creation, update, and deletion recalculate correctly.',
        'Filter criteria are applied correctly.',
        'Users can view the value where required.',
        'Expected record volume performs acceptably.'
    ];

    recommendation.buildChecklist = [
        'Confirm master-detail relationship.',
        'Identify parent and child objects.',
        'Choose the aggregate type.',
        'Select the child field.',
        'Define filter criteria.',
        'Configure security.',
        'Add the field to layouts and reports.',
        'Test the complete child-record lifecycle.'
    ];

    recommendation.alternatives = [
        {
            name: 'Record-Triggered Flow',
            recommendation:
                'Use for lookup relationships',
            reason:
                'Flow can maintain an aggregate value when a native Roll-Up Summary Field is unavailable.'
        },
        {
            name: 'Apex Roll-Up Logic',
            recommendation:
                'Use for advanced aggregation',
            reason:
                'Apex may be required for complex, cross-object, or high-volume aggregate logic.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected a Roll-Up Summary Field because the requirement aggregates child data on a master-detail parent. It is native, automatic, and simpler to maintain than Flow or Apex.';

    return recommendation;
}

function createDuplicateManagement(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Matching Rule and Duplicate Rule';

    recommendation.solutionIcon =
        'utility:merge_field';

    recommendation.summary =
        'Use a Matching Rule to identify potential duplicate records and a Duplicate Rule to warn users or block duplicate creation.';

    recommendation.confidence = '95%';
    recommendation.complexity = 'Medium';
    recommendation.estimatedBuildTime =
        '30–60 minutes';
    recommendation.maintenanceLevel =
        'Admin-friendly';
    recommendation.recommendedTiming =
        'During record creation or update';

    recommendation.userStory =
        `As a data steward, I want Salesforce to detect and manage duplicates when ${requirement.toLowerCase()} so that customer and business data remains trustworthy.`;

    recommendation.whyThisFits = [
        'The requirement focuses on duplicate detection or prevention.',
        'Salesforce provides native matching and enforcement tools.',
        'Rules can warn users or block the save.',
        'Common duplicate scenarios do not require custom code.',
        'Duplicate management can support users, imports, and integrations.'
    ];

    recommendation.architectureSteps = [
        'Identify the fields that define a duplicate.',
        'Determine whether exact or fuzzy matching is required.',
        'Create or select a Matching Rule.',
        'Create a Duplicate Rule.',
        'Choose alert, allow, or block behavior.',
        'Define bypass users or integration behavior where necessary.',
        'Activate the Matching Rule.',
        'Activate the Duplicate Rule.',
        'Test exact, fuzzy, import, and integration scenarios.',
        'Document merge and cleanup procedures.'
    ];

    recommendation.risks = [
        'Rules that are too strict may block legitimate records.',
        'Rules that are too loose may miss duplicates.',
        'Fuzzy matching may generate false positives.',
        'Integrations and imports may require different behavior.',
        'Existing duplicates require a cleanup and merge strategy.'
    ];

    recommendation.testCases = [
        'An exact duplicate is detected.',
        'A near-match duplicate is detected.',
        'A legitimate similar record is allowed.',
        'A user receives the correct warning or block.',
        'An integration user behaves as documented.',
        'Bulk import behavior is tested.',
        'The merge process preserves intended data.'
    ];

    recommendation.acceptanceCriteria = [
        'Potential duplicates are identified using documented criteria.',
        'Users receive the expected warning or block.',
        'Legitimate records can still be created.',
        'Integration and import behavior is documented.',
        'Existing duplicates have a cleanup process.',
        'False-positive rates are acceptable.'
    ];

    recommendation.buildChecklist = [
        'Define duplicate criteria.',
        'Choose exact or fuzzy matching.',
        'Configure the Matching Rule.',
        'Configure the Duplicate Rule.',
        'Choose warning or blocking behavior.',
        'Define bypass behavior.',
        'Activate both rules.',
        'Test UI, import, and integration scenarios.',
        'Document cleanup and merge processes.'
    ];

    recommendation.alternatives = [
        {
            name: 'Before-Save Flow',
            recommendation:
                'Use for data normalization',
            reason:
                'A Before-Save Flow can normalize phone numbers, email values, or other data before duplicate evaluation.'
        },
        {
            name: 'Apex Duplicate Service',
            recommendation:
                'Use only for advanced matching',
            reason:
                'Custom code may be required for complex cross-object, weighted, or industry-specific matching.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected Matching Rules and Duplicate Rules because Salesforce provides native duplicate detection and enforcement. I would tune the matching criteria carefully, test false positives, and confirm behavior for users, integrations, and imports.';

    return recommendation;
}

function createPlatformEvent(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Platform Event with Event-Triggered Automation';

    recommendation.solutionIcon =
        'utility:broadcast';

    recommendation.summary =
        'Use a Platform Event when systems or processes need loosely coupled, asynchronous, event-driven communication.';

    recommendation.confidence = '87%';
    recommendation.complexity = 'High';
    recommendation.estimatedBuildTime =
        'Several hours';
    recommendation.maintenanceLevel =
        'Developer or architect oversight';
    recommendation.recommendedTiming =
        'Asynchronous event-driven processing';

    recommendation.userStory =
        `As an integration or process owner, I want an event-driven solution for ${requirement.toLowerCase()} so that systems and subscribers can respond independently and asynchronously.`;

    recommendation.whyThisFits = [
        'The requirement describes event-driven processing.',
        'Publishers and subscribers should remain loosely coupled.',
        'Processing may occur asynchronously.',
        'Multiple subscribers may respond to the same business event.',
        'Platform Events support Salesforce and external-system integration patterns.'
    ];

    recommendation.architectureSteps = [
        'Define the business event and event contract.',
        'Create the Platform Event and required fields.',
        'Configure the publisher using Flow, Apex, or an external system.',
        'Configure Flow, Apex, or external subscribers.',
        'Design subscribers to be idempotent.',
        'Define replay and retry behavior.',
        'Add monitoring and error handling.',
        'Document event retention and limits.',
        'Test duplicates, ordering, failures, and volume.'
    ];

    recommendation.risks = [
        'Event delivery and replay require careful design.',
        'Subscribers must safely handle duplicate events.',
        'Event ordering may not always match business assumptions.',
        'Debugging asynchronous processes can be more difficult.',
        'Event limits and retention periods must be considered.',
        'Failed subscribers require monitoring and recovery procedures.'
    ];

    recommendation.testCases = [
        'The publisher successfully emits the event.',
        'Each intended subscriber receives the event.',
        'A duplicate event is handled safely.',
        'A subscriber failure is logged.',
        'Replay behavior works as documented.',
        'Out-of-order events are handled safely.',
        'High-volume publishing and subscription behavior is tested.'
    ];

    recommendation.acceptanceCriteria = [
        'The event contract is documented.',
        'Publishers emit the expected event.',
        'Subscribers process events safely.',
        'Duplicate and replay scenarios are handled.',
        'Monitoring and failure recovery are documented.',
        'Volume remains within platform limits.'
    ];

    recommendation.buildChecklist = [
        'Define the business event.',
        'Define the event contract.',
        'Create the Platform Event.',
        'Build the publisher.',
        'Build subscribers.',
        'Add idempotency controls.',
        'Add monitoring and error handling.',
        'Define replay strategy.',
        'Test duplicates, ordering, and volume.'
    ];

    recommendation.alternatives = [
        {
            name: 'Record-Triggered Flow',
            recommendation:
                'Use for simple same-org automation',
            reason:
                'A Record-Triggered Flow is simpler when all processing happens synchronously in one Salesforce org.'
        },
        {
            name: 'Apex Callout',
            recommendation:
                'Use for immediate request-response integration',
            reason:
                'A direct callout may be better when Salesforce requires an immediate response from an external service.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected a Platform Event because the requirement benefits from asynchronous, loosely coupled communication. I would define a clear event contract, make subscribers idempotent, and test replay, duplicate, ordering, and failure scenarios.';

    return recommendation;
}

function createInvocableApex(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Invocable Apex with Flow Orchestration';

    recommendation.solutionIcon =
        'utility:apex';

    recommendation.summary =
        'Use Invocable Apex when the requirement needs advanced transaction control, complex logic, high-volume processing, integrations, or functionality that Flow cannot safely provide alone.';

    recommendation.confidence = '86%';
    recommendation.status =
        'Conditional Recommendation';
    recommendation.complexity = 'High';
    recommendation.estimatedBuildTime =
        'Several hours or more';
    recommendation.maintenanceLevel =
        'Developer support required';
    recommendation.recommendedTiming =
        'Flow-managed orchestration with Apex service execution';

    recommendation.userStory =
        `As a system owner, I want Salesforce to ${requirement.toLowerCase()} so that advanced business, integration, or scale requirements are handled safely and reliably.`;

    recommendation.whyThisFits = [
        'The requirement suggests advanced logic, integration, scale, or transaction control.',
        'Apex provides detailed exception and transaction management.',
        'Invocable Apex keeps complex services reusable.',
        'Flow can remain the maintainable orchestration layer.',
        'The hybrid pattern limits custom code to the logic that genuinely requires it.'
    ];

    recommendation.architectureSteps = [
        'Confirm that declarative tools cannot safely meet the requirement.',
        'Separate orchestration logic from service logic.',
        'Create focused Apex service classes.',
        'Expose only required functionality through an invocable method.',
        'Bulkify all record processing.',
        'Enforce sharing, CRUD, and field-level security.',
        'Add structured exception handling and logging.',
        'Configure Named Credentials for external callouts where required.',
        'Create comprehensive Apex tests.',
        'Call the service from Flow where appropriate.',
        'Document deployment, monitoring, and support ownership.'
    ];

    recommendation.risks = [
        'Custom code increases maintenance requirements.',
        'Poor bulkification may cause governor-limit failures.',
        'Insufficient tests may block deployment or hide defects.',
        'Security must be enforced explicitly.',
        'Callouts require authentication and transaction planning.',
        'Changes may require developer support and regression testing.'
    ];

    recommendation.testCases = [
        'A single-record transaction succeeds.',
        'A bulk transaction succeeds.',
        'Invalid input is handled.',
        'An external integration fails safely.',
        'A permission-restricted user is handled correctly.',
        'Governor-limit-sensitive behavior is tested.',
        'Rollback and exception behavior is verified.',
        'Flow-to-Apex inputs and outputs behave correctly.',
        'Required Apex code coverage is achieved.'
    ];

    recommendation.acceptanceCriteria = [
        'The Apex service is bulk-safe.',
        'Sharing and object security are enforced.',
        'Exceptions are logged or returned appropriately.',
        'Flow inputs and outputs are documented.',
        'Tests cover positive, negative, bulk, and failure scenarios.',
        'Deployment meets required code coverage.',
        'The solution has documented support ownership.'
    ];

    recommendation.buildChecklist = [
        'Validate the need for custom code.',
        'Design the service class.',
        'Create the invocable interface.',
        'Bulkify the logic.',
        'Enforce sharing and security.',
        'Add exception handling.',
        'Configure callout authentication if required.',
        'Write comprehensive tests.',
        'Integrate with Flow.',
        'Document monitoring and support.'
    ];

    recommendation.alternatives = [
        {
            name: 'Record-Triggered Flow',
            recommendation:
                'Use for simpler portions',
            reason:
                'Keep maintainable declarative steps in Flow and reserve Apex for the genuinely complex logic.'
        },
        {
            name: 'Platform Event',
            recommendation:
                'Use for asynchronous decoupling',
            reason:
                'Platform Events may be more appropriate when multiple asynchronous subscribers need to respond independently.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected Invocable Apex only after determining that the requirement exceeds safe declarative capabilities. I would keep the code bulk-safe, security-aware, testable, and reusable, while using Flow as the orchestration layer where that improves maintainability.';

    return recommendation;
}

function createClarificationResponse(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'More Information Required';

    recommendation.solutionIcon =
        'utility:question';

    recommendation.summary =
        'The requirement does not include enough detail to confidently recommend a Salesforce automation or configuration solution.';

    recommendation.confidence = '45%';
    recommendation.status =
        'Clarification Needed';
    recommendation.complexity = 'Unknown';
    recommendation.estimatedBuildTime =
        'Cannot estimate yet';
    recommendation.maintenanceLevel =
        'To be determined';
    recommendation.recommendedTiming =
        'To be confirmed';

    recommendation.userStory =
        'As a solution designer, I want the business requirement clarified so that the correct Salesforce solution can be selected.';

    recommendation.whyThisFits = [
        'The triggering event is unclear.',
        'The Salesforce object may not be clearly identified.',
        'The expected business outcome needs more detail.',
        'User interaction, approval, integration, timing, and volume may change the recommendation.',
        'Acceptance criteria are not yet measurable.'
    ];

    recommendation.architectureSteps = [
        'Identify the Salesforce object.',
        'Define what starts the process.',
        'Describe the expected business outcome.',
        'Confirm whether a user must interact with the process.',
        'Confirm whether formal approval is required.',
        'Identify integrations or external systems.',
        'Estimate expected record volume.',
        'Document exceptions and edge cases.',
        'Define measurable acceptance criteria.',
        'Resubmit the clarified requirement.'
    ];

    recommendation.risks = [
        'Selecting a tool too early may create rework.',
        'Missing volume details may lead to scale problems.',
        'Missing user-experience needs may produce the wrong solution.',
        'Unclear acceptance criteria make testing difficult.',
        'Unknown integrations may create security and transaction concerns.'
    ];

    recommendation.testCases = [
        'Confirm the final requirement has a clear trigger.',
        'Confirm the Salesforce object is identified.',
        'Confirm expected outcomes are measurable.',
        'Confirm users and permissions are known.',
        'Confirm exceptions and edge cases are documented.',
        'Confirm volume and integration requirements are understood.'
    ];

    recommendation.acceptanceCriteria = [
        'The object is identified.',
        'The trigger is documented.',
        'The outcome is measurable.',
        'Users and timing are known.',
        'Volume and integration needs are understood.',
        'Exceptions and acceptance criteria are documented.'
    ];

    recommendation.buildChecklist = [
        'Run a discovery session.',
        'Document the current process.',
        'Identify stakeholders.',
        'Define the trigger.',
        'Define the business outcome.',
        'Identify users and permissions.',
        'Identify integration needs.',
        'Estimate volume.',
        'Define acceptance criteria.',
        'Run Automation Advisor again.'
    ];

    recommendation.alternatives = [
        {
            name: 'Requirement Discovery Session',
            recommendation: 'Recommended',
            reason:
                'Gather the object, trigger, users, outcome, timing, volume, integrations, exceptions, and acceptance criteria before designing the solution.'
        }
    ];

    recommendation.interviewAnswer =
        'I would not choose an automation tool until the requirement is clearer. I would first confirm the object, trigger, expected outcome, users, timing, volume, integrations, exceptions, and measurable acceptance criteria.';

    return recommendation;
}

function createDefaultDeploymentChecklist() {
    return [
        'Validate the solution in a sandbox.',
        'Complete documented test scenarios.',
        'Confirm object permissions and field-level security.',
        'Review automation order and dependencies.',
        'Prepare deployment notes.',
        'Deploy through a controlled change process.',
        'Run post-deployment smoke testing.',
        'Confirm monitoring and support ownership.'
    ];
}

function createDefaultRollbackPlan() {
    return [
        'Document the previous configuration.',
        'Retain a recoverable previous version where appropriate.',
        'Identify records affected during deployment.',
        'Define how to deactivate or revert the new solution.',
        'Prepare corrective data steps if records were changed.',
        'Confirm rollback criteria with the business owner.'
    ];
}