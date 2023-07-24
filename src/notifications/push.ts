import { VAPIDKeys } from "../conf/push.js";
import { Database } from "../lib/database.js";
import { Controller } from "../types/controllers.js";
import webpush from "web-push";

webpush.setVapidDetails("mailto: kristian@kristn.co.uk", VAPIDKeys.publicKey, VAPIDKeys.privateKey);

export class PushNotifications {
	public static async sendOnlineNotification(controller: Controller): Promise<void> {
		const subscriptions = await Database.getPushFromCallsign(controller.callsign);

		for (const subscription of subscriptions) {
			webpush.sendNotification(
				subscription,
				JSON.stringify({
					title: "New VatNotif notification!",
					body: `🆙 Controller **${controller.name}** (${controller.cid}) has logged on as **${controller.callsign}**!`,
					icon: "https://vatnotif.kristn.co.uk/brand/logo.webp",
				})
			);
		}
	}

	public static async sendDownNotification(controller: Controller): Promise<void> {
		const subscriptions = await Database.getPushFromCallsign(controller.callsign);

		for (const subscription of subscriptions) {
			webpush.sendNotification(
				subscription,
				JSON.stringify({
					title: "New VatNotif notification!",
					body: `🔻 Controller **${controller.name}** (${controller.cid}) has logged off from **${controller.callsign}**!`,
					icon: "https://vatnotif.kristn.co.uk/brand/logo.webp",
				})
			);
		}
	}

	public static async sendOnlineNotifications(controllers: Controller[]): Promise<void> {
		for (const controller of controllers) {
			await this.sendOnlineNotification(controller);
		}
	}

	public static async sendDownNotifications(controllers: Controller[]): Promise<void> {
		for (const controller of controllers) {
			await this.sendDownNotification(controller);
		}
	}
}
