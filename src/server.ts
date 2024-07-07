import cors from "cors";
import path from "path";
import express, { Express } from "express";
import helmet from "helmet";
import { pino } from "pino";
import { createServer } from "http";

import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { userRouter } from "@/api/user/userRouter";
import { openAPIRouter } from "@/api-docs/openAPIRouter";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import { twillioRouter } from "@/api/twillio/twillioRouter";
import setupWebSocket from "@/websocketServer";

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

app.use(require("express-status-monitor")());

// Middlewares
app.use(express.json());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// FIXME: temp for testing from UI

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.socket.io;"
  );
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/users", userRouter);
app.use("/twillio", twillioRouter);

// Swagger UI
// app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

// Create HTTP server
const server = createServer(app);

// Setup WebSocket server
setupWebSocket(server);

// Start the server
server.listen(env.PORT, () => {
  const { NODE_ENV, HOST, PORT } = env;
  logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);
});

const onCloseSignal = () => {
  logger.info("sigint received, shutting down");
  server.close(() => {
    logger.info("server closed");
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);

export { app, logger };
