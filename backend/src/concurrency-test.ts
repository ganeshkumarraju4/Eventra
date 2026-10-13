const baseUrl = "http://localhost:3001/api/events";

const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ZjVkZDA5MS0zMTlhLTQ0NjEtYjliMy0xMjVjOWM5YThhZDEiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3OTE4OTM1OTUsImV4cCI6MTc5MTg5NzE5NX0.UA5FwsxSZ2PpFhMdjT07TUuomtFvs7IbetQk6WPwxyM";

// Event that is currently PENDING
const pendingEventId = "fdcdc7c2-39b4-4cd8-9639-3a3100e0d7e1";

// Change request belonging to an already APPROVED event
const changeRequestId = "cfae624a-f433-4e2d-bf87-990a74a98b83";

async function approveEvent() {
    const response = await fetch(
        `${baseUrl}/${pendingEventId}/approve`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`
            }
        }
    );

    return {
        operation: "Approve pending event",
        status: response.status,
        body: await response.json()
    };
}

async function approveChangeRequest() {
    const response = await fetch(
        `${baseUrl}/admin/change-requests/${changeRequestId}/approve`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                reviewComment: "Concurrent booking test"
            })
        }
    );

    return {
        operation: "Approve event change request",
        status: response.status,
        body: await response.json()
    };
}

async function main() {
    const results = await Promise.all([
        approveEvent(),
        approveChangeRequest()
    ]);

    console.dir(results, { depth: null });
}

main().catch(console.error);