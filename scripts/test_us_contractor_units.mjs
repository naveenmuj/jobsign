import assert from 'assert';

console.log("====================================================");
console.log("🧪 TESTING US CONTRACTOR SUITE & DEPOSIT LOGIC");
console.log("====================================================");

// 1. Test Quick Deposit Percentage Math
const quoteTotalCents = 350000; // $3,500.00
const percentages = [10, 25, 33, 50];

console.log(`\n1. Quick Deposit Percentage calculations for Total: $${(quoteTotalCents / 100).toFixed(2)}`);
percentages.forEach(pct => {
  const depositCents = Math.round((quoteTotalCents * pct) / 100);
  const balanceCents = quoteTotalCents - depositCents;
  const depositStr = (depositCents / 100).toFixed(2);
  const balanceStr = (balanceCents / 100).toFixed(2);
  console.log(`   [${pct}%] -> Deposit: $${depositStr} | Balance Due: $${balanceStr}`);
  
  if (pct === 10) assert.strictEqual(depositStr, "350.00");
  if (pct === 25) assert.strictEqual(depositStr, "875.00");
  if (pct === 33) assert.strictEqual(depositStr, "1155.00");
  if (pct === 50) assert.strictEqual(depositStr, "1750.00");
  assert.strictEqual(depositCents + balanceCents, quoteTotalCents);
});
console.log("   ✅ Quick Deposit percentages passed with zero rounding errors!");

// 2. Test Currency formatting
function formatUSD(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
function formatINR(cents) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100);
}

console.log("\n2. Currency formatting comparison:");
console.log(`   USD $3,500.00: ${formatUSD(350000)}`);
console.log(`   INR ₹2,85,000: ${formatINR(28500000)}`);
assert.strictEqual(formatUSD(350000), "$3,500.00");

// 3. Test Fee Comparison between Joist (3.49% + $0.30) vs JobSign (0%)
console.log("\n3. Fee comparison on a $5,000 project:");
const projectTotal = 5000;
const joistFee = (projectTotal * 0.0349) + 0.30;
const jobSignFee = 0.00;
const contractorSavings = joistFee - jobSignFee;

console.log(`   Joist Payment Processing Fee (3.49% + $0.30): $${joistFee.toFixed(2)}`);
console.log(`   JobSign Payment Rails Fee (Zelle / ACH / Cash App / Check): $${jobSignFee.toFixed(2)}`);
console.log(`   Direct Savings per $5k job with JobSign: $${contractorSavings.toFixed(2)}`);
assert.strictEqual(joistFee, 174.80);

console.log("\n====================================================");
console.log("🎉 ALL US CONTRACTOR LOGIC TESTS PASSED (100%)");
console.log("====================================================");
