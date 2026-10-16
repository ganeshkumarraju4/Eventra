const BASE_URL = "http://localhost:3001/api";

const REGISTRATION_ID = "af7e8414-51a4-4b3f-a562-38d3c73a9784";
const ORGANIZER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ZjVkZDA5MS0zMTlhLTQ0NjEtYjliMy0xMjVjOWM5YThhZDEiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3OTIwODc0NTQsImV4cCI6MTc5MjA5MTA1NH0.ANvqnqgWsr6F6hUTOZfWrkh1dxozQ0wN71exdDWe8iU";

if (!REGISTRATION_ID || !ORGANIZER_TOKEN) {
    throw new Error(
        "Please set REGISTRATION_ID and ORGANIZER_TOKEN environment variables."
    );
}

async function sendRequest(
    action: "approve" | "reject"
) {
    const startTime = Date.now();

    try {
        const response = await fetch(
            `${BASE_URL}/registrations/${REGISTRATION_ID}/${action}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${ORGANIZER_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const body = await response.json();

        return {
            action: action.toUpperCase(),
            statusCode: response.status,
            durationMs: Date.now() - startTime,
            response: body
        };
    } catch (error) {
        return {
            action: action.toUpperCase(),
            statusCode: 0,
            durationMs: Date.now() - startTime,
            response: error instanceof Error
                ? error.message
                : "Unknown error"
        };
    }
}

async function testConcurrency() {
    console.log("\n========================================");
    console.log(" APPROVE vs REJECT CONCURRENCY TEST");
    console.log("========================================");
    console.log("Registration ID:", REGISTRATION_ID);
    console.log("Sending both requests simultaneously...\n");

    const results = await Promise.all([
        sendRequest("approve"),
        sendRequest("reject")
    ]);

    for (const result of results) {
        console.log("----------------------------------------");
        console.log("Action:", result.action);
        console.log("HTTP Status:", result.statusCode);
        console.log("Duration:", `${result.durationMs} ms`);
        console.log("Response:", JSON.stringify(result.response, null, 2));
    }

    const successfulRequests = results.filter(
        result => result.statusCode >= 200 && result.statusCode < 300
    );

    console.log("\n========================================");
    console.log(" TEST SUMMARY");
    console.log("========================================");
    console.log("Successful requests:", successfulRequests.length);

    if (successfulRequests.length === 1) {
        console.log("PASS: Exactly one request succeeded.");
    } else if (successfulRequests.length === 0) {
        console.log(
            "INCONCLUSIVE: Neither request succeeded. Check the errors."
        );
    } else {
        console.log(
            "FAIL: Both requests succeeded. Investigate the status transitions."
        );
    }

    console.log("========================================\n");
}

testConcurrency();