const BASE_URL = "http://localhost:3001/api";

// Use an APPROVED event with registrationMode = OPEN.
// It must have exactly one seat remaining.
const EVENT_ID = "e829b550-b883-49b5-9d65-2b5f7de335a7";

// JWTs belonging to TWO DIFFERENT users.
// Neither user should already be registered for this event.
const USER_TOKEN_1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxZGZkOTQxMi1hOWZjLTQ0MTctYWE0YS1iMzVhZDZkZjFlZDEiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc5MTk5ODczNiwiZXhwIjoxNzkyMDAyMzM2fQ.lcXUgzpAszs95OdgrRmbaHKYzmCRELMk4hTOA31-CgM";
const USER_TOKEN_2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNjRlMWNlZS05M2U3LTRiNDgtYWU0MS1iZjkzNTA4ZmI4MDAiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc5MTk5ODc1NywiZXhwIjoxNzkyMDAyMzU3fQ.vYdqyPtj1SvyZqzckjRLYUPZFqwsQsM9LJVO3mCfMA4";

async function createRegistration(token: string, userNumber: number) {
    const response = await fetch(`${BASE_URL}/registrations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            eventId: EVENT_ID,
            answers: [],
        }),
    });

    const body = await response.json();

    return {
        userNumber,
        statusCode: response.status,
        body,
    };
}

async function main() {
    console.log("Starting concurrent registration creation test...\n");
    console.log("Event ID:", EVENT_ID);

    // Start both requests concurrently.
    const results = await Promise.all([
        createRegistration(USER_TOKEN_1, 1),
        createRegistration(USER_TOKEN_2, 2),
    ]);

    for (const result of results) {
        console.log("\n-----------------------------------");
        console.log("User:", result.userNumber);
        console.log("HTTP Status:", result.statusCode);
        console.log("Response:", JSON.stringify(result.body, null, 2));
    }

    const successful = results.filter(
        result => result.statusCode === 201
    ).length;

    const capacityRejected = results.filter(
        result =>
            result.statusCode === 400 &&
            result.body.message ===
                "Event has reached its maximum capacity"
    ).length;

    console.log("\n========== TEST RESULT ==========");

    if (successful === 1 && capacityRejected === 1) {
        console.log("✅ PASS: Exactly one registration succeeded.");
        console.log("✅ PASS: The other request was rejected because capacity was full.");
    } else {
        console.log("❌ FAIL: Unexpected result.");
        console.log("Successful registrations:", successful);
        console.log("Capacity rejections:", capacityRejected);
    }
}

main().catch(error => {
    console.error("Test execution failed:", error);
});