import { ControllerStatus, NotificaionManager } from "../notifications/manager";
import { normaliseCallsign } from "./callsign";
import { logger } from "./logger";
import { prisma } from "./prisma";

export interface Controller {
	cid: number;
	name: string;
	callsign: string;
	frequency: string;
}

export class Vatsim {
	public static lastFetched: number = 0;
	public static lastFetchedControllers: Controller[] = [];

	public static upControllers: Controller[] = [];
	public static downControllers: Controller[] = [];

	private static async fetchControllers(): Promise<Controller[]> {
		let controllers: Controller[] = [];

		let res;
		try {
			res = await fetch("https://data.vatsim.net/v3/vatsim-data.json");
		} catch (e) {}

		if (!res?.ok) {
			logger.error("Failed to fetch data from VATSIM, using last fetched data", res?.status);
			return this.lastFetchedControllers;
		}

		const data = await res.json();

		if (data.general.update < this.lastFetched) return this.lastFetchedControllers;

		for (const controller of data.controllers) {
			const normalisedCallsign = normaliseCallsign(controller.callsign);

			if (
				!normalisedCallsign.includes("_") ||
				(controller.frequency === "199.998" && !controller.callsign.includes("OBS") && !controller.callsign.includes("SUP"))
			)
				continue;

			controllers.push({
				cid: controller.cid,
				name: controller.name,
				callsign: controller.callsign,
				frequency: controller.frequency,
			});
		}

		return controllers;
	}

	private static async filterUpControllers(currentControllers: Controller[]) {
		return currentControllers.filter((controller) => {
			return !this.lastFetchedControllers.some((c) => c.cid === controller.cid);
		});
	}

	private static async filterDownControllers(currentControllers: Controller[]) {
		return this.lastFetchedControllers.filter((controller) => {
			return !currentControllers.some((c) => c.cid === controller.cid);
		});
	}

	public static async mainUpdater() {
		logger.info("Starting fetching cycle");
		const currentControllers = await this.fetchControllers();
		this.lastFetched = Date.now();

		if (this.lastFetchedControllers.length === 0) {
			this.lastFetchedControllers = currentControllers;
			return;
		}

		const upControllers = await this.filterUpControllers(currentControllers);
		const downControllers = await this.filterDownControllers(currentControllers);

		logger.info(`Up controllers: ${upControllers.map((controller) => controller.callsign).join(", ") || "None"}`);
		logger.info(`Down controllers: ${downControllers.map((controller) => controller.callsign).join(", ") || "None"}`);

		NotificaionManager.sendNotifications(
			upControllers
				.map((controller) => ({ controller, type: "up" }))
				.concat(downControllers.map((controller) => ({ controller, type: "down" }))) as ControllerStatus[]
		);

		this.upControllers = upControllers;
		this.downControllers = downControllers;
		this.lastFetchedControllers = currentControllers;
	}
}
