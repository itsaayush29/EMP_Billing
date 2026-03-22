// Test data for invoice creation
export const invoiceData = {
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
};