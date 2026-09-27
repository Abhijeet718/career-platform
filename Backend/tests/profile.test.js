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
        role
    });
    return res.headers["set-cookie"][0].split(";")[0];
}

describe("PATCH /api/auth/profile", () => {
    test("rejects unauthenticated requests", async () => {
        const res = await request(app).patch("/api/auth/profile").send({ skills: ["java"] });
        expect(res.status).toBe(401);
    });

    test("rejects an empty body", async () => {
        const cookie = await registerAndGetCookie("student", "pstu1");
        const res = await request(app).patch("/api/auth/profile").set("Cookie", cookie).send({});
        expect(res.status).toBe(400);
    });

    test("a student can set their skills, lowercased", async () => {
        const cookie = await registerAndGetCookie("student", "pstu2");

        const res = await request(app)
            .patch("/api/auth/profile")
            .set("Cookie", cookie)
            .send({ skills: ["Java", "React", "MongoDB"] });

        expect(res.status).toBe(200);
        expect(res.body.data.user.skills).toEqual(["java", "react", "mongodb"]);
    });

    test("a recruiter can set their company name", async () => {
        const cookie = await registerAndGetCookie("recruiter", "prec1");

        const res = await request(app)
            .patch("/api/auth/profile")
            .set("Cookie", cookie)
            .send({ companyName: "New Company Name" });

        expect(res.status).toBe(200);
        expect(res.body.data.user.companyName).toBe("New Company Name");
    });

    test("a student setting companyName has it silently ignored (not their field)", async () => {
        const cookie = await registerAndGetCookie("student", "pstu3");

        const res = await request(app)
            .patch("/api/auth/profile")
            .set("Cookie", cookie)
            .send({ companyName: "Should Not Apply", skills: ["python"] });

        expect(res.status).toBe(200);
        expect(res.body.data.user.skills).toEqual(["python"]);
        expect(res.body.data.user.companyName).toBeUndefined();
    });
});