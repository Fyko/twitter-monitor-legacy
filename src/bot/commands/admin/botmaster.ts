import { Command } from 'discord-akairo';
import { Message, Role } from 'discord.js';

export default class BotMasterCommand extends Command {
	public constructor() {
		super('botmaster', {
			category: 'admin',
			channel: 'guild',
			aliases: ['botmaster', 'master', 'ruler'],
			args: [
				{
					id: 'role',
					type: 'role',
					prompt: {
						start: 'What would you like to set the bot master role to?',
						retry: 'I need a real role.',
						optional: true,
					},
				},
				{
					id: 'off',
					flag: ['--off', '-o'],
				},
			],
			description: {
				content: 'Sets the role that allows control over all commands.',
				usage: '[role] [--off]',
				examples: ['@Owner', 'Bot Master', '--off', ''],
			},
		});
	}

	// @ts-ignore
	public userPermissions(msg: Message): string | null {
		return msg.author.id === msg.guild!.ownerID ? null : 'notOwner';
	}

	public async exec(msg: Message, { role, off }: { role: Role; off: boolean }): Promise<Message | Message[] | void> {
		const guild = this.client.settings.cache.guilds.get(msg.guild!.id);
		const botMaster = guild!.botMaster || undefined;

		if (!off && !role) {
			if (botMaster && msg.guild!.roles.cache.get(botMaster))
				return msg.util?.reply(`the current bot master role is **${msg.guild!.roles.cache.get(botMaster)}**.`);
			return msg.util?.reply('there is no current bot master role.');
		}

		if (off) {
			await this.client.settings.set('guild', { id: msg.guild!.id }, { botMaster: undefined });
			return msg.util?.reply('successfully removed the bot master role.');
		}

		await this.client.settings.set('guild', { id: msg.guild!.id }, { botMaster: role.id });

		return msg.util?.reply(`successfully set the bot master role to **${role.name}**.`);
	}
}
