const request = require("supertest");
const app = require("../src/app");
const { connectTestDB, clearTestDB, closeTestDB } = require("./setup/testDb");

beforeAll(async () => {
    await connectTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

afterAll(async () => {
    await closeTestDB();
});

const validStudent = {
    username: "teststudent",
    email: "student@example.com",
    password: "password123",
    role: "student"
};

const validRecruiter = {
    username: "testrecruiter",
    email: "recruiter@example.com",
    password: "password123",
    role: "recruiter",
    companyName: "Acme Corp"
};

describe("POST /api/auth/register", () => {
    test("registers a student successfully", async () => {
        const res = await request(app).post("/api/auth/register").send(validStudent);

        expect(res.status).toBe(201);
        expect(res.body.data.user.role).toBe("student");
        expect(res.body.data.user.password).toBeUndefined();
        expect(res.headers["set-cookie"]).toBeDefined();
    });

    test("registers a recruiter successfully with companyName", async () => {
        const res = await request(app).post("/api/auth/register").send(validRecruiter);

        expect(res.status).toBe(201);
        expect(res.body.data.user.role).toBe("recruiter");
        expect(res.body.data.user.companyName).toBe("Acme Corp");
    });

    test("rejects an invalid role", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ ...validStudent, role: "admin" });

        expect(res.status).toBe(400);
        expect(res.body.errors.some(e => e.field === "role")).toBe(true);
    });

    test("rejects missing role", async () => {
        const { role, ...withoutRole } = validStudent;
        const res = await request(app).post("/api/auth/register").send(withoutRole);

        expect(res.status).toBe(400);
    });

    test("rejects a password shorter than 8 characters", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ ...validStudent, password: "short" });

        expect(res.status).toBe(400);
    });

    test("rejects duplicate email", async () => {
        await request(app).post("/api/auth/register").send(validStudent);

        const res = await request(app)
            .post("/api/auth/register")
            .send({ ...validStudent, username: "differentname" });

        expect(res.status).toBe(409);
    });

    test("a student's safe user object does not leak recruiter fields, and vice versa", async () => {
        const studentRes = await request(app).post("/api/auth/register").send(validStudent);
        expect(studentRes.body.data.user.companyName).toBeUndefined();

        const recruiterRes = await request(app).post("/api/auth/register").send(validRecruiter);
        expect(recruiterRes.body.data.user.skills).toBeUndefined();
    });
});

describe("POST /api/auth/login", () => {
    beforeEach(async () => {
        await request(app).post("/api/auth/register").send(validStudent);
    });

    test("rejects wrong password", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: validStudent.email, password: "wrongpassword" });

        expect(res.status).toBe(400);
    });

    test("logs in successfully and returns the role", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: validStudent.email, password: validStudent.password });

        expect(res.status).toBe(200);
        expect(res.body.data.user.role).toBe("student");
    });
});

describe("GET /api/auth/get-me", () => {
    test("rejects when not authenticated", async () => {
        const res = await request(app).get("/api/auth/get-me");
        expect(res.status).toBe(401);
    });

    test("returns the current user with their role", async () => {
        const agent = request.agent(app);
        await agent.post("/api/auth/register").send(validRecruiter);

        const res = await agent.get("/api/auth/get-me");

        expect(res.status).toBe(200);
        expect(res.body.data.user.role).toBe("recruiter");
    });
});

describe("GET /api/auth/logout", () => {
    test("clears the session so a subsequent get-me fails", async () => {
        const agent = request.agent(app);
        await agent.post("/api/auth/register").send(validStudent);

        const logoutRes = await agent.get("/api/auth/logout");
        expect(logoutRes.status).toBe(200);

        const meRes = await agent.get("/api/auth/get-me");
        expect(meRes.status).toBe(401);
    });
});