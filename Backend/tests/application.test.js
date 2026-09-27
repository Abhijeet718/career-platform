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

async function registerAndGetCookie(role, emailPrefix, extra = {}) {
    const res = await request(app).post("/api/auth/register").send({
        username: `${emailPrefix}_user`,
        email: `${emailPrefix}@example.com`,
        password: "password123",
        role,
        ...extra
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
    requiredSkills: ["Node.js", "MongoDB", "Docker", "AWS"]
};

describe("POST /api/jobs/:jobId/apply", () => {
    test("rejects unauthenticated requests", async () => {
        const res = await request(app).post("/api/jobs/000000000000000000000000/apply");
        expect(res.status).toBe(401);
    });

    test("rejects a recruiter trying to apply (student-only action)", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arec1", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const res = await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", recruiterCookie);
        expect(res.status).toBe(403);
    });

    test("returns 404 for a non-existent job", async () => {
        const studentCookie = await registerAndGetCookie("student", "astu1");
        const res = await request(app)
            .post("/api/jobs/000000000000000000000000/apply")
            .set("Cookie", studentCookie);
        expect(res.status).toBe(404);
    });

    test("computes the correct match score based on overlapping skills", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arec2", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const studentCookie = await registerAndGetCookie("student", "astu2");
        await request(app).patch("/api/auth/profile").set("Cookie", studentCookie)
            .send({ skills: ["Node.js", "MongoDB", "Python"] });

        const res = await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", studentCookie);

        expect(res.status).toBe(201);
        expect(res.body.data.application.matchScore).toBe(50);
        expect(res.body.data.application.matchedSkills.sort()).toEqual(["mongodb", "node.js"]);
        expect(res.body.data.application.missingSkills.sort()).toEqual(["aws", "docker"]);
        expect(res.body.data.application.status).toBe("applied");
    });

    test("rejects applying to the same job twice", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arec3", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const studentCookie = await registerAndGetCookie("student", "astu3");
        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", studentCookie);

        const res = await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", studentCookie);

        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/already applied/i);
    });
});

describe("GET /api/applications/mine", () => {
    test("returns the student's own applications with job details populated", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arec4", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const studentCookie = await registerAndGetCookie("student", "astu4");
        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", studentCookie);

        const res = await request(app).get("/api/applications/mine").set("Cookie", studentCookie);

        expect(res.status).toBe(200);
        expect(res.body.data.applications).toHaveLength(1);
        expect(res.body.data.applications[0].job.title).toBe("Backend Engineer");
    });

    test("rejects a recruiter (student-only route)", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arec5", { companyName: "X" });
        const res = await request(app).get("/api/applications/mine").set("Cookie", recruiterCookie);
        expect(res.status).toBe(403);
    });
});

describe("GET /api/jobs/:jobId/applicants (IDOR protection)", () => {
    test("a recruiter cannot view applicants for a job they did not post", async () => {
        const ownerCookie = await registerAndGetCookie("recruiter", "arecOwner", { companyName: "X" });
        const otherRecruiterCookie = await registerAndGetCookie("recruiter", "arecOther", { companyName: "Y" });

        const jobRes = await request(app).post("/api/jobs").set("Cookie", ownerCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const studentCookie = await registerAndGetCookie("student", "astu5");
        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", studentCookie);

        const res = await request(app)
            .get(`/api/jobs/${jobId}/applicants`)
            .set("Cookie", otherRecruiterCookie);

        expect(res.status).toBe(404);
    });

    test("the owning recruiter CAN view applicants, sorted by match score", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arecOwner2", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const studentCookie = await registerAndGetCookie("student", "astu6");
        await request(app).patch("/api/auth/profile").set("Cookie", studentCookie)
            .send({ skills: ["Node.js", "MongoDB", "Docker", "AWS"] });
        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", studentCookie);

        const res = await request(app).get(`/api/jobs/${jobId}/applicants`).set("Cookie", recruiterCookie);

        expect(res.status).toBe(200);
        expect(res.body.data.applications).toHaveLength(1);
        expect(res.body.data.applications[0].matchScore).toBe(100);
        expect(res.body.data.applications[0].applicant.username).toBe("astu6_user");
    });
});

describe("PATCH /api/applications/:applicationId/status (IDOR protection)", () => {
    async function setupApplication(id) {
        const recruiterCookie = await registerAndGetCookie("recruiter", `arecS${id}`, { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const studentCookie = await registerAndGetCookie("student", `astuS${id}`);
        const applyRes = await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", studentCookie);
        const applicationId = applyRes.body.data.application._id;

        return { recruiterCookie, applicationId };
    }

    test("a different recruiter cannot update another recruiter's application", async () => {
        const { applicationId } = await setupApplication(1);
        const otherRecruiterCookie = await registerAndGetCookie("recruiter", "arecOther1", { companyName: "Z" });

        const res = await request(app)
            .patch(`/api/applications/${applicationId}/status`)
            .set("Cookie", otherRecruiterCookie)
            .send({ status: "shortlisted" });

        expect(res.status).toBe(404);
    });

    test("the owning recruiter can update the status", async () => {
        const { recruiterCookie, applicationId } = await setupApplication(2);

        const res = await request(app)
            .patch(`/api/applications/${applicationId}/status`)
            .set("Cookie", recruiterCookie)
            .send({ status: "shortlisted" });

        expect(res.status).toBe(200);
        expect(res.body.data.application.status).toBe("shortlisted");
    });

    test("rejects an invalid status value", async () => {
        const { recruiterCookie, applicationId } = await setupApplication(3);

        const res = await request(app)
            .patch(`/api/applications/${applicationId}/status`)
            .set("Cookie", recruiterCookie)
            .send({ status: "not_a_real_status" });

        expect(res.status).toBe(400);
    });

    test("a student cannot update application status (recruiter-only action)", async () => {
        const { applicationId } = await setupApplication(4);
        const someStudentCookie = await registerAndGetCookie("student", "astuNope1");

        const res = await request(app)
            .patch(`/api/applications/${applicationId}/status`)
            .set("Cookie", someStudentCookie)
            .send({ status: "shortlisted" });

        expect(res.status).toBe(403);
    });
});