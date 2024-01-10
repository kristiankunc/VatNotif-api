import express from "express";
import { Vatsim, vatsim } from "./vatsim.js";
import { VAPIDKeys } from "./conf/push.js";
import webpush from "web-push";
import { Database } from "./lib/database.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { ukData } from "./uk-data.js";

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

let isDev = process.argv.length > 2 && process.argv[2] === "dev";
if (isDev) {
	console.log("Running in dev mode");
}

await ukData.fetchData();
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
	if (!req.params.icao) return res.status(400).send("No ICAO provided");

	const icao = req.params.icao.toUpperCase();
	if (!icao.startsWith("EG")) return res.status(400).send("Invalid ICAO, topdown only available for UK (EGTT, EGPX FIRs)");

	const airfield = ukData.airfieldMap.get(icao);
	if (!airfield) return res.status(404).send("No airfield found for ICAO");

	res.json(airfield.controllers);
});

app.get("/topdown/callsign/:callsign", async (req, res) => {
	if (!req.params.callsign) return res.status(400).send("No callsign provided");

	const callsign = vatsim.normaliseCallsign(req.params.callsign);

	const controllers = ukData.controllerCallsignTopdown.get(callsign);
	if (!controllers) return res.status(404).send("No controllers found for callsign");

	res.json(controllers);
});

app.listen(8000, () => {
	console.log(`VatNotif API listening at http://localhost:8000`);
});
