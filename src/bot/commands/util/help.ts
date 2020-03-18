import { stripIndents } from 'common-tags';
import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, Permissions } from 'discord.js';

export default class HelpCommand extends Command {
	public constructor() {
		super('help', {
			category: 'utilities',
			aliases: ['help'],
			description: {
				content: 'Displays all available commands or detailed info for a specific command.',
				usage: '[command]',
				examples: ['', 'botmaster', 'feed'],
			},
			clientPermissions: [Permissions.FLAGS.EMBED_LINKS],
			args: [
				{
					id: 'command',
					type: 'commandAlias',
					prompt: {
						start: 'Which command would you like more info on?',
						retry: 'Please provide a valid command.',
						optional: true,
					},
				},
			],
		});
	}

	public async exec(msg: Message, { command }: { command: undefined | Command }): Promise<Message | Message[] | void> {
		const prefix = (this.handler.prefix as PrefixSupplier)(msg);

		if (!command) {
			const embed = this.client.util
				.embed()
				.setColor(msg.guild?.me?.displayColor || this.client.config.color)
				.setTitle('Commands').setDescription(stripIndents`This is a list of the available commands.
                    For more info on a command, type \`${prefix}help <command>\`
                `);

			for (const category of this.handler.categories.values()) {
				if (category.id === 'owner') continue;
				embed.addField(
					`${category.id.replace(/(\b\w)/gi, lc => lc.toUpperCase())}`,
					`${category
						.filter(cmd => cmd.aliases.length > 0)
						.map(cmd => `\`${prefix}${cmd.aliases[0]}\``)
						.join(', ')}`,
				);
			}
			return msg.util?.send({ embed });
		}
		const embed = this.client.util
			.embed()
			.setColor(msg.guild?.me?.displayColor || this.client.config.color)
			.setTitle(`\`${command.aliases[0]} ${command.description.usage ? command.description.usage : ''}\``)
			.addField('❯  Description', command.description.content || '\u200b');

		if (command.aliases.length > 1)
			embed.addField('❯ Aliases', `\`${command.aliases.map(a => `\`${a}\``).join(', ')}\``);
		if (command.description.examples && command.description.examples.length)
			embed.addField(
				'❯ Examples',
				command.description.examples.map((e: string) => `${prefix}${command.aliases[0]}${e}`),
			);
		return msg.util?.send({ embed });
	}
}
