const BASE_URL = "http://localhost:3001/api";

// Use an existing APPROVED registration.
const REGISTRATION_ID = "d95c1f33-2e95-4370-8aac-f38c382af725";

// JWT of the user who owns this registration.
const USER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxZGZkOTQxMi1hOWZjLTQ0MTctYWE0YS1iMzVhZDZkZjFlZDEiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc5MjAwMzE1MywiZXhwIjoxNzkyMDA2NzUzfQ.F1xAzvGbmOWxo1wqyUKRjE4CdXiCvVs6EGJdBs9do3M";

async function cancelRegistration(requestNumber: number) {
    const response = await fetch(
        `${BASE_URL}/registrations/${REGISTRATION_ID}/cancel`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${USER_TOKEN}`,
            },
        }
    );

    const body = await response.json();

    return {
        requestNumber,
        statusCode: response.status,
        body,
    };
}

async function main() {
    console.log("Starting duplicate cancellation concurrency test...\n");
    console.log("Registration ID:", REGISTRATION_ID);

    // Send both requests simultaneously.
    const results = await Promise.all([
        cancelRegistration(1),
        cancelRegistration(2),
    ]);

    for (const result of results) {
        console.log("\n-----------------------------------");
        console.log("Request:", result.requestNumber);
        console.log("HTTP Status:", result.statusCode);
        console.log("Response:", JSON.stringify(result.body, null, 2));
    }

    const successful = results.filter(
        result => result.statusCode === 200
    ).length;

    const rejected = results.filter(
        result =>
            result.statusCode === 400 &&
            result.body.message ===
                "Cannot cancel a cancelled registration"
    ).length;

    console.log("\n========== TEST RESULT ==========");

    if (successful === 1 && rejected === 1) {
        console.log("✅ PASS: One cancellation succeeded.");
        console.log("✅ PASS: The duplicate cancellation was rejected.");
    } else {
        console.log("❌ FAIL: Unexpected result.");
        console.log("Successful cancellations:", successful);
        console.log("Duplicate rejections:", rejected);
    }
}

main().catch(error => {
    console.error("Test execution failed:", error);
});