const timestamp = Date.now();
const validFrom = new Date();
const validUntil = new Date(validFrom);
validUntil.setDate(validUntil.getDate() + 10);

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export const couponData = {
  coupon: {
    code: `PLAY${timestamp}`.slice(0, 16),
    name: `LEARNPLAYWRIGHT${timestamp}`.slice(0, 24),
    type: 'percentage',
    percentage: '25',
    scope: 'Invoice',
    maxRedemptions: '',
    maxRedemptionsPerClient: '2',
    minimumAmount: '',
    validFrom: formatDate(validFrom),
    validUntil: formatDate(validUntil),
  },
};
