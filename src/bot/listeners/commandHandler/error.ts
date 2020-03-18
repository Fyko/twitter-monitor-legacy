import { Listener } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';

export default class ErrorHandler extends Listener {
	public constructor() {
		super('error', {
			emitter: 'commandHandler',
			event: 'error',
			category: 'commandHandler',
		});
	}

	public exec(err: Error, msg: Message): this {
		this.client.logger.error(`[COMMAND ERROR] ${err.stack}`);
		const channel = msg.channel as TextChannel;
		if (msg.guild ? channel.permissionsFor(this.client.user!)!.has('SEND_MESSAGES') : true) {
			msg.channel.send(['An error occured:', '```js', err.toString(), '```']);
		}

		return this;
	}
}
