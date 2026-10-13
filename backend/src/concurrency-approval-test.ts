const baseUrl = "http://localhost:3001/api/events";

const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ZjVkZDA5MS0zMTlhLTQ0NjEtYjliMy0xMjVjOWM5YThhZDEiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3OTE5MDg2MTksImV4cCI6MTc5MTkxMjIxOX0.tiTNyzrSjKzf_hWggsPA8nwh4bbLyCpRBwFf1n43Xxk";
const eventId = "22222222-2222-2222-2222-222222222222";

async function approveEvent() {
    const response = await fetch(
        `${baseUrl}/${eventId}/approve`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json"
            }
        }
    );

    return {
        status: response.status,
        body: await response.json()
    };
}

async function main() {
    const results = await Promise.all([
        approveEvent(),
        approveEvent()
    ]);

    console.dir(results, { depth: null });

    const successCount = results.filter(
        result => result.status === 200
    ).length;

    const failureCount = results.filter(
        result => result.status === 400
    ).length;

    console.log({ successCount, failureCount });

    if (successCount === 1 && failureCount === 1) {
        console.log("PASS: Exactly one approval succeeded.");
    } else {
        console.log("CHECK: Results differed from expectations.");
    }
}

main().catch(console.error);