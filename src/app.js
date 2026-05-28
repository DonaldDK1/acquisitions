import express from 'express';
import logger from "./config/logger.js";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from 'cookie-parser';
import authRoutes from "./routes/auth.routes.js";
import securityMiddleware from "./middleware/security.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

// process.on("uncaughtException", (err) => {
//   console.error("UNCAUGHT EXCEPTION:", err);
// });

// process.on("unhandledRejection", (err) => {
//   console.error("UNHANDLED REJECTION:", err);
// });

logger.info("App is starting...");
console.log("index.js is running");

app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

app.use(securityMiddleware);
app.get('/', (req, res) => {
  logger.info('Received a request to the root endpoint');
  res.status(200).send('hello from aqusitions!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get("/api", (req, res) => {
  res.status(200).json({ message: "Aqusitions API is running", version: "1.0.0" });
});

app.use('/api/auth', authRoutes);

export default app;
