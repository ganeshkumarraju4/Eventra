const BASE_URL = "http://localhost:3001/api";

// Replace these with IDs from a FRESH test setup.
const REGISTRATION_ID_1 = "19a1c298-5185-4a9f-b1e9-d8004ada98ba";
const REGISTRATION_ID_2 = "909a97b3-b0e8-443e-9da4-07dc16da108b";
const REGISTRATION_ID_3 = "bed21af1-ec3f-40fb-9e22-b37b11c6e25b";


// JWT of the organizer who owns the event.
const ORGANIZER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNTZiOWIyNi1lYmRhLTQzNzMtYmEwZC1mOGUzMWM5NzJiZjIiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc5MTk5NzQ0OSwiZXhwIjoxNzkyMDAxMDQ5fQ._6C5AC3jp6TnmYlk6YKo4vWmu27nfVDC3TyuzEbqlgk";

async function approveRegistration(registrationId: string) {
    const response = await fetch(
        `${BASE_URL}/registrations/${registrationId}/approve`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${ORGANIZER_TOKEN}`,
            },
        }
    );

    const body = await response.json();

    return {
        registrationId,
        statusCode: response.status,
        body,
    };
}

async function main() {
    console.log("Starting concurrent registration approval test...\n");

    // Both requests start concurrently.
    const results = await Promise.all([
        approveRegistration(REGISTRATION_ID_1),
        approveRegistration(REGISTRATION_ID_2),
        approveRegistration(REGISTRATION_ID_2),
    ]);

    for (const result of results) {
        console.log("-----------------------------------");
        console.log("Registration:", result.registrationId);
        console.log("HTTP Status:", result.statusCode);
        console.log("Response:", JSON.stringify(result.body, null, 2));
    }

    const successful = results.filter(
        result => result.statusCode === 200
    ).length;

    const capacityRejected = results.filter(
        result =>
            result.statusCode === 400 &&
            result.body.message ===
                "Event has reached its maximum capacity"
    ).length;

    console.log("\n========== TEST RESULT ==========");

    if (successful === 1 && capacityRejected === 1) {
        console.log("✅ PASS: Only one registration was approved.");
        console.log("✅ PASS: The other registration was rejected because capacity was full.");
    } else {
        console.log("❌ FAIL: Unexpected concurrency result.");
        console.log("Successful approvals:", successful);
        console.log("Capacity rejections:", capacityRejected);
    }
}

main().catch(error => {
    console.error("Test failed:", error);
});