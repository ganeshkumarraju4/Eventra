const BASE_URL = "http://localhost:3001/api";

// Dedicated test event at full capacity.
const EVENT_ID = "22222222-2222-2222-2222-222222222222";

// An APPROVED registration belonging to USER_TOKEN_1.
const REGISTRATION_ID = "26b4086a-69a1-4c0a-9f3c-a1cbb8c66dd5";

// The user who owns the registration being cancelled.
const USER_TOKEN_1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNTZiOWIyNi1lYmRhLTQzNzMtYmEwZC1mOGUzMWM5NzJiZjIiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc5MjAwMjA1NywiZXhwIjoxNzkyMDA1NjU3fQ.nKcxo9FVvPWhwjEyOEluwT2XXwFOeP94hxIZ7Q5aeYc";

// A different user who has NOT registered for this event.
const USER_TOKEN_2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNjRlMWNlZS05M2U3LTRiNDgtYWU0MS1iZjkzNTA4ZmI4MDAiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc5MjAwMjAxNSwiZXhwIjoxNzkyMDA1NjE1fQ.4JH5_GiT9Ap0JdbOevJ0BPiZeU1mumMX36QnV5pHsz0";

async function cancelRegistration() {
    const response = await fetch(
        `${BASE_URL}/registrations/${REGISTRATION_ID}/cancel`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${USER_TOKEN_1}`,
                "Content-Type": "application/json",
            },
        }
    );

    const body = await response.json();

    return {
        operation: "Cancel existing registration",
        statusCode: response.status,
        body,
    };
}

async function createRegistration() {
    const response = await fetch(
        `${BASE_URL}/registrations`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${USER_TOKEN_2}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                eventId: EVENT_ID,
                answers: [],
            }),
        }
    );

    const body = await response.json();

    return {
        operation: "Create new registration",
        statusCode: response.status,
        body,
    };
}

async function main() {
    console.log(
        "Starting cancellation-versus-registration concurrency test...\n"
    );

    const results = await Promise.all([
        cancelRegistration(),
        createRegistration(),
    ]);

    for (const result of results) {
        console.log("\n-----------------------------------");
        console.log("Operation:", result.operation);
        console.log("HTTP Status:", result.statusCode);
        console.log("Response:", JSON.stringify(result.body, null, 2));
    }

    console.log("\n========== TEST RESULT ==========");

    const cancellationSucceeded = results.some(
        result =>
            result.operation === "Cancel existing registration" &&
            result.statusCode === 200
    );

    const registrationSucceeded = results.some(
        result =>
            result.operation === "Create new registration" &&
            result.statusCode === 201
    );

    const registrationRejectedForCapacity = results.some(
        result =>
            result.operation === "Create new registration" &&
            result.statusCode === 400 &&
            result.body.message ===
                "Event has reached its maximum capacity"
    );

    if (cancellationSucceeded && registrationSucceeded) {
        console.log("Both operations succeeded.");
        console.log(
            "This can be valid: registration creation may have completed after cancellation freed a seat."
        );
    } else if (
        cancellationSucceeded &&
        registrationRejectedForCapacity
    ) {
        console.log(
            "Cancellation succeeded; registration was rejected while capacity was full."
        );
    } else {
        console.log(
            "Unexpected result. Inspect the responses and final database state."
        );
    }
}

main().catch(error => {
    console.error("Test execution failed:", error);
});