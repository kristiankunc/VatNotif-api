import { DiscordEmbed } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ControllerNotification, NotificationService, NotificaionManager } from "./manager";
import { logger } from "../lib/logger";

interface JSONEmbed {
	content: null;
	embeds: [
		{
			title: string;
			description: string;
			color: number;
			timestamp: string;
		}
	];
	username: string;
	avatar_url: string;
	attachments: [];
}
export class DiscordNotifications extends NotificationService {
	public static async sendNotifications(controllers: ControllerNotification[]): Promise<void> {
		for (const controller of controllers) {
			logger.info(
				`Sending Discord notifications for ${controller.status.controller.callsign}, total of ${controller.watchers.length} watchers`
			);
			for (const watcher of controller.watchers) {
				const message = await DiscordNotifications.buildMessage(controller, watcher);
				if (!message) continue;
				await DiscordNotifications.sendDiscordMessage(message, watcher);
			}
		}
	}

	private static async buildMessage(notification: ControllerNotification, watcher: number): Promise<{ url: string; data: JSONEmbed } | null> {
		const embed = await prisma.discordEmbed.findFirst({
			where: {
				cid: watcher,
				event: notification.status.type,
				enabled: true,
			},
		});

		if (!embed) return null;

		return {
			url: embed.url,
			data: {
				content: null,
				embeds: [
					{
						title: NotificaionManager.replaceVariables(embed.title, notification.status.controller),
						description: NotificaionManager.replaceVariables(embed.text, notification.status.controller),
						color: parseInt(embed.color.slice(1), 16),
						timestamp: new Date().toISOString(),
					},
				],
				username: embed.author,
				avatar_url: embed.avatar,
				attachments: [],
			},
		};
	}

	private static async sendDiscordMessage(message: { url: string; data: JSONEmbed }, cid: number): Promise<void> {
		const res = await fetch(message.url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message.data),
		});

		if (!res.ok) {
			logger.error(`Failed to send discord message to ${cid}`, res.status);
		}
	}
}
