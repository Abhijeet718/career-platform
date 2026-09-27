const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET", "GOOGLE_GENAI_API_KEY"];

function validateEnv() {
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.error(
            `Missing required environment variable(s): ${missing.join(", ")}\n` +
            `Copy Backend/.env.example to Backend/.env and fill in real values.`
        );
        process.exit(1);
    }
}

module.exports = validateEnv;