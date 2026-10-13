const baseUrl = "http://localhost:3001/api/events";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzZTA1YmZjYS1mMTNhLTQ1MWYtOGI3OC1mNzEyYWYxNGQ5MTYiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc5MTg4OTM1OCwiZXhwIjoxNzkxODkyOTU4fQ.7Mz0fRtf-IX3qfY0xLE4ITZeERSPRn1KSi5KKdGj0zs";
const venueId = "261a7669-60b3-413d-b0c0-afd21b7645f8";

const eventData = (title: string) => ({
    title,
    description: "Concurrent booking test",
    startTime: "2026-11-10T10:00:00.000Z",
    endTime: "2026-11-10T12:00:00.000Z",
    category: "TECHNICAL",
    type: "PUBLIC",
    registrationMode: "OPEN",
    maxParticipants: 50,
    venueId
});

async function sendRequest(title: string) {
    const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(eventData(title))
    });

    return {
        event: title,
        status: response.status,
        body: await response.json()
    };
}

async function main() {
    const results = await Promise.all([
        sendRequest("Concurrent Event A"),
        sendRequest("Concurrent Event B")
    ]);

    console.dir(results, { depth: null });
}

main().catch(console.error);