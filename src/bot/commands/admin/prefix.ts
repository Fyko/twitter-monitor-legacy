import { Argument, Command, PrefixSupplier } from 'discord-akairo';
import { Message, Permissions } from 'discord.js';

export default class PrefixCommand extends Command {
	public constructor() {
		super('prefix', {
			category: 'admin',
			channel: 'guild',
			aliases: ['prefix'],
			args: [
				{
					id: 'prefix',
					type: Argument.validate('string', (_, p) => !/\s/.test(p) && p.length <= 10),
					prompt: {
						start: 'What do you want to set the prefix to?',
						retry: "C'mon. I need a prefix without spaces and less than 10 characters",
					},
				},
			],
			userPermissions: [Permissions.FLAGS.MANAGE_GUILD],
			description: {
				content: "Changes or displays this server's prefix.",
				usage: '[prefix]',
				examples: ['', '?', '>'],
			},
		});
	}

	public async exec(msg: Message, { prefix }: { prefix: string }): Promise<Message | Message[] | void> {
		if (!prefix) return msg.util?.reply(`the current prefix is \`${(this.handler.prefix as PrefixSupplier)(msg)}\`.`);

		await this.client.settings.set('guild', { id: msg.guild!.id }, { prefix });
		return msg.util?.reply(`successfully set the prefix to \`${prefix}\`.`);
	}
}
