const timestamp = Date.now();

export function createRegistrationUser(overrides = {}) {
  return {
    organizationName: `Test Org ${timestamp}`,
    organizationCountry: 'india',
    organizationState: 'chhattisgarh',
    firstName: 'Test',
    lastName: 'User',
    workEmail: `test.user+${timestamp}@example.com`,
    password: 'Test@1234',
    ...overrides,
  };
}

export const registrationData = {
  validUser: createRegistrationUser(),
  invalidUsers: {
    missingFirstName: createRegistrationUser({ firstName: '' }),
    invalidEmail: createRegistrationUser({
      workEmail: `invalid-email-${timestamp}`,
    }),
  },
};
