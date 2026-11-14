const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const config = require("./config");
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const readingRoutes = require("./routes/readings");
const reportRoutes = require("./routes/reports");
const requireJsonObject = require("./middleware/requireJsonObject");
const requestTimezone = require("./middleware/requestTimezone");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Behind a reverse proxy, trust it so rate limiting sees each visitor's real IP.
if (config.trustProxy) app.set("trust proxy", config.trustProxy);

app.use(helmet()); // security headers (also removes X-Powered-By)
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: "10kb" })); // our requests are tiny; refuse huge bodies
app.use(requireJsonObject);
app.use(requestTimezone);

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/readings", readingRoutes);
app.use("/reports", reportRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found." }));
app.use(errorHandler);

module.exports = app;
