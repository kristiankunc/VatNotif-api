import { prisma } from "../lib/prisma";
import { ControllerNotification, NotificationService, NotificaionManager } from "./manager";

interface DiscordMessage {
	content: string;
	url: string;
}
export class DiscordNotifications extends NotificationService {
	public static async sendNotifications(controllers: ControllerNotification[]): Promise<void> {
		for (const controller of controllers) {
			for (const watcher of controller.watchers) {
				const message = await this.buildMessage(controller, watcher);
				if (!message) continue;
				await this.sendDiscordMessage(message, watcher);
			}
		}
	}

	private static async buildMessage(notification: ControllerNotification, watcher: number): Promise<DiscordMessage> {
		const messageFormats = await prisma.discord_notifications.findFirst({
			where: {
				cid: watcher,
			},
			select: {
				down_content: true,
				up_content: true,
				webhook_url: true,
			},
		});

		if (!messageFormats) return null as any;

		let content =
			notification.status.type === "down" ? messageFormats.down_content?.toString() || "" : messageFormats.up_content?.toString() || "";

		return {
			content: NotificaionManager.replaceVariables(content, notification.status.controller),
			url: messageFormats.webhook_url,
		};
	}

	private static async sendDiscordMessage(message: DiscordMessage, cid: number): Promise<void> {
		const res = await fetch(message.url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				content: message.content,
			}),
		});

		if (!res.ok) {
			console.error(`Failed to send discord message to ${cid}`);
		}
	}
}
