// Test data for different invoice scenarios
export const testScenarios = {
  // Happy path scenario (existing)
  happyPath: {
    login: {
      email: 'admin@acme.com',
      password: 'Admin@123'
    },
    invoice: {
      clientIndex: 1,
      issueDate: '2026-03-06',
      dueDate: '2026-04-07',
      currency: 'USD',
      reference: 'dhfifois',
      notes: 'ajsjs',
      terms: 'djdj',
      customField: {
        name: 'custom_field',
        value: '74'
      }
    },
    lineItems: [
      {
        name: 'asd',
        description: 'asd',
        quantity: '12',
        rate: '10'
      },
      {
        name: 'sdjk',
        description: 'hskjd',
        quantity: '3',
        rate: '3'
      }
    ]
  },

  // Minimum required fields only
  minimumFields: {
    login: {
      email: 'admin@acme.com',
      password: 'Admin@123'
    },
    invoice: {
      clientIndex: 1,
      issueDate: '2026-03-06',
      dueDate: '2026-04-07',
      currency: 'USD',
      reference: '',
      notes: '',
      terms: '',
      customField: null // No custom field
    },
    lineItems: [
      {
        name: 'Basic Item',
        description: 'Basic Description',
        quantity: '1',
        rate: '100'
      }
    ]
  },

  // Multiple line items scenario
  multipleItems: {
    login: {
      email: 'admin@acme.com',
      password: 'Admin@123'
    },
    invoice: {
      clientIndex: 1,
      issueDate: '2026-03-06',
      dueDate: '2026-04-07',
      currency: 'EUR',
      reference: 'MULTI-001',
      notes: 'Invoice with multiple line items',
      terms: 'Payment due within 30 days',
      customField: {
        name: 'project_code',
        value: 'PROJ-2026'
      }
    },
    lineItems: [
      {
        name: 'Consulting Services',
        description: 'Technical consulting for Q1',
        quantity: '40',
        rate: '150'
      },
      {
        name: 'Development Work',
        description: 'Custom software development',
        quantity: '80',
        rate: '120'
      },
      {
        name: 'Testing Services',
        description: 'Quality assurance and testing',
        quantity: '20',
        rate: '100'
      }
    ]
  },

  // Past due date scenario
  pastDueDate: {
    login: {
      email: 'admin@acme.com',
      password: 'Admin@123'
    },
    invoice: {
      clientIndex: 1,
      issueDate: '2026-01-01',
      dueDate: '2026-01-15', // Past due date
      currency: 'GBP',
      reference: 'PAST-001',
      notes: 'Overdue invoice test',
      terms: 'Payment was due',
      customField: {
        name: 'overdue_notice',
        value: 'true'
      }
    },
    lineItems: [
      {
        name: 'Overdue Service',
        description: 'Service that should have been paid',
        quantity: '10',
        rate: '50'
      }
    ]
  },

  // High value invoice
  highValue: {
    login: {
      email: 'admin@acme.com',
      password: 'Admin@123'
    },
    invoice: {
      clientIndex: 1,
      issueDate: '2026-03-06',
      dueDate: '2026-04-07',
      currency: 'USD',
      reference: 'HIGH-VAL-001',
      notes: 'High value transaction',
      terms: 'Special payment terms for large invoices',
      customField: {
        name: 'high_value_flag',
        value: 'true'
      }
    },
    lineItems: [
      {
        name: 'Enterprise License',
        description: 'Annual enterprise software license',
        quantity: '1',
        rate: '50000'
      },
      {
        name: 'Implementation',
        description: 'System implementation services',
        quantity: '100',
        rate: '200'
      }
    ]
  }
};