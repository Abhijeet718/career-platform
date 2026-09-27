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

async function registerAndGetCookie(role, emailPrefix) {
    const res = await request(app).post("/api/auth/register").send({
        username: `${emailPrefix}_user`,
        email: `${emailPrefix}@example.com`,
        password: "password123",
        role,
        ...(role === "recruiter" && { companyName: "Test Co" })
    });
    const cookie = res.headers["set-cookie"]?.[0]?.split(";")[0];
    if (!cookie) {
        throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
    }
    return cookie;
}

const validJob = {
    title: "Backend Engineer",
    description: "We are looking for a backend engineer with Node.js experience.",
    requiredSkills: ["Node.js", "MongoDB", "Express"],
    location: "Bangalore"
};

describe("POST /api/jobs", () => {
    test("rejects unauthenticated requests", async () => {
        const res = await request(app).post("/api/jobs").send(validJob);
        expect(res.status).toBe(401);
    });

    test("rejects a student trying to post a job (role enforcement)", async () => {
        const studentCookie = await registerAndGetCookie("student", "stu1");

        const res = await request(app)
            .post("/api/jobs")
            .set("Cookie", studentCookie)
            .send(validJob);

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/requires one of these roles/i);
    });

    test("allows a recruiter to post a job", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "rec1");

        const res = await request(app)
            .post("/api/jobs")
            .set("Cookie", recruiterCookie)
            .send(validJob);

        expect(res.status).toBe(201);
        expect(res.body.data.job.title).toBe("Backend Engineer");
        expect(res.body.data.job.requiredSkills).toEqual(["node.js", "mongodb", "express"]);
    });

    test("rejects a job with no required skills", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "rec2");

        const res = await request(app)
            .post("/api/jobs")
            .set("Cookie", recruiterCookie)
            .send({ ...validJob, requiredSkills: [] });

        expect(res.status).toBe(400);
    });

    test("rejects a title that's too short", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "rec3");

        const res = await request(app)
            .post("/api/jobs")
            .set("Cookie", recruiterCookie)
            .send({ ...validJob, title: "ab" });

        expect(res.status).toBe(400);
    });
});

describe("GET /api/jobs", () => {
    test("rejects unauthenticated requests", async () => {
        const res = await request(app).get("/api/jobs");
        expect(res.status).toBe(401);
    });

    test("a student can browse jobs posted by a recruiter", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "rec4");
        await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);

        const studentCookie = await registerAndGetCookie("student", "stu2");
        const res = await request(app).get("/api/jobs").set("Cookie", studentCookie);

        expect(res.status).toBe(200);
        expect(res.body.data.jobs).toHaveLength(1);
        expect(res.body.data.jobs[0].title).toBe("Backend Engineer");
        expect(res.body.data.jobs[0].postedBy.companyName).toBe("Test Co");
    });

    test("paginates correctly", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "rec5");
        for (let i = 0; i < 3; i++) {
            await request(app).post("/api/jobs").set("Cookie", recruiterCookie)
                .send({ ...validJob, title: `Job Title ${i}` });
        }

        const res = await request(app)
            .get("/api/jobs?page=1&limit=2")
            .set("Cookie", recruiterCookie);

        expect(res.body.data.jobs).toHaveLength(2);
        expect(res.body.data.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    });
});

describe("GET /api/jobs/:jobId", () => {
    test("returns 404 for a non-existent job", async () => {
        const cookie = await registerAndGetCookie("student", "stu3");
        const fakeId = "aaaaaaaaaaaaaaaaaaaaaaaa";

        const res = await request(app).get(`/api/jobs/${fakeId}`).set("Cookie", cookie);
        expect(res.status).toBe(404);
    });

    test("returns full job details", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "rec6");
        const createRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = createRes.body.data.job._id;

        const res = await request(app).get(`/api/jobs/${jobId}`).set("Cookie", recruiterCookie);

        expect(res.status).toBe(200);
        expect(res.body.data.job.description).toBe(validJob.description);
    });
});

describe("GET /api/jobs/mine", () => {
    test("rejects a student (recruiter-only route)", async () => {
        const studentCookie = await registerAndGetCookie("student", "stu4");

        const res = await request(app).get("/api/jobs/mine").set("Cookie", studentCookie);
        expect(res.status).toBe(403);
    });

    test("returns only the requesting recruiter's own jobs", async () => {
        const recruiterACookie = await registerAndGetCookie("recruiter", "recA");
        const recruiterBCookie = await registerAndGetCookie("recruiter", "recB");

        await request(app).post("/api/jobs").set("Cookie", recruiterACookie).send(validJob);
        await request(app).post("/api/jobs").set("Cookie", recruiterBCookie).send({ ...validJob, title: "Frontend Engineer" });

        const res = await request(app).get("/api/jobs/mine").set("Cookie", recruiterACookie);

        expect(res.status).toBe(200);
        expect(res.body.data.jobs).toHaveLength(1);
        expect(res.body.data.jobs[0].title).toBe("Backend Engineer");
    });
});