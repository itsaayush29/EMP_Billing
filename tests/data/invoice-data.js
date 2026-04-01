import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const timestamp = Date.now();
const issueDate = new Date();
const dueDate = new Date(issueDate);
dueDate.setDate(dueDate.getDate() + 30);

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export const invoiceData = {
  login: {
    email: process.env.ADMIN_EMAIL || 'admin@acme.com',
    password: process.env.ADMIN_PASSWORD || '',
  },
  invoice: {
    issueDate: formatDate(issueDate),
    dueDate: formatDate(dueDate),
    currency: 'USD',
    reference: `INV-${timestamp}`,
  },
  lineItems: [
    {
      name: 'Implementation',
      description: 'Invoice automation coverage',
      quantity: '12',
      rate: '10',
    },
  ],
};
