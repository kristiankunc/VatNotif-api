import express from "express";
import { Vatsim } from "./lib/vatsim";
import http from "http";
import { Server } from "socket.io";
import { NotificaionManager } from "./notifications/manager";
import { DiscordNotifications } from "./notifications/discord";

const app = express();
const server = http.createServer(app);
/*
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});
*/

Vatsim.mainUpdater();
setInterval(() => Vatsim.mainUpdater(), 15000);

NotificaionManager.notificationCallbacks.push(DiscordNotifications.sendNotifications);

app.all("/controllers/*", (req, res, next) => {
	res.setHeader("Last-Modified", new Date(Vatsim.lastFetched).toUTCString());
	next();
});

app.get("/controllers/new", (req, res) => {
	res.json(Vatsim.upControllers);
});

app.get("/controllers/down", (req, res) => {
	res.json(Vatsim.downControllers);
});

app.get("/controllers/online", (req, res) => {
	res.json(Vatsim.lastFetchedControllers.filter((controller) => controller.frequency !== "199.998"));
});

server.listen(3000, () => {
	console.log("listening on *:3000");
});
