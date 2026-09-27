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

    test("filters applicants by status", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arecFilter1", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const studentACookie = await registerAndGetCookie("student", "filtA");
        const studentBCookie = await registerAndGetCookie("student", "filtB");

        const applyA = await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", studentACookie);
        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", studentBCookie);

        await request(app)
            .patch(`/api/applications/${applyA.body.data.application._id}/status`)
            .set("Cookie", recruiterCookie)
            .send({ status: "shortlisted" });

        const res = await request(app)
            .get(`/api/jobs/${jobId}/applicants?status=shortlisted`)
            .set("Cookie", recruiterCookie);

        expect(res.status).toBe(200);
        expect(res.body.data.applications).toHaveLength(1);
        expect(res.body.data.applications[0].applicant.username).toBe("filtA_user");
    });

    test("filters applicants by minMatchScore", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arecFilter2", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const highMatchCookie = await registerAndGetCookie("student", "highMatch");
        await request(app).patch("/api/auth/profile").set("Cookie", highMatchCookie)
            .send({ skills: ["Node.js", "MongoDB", "Docker", "AWS"] });

        const lowMatchCookie = await registerAndGetCookie("student", "lowMatch");
        await request(app).patch("/api/auth/profile").set("Cookie", lowMatchCookie)
            .send({ skills: ["Node.js"] });

        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", highMatchCookie);
        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", lowMatchCookie);

        const res = await request(app)
            .get(`/api/jobs/${jobId}/applicants?minMatchScore=50`)
            .set("Cookie", recruiterCookie);

        expect(res.status).toBe(200);
        expect(res.body.data.applications).toHaveLength(1);
        expect(res.body.data.applications[0].applicant.username).toBe("highMatch_user");
    });

    test("searches applicants by username", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arecFilter3", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const priyaCookie = await registerAndGetCookie("student", "priyaSharma");
        const rahulCookie = await registerAndGetCookie("student", "rahulVerma");
        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", priyaCookie);
        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", rahulCookie);

        const res = await request(app)
            .get(`/api/jobs/${jobId}/applicants?search=priya`)
            .set("Cookie", recruiterCookie);

        expect(res.status).toBe(200);
        expect(res.body.data.applications).toHaveLength(1);
        expect(res.body.data.applications[0].applicant.username).toBe("priyaSharma_user");
    });

    test("searches applicants by skill", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arecFilter4", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const kubernetesStudentCookie = await registerAndGetCookie("student", "kubeStudent");
        await request(app).patch("/api/auth/profile").set("Cookie", kubernetesStudentCookie)
            .send({ skills: ["kubernetes", "node.js"] });

        const otherStudentCookie = await registerAndGetCookie("student", "otherStudent");
        await request(app).patch("/api/auth/profile").set("Cookie", otherStudentCookie)
            .send({ skills: ["python"] });

        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", kubernetesStudentCookie);
        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", otherStudentCookie);

        const res = await request(app)
            .get(`/api/jobs/${jobId}/applicants?search=kubernetes`)
            .set("Cookie", recruiterCookie);

        expect(res.status).toBe(200);
        expect(res.body.data.applications).toHaveLength(1);
        expect(res.body.data.applications[0].applicant.username).toBe("kubeStudent_user");
    });

    test("returns an empty list (not an error) when search matches no one", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arecFilter5", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const res = await request(app)
            .get(`/api/jobs/${jobId}/applicants?search=nonexistentname`)
            .set("Cookie", recruiterCookie);

        expect(res.status).toBe(200);
        expect(res.body.data.applications).toHaveLength(0);
        expect(res.body.data.pagination.total).toBe(0);
    });

    test("sorts by createdAt ascending when requested", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arecFilter6", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const firstCookie = await registerAndGetCookie("student", "firstApplicant");
        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", firstCookie);

        const secondCookie = await registerAndGetCookie("student", "secondApplicant");
        await request(app).post(`/api/jobs/${jobId}/apply`).set("Cookie", secondCookie);

        const res = await request(app)
            .get(`/api/jobs/${jobId}/applicants?sortBy=createdAt&sortOrder=asc`)
            .set("Cookie", recruiterCookie);

        expect(res.status).toBe(200);
        expect(res.body.data.applications[0].applicant.username).toBe("firstApplicant_user");
        expect(res.body.data.applications[1].applicant.username).toBe("secondApplicant_user");
    });

    test("rejects an invalid status filter value", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "arecFilter7", { companyName: "X" });
        const jobRes = await request(app).post("/api/jobs").set("Cookie", recruiterCookie).send(validJob);
        const jobId = jobRes.body.data.job._id;

        const res = await request(app)
            .get(`/api/jobs/${jobId}/applicants?status=not_a_real_status`)
            .set("Cookie", recruiterCookie);

        expect(res.status).toBe(400);
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