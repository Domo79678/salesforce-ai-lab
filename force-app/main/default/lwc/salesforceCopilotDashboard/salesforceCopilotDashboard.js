import { LightningElement } from 'lwc';

const DASHBOARD = 'dashboard';

export default class SalesforceCopilotDashboard extends LightningElement {

    currentView = DASHBOARD;

    capabilities = [

        {
            name: 'explainThis',
            title: 'Explain This',
            iconName: 'utility:knowledge_base',
            description:
                'Instantly explain Salesforce metadata using business context, technical analysis, dependency mapping, deployment guidance, testing recommendations, and interview coaching.',
            status: 'Available',
            statusClass: 'status-badge status-available',
            progress: 100,
            progressLabel: '100% complete',
            phase: 'Copilot Intelligence Engine',
            disabled: false,
            featured: true
        },

        {
            name: 'flowIntelligence',
            title: 'Flow Intelligence',
            iconName: 'utility:flow',
            description:
                'Analyze Salesforce Flows, identify risks, documentation, testing strategies, and interview insights.',
            status: 'Available',
            statusClass: 'status-badge status-available',
            progress: 85,
            progressLabel: '85% complete',
            phase: 'Live Module',
            disabled: false
        },

        {
            name: 'orgExplorer',
            title: 'Org Explorer',
            iconName: 'utility:connected_apps',
            description:
                'Explore Salesforce objects, fields, permissions, relationships, and metadata.',
            status: 'Available',
            statusClass: 'status-badge status-available',
            progress: 80,
            progressLabel: '80% complete',
            phase: 'Metadata Explorer',
            disabled: false
        },

        {
            name: 'orgHealthDashboard',
            title: 'Org Health',
            iconName: 'utility:shield',
            description:
                'Evaluate organization health, metadata quality, deployment readiness, and improvement opportunities.',
            status: 'Available',
            statusClass: 'status-badge status-available',
            progress: 90,
            progressLabel: '90% complete',
            phase: 'Live Metadata',
            disabled: false
        },

        {
            name: 'automationAdvisor',
            title: 'Automation Advisor',
            iconName: 'utility:settings',
            description:
                'Recommend the best Salesforce automation solution using Flow, Validation Rules, Approval Processes, configuration, or Apex.',
            status: 'Available',
            statusClass: 'status-badge status-available',
            progress: 100,
            progressLabel: '100% complete',
            phase: 'Rules-Based Advisor',
            disabled: false
        },

        {
            name: 'troubleshootingAssistant',
            title: 'Troubleshooting Assistant',
            iconName: 'utility:warning',
            description:
                'Diagnose Flow failures, save errors, permissions, duplicate rules, Apex issues, and configuration problems.',
            status: 'Available',
            statusClass: 'status-badge status-available',
            progress: 90,
            progressLabel: '90% complete',
            phase: 'Rules-Based Assistant',
            disabled: false
        },

        {
            name: 'documentationGenerator',
            title: 'Documentation Generator',
            iconName: 'utility:knowledge_base',
            description:
                'Generate administrator documentation, release notes, deployment guides, and testing plans.',
            status: 'Planned',
            statusClass: 'status-badge status-planned',
            progress: 5,
            progressLabel: '5% complete',
            phase: 'Coming Soon',
            disabled: true
        },

        {
            name: 'aiLearningCoach',
            title: 'AI Learning Coach',
            iconName: 'utility:education',
            description:
                'Practice Salesforce concepts, certification questions, interview scenarios, and administrator skills.',
            status: 'Planned',
            statusClass: 'status-badge status-planned',
            progress: 5,
            progressLabel: '5% complete',
            phase: 'Coming Soon',
            disabled: true
        }

    ];

    /*
    -----------------------------------------
    Views
    -----------------------------------------
    */

    get showDashboard() {
        return this.currentView === DASHBOARD;
    }

    get showExplainThis() {
        return this.currentView === 'explainThis';
    }

    get showFlowIntelligence() {
        return this.currentView === 'flowIntelligence';
    }

    get showOrgExplorer() {
        return this.currentView === 'orgExplorer';
    }

    get showOrgHealthDashboard() {
        return this.currentView === 'orgHealthDashboard';
    }

    get showAutomationAdvisor() {
        return this.currentView === 'automationAdvisor';
    }

    get showTroubleshootingAssistant() {
        return this.currentView === 'troubleshootingAssistant';
    }

    get showMetadataDiagnostic() {
        return this.currentView === 'metadataDiagnostic';
    }

    /*
    -----------------------------------------
    Navigation
    -----------------------------------------
    */

    handleLaunch(event) {

        const destination =
            event.currentTarget.dataset.name;

        this.navigate(destination);

    }

    handleQuickAction(event) {

        const destination =
            event.currentTarget.dataset.destination;

        this.navigate(destination);

    }

    navigate(destination) {

        if (!destination) {
            return;
        }

        if (destination === 'metadataDiagnostic') {

            this.currentView = destination;

            return;

        }

        const capability =
            this.capabilities.find(
                item => item.name === destination
            );

        if (!capability) {
            return;
        }

        if (capability.disabled) {
            return;
        }

        this.currentView = destination;

    }

    backToDashboard() {

        this.currentView = DASHBOARD;

    }

}