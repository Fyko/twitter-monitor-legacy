import { Command } from 'discord-akairo';
import { Message, Permissions, TextChannel } from 'discord.js';

export default class InvitesCommand extends Command {
	public constructor() {
		super('feed-invite', {
			category: 'feeds',
			channel: 'guild',
			description: {
				content: 'Returns info on an existing feed.',
				usage: '<refID/channel ID>',
				examples: ['1', '#twitter-monitor'],
			},
			args: [
				{
					id: 'feed',
					type: 'textChannel',
					prompt: {
						start:
							'What feed would you toggle invite-pinging in? Please provide a valid channel ID or feed reference ID.',
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
		const it = !doc.invites;
		await this.client.settings.set('feed', { channelID: doc.channelID }, { invites: it });
		return msg.util?.reply(`successfully turned ${it ? '**on**' : '**off**'} Discord-invite pinging for that feed.`);
	}
}
