import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { stripIndents } from 'common-tags';

export default class PingCommand extends Command {
	public constructor() {
		super('ping', {
			aliases: ['ping', 'latency', 'test'],
			description: {
				content: "Checks the bot's ping to Discord.",
			},
			category: 'utilities',
		});
	}

	public async exec(msg: Message): Promise<Message | Message[]> {
		const message = await msg.channel.send('Ping?');
		const ping = Math.round(message.createdTimestamp - msg.createdTimestamp);
		return message.edit(stripIndents`
			Message Edit Time: \`${ping}\`ms
			API Heartbeat: \`${this.client.ws.ping.toFixed()}\`ms
		`);
	}
}
