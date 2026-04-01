const timestamp = Date.now();

export const vendorData = {
  login: {
    email: process.env.ADMIN_EMAIL || 'admin@acme.com',
    password: process.env.ADMIN_PASSWORD || '',
  },
  vendor: {
    name: `Vendor ${timestamp}`,
    company: 'Globus',
    email: `vendor.${timestamp}@example.com`,
    phone: '4545454545',
    taxId: '22AAAAA0000A1Z5',
    addressLine1: '123 Test Street',
    addressLine2: 'Suite B',
    city: 'Bhilai',
    state: 'Chhattisgarh',
    postalCode: '490020',
    country: 'India',
    notes: 'Created by Selenium automation',
  },
};
