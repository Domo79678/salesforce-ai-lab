import { LightningElement } from 'lwc';

export default class SalesforceCopilotDashboard extends LightningElement {
    currentView = 'dashboard';

    capabilities = [
        {
            name: 'flowIntelligence',
            title: 'Flow Intelligence',
            iconName: 'utility:flow',
            description:
                'Analyze Flow logic, risks, tests, documentation, and interview insights.',
            status: 'Available',
            statusClass:
                'status-badge status-available',
            progress: 85,
            progressLabel:
                '85% complete',
            phase:
                'Live Module',
            disabled: false
        },
        {
            name: 'orgExplorer',
            title: 'Org Explorer',
            iconName:
                'utility:connected_apps',
            description:
                'Explore Salesforce objects, fields, relationships, permissions, and metadata.',
            status: 'Available',
            statusClass:
                'status-badge status-available',
            progress: 75,
            progressLabel:
                '75% complete',
            phase:
                'Live Module',
            disabled: false
        },
        {
            name: 'orgHealthDashboard',
            title: 'Org Health',
            iconName:
                'utility:shield',
            description:
                'Evaluate health scores, risks, recommendations, and deployment readiness.',
            status: 'Available',
            statusClass:
                'status-badge status-available',
            progress: 85,
            progressLabel:
                '85% complete',
            phase:
                'Knowledge Layer MVP',
            disabled: false
        },
        {
            name: 'automationAdvisor',
            title: 'Automation Advisor',
            iconName:
                'utility:settings',
            description:
                'Choose the right Salesforce automation architecture for a business requirement.',
            status: 'Available',
            statusClass:
                'status-badge status-available',
            progress: 100,
            progressLabel:
                '100% complete',
            phase:
                'Rules-Based Advisor v1.0',
            disabled: false
        },
        {
            name:
                'troubleshootingAssistant',
            title:
                'Troubleshooting Assistant',
            iconName:
                'utility:warning',
            description:
                'Diagnose Salesforce errors and generate investigation, repair, and testing guidance.',
            status:
                'MVP Testing',
            statusClass:
                'status-badge status-available',
            progress:
                90,
            progressLabel:
                '90% complete',
            phase:
                'Rules-Based Assistant v1.0',
            disabled:
                false
        },
        {
            name:
                'documentationGenerator',
            title:
                'Documentation Generator',
            iconName:
                'utility:knowledge_base',
            description:
                'Generate administrator documentation, release notes, and testing plans.',
            status:
                'Planned',
            statusClass:
                'status-badge status-planned',
            progress:
                5,
            progressLabel:
                '5% complete',
            phase:
                'Next Module',
            disabled:
                true
        },
        {
            name:
                'aiLearningCoach',
            title:
                'AI Learning Coach',
            iconName:
                'utility:education',
            description:
                'Practice Salesforce scenarios, certification concepts, and interviews.',
            status:
                'Planned',
            statusClass:
                'status-badge status-planned',
            progress:
                5,
            progressLabel:
                '5% complete',
            phase:
                'Upcoming Module',
            disabled:
                true
        }
    ];

    get showDashboard() {
        return this.currentView === 'dashboard';
    }

    get showFlowIntelligence() {
        return (
            this.currentView ===
            'flowIntelligence'
        );
    }

    get showOrgExplorer() {
        return (
            this.currentView ===
            'orgExplorer'
        );
    }

    get showOrgHealthDashboard() {
        return (
            this.currentView ===
            'orgHealthDashboard'
        );
    }

    get showAutomationAdvisor() {
        return (
            this.currentView ===
            'automationAdvisor'
        );
    }

    get showTroubleshootingAssistant() {
        return (
            this.currentView ===
            'troubleshootingAssistant'
        );
    }

    get showMetadataDiagnostic() {
        return (
            this.currentView ===
            'metadataDiagnostic'
        );
    }

    handleLaunch(event) {
        const capabilityName =
            event.currentTarget
                .dataset.name;

        if (!capabilityName) {
            return;
        }

        const capability =
            this.capabilities.find(
                (item) =>
                    item.name ===
                    capabilityName
            );

        if (
            !capability ||
            capability.disabled
        ) {
            return;
        }

        this.currentView =
            capabilityName;
    }

    handleQuickAction(event) {
        const destination =
            event.currentTarget
                .dataset.destination;

        if (!destination) {
            return;
        }

        if (
            destination ===
            'metadataDiagnostic'
        ) {
            this.currentView =
                destination;
            return;
        }

        const capability =
            this.capabilities.find(
                (item) =>
                    item.name ===
                    destination
            );

        if (
            !capability ||
            capability.disabled
        ) {
            return;
        }

        this.currentView =
            destination;
    }

    backToDashboard() {
        this.currentView =
            'dashboard';
    }
}