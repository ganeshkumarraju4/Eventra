const BASE_URL = "http://localhost:3001/api";

// Use a test event with capacity 10 and 9 approved registrations.
const EVENT_ID = "e829b550-b883-49b5-9d65-2b5f7de335a7";

// An existing PENDING registration belonging to this event.
const REGISTRATION_ID = "1afe1e5c-6c14-45b3-b6ab-495f4cf4dae7";

// JWT belonging to the event organizer.
const ORGANIZER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ZjVkZDA5MS0zMTlhLTQ0NjEtYjliMy0xMjVjOWM5YThhZDEiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3OTIwMDA5ODYsImV4cCI6MTc5MjAwNDU4Nn0.BB8zJONM8FjyPHEAqoFOy94NKwd3fecNixF5oeGphbk";

async function updateCapacity() {
    const response = await fetch(
        `${BASE_URL}/events/${EVENT_ID}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${ORGANIZER_TOKEN}`,
            },
            body: JSON.stringify({
                maxParticipants: 3,
            }),
        }
    );

    const body = await response.json();

    return {
        operation: "Update capacity to 3",
        statusCode: response.status,
        body,
    };
}

async function approveRegistration() {
    const response = await fetch(
        `${BASE_URL}/registrations/${REGISTRATION_ID}/approve`,
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
        operation: "Approve registration",
        statusCode: response.status,
        body,
    };
}

async function main() {
    console.log("Starting capacity-versus-approval concurrency test...\n");

    // Both operations start concurrently.
    const results = await Promise.all([
        updateCapacity(),
        approveRegistration(),
    ]);

    for (const result of results) {
        console.log("\n-----------------------------------");
        console.log("Operation:", result.operation);
        console.log("HTTP Status:", result.statusCode);
        console.log("Response:", JSON.stringify(result.body, null, 2));
    }

    console.log("\n========== TEST RESULT ==========");

    const capacitySucceeded = results.some(
        result =>
            result.operation === "Update capacity to 3" &&
            result.statusCode === 200
    );

    const approvalSucceeded = results.some(
        result =>
            result.operation === "Approve registration" &&
            result.statusCode === 200
    );

    if (capacitySucceeded && !approvalSucceeded) {
        console.log("Capacity update succeeded; registration approval was rejected.");
    } else if (!capacitySucceeded && approvalSucceeded) {
        console.log("Registration approval succeeded; capacity reduction was rejected.");
    } else {
        console.log("Inspect the final database state to determine whether the result is valid.");
    }
}

main().catch(error => {
    console.error("Test execution failed:", error);
});