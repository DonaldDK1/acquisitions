import { slidingWindow } from "@arcjet/node";
import aj from "../config/arcjet.js";
import logger from "#config/logger.js";

const securityMiddleware = async (req, res, next) => {
    try {
        const role = req.user?.role || "guest";

        let limit;
        let message;

        switch (role) {
            case "admin":
                limit = 20;
                message = "Admin users have a higher request limit.";
                break;
            case "user":
                limit = 10;
                message = "Regular users have a moderate request limit.";
                break;
            case "guest":
                limit = 5;
                message = "Guest users have a lower request limit.";
                break;
        }
        const client = aj.withRule(slidingWindow({ mode: "LIVE", interval: "1m", max: limit, name: `${role}-rate-limit` }));

        const decision = await client.protect(req);

        if (decision.isDenied() && decision.reason.isBot()) {
            logger.warn("Bot detected and blocked", { ip: req.ip, userAgent: req.get("User-Agent"), path: req.path });
            return res.status(403).json({ error: "Forbidden", message: "Bot traffic is not allowed" });
        }

        if (decision.isDenied() && decision.reason.isShield()) {
            logger.warn("Shield blocked request", { ip: req.ip, userAgent: req.get("User-Agent"), path: req.path, method: req.method });
            return res.status(403).json({ error: "Forbidden", message: "Request blocked by security policy" });
        }

        if (decision.isDenied() && decision.reason.isRateLimit()) {
            logger.warn("Rate limit exceeded", { ip: req.ip, userAgent: req.get("User-Agent"), path: req.path, method: req.method });
            return res.status(429).json({ error: "Too Many Requests", message: "You have exceeded the rate limit" });

        }
        next();
    } catch (error) {
        console.error("Security middleware error", error);
        res.status(500).json({ error: "Internal Server Error", message: "An error occurred while processing your request" });
    }
}

export default securityMiddleware;