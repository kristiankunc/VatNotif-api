import { Database } from "./lib/database.js";
import { DiscordNotifications } from "./notifications/discord.js";
import { PushNotifications } from "./notifications/push.js";
import { Controller } from "./types/controllers.js";
export class Vatsim {
	private initialized = false;
	public lastModified = new Date();

	private onlineControllers: Controller[] = [];
	private newControllers: Controller[] = [];
	private downControllers: Controller[] = [];

	public async initialize(dev: boolean = false): Promise<void> {
		if (this.initialized) {
			return;
		}

		this.onlineControllers = await this.fetchControllers();
		setInterval(async () => {
			const onlineControllers = await this.fetchControllers();
			this.lastModified = new Date();

			const ignoredCids = await Database.getIgnoredCids();
			this.newControllers = await this.filterNewControllers(onlineControllers);
			this.downControllers = await this.filterDownControllers(onlineControllers);
			this.onlineControllers = onlineControllers;

			if (dev) return;

			for (const newController of this.newControllers) {
				if (!ignoredCids.includes(newController.cid)) {
					const normalisedCallsign = this.normaliseCallsign(newController.callsign);
					const affectedCids = await Database.getAffectedCids(normalisedCallsign);

					await DiscordNotifications.sendOnlineNotification(newController, affectedCids);
					await PushNotifications.sendOnlineNotification(newController, affectedCids);
				}
			}

			for (const downController of this.downControllers) {
				if (!ignoredCids.includes(downController.cid)) {
					const affectedCids = await Database.getAffectedCids(downController.callsign);

					await DiscordNotifications.sendDownNotification(downController, affectedCids);
					await PushNotifications.sendDownNotification(downController, affectedCids);
				}
			}
		}, 15 * 1000);

		this.initialized = true;
	}

	private async fetchControllers(): Promise<Controller[]> {
		let res: Response | null = null;
		try {
			res = await fetch("https://data.vatsim.net/v3/vatsim-data.json");
		} catch (err) {
			console.error(err);
			return this.onlineControllers;
		}

		if (!res || !res.ok) {
			return this.onlineControllers;
		}

		return (await res.json()).controllers;
	}

	private async filterNewControllers(onlineControllers: Controller[]): Promise<Controller[]> {
		const newControllers: Controller[] = [];

		for (const onlineController of onlineControllers) {
			const found = this.onlineControllers.find((controller) => controller.cid === onlineController.cid);

			if (!found) {
				newControllers.push(onlineController);
			}
		}

		return newControllers;
	}

	private async filterDownControllers(onlineControllers: Controller[]): Promise<Controller[]> {
		const downControllers: Controller[] = [];

		for (const controller of this.onlineControllers) {
			const found = onlineControllers.find((onlineController) => onlineController.cid === controller.cid);

			if (!found) {
				downControllers.push(controller);
			}
		}

		return downControllers;
	}

	public normaliseCallsign(callsign: string): string {
		return callsign.replace(/_+/g, "_").toUpperCase();
	}

	public async forceRefresh(): Promise<void> {
		this.onlineControllers = await this.fetchControllers();
	}

	public getOnlineControllers(): Controller[] {
		return this.onlineControllers;
	}

	public getNewControllers(): Controller[] {
		return this.newControllers;
	}

	public getDownControllers(): Controller[] {
		return this.downControllers;
	}
}

export const vatsim = new Vatsim();
