export const testScenarios = {
  multipleItems: {
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
  }
};
