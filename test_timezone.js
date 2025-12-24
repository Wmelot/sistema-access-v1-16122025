
// Mock of the logic in actions.ts

function testDayOfWeek(dateStr, timeStr) {
    console.log(`--- Testing ${dateStr} at ${timeStr} (Brazil Time) ---`);

    // The logic used in actions.ts
    // const startObj = new Date(startDateStr + 'T' + time + ':00-03:00')
    const startDateTime = new Date(`${dateStr}T${timeStr}:00-03:00`);

    console.log(`ISO String (UTC): ${startDateTime.toISOString()}`);
    console.log(`Server Local Time: ${startDateTime.toString()}`);

    // The bug suspect: .getDay() returns local server day.
    // In Vercel, server is UTC. In dev (Mac), it might be local.
    const serverDay = startDateTime.getDay();
    const serverHours = startDateTime.getHours();

    console.log(`startDateTime.getDay() [Server Local]: ${serverDay}`);
    console.log(`startDateTime.getHours() [Server Local]: ${serverHours}`);

    // If I am in Brazil (UTC-3), Friday 22:00 is:
    // UTC: Saturday 01:00.
    // UTC .getDay() is 6 (Saturday).
    // Brazil .getDay() is 5 (Friday).

    // We expect the code to match availability for FRIDAY (5).

    // Let's simulate UTC environment where this code might run
    // There isn't an easy way to switch Node process timezone at runtime for just one object without env vars,
    // but .getDay() always returns based on the system's local time setting.

    // Correct logic should derive day from the ISO string shifted by offset.
}

// Test Case 1: Friday late night
testDayOfWeek('2023-10-27', '22:00'); // Oct 27 2023 was a Friday

// Test Case 2: Monday morning
testDayOfWeek('2023-10-30', '09:00'); 
