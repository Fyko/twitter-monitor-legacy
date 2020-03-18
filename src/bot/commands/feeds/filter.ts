import { Command } from 'discord-akairo';
import { Message, Permissions, TextChannel } from 'discord.js';

export default class FilterCommand extends Command {
	public constructor() {
		super('feed-filter', {
			category: 'feeds',
			channel: 'guild',
			description: {
				content: 'Toggles filtering for replies and retweets.',
				usage: '<refID/channel ID>',
				examples: ['1', '#twitter-monitor'],
			},
			args: [
				{
					id: 'feed',
					type: 'textChannel',
					prompt: {
						start:
							'What feed would you update filtering settings in? Please provide a valid channel ID or feed reference ID.',
						retry: 'Please provide a valid channel ID or feed reference ID.',
					},
				},
			],
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

	public async exec(msg: Message, { feed }: { feed: TextChannel }): Promise<Message | Message[] | undefined> {
		const doc = this.client.settings.cache.feeds.find(f => f.channelID === feed.id);
		if (!doc) return msg.util?.reply("I could't find a feed within that channel");
		const it = !doc.filter;
		await this.client.settings.set('feed', { channelID: doc.channelID }, { filter: it });
		return msg.util?.reply(
			`successfully turned ${it ? '**on**' : '**off**'} filtering for replies and retweets for that feed.`,
		);
	}
}
