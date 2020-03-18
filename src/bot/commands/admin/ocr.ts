import { Command } from 'discord-akairo';
import { Message, Permissions } from 'discord.js';

export default class OCRCommand extends Command {
	public constructor() {
		super('ocr', {
			category: 'admin',
			aliases: ['ocr'],
			channel: 'guild',
			description: {
				content: 'Toggles the OCR.',
			},
		});
	}

	// @ts-ignore
	public userPermissions(msg: Message): 'noPerms' | null {
		const guild = this.client.settings.cache.guilds.get(msg.guild!.id);
		const botMaster = guild?.botMaster;
		const hasStaff =
			msg.member!.permissions.has(Permissions.FLAGS.MANAGE_GUILD) ||
			(botMaster && msg.member!.roles.cache.has(botMaster));
		if (!hasStaff) return 'noPerms';
		return null;
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const doc = this.client.settings.cache.guilds.get(msg.guild!.id)!;
		const ocr = !doc.ocr;
		await this.client.settings.set('guild', { id: doc.id }, { ocr });
		return msg.util?.reply(
			`successfully turned ${ocr ? '**on**' : '**off**'} the OCR (Optical Character Recognition).`,
		);
	}
}
