import { Database } from "../lib/database.js";
import { Controller } from "../types/controllers.js";

export class DiscordNotifications {
	public static async sendOnlineNotification(controller: Controller): Promise<void> {
		const webhooks = await Database.getWebhooksFromCallsign(controller.callsign);

		for (const webhook of webhooks) {
			await fetch(webhook, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					content: null,
					embeds: [
						{
							title: "New VatNotif notification!",
							description: `🆙 Controller **${controller.name}** (${controller.cid}) has logged on as **${controller.callsign}**!`,
							color: 3319890,
							timestamp: new Date().toISOString(),
						},
					],
					username: "VatNotif",
					avatar_url: "https://vatnotif.kristn.co.uk/brand/logo.webp",
					attachments: [],
				}),
			});
		}
	}

	public static async sendDownNotification(controller: Controller): Promise<void> {
		const webhooks = await Database.getWebhooksFromCallsign(controller.callsign);

		for (const webhook of webhooks) {
			await fetch(webhook, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					content: null,
					embeds: [
						{
							title: "New VatNotif notification!",
							description: `🔻 Controller **${controller.name}** (${controller.cid}) has logged off from **${controller.callsign}**!`,
							color: 14298413,
							timestamp: new Date().toISOString(),
						},
					],
					username: "VatNotif",
					avatar_url: "https://vatnotif.kristn.co.uk/brand/logo.webp",
					attachments: [],
				}),
			});
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
