import { prisma } from "../lib/prisma";
import { Controller } from "../lib/vatsim";

export interface ControllerStatus {
	controller: Controller;
	type: "up" | "down";
}
export interface ControllerNotification {
	status: ControllerStatus;
	watchers: number[];
}

export abstract class NotificationService {
	public static sendNotifications(controllers: ControllerNotification[]): Promise<void> {
		throw new Error("Method not implemented.");
	}
}

export class NotificaionManager {
	public static notificationCallbacks: ((controllers: ControllerNotification[]) => Promise<void>)[] = [];

	private static async getNotifications(controllers: ControllerStatus[]): Promise<ControllerNotification[]> {
		const controllerCace = new Map<string, Controller>();
		controllers.forEach((controllerStatus) => {
			controllerCace.set(controllerStatus.controller.callsign, controllerStatus.controller);
		});

		const watchers = new Map<Controller, number[]>();

		const watchingPairs = await prisma.watchedCallsign.findMany({
			where: {
				callsign: {
					in: Array.from(controllerCace.keys()),
				},
			},
			select: {
				callsign: true,
				cid: true,
			},
		});
		watchingPairs.forEach((pair) => {
			const controller = controllerCace.get(pair.callsign);
			if (controller) {
				if (!watchers.has(controller)) {
					watchers.set(controller, []);
				}
				watchers.get(controller)?.push(pair.cid);
			}
		});

		const notifications: ControllerNotification[] = [];

		controllers.forEach((controllerStatus) => {
			const controller = controllerStatus.controller;
			const watcherCids = watchers.get(controller) ?? [];
			notifications.push({
				status: controllerStatus,
				watchers: watcherCids,
			});
		});

		return notifications;
	}

	public static async sendNotifications(controllers: ControllerStatus[]): Promise<void> {
		const notifications = await this.getNotifications(controllers);
		for (const sendNotification of this.notificationCallbacks) {
			await sendNotification(notifications);
		}
	}

	public static replaceVariables(content: string, controller: Controller): string {
		content = content.replace("{cid}", controller.cid.toString());
		content = content.replace("{name}", controller.name);
		content = content.replace("{callsign}", controller.callsign);
		content = content.replace("{frequency}", controller.frequency);

		return content;
	}
}
