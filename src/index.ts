import express from "express";
import { Vatsim } from "./lib/vatsim";
import http from "http";
import { NotificaionManager } from "./notifications/manager";
import { DiscordNotifications } from "./notifications/discord";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { logger } from "./lib/logger";

const app = express();

const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const server = http.createServer(app);

Vatsim.mainUpdater();
setInterval(() => Vatsim.mainUpdater(), 15000);

NotificaionManager.notificationCallbacks.push(DiscordNotifications.sendNotifications);

app.all("/controllers", (req, res, next) => {
	res.setHeader("Last-Modified", new Date(Vatsim.lastFetched).toUTCString());
	next();
});

app.get("/", (req, res) => {
	res.setHeader("content-type", "text/plain");
	res.send("VatNotif API, docs @ /docs");
});

app.get("/controllers/up", (req, res) => {
	res.json(Vatsim.upControllers);
});

app.get("/controllers/down", (req, res) => {
	res.json(Vatsim.downControllers);
});

app.get("/controllers/online", (req, res) => {
	res.json(Vatsim.lastFetchedControllers);
});

server.listen(3001, () => {
	logger.info("Server started on port 3001");
});
