import { Command } from 'discord-akairo';
import { Message, Permissions, TextChannel } from 'discord.js';

export default class DeleteCommand extends Command {
	public constructor() {
		super('feed-delete', {
			category: 'feeds',
			channel: 'guild',
			description: {
				content: 'Deletes an existing feed.',
				usage: '<refID/channel ID>',
				examples: ['1', '#twitter-monitor'],
			},
			args: [
				{
					id: 'feed',
					type: 'textChannel',
					prompt: {
						start: 'What feed do you want to delete? Please provide a valid channel ID.',
						retry: 'Please provide a valid channel ID.',
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

		try {
			const hook = await this.client.fetchWebhook(doc.webhookID);
			if (hook) await hook.delete();
		} catch {}

		await this.client.settings.remove('feed', { channelID: doc.channelID });
		return msg.util?.reply('successfully deleted that feed.');
	}
}
