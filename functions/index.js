const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const ADMIN_SECRET = defineSecret("ADMIN_SECRET");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

let appPromise;

function getApp() {
  if (!appPromise) {
    process.env.FIREBASE_FUNCTIONS = "true";
    appPromise = require("./server.cjs").startServer({ listen: false });
  }
  return appPromise;
}

exports.cgssbApi = onRequest(
  {
    region: "asia-south1",
    timeoutSeconds: 60,
    memory: "1GiB",
    concurrency: 80,
    maxInstances: 100,
    secrets: [ADMIN_SECRET, GEMINI_API_KEY],
  },
  async (req, res) => {
    process.env.ADMIN_SECRET = ADMIN_SECRET.value();
    process.env.GEMINI_API_KEY = GEMINI_API_KEY.value();

    try {
      const app = await getApp();
      return app(req, res);
    } catch (error) {
      console.error("CGSSB API initialization failed:", error);
      if (!res.headersSent) {
        return res.status(503).json({
          success: false,
          error: "Backend initialization failed.",
        });
      }
    }
  }
);
