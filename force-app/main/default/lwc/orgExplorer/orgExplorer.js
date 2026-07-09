import { LightningElement } from 'lwc';
import describeObject from '@salesforce/apex/OrgExplorerController.describeObject';

export default class OrgExplorer extends LightningElement {
    orgInput = '';
    orgAnalysis = null;

    get showOrgAnalysis() {
        return this.orgAnalysis !== null;
    }

    handleOrgInputChange(event) {
        this.orgInput = event.target.value;
    }

    normalizeObjectName(input) {
        const value = input || 'Opportunity';
        const lowerValue = value.toLowerCase().trim();

        const standardObjects = {
            account: 'Account',
            contact: 'Contact',
            opportunity: 'Opportunity',
            lead: 'Lead',
            case: 'Case',
            task: 'Task',
            event: 'Event',
            campaign: 'Campaign',
            user: 'User'
        };

        return standardObjects[lowerValue] || value.trim();
    }

    async exploreObject() {
        const objectApiName = this.normalizeObjectName(this.orgInput);
        this.orgAnalysis = null;

        try {
            const result = await describeObject({ objectApiName });

            if (!result.found) {
                this.orgAnalysis = {
                    objectName: objectApiName,
                    objectType: 'Not Found',
                    healthScore: '0%',
                    impactLevel: 'Object Not Found',
                    fieldCount: 0,
                    relationships: 0,
                    validationRules: 0,
                    recordTypes: 0,
                    flows: 0,
                    pageLayouts: 0,
                    permissions: 'Unavailable',
                    summary: result.message,
                    fields: [],
                    relationshipMap: [],
                    automationInventory: [],
                    risks: ['Object could not be found in this org. Check the API name and try again.'],
                    recommendations: ['Use the exact object API name, such as Opportunity, Account, Contact, Case, or Custom_Object__c.']
                };
                return;
            }

            const fields = result.fields || [];

            this.orgAnalysis = {
                objectName: result.label,
                objectApiName: result.apiName,
                objectType: result.custom ? 'Custom Object' : 'Standard Object',
                healthScore: '87%',
                impactLevel: result.queryable ? 'High Impact Object' : 'Limited Access Object',
                fieldCount: result.fieldCount,
                relationships: result.relationshipCount,
                validationRules: 'Future Metadata API',
                recordTypes: 'Future Metadata API',
                flows: 'Future Metadata API',
                pageLayouts: 'Future Metadata API',
                permissions: result.updateable ? 'Editable' : 'Read Only',
                fields: fields.slice(0, 25),

                summary: `${result.label} (${result.apiName}) is a ${result.custom ? 'custom' : 'standard'} Salesforce object with ${result.fieldCount} fields and ${result.relationshipCount} child relationships.`,

                relationshipMap: [
                    `${result.label} → Child Relationships: ${result.relationshipCount}`,
                    `${result.label} → Fields: ${result.fieldCount}`,
                    `${result.label} → Createable: ${result.createable}`,
                    `${result.label} → Updateable: ${result.updateable}`,
                    `${result.label} → Deleteable: ${result.deletable}`,
                    `${result.label} → Queryable: ${result.queryable}`
                ],

                automationInventory: [
                    'Flow inventory requires Metadata API or Tooling API integration.',
                    'Validation Rule inventory requires Metadata API integration.',
                    'Apex Trigger inventory requires Tooling API integration.',
                    'Permission analysis requires Profile and Permission Set metadata.'
                ],

                risks: [
                    'Objects with many fields can become difficult for users to maintain.',
                    'Objects with many relationships may have high change impact.',
                    'Automation inventory is not fully connected yet.'
                ],

                recommendations: [
                    'Review field list and identify unused or unclear fields.',
                    'Document important fields and relationships.',
                    'Add Metadata API or Tooling API support for automation inventory.'
                ]
            };
        } catch (error) {
            this.orgAnalysis = {
                objectName: objectApiName,
                objectType: 'Error',
                healthScore: '0%',
                impactLevel: 'Apex Error',
                fieldCount: 0,
                relationships: 0,
                validationRules: 0,
                recordTypes: 0,
                flows: 0,
                pageLayouts: 0,
                permissions: 'Unavailable',
                summary: 'There was an error retrieving object metadata.',
                fields: [],
                relationshipMap: [],
                automationInventory: [],
                risks: ['Apex call failed. Check deployment, class access, and object API name.'],
                recommendations: ['Confirm OrgExplorerController deployed successfully and try again.']
            };
        }
    }
}