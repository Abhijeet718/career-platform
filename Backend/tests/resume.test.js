const request = require("supertest");
const app = require("../src/app");
const { connectTestDB, clearTestDB, closeTestDB } = require("./setup/testDb");

jest.mock("pdf-parse", () => ({
    PDFParse: jest.fn().mockImplementation(() => ({
        getText: jest.fn().mockResolvedValue({
            text: "Experienced software engineer skilled in Java, React, and MongoDB. Built several full-stack projects."
        })
    }))
}));

jest.mock("../src/services/ai.service", () => ({
    analyzeResume: jest.fn().mockResolvedValue({
        atsScore: 78,
        extractedSkills: ["Java", "React", "MongoDB"],
        suggestions: ["Add measurable project results", "Include backend deployment experience"],
        summary: "A full-stack engineer with solid MERN and Java experience."
    })
}));

beforeAll(async () => {
    await connectTestDB();
});

afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
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
    return res.headers["set-cookie"][0].split(";")[0];
}

describe("POST /api/resume/analyze", () => {
    test("rejects unauthenticated requests", async () => {
        const res = await request(app).post("/api/resume/analyze");
        expect(res.status).toBe(401);
    });

    test("rejects a recruiter (student-only action)", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "resrec1", { companyName: "X" });

        const res = await request(app)
            .post("/api/resume/analyze")
            .set("Cookie", recruiterCookie)
            .attach("resume", Buffer.from("fake pdf content"), { filename: "resume.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(403);
    });

    test("rejects a request with no file attached", async () => {
        const studentCookie = await registerAndGetCookie("student", "resstu1");

        const res = await request(app)
            .post("/api/resume/analyze")
            .set("Cookie", studentCookie);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/pdf resume file is required/i);
    });

    test("rejects a non-PDF file", async () => {
        const studentCookie = await registerAndGetCookie("student", "resstu2");

        const res = await request(app)
            .post("/api/resume/analyze")
            .set("Cookie", studentCookie)
            .attach("resume", Buffer.from("not a pdf"), { filename: "resume.txt", contentType: "text/plain" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/only pdf files/i);
    });

    test("analyzes a resume and auto-populates the student's skills", async () => {
        const studentCookie = await registerAndGetCookie("student", "resstu3");

        const res = await request(app)
            .post("/api/resume/analyze")
            .set("Cookie", studentCookie)
            .attach("resume", Buffer.from("fake pdf content"), { filename: "resume.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(200);
        expect(res.body.data.analysis.atsScore).toBe(78);
        expect(res.body.data.updatedSkills).toEqual(["java", "react", "mongodb"]);

        const meRes = await request(app).get("/api/auth/get-me").set("Cookie", studentCookie);
        expect(meRes.body.data.user.skills).toEqual(["java", "react", "mongodb"]);
    });

    test("accepts an optional targetRole field", async () => {
        const studentCookie = await registerAndGetCookie("student", "resstu4");

        const res = await request(app)
            .post("/api/resume/analyze")
            .set("Cookie", studentCookie)
            .field("targetRole", "Backend Developer")
            .attach("resume", Buffer.from("fake pdf content"), { filename: "resume.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(200);
    });
});