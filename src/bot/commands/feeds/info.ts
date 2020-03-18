import { Command } from 'discord-akairo';
import { Message, Permissions, TextChannel } from 'discord.js';

export default class InfoCommand extends Command {
	public constructor() {
		super('feed-info', {
			category: 'feeds',
			channel: 'guild',
			description: {
				content: 'Returns info on an existing feed.',
				usage: '<refID/channel ID>',
				examples: ['1', '#twitter-monitor'],
			},
			clientPermissions: [Permissions.FLAGS.EMBED_LINKS],
			args: [
				{
					id: 'feed',
					type: 'textChannel',
					prompt: {
						start: 'What feed would you like some info on? Please provide a valid channel ID or feed reference ID.',
						retry: 'Please provide a valid channel ID or feed reference ID.',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { feed }: { feed: TextChannel }): Promise<Message | Message[] | void> {
		const doc = this.client.settings.cache.feeds.find(f => f.channelID === feed.id);
		if (!doc) return msg.util?.reply("I could't find a feed within that channel");

		const accounts = await Promise.all(
			doc.accounts.map(async a => {
				const user = await this.client.monitor.getUserById(a)!;
				return `${user!.screen_name}`;
			}),
		);

		const chunks = this.chunkArray(accounts, 20);

		const embed = this.client.util
			.embed()
			.setColor(msg.guild?.me?.displayColor || this.client.config.color)
			.setAuthor(`Feed #${doc.refID}`, msg.guild!.iconURL()!)
			.addField(`Accounts (${doc.accounts.length})`, chunks[0].join(', ').substring(0, 1024) || '\u200b');
		if (chunks.length > 1) {
			const editedChunks = chunks.shift();
			if (editedChunks && editedChunks.length) {
				for (const c of chunks) embed.addField('Accounts cont.', c.join(', '));
			}
		}
		embed
			.addField('Discord Invite Pinging', doc.invites || false)
			.addField(
				'Keywords',
				doc.keywords
					.map(r => `\`${r}\``)
					.join(', ')
					.substring(0, 100) || '\u200b',
			)
			.setFooter('© Sycer Development');
		return msg.util?.send({ embed });
	}

	public chunkArray(myArray: string[], chunk_size: number): string[][] {
		let index = 0;
		const arrayLength = myArray.length;
		const tempArray = [];

		for (index = 0; index < arrayLength; index += chunk_size) {
			const myChunk = myArray.slice(index, index + chunk_size);
			tempArray.push(myChunk);
		}

		return tempArray;
	}
}
