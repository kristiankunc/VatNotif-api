import express from "express";
import { vatsim } from "./vatsim.js";
import { VAPIDKeys } from "./conf/push.js";
import webpush from "web-push";
import { Database } from "./lib/database.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { airspaceData } from "./data.js";

const app = express();
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Last-Modified", vatsim.lastModified.toUTCString());
	next();
});
app.use(express.json());
const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

webpush.setVapidDetails("mailto: kristian@kristn.co.uk", VAPIDKeys.publicKey, VAPIDKeys.privateKey);

await vatsim.initialize();
await vatsim.forceRefresh();

app.get("/", (req, res) => {
	res.setHeader("content-type", "text/plain");
	res.send("VatNotif API, docs @ https://api.vatnotif.kristn.co.uk/docs");
});

app.get("/controllers/online", async (req, res) => {
	res.json(vatsim.getOnlineControllers());
});

app.get("/controllers/new", async (req, res) => {
	res.json(vatsim.getNewControllers());
});

app.get("/controllers/down", async (req, res) => {
	res.json(vatsim.getDownControllers());
});

app.get("/push/public-key", async (req, res) => {
	res.setHeader("content-type", "text/plain");
	res.send(VAPIDKeys.publicKey);
});

app.post("/push/subscribe", async (req, res) => {
	if (!req.body) return res.status(400).send("No body");
	const cid = req.body.cid;
	const subscription = req.body.subscription;

	if (!cid || isNaN(cid) || cid < 0 || cid > 99999999) {
		res.status(400).send("Invalid CID");
		return;
	}

	Database.registerPushNotification(cid, subscription);

	webpush.sendNotification(
		subscription,
		JSON.stringify({
			title: "VatNotif",
			body: "You are now subscribed to VatNotif push notifications",
			icon: "https://vatnotif.kristn.co.uk/brand/logo.png",
			badge: "https://vatnotif.kristn.co.uk/brand/logo.png",
			image: "https://vatnotif.kristn.co.uk/brand/logo.png",
			vibrate: [100, 50, 100],
		})
	);

	res.sendStatus(201);
});

app.get("/topdown/icao/:icao", async (req, res) => {
	const icao = req.params.icao.toUpperCase();

	if (!icao || icao.length !== 4) {
		res.status(400).send("Invalid ICAO");
		return;
	}

	const topdown = airspaceData.getAerodromeTopdown(icao);

	if (!topdown) {
		res.status(404).send("ICAO not found");
		return;
	}

	res.json(topdown);
});

app.get("/topdown/position/:callsign", async (req, res) => {
	const callsign = req.params.callsign;

	const topdown = airspaceData.getCallsignTopdown(callsign);

	if (!topdown) {
		res.status(404).send("Callsign not found");
		return;
	}

	res.json(topdown);
});

app.listen(8000, () => {
	console.log(`VatNotif API listening at http://localhost:8000`);
});
