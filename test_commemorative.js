const { getCommemorationForDate } = require('./src/lib/commemorative-dates');

// Test with October 13 (Fisioterapeuta)
const testDate = new Date('2026-10-13');
const result = getCommemorationForDate(testDate);

console.log('Testing date:', testDate.toISOString());
console.log('Result:', result);

// Test with current date
const now = new Date();
const nowResult = getCommemorationForDate(now);
console.log('\nCurrent date:', now.toISOString());
console.log('Result:', nowResult);
