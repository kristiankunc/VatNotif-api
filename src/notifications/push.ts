import { VAPIDKeys } from "../conf/push.js";
import { Database } from "../lib/database.js";
import { Controller } from "../types/controllers.js";
import webpush from "web-push";

webpush.setVapidDetails("mailto: kristian@kristn.co.uk", VAPIDKeys.publicKey, VAPIDKeys.privateKey);

export class PushNotifications {
	public static async sendOnlineNotification(controller: Controller, affectedCids: number[]): Promise<void> {
		const subscriptions = await Database.getPushFromCallsign(controller.callsign, affectedCids);

		for (const subscription of subscriptions) {
			webpush.sendNotification(
				subscription,
				JSON.stringify({
					title: "New VatNotif notification!",
					body: `🆙 Controller ${controller.name} (${controller.cid}) has logged on as ${controller.callsign}${
						controller.frequency !== "199.998" ? ` - ` + controller.frequency : ""
					}!`,
					icon: "https://vatnotif.kristn.co.uk/brand/logo.png",
					badge: "https://vatnotif.kristn.co.uk/brand/logo.png",
					image: "https://vatnotif.kristn.co.uk/brand/logo.png",
					vibrate: [100, 50, 100],
				})
			);
		}
	}

	public static async sendDownNotification(controller: Controller, affectedCids: number[]): Promise<void> {
		const subscriptions = await Database.getPushFromCallsign(controller.callsign, affectedCids);

		for (const subscription of subscriptions) {
			webpush.sendNotification(
				subscription,
				JSON.stringify({
					title: "New VatNotif notification!",
					body: `🔻 Controller ${controller.name} (${controller.cid}) has logged off from ${controller.callsign}!`,
					icon: "https://vatnotif.kristn.co.uk/brand/logo.png",
					badge: "https://vatnotif.kristn.co.uk/brand/logo.png",
					image: "https://vatnotif.kristn.co.uk/brand/logo.png",
					vibrate: [100, 50, 100],
				})
			);
		}
	}
}
