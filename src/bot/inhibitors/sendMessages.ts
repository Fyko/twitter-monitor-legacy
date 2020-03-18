import { Inhibitor } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';

export default class SendMessagesInhibtor extends Inhibitor {
	public constructor() {
		super('sendMessages', {
			reason: 'sendMessages',
		});
	}

	// @ts-ignore
	public exec(msg: Message): boolean {
		if (!msg.guild) return true;
		if (msg.channel instanceof TextChannel) return !msg.channel.permissionsFor(this.client.user!)!.has('SEND_MESSAGES');
	}
}
