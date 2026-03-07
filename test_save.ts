import { saveAttendanceRecord } from "./src/actions/attendance";

async function test() {
    const res = await saveAttendanceRecord({
        appointment_id: "852fbe8f-f217-42eb-a8bb-1058d573c74e", // Valid appointment from Maria's logs
        patient_id: "cdaf2e62-66ab-43c0-9541-726508a482e3", // Maria de Lima Said
        template_id: "pbe-5",
        content: { test: "data", deeply: { nested: true } },
        record_type: "assessment"
    }, "access-fisioterapia");

    console.log("Result:", JSON.stringify(res, null, 2));
}

test().catch(console.error);
