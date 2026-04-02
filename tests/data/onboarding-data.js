let _inviteCounter = 0;

export function createOnboardingData(overrides = {}) {
  const id = `${Date.now()}${++_inviteCounter}`;

  return {
    organizationLabel: 'Testing',
    moduleName: 'Payroll Management',
    invitedUsers: [
      {
        email: `empcloud.admin+${id}@example.com`,
        role: 'Admin',
      },
      {
        email: `empcloud.employee+${id}@example.com`,
        role: 'Employee',
      },
    ],
    attendance: {
      code: '010',
      shiftName: 'Night Shift',
      startTime: '22:10',
      endTime: '07:01',
    },
    ...overrides,
  };
}

export const onboardingData = createOnboardingData();
