/*
 * orgContextViewer.js
 *
 * Diagnostic component for testing the Salesforce Copilot
 * Org Context Service.
 */

import { LightningElement } from 'lwc';

import {
    getOrgSummary,
    getObjects,
    getObjectContext
} from 'c/orgContextService';

export default class OrgContextViewer
    extends LightningElement {

    orgSummary = null;
    objects = [];
    objectContext = null;

    objectSearchTerm = '';
    objectResultLimit = '100';
    objectApiName = 'Opportunity';

    isLoadingSummary = false;
    isLoadingObjects = false;
    isLoadingObjectContext = false;

    errorMessage = '';
    successMessage = '';

    connectedCallback() {
        this.loadOrgSummary();
    }

    get hasOrgSummary() {
        return Boolean(this.orgSummary);
    }

    get hasObjects() {
        return this.objects.length > 0;
    }

    get hasObjectContext() {
        return Boolean(this.objectContext);
    }

    get objectCountLabel() {
        return `${this.objects.length} objects loaded`;
    }

    get customObjectLabel() {
        return this.orgSummary
            ? String(
                  this.orgSummary.customObjects
              )
            : '0';
    }

    get standardObjectLabel() {
        return this.orgSummary
            ? String(
                  this.orgSummary.standardObjects
              )
            : '0';
    }

    get totalObjectLabel() {
        return this.orgSummary
            ? String(
                  this.orgSummary.totalObjects
              )
            : '0';
    }

    get queryableObjectLabel() {
        return this.orgSummary
            ? String(
                  this.orgSummary.queryableObjects
              )
            : '0';
    }

    get accessibleObjectLabel() {
        return this.orgSummary
            ? String(
                  this.orgSummary.accessibleObjects
              )
            : '0';
    }

    get summaryButtonDisabled() {
        return this.isLoadingSummary;
    }

    get objectsButtonDisabled() {
        return this.isLoadingObjects;
    }

    get inspectButtonDisabled() {
        return (
            this.isLoadingObjectContext ||
            !this.objectApiName.trim()
        );
    }

    async loadOrgSummary() {
        this.resetMessages();
        this.isLoadingSummary = true;

        try {
            this.orgSummary =
                await getOrgSummary();

            this.successMessage =
                'Live organization summary loaded successfully.';
        } catch (error) {
            this.errorMessage =
                this.getErrorMessage(error);
        } finally {
            this.isLoadingSummary = false;
        }
    }

    async loadObjects() {
        this.resetMessages();
        this.isLoadingObjects = true;
        this.objects = [];

        try {
            this.objects = await getObjects(
                this.objectSearchTerm,
                Number(this.objectResultLimit)
            );

            this.successMessage =
                `${this.objects.length} Salesforce objects loaded successfully.`;
        } catch (error) {
            this.errorMessage =
                this.getErrorMessage(error);
        } finally {
            this.isLoadingObjects = false;
        }
    }

    async inspectObject() {
        this.resetMessages();
        this.objectContext = null;
        this.isLoadingObjectContext = true;

        try {
            this.objectContext =
                await getObjectContext(
                    this.objectApiName
                );

            this.successMessage =
                `${this.objectContext.label} metadata loaded successfully.`;
        } catch (error) {
            this.errorMessage =
                this.getErrorMessage(error);
        } finally {
            this.isLoadingObjectContext = false;
        }
    }

    handleObjectSearchChange(event) {
        this.objectSearchTerm =
            event.target.value || '';
    }

    handleResultLimitChange(event) {
        this.objectResultLimit =
            event.detail.value;
    }

    handleObjectNameChange(event) {
        this.objectApiName =
            event.target.value || '';
    }

    handleRefreshSummary() {
        this.loadOrgSummary();
    }

    handleLoadObjects() {
        this.loadObjects();
    }

    handleInspectObject() {
        this.inspectObject();
    }

    resetMessages() {
        this.errorMessage = '';
        this.successMessage = '';
    }

    getErrorMessage(error) {
        if (
            error &&
            typeof error.message === 'string'
        ) {
            return error.message;
        }

        if (
            error &&
            error.body &&
            typeof error.body.message ===
                'string'
        ) {
            return error.body.message;
        }

        return 'The Org Context Service could not retrieve Salesforce metadata.';
    }

    get resultLimitOptions() {
        return [
            {
                label: '25 objects',
                value: '25'
            },
            {
                label: '50 objects',
                value: '50'
            },
            {
                label: '100 objects',
                value: '100'
            },
            {
                label: '200 objects',
                value: '200'
            }
        ];
    }
}