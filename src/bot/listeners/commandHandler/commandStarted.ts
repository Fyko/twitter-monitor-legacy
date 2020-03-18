import { Listener, Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class CommandStartedListener extends Listener {
	public constructor() {
		super('commandStarted', {
			emitter: 'commandHandler',
			event: 'commandStarted',
			category: 'commandHandler',
		});
	}

	public exec(msg: Message, command: Command): void {
		if (msg.util!.parsed!.command) return;
		const tag = msg.guild ? msg.guild.name : `${msg.author.tag}/PM`;
		this.client.logger.info(`[COMMAND] ${command.id} - ${tag}`);
	}
}
