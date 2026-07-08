import { LightningElement } from 'lwc';

export default class SalesforceCopilotDashboard extends LightningElement {

    selectedCapability = '';

    capabilities = [

        {
            name: 'flowIntelligence',
            title: '🧠 Flow Intelligence',
            description: 'Analyze Salesforce Flows, explain automation logic, identify risks, generate testing plans, documentation, and interview insights.',
            status: 'Available'
        },

        {
            name: 'orgExplorer',
            title: '🗺️ Org Explorer',
            description: 'Explore objects, fields, relationships, page layouts, and metadata throughout your Salesforce org.',
            status: 'Coming Soon'
        },

        {
            name: 'automationAdvisor',
            title: '⚙️ Automation Advisor',
            description: 'Recommend the best automation solution using Flows, Approval Processes, Validation Rules, or Apex.',
            status: 'Coming Soon'
        },

        {
            name: 'documentationGenerator',
            title: '📄 Documentation Generator',
            description: 'Automatically generate administrator guides, technical documentation, release notes, and testing documentation.',
            status: 'Coming Soon'
        },

        {
            name: 'aiLearningCoach',
            title: '🎓 AI Learning Coach',
            description: 'Interactive Salesforce learning, certification preparation, quizzes, and interview coaching.',
            status: 'Coming Soon'
        },

        {
            name: 'troubleshootingAssistant',
            title: '🛠️ Troubleshooting Assistant',
            description: 'Diagnose Flow failures, validation rules, permission issues, automation conflicts, and configuration problems.',
            status: 'Coming Soon'
        }

    ];

    handleLaunch(event) {
        this.selectedCapability = event.target.dataset.name;
    }

    get selectedCapabilityDetails() {
        return this.capabilities.find(
            capability => capability.name === this.selectedCapability
        );
    }

    get selectedCapabilityTitle() {
        return this.selectedCapabilityDetails
            ? this.selectedCapabilityDetails.title
            : '';
    }

    get selectedCapabilityDescription() {
        return this.selectedCapabilityDetails
            ? this.selectedCapabilityDetails.description
            : '';
    }

}