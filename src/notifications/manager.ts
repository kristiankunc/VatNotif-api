import { normaliseCallsign } from "../lib/callsign";
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
		const controllerCache = new Map<string, Controller>();
		controllers.forEach((controllerStatus) => {
			controllerCache.set(controllerStatus.controller.callsign, controllerStatus.controller);
		});

		const watchers = new Map<Controller, number[]>();

		for (const controller of controllers) {
			let res = await prisma.$queryRaw`SELECT cid FROM WatchedCallsign WHERE ${normaliseCallsign(
				controller.controller.callsign
			)} LIKE callsign`;

			// @ts-ignore
			for (const watch of res) {
				if (!watchers.has(controller.controller)) watchers.set(controller.controller, []);
				watchers.get(controller.controller)?.push(watch.cid);
			}
		}

		const notifications: ControllerNotification[] = [];

		for (const controller of controllers) {
			if (!watchers.has(controller.controller)) continue;
			notifications.push({
				status: controller,
				watchers: watchers.get(controller.controller) || [],
			});
		}

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
