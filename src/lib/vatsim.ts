import { normaliseCallsign } from "./callsign";
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

	public static noprimBuffer: (Controller & { addedAt: Date })[] = [];

	private static async fetchControllers(): Promise<Controller[]> {
		let controllers: Controller[] = [];

		const res = await fetch("https://data.vatsim.net/v3/vatsim-data.json");
		if (!res.ok) throw new Error("Failed to fetch VATSIM data");

		const data = await res.json();

		if (data.general.update < this.lastFetched) return this.lastFetchedControllers;

		const ignoredCids = await prisma.ignoredCid.findMany({
			select: {
				cid: true,
			},
		});

		for (const controller of data.controllers) {
			const normalisedCallsign = normaliseCallsign(controller.callsign);

			if (ignoredCids.includes(controller.cid) || !normalisedCallsign.includes("_")) continue;
			if (controller.frequency === "199.998") {
				this.noprimBuffer.push({
					addedAt: new Date(),
					cid: controller.cid,
					name: controller.name,
					callsign: controller.callsign,
					frequency: controller.frequency,
				});
			}

			controllers.push({
				cid: controller.cid,
				name: controller.name,
				callsign: controller.callsign,
				frequency: controller.frequency,
			});
		}

		return controllers;
	}

	private static getNewControllersFromBuff(): Controller[] {
		const newPrims: Controller[] = [];

		this.noprimBuffer = this.noprimBuffer.filter((controller) => {
			return Date.now() - controller.addedAt.getTime() < 60000;
		});

		for (const controller of this.noprimBuffer) {
			const newFreq = this.lastFetchedControllers.find((c) => c.cid === controller.cid)?.frequency;
			if (newFreq && newFreq !== "199.998") {
				newPrims.push(controller);
			}
		}

		return newPrims;
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
		const currentControllers = await this.fetchControllers();
		this.lastFetched = Date.now();

		if (this.lastFetchedControllers.length === 0) {
			this.lastFetchedControllers = currentControllers;
			return;
		}

		const upControllers = (await this.filterUpControllers(currentControllers)).concat(this.getNewControllersFromBuff());
		const downControllers = await this.filterDownControllers(currentControllers);

		this.upControllers = upControllers;
		this.downControllers = downControllers;
		this.lastFetchedControllers = currentControllers;
	}
}
