// scripts/verify_billing_calc.js

// This script is a standalone test to verify the billing calculation logic.
// It replicates the core calculation function from the billing controller
// to avoid altering the production code for testing purposes.

console.log("Running billing calculation verification script...");

// --- Replicated helpers from controllers/billingController.js ---

const classificationMap = {
    0: 'residential',
    1: 'commercial',
    2: 'institutional',
    3: 'industrial',
};

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

// This is the corrected calculation logic.
function calculateBillingAmounts(payload, billingConfig) {
  const result = { ...payload };

  const classificationName = classificationMap[result.classification] || 'residential';
  const rateInfo = (billingConfig && billingConfig.rates) ? billingConfig.rates[classificationName] : null;

  result.minimum = result.minimum > 0 ? result.minimum : (rateInfo ? rateInfo.minimum : 0);
  result.perCubic = result.perCubic > 0 ? result.perCubic : (rateInfo ? rateInfo.perCubic : 0);

  result.consumption = Math.max(0, toNumber(result.currentReading) - toNumber(result.previousReading));

  const chargeableCubic = Math.max(0, result.consumption - toNumber(result.freeCubic));
  const computedAmount = toNumber(result.perCubic) * chargeableCubic;
  
  // The corrected formula: amount is minimum + usage charge.
  result.currentBilling = computedAmount + toNumber(result.minimum);

  if (result.discount && result.discount > 0) {
    result.currentBilling = Math.max(0, result.currentBilling - toNumber(result.discount));
  }

  if (result.lessAmount && result.lessAmount > 0) {
    result.currentBilling = Math.max(0, result.currentBilling - toNumber(result.lessAmount));
  }

  result.remainingBalance = Math.max(0, result.currentBilling - toNumber(result.paidAmount));

  return result;
}

// --- Test Cases ---

const mockBillingConfig = {
    name: 'default',
    rates: {
        residential: {
            minimum: 50,
            perCubic: 10,
        }
    }
};

// Test Case 1: Consumption is below free cubic meters.
// Expected: currentBilling should be the minimum charge.
let testPayload1 = {
    classification: 0, // residential
    previousReading: 100,
    currentReading: 108, // consumption = 8
    freeCubic: 10,
    minimum: 50,
    perCubic: 10,
};
let result1 = calculateBillingAmounts(testPayload1, mockBillingConfig);
console.assert(result1.currentBilling === 50, "Test Case 1 Failed: Billed amount should be minimum if consumption is within free tier.", result1);
if (result1.currentBilling === 50) {
    console.log("Test Case 1 Passed: Consumption within free tier results in minimum charge.");
}

// Test Case 2: Consumption is exactly the free cubic meters.
// Expected: currentBilling should be the minimum charge.
let testPayload2 = {
    classification: 0,
    previousReading: 100,
    currentReading: 110, // consumption = 10
    freeCubic: 10,
    minimum: 50,
    perCubic: 10,
};
let result2 = calculateBillingAmounts(testPayload2, mockBillingConfig);
console.assert(result2.currentBilling === 50, "Test Case 2 Failed: Billed amount should be minimum if consumption equals free tier.", result2);
if (result2.currentBilling === 50) {
    console.log("Test Case 2 Passed: Consumption at free tier limit results in minimum charge.");
}


// Test Case 3: Consumption is above free cubic meters.
// Formula: (consumption - freeCubic) * perCubic + minimum
// (15 - 10) * 10 + 50 = 5 * 10 + 50 = 50 + 50 = 100
let testPayload3 = {
    classification: 0,
    previousReading: 100,
    currentReading: 115, // consumption = 15
    freeCubic: 10,
    minimum: 50,
    perCubic: 10,
};
let result3 = calculateBillingAmounts(testPayload3, mockBillingConfig);
console.assert(result3.currentBilling === 100, "Test Case 3 Failed: Billed amount calculation for consumption above free tier is incorrect.", result3);
if (result3.currentBilling === 100) {
    console.log("Test Case 3 Passed: Correctly calculated bill for consumption above free tier.");
}


// Test Case 4: Zero consumption.
// Expected: currentBilling should be the minimum charge.
let testPayload4 = {
    classification: 0,
    previousReading: 100,
    currentReading: 100, // consumption = 0
    freeCubic: 10,
    minimum: 50,
    perCubic: 10,
};
let result4 = calculateBillingAmounts(testPayload4, mockBillingConfig);
console.assert(result4.currentBilling === 50, "Test Case 4 Failed: Billed amount for zero consumption should be minimum.", result4);
if (result4.currentBilling === 50) {
    console.log("Test Case 4 Passed: Zero consumption results in minimum charge.");
}

console.log("\nVerification script finished.");
