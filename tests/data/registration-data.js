let _userCounter = 0;

export function createRegistrationUser(overrides = {}) {
  // Use a unique id per call so repeated runs never share the same email address.
  const id = `${Date.now()}${++_userCounter}`;
  return {
    organizationName: `Test Org ${id}`,
    organizationCountry: 'india',
    organizationState: 'chhattisgarh',
    firstName: 'Test',
    lastName: 'User',
    workEmail: `test.user+${id}@example.com`,
    password: 'Test@1234',
    ...overrides,
  };
}

export const registrationData = {
  validUser: createRegistrationUser(),
};
