const http = require("http");
const Client = require("socket.io-client");
const request = require("supertest");
const app = require("../src/app");
const { initializeSocket, getIO } = require("../src/socket/socket");
const { connectTestDB, clearTestDB, closeTestDB } = require("./setup/testDb");

let httpServer;
let port;

beforeAll(async () => {
    await connectTestDB();
    httpServer = http.createServer(app);
    initializeSocket(httpServer);
    await new Promise((resolve) => httpServer.listen(0, resolve));
    port = httpServer.address().port;
});

afterEach(async () => {
    await clearTestDB();
});

afterAll(async () => {
    await closeTestDB();
    await new Promise((resolve) => getIO().close(resolve));
});

async function registerAndGetCookie(role, emailPrefix, extra = {}) {
    const res = await request(app).post("/api/auth/register").send({
        username: `${emailPrefix}_user`,
        email: `${emailPrefix}@example.com`,
        password: "password123",
        role,
        ...extra
    });
    return res.headers["set-cookie"][0].split(";")[0];
}

describe("Real-time application status updates (Socket.io)", () => {
    test("student receives a LIVE event when a recruiter updates their application's status", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "socrec1", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send({
            title: "Backend Engineer",
            description: "Node.js backend role with real database experience needed.",
            requiredSkills: ["node.js"]
        });
        const jobId = jobRes.body.data.job._id;

        const studentCookie = await registerAndGetCookie("student", "socstu1");
        const applyRes = await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", studentCookie);
        const applicationId = applyRes.body.data.application._id;

        const client = Client(`http://localhost:${port}`, {
            transports: ["websocket"],
            extraHeaders: { Cookie: studentCookie }
        });

        await new Promise((resolve, reject) => {
            client.on("connect", resolve);
            client.on("connect_error", reject);
        });

        const eventPromise = new Promise((resolve, reject) => {
            client.on("applicationStatusUpdated", resolve);
            setTimeout(() => reject(new Error("Timed out waiting for socket event")), 5000);
        });

        await request(app)
            .patch(`/api/applications/${applicationId}/status`)
            .set("Cookie", recruiterCookie)
            .send({ status: "shortlisted" });

        const event = await eventPromise;
        expect(event.status).toBe("shortlisted");
        expect(event.applicationId).toBe(applicationId);
        expect(event.jobTitle).toBe("Backend Engineer");

        client.close();
    });

    test("rejects a socket connection with no valid auth cookie", async () => {
        const client = Client(`http://localhost:${port}`, {
            transports: ["websocket"]
        });

        const error = await new Promise((resolve) => {
            client.on("connect_error", resolve);
        });

        expect(error.message).toMatch(/unauthorized/i);
        client.close();
    });

    test("a student does NOT receive another student's status update (room isolation)", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "socrec2", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send({
            title: "Frontend Engineer",
            description: "React frontend role requiring solid component design skills.",
            requiredSkills: ["react"]
        });
        const jobId = jobRes.body.data.job._id;

        const studentACookie = await registerAndGetCookie("student", "socstuA");
        const studentBCookie = await registerAndGetCookie("student", "socstuB");

        const applyRes = await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", studentACookie);
        const applicationId = applyRes.body.data.application._id;

        const clientB = Client(`http://localhost:${port}`, {
            transports: ["websocket"],
            extraHeaders: { Cookie: studentBCookie }
        });
        await new Promise((resolve, reject) => {
            clientB.on("connect", resolve);
            clientB.on("connect_error", reject);
        });

        let receivedByB = false;
        clientB.on("applicationStatusUpdated", () => { receivedByB = true; });

        await request(app)
            .patch(`/api/applications/${applicationId}/status`)
            .set("Cookie", recruiterCookie)
            .send({ status: "rejected" });

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(receivedByB).toBe(false);
        clientB.close();
    });
});