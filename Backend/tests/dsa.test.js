const request = require("supertest");
const app = require("../src/app");
const { dsaEntryModel } = require("../src/models/dsa.model");
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

const validEntry = {
    title: "Two Sum",
    topic: "array",
    difficulty: "easy",
    status: "solved",
    platform: "LeetCode"
};

describe("POST /api/dsa", () => {
    test("rejects unauthenticated requests", async () => {
        const res = await request(app).post("/api/dsa").send(validEntry);
        expect(res.status).toBe(401);
    });

    test("logs a valid entry (works for both roles — this is a personal tool)", async () => {
        const studentCookie = await registerAndGetCookie("student", "dsastu1");
        const res = await request(app).post("/api/dsa").set("Cookie", studentCookie).send(validEntry);

        expect(res.status).toBe(201);
        expect(res.body.data.entry.title).toBe("Two Sum");
        expect(res.body.data.entry.status).toBe("solved");
    });

    test("a recruiter can also use their own tracker", async () => {
        const recruiterCookie = await registerAndGetCookie("recruiter", "dsarec1");
        const res = await request(app).post("/api/dsa").set("Cookie", recruiterCookie).send(validEntry);
        expect(res.status).toBe(201);
    });

    test("defaults status to 'solved' when omitted", async () => {
        const cookie = await registerAndGetCookie("student", "dsastu2");
        const { status, ...withoutStatus } = validEntry;

        const res = await request(app).post("/api/dsa").set("Cookie", cookie).send(withoutStatus);

        expect(res.status).toBe(201);
        expect(res.body.data.entry.status).toBe("solved");
    });

    test("rejects an invalid topic", async () => {
        const cookie = await registerAndGetCookie("student", "dsastu3");
        const res = await request(app).post("/api/dsa").set("Cookie", cookie)
            .send({ ...validEntry, topic: "not-a-real-topic" });
        expect(res.status).toBe(400);
    });

    test("rejects an invalid difficulty", async () => {
        const cookie = await registerAndGetCookie("student", "dsastu4");
        const res = await request(app).post("/api/dsa").set("Cookie", cookie)
            .send({ ...validEntry, difficulty: "impossible" });
        expect(res.status).toBe(400);
    });
});

describe("GET /api/dsa", () => {
    test("lists only the caller's own entries", async () => {
        const cookieA = await registerAndGetCookie("student", "dsalistA");
        const cookieB = await registerAndGetCookie("student", "dsalistB");

        await request(app).post("/api/dsa").set("Cookie", cookieA).send(validEntry);
        await request(app).post("/api/dsa").set("Cookie", cookieB).send({ ...validEntry, title: "Valid Parentheses" });

        const res = await request(app).get("/api/dsa").set("Cookie", cookieA);

        expect(res.status).toBe(200);
        expect(res.body.data.entries).toHaveLength(1);
        expect(res.body.data.entries[0].title).toBe("Two Sum");
    });

    test("filters by topic", async () => {
        const cookie = await registerAndGetCookie("student", "dsafilter1");
        await request(app).post("/api/dsa").set("Cookie", cookie).send(validEntry);
        await request(app).post("/api/dsa").set("Cookie", cookie).send({ ...validEntry, title: "Binary Tree Paths", topic: "tree" });

        const res = await request(app).get("/api/dsa?topic=tree").set("Cookie", cookie);

        expect(res.status).toBe(200);
        expect(res.body.data.entries).toHaveLength(1);
        expect(res.body.data.entries[0].topic).toBe("tree");
    });

    test("filters by status", async () => {
        const cookie = await registerAndGetCookie("student", "dsafilter2");
        await request(app).post("/api/dsa").set("Cookie", cookie).send(validEntry);
        await request(app).post("/api/dsa").set("Cookie", cookie).send({ ...validEntry, title: "Hard DP Problem", status: "todo" });

        const res = await request(app).get("/api/dsa?status=todo").set("Cookie", cookie);

        expect(res.status).toBe(200);
        expect(res.body.data.entries).toHaveLength(1);
        expect(res.body.data.entries[0].title).toBe("Hard DP Problem");
    });
});

describe("PATCH /api/dsa/:entryId (ownership)", () => {
    test("the owner can update their entry", async () => {
        const cookie = await registerAndGetCookie("student", "dsaupdate1");
        const createRes = await request(app).post("/api/dsa").set("Cookie", cookie).send(validEntry);
        const entryId = createRes.body.data.entry._id;

        const res = await request(app)
            .patch(`/api/dsa/${entryId}`)
            .set("Cookie", cookie)
            .send({ status: "attempted", notes: "Need to revisit two-pointer approach" });

        expect(res.status).toBe(200);
        expect(res.body.data.entry.status).toBe("attempted");
        expect(res.body.data.entry.notes).toBe("Need to revisit two-pointer approach");
    });

    test("another user cannot update someone else's entry", async () => {
        const ownerCookie = await registerAndGetCookie("student", "dsaowner1");
        const otherCookie = await registerAndGetCookie("student", "dsaother1");

        const createRes = await request(app).post("/api/dsa").set("Cookie", ownerCookie).send(validEntry);
        const entryId = createRes.body.data.entry._id;

        const res = await request(app)
            .patch(`/api/dsa/${entryId}`)
            .set("Cookie", otherCookie)
            .send({ status: "attempted" });

        expect(res.status).toBe(404);
    });

    test("rejects an empty update body", async () => {
        const cookie = await registerAndGetCookie("student", "dsaupdate2");
        const createRes = await request(app).post("/api/dsa").set("Cookie", cookie).send(validEntry);
        const entryId = createRes.body.data.entry._id;

        const res = await request(app).patch(`/api/dsa/${entryId}`).set("Cookie", cookie).send({});
        expect(res.status).toBe(400);
    });
});

