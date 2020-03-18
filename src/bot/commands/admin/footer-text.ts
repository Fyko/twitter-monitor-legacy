import { Command } from 'discord-akairo';
import { Message, Permissions } from 'discord.js';

export default class FooterTextCommand extends Command {
	public constructor() {
		super('footer-text', {
			category: 'admin',
			channel: 'guild',
			args: [
				{
					id: 'text',
					type: 'string',
					match: 'rest',
					prompt: {
						start: 'What would you like to set the embed footer icon to?',
						retry: 'Please provide me with a valid image link or attachment.',
					},
				},
			],
			description: {
				content: 'Sets the text for the tweet-embed footer.',
				usage: '<text>',
				examples: ['Imagination Cooks ✨', ''],
			},
		});
	}

	// @ts-ignore
	public async userPermissions(msg: Message): Promise<'noPerms' | null> {
		const guild = this.client.settings.cache.guilds.get(msg.guild!.id);
		const botMaster = guild?.botMaster;
		const hasStaff =
			msg.member!.permissions.has(Permissions.FLAGS.MANAGE_GUILD) ||
			(botMaster && msg.member!.roles.cache.has(botMaster));
		if (!hasStaff) return 'noPerms';
		return null;
	}

	public async exec(msg: Message, { text }: { text: string }): Promise<Message | Message[] | void> {
		const guild = this.client.settings.cache.guilds.get(msg.guild!.id);
		const i = guild!.footerText || undefined;

		if (!i) {
			if (i) return msg.util?.reply(`the current footer text is \`${i}\`.`);
			return msg.util?.reply('there is no current embed footer-text.');
		}

		await this.client.settings.set('guild', { id: msg.guild!.id }, { footerText: text });

		return msg.util?.reply(`successfully set the embed footer-text to \`${text}\`.`);
	}
}