describe("DELETE /api/dsa/:entryId (ownership)", () => {
    test("the owner can delete their entry", async () => {
        const cookie = await registerAndGetCookie("student", "dsadelete1");
        const createRes = await request(app).post("/api/dsa").set("Cookie", cookie).send(validEntry);
        const entryId = createRes.body.data.entry._id;

        const res = await request(app).delete(`/api/dsa/${entryId}`).set("Cookie", cookie);
        expect(res.status).toBe(200);

        const listRes = await request(app).get("/api/dsa").set("Cookie", cookie);
        expect(listRes.body.data.entries).toHaveLength(0);
    });

    test("another user cannot delete someone else's entry", async () => {
        const ownerCookie = await registerAndGetCookie("student", "dsaowner2");
        const otherCookie = await registerAndGetCookie("student", "dsaother2");

        const createRes = await request(app).post("/api/dsa").set("Cookie", ownerCookie).send(validEntry);
        const entryId = createRes.body.data.entry._id;

        const res = await request(app).delete(`/api/dsa/${entryId}`).set("Cookie", otherCookie);
        expect(res.status).toBe(404);
    });
});

describe("GET /api/dsa/stats", () => {
    test("topic breakdown includes topics with ZERO solves, sorted ascending", async () => {
        const cookie = await registerAndGetCookie("student", "dsastats1");
        await request(app).post("/api/dsa").set("Cookie", cookie).send({ ...validEntry, topic: "array" });
        await request(app).post("/api/dsa").set("Cookie", cookie).send({ ...validEntry, topic: "array", title: "3Sum" });
        await request(app).post("/api/dsa").set("Cookie", cookie).send({ ...validEntry, topic: "tree", title: "Inorder Traversal" });

        const res = await request(app).get("/api/dsa/stats").set("Cookie", cookie);

        expect(res.status).toBe(200);
        expect(res.body.data.totalSolved).toBe(3);

        const arrayEntry = res.body.data.topicBreakdown.find(t => t.topic === "array");
        const treeEntry = res.body.data.topicBreakdown.find(t => t.topic === "tree");
        const graphEntry = res.body.data.topicBreakdown.find(t => t.topic === "graph");
        expect(arrayEntry.solved).toBe(2);
        expect(treeEntry.solved).toBe(1);
        expect(graphEntry.solved).toBe(0);

        expect(res.body.data.weakestTopics).not.toContain("array");
    });

    test("difficulty breakdown counts correctly", async () => {
        const cookie = await registerAndGetCookie("student", "dsastats2");
        await request(app).post("/api/dsa").set("Cookie", cookie).send({ ...validEntry, difficulty: "easy" });
        await request(app).post("/api/dsa").set("Cookie", cookie).send({ ...validEntry, title: "Hard One", difficulty: "hard" });
        await request(app).post("/api/dsa").set("Cookie", cookie).send({ ...validEntry, title: "Another Hard", difficulty: "hard" });

        const res = await request(app).get("/api/dsa/stats").set("Cookie", cookie);

        expect(res.body.data.difficultyBreakdown).toEqual({ easy: 1, medium: 0, hard: 2 });
    });

    test("'attempted'/'todo' entries do NOT count toward solved stats", async () => {
        const cookie = await registerAndGetCookie("student", "dsastats3");
        await request(app).post("/api/dsa").set("Cookie", cookie).send({ ...validEntry, status: "todo" });
        await request(app).post("/api/dsa").set("Cookie", cookie).send({ ...validEntry, title: "Attempted One", status: "attempted" });

        const res = await request(app).get("/api/dsa/stats").set("Cookie", cookie);

        expect(res.body.data.totalSolved).toBe(0);
    });

    test("computes a genuine multi-day streak using real (backdated) entries", async () => {
        const cookie = await registerAndGetCookie("student", "dsastreak1");
        const meRes = await request(app).get("/api/auth/get-me").set("Cookie", cookie);
        const userId = meRes.body.data.user.id;

        const today = new Date();
        const daysAgo = (n) => {
            const d = new Date(today);
            d.setDate(d.getDate() - n);
            return d;
        };

        await dsaEntryModel.create({ user: userId, title: "Today", topic: "array", difficulty: "easy", status: "solved", createdAt: daysAgo(0) });
        await dsaEntryModel.create({ user: userId, title: "Yesterday", topic: "array", difficulty: "easy", status: "solved", createdAt: daysAgo(1) });
        await dsaEntryModel.create({ user: userId, title: "2 days ago", topic: "array", difficulty: "easy", status: "solved", createdAt: daysAgo(2) });
        await dsaEntryModel.create({ user: userId, title: "5 days ago", topic: "array", difficulty: "easy", status: "solved", createdAt: daysAgo(5) });

        const res = await request(app).get("/api/dsa/stats").set("Cookie", cookie);

        expect(res.status).toBe(200);
        expect(res.body.data.currentStreak).toBe(3);
    });

    test("streak is 0 with no solved entries", async () => {
        const cookie = await registerAndGetCookie("student", "dsastreak2");
        const res = await request(app).get("/api/dsa/stats").set("Cookie", cookie);
        expect(res.body.data.currentStreak).toBe(0);
    });
});