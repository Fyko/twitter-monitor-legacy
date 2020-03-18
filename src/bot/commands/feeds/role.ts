import { Command } from 'discord-akairo';
import { Message, Permissions, Role, TextChannel } from 'discord.js';

export default class RoleCommand extends Command {
	public constructor() {
		super('feed-role', {
			category: 'feeds',
			channel: 'guild',
			description: {
				content: 'Sets a role for pinging on invite and keyword detection for a specified feed.',
				usage: '<channel/refID> <role>',
				examples: ['1 @member', '#pd member'],
			},
			args: [
				{
					id: 'feed',
					type: 'textChannel',
					prompt: {
						start:
							'What feed would you like to set the role for? Please provide a valid channel ID or feed reference ID.',
						retry: 'Please provide a valid channel ID or feed reference ID.',
					},
				},
				{
					id: 'role',
					type: 'role',
					prompt: {
						start: 'What role would you like to set for pinging on keyword or invite detection?',
						retry: 'Please provide a valid role mention, name, or ID.',
					},
				},
				{
					id: 'all',
					type: 'flag',
					flag: '--all',
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

	public async exec(
		msg: Message,
		{ feed, role, all }: { feed: TextChannel; role: Role; all: boolean },
	): Promise<Message | Message[] | void> {
		if (all) {
			const docs = this.client.settings.cache.feeds.filter(e => e.guildID === msg.guild!.id);
			if (!docs.size) return msg.util?.reply(`your server has no feeds!`);
			for (const d of docs.values()) await this.client.settings.set('feed', { _id: d._id }, { role: role.id });
			return msg.util?.send(`successfully set the role for ${docs.size} feeds.`);
		}

		const doc = this.client.settings.cache.feeds.find(f => f.channelID === feed.id);
		if (!doc) return msg.util?.reply("I could't find a feed within that channel.");
		this.client.settings.set('feed', { channelID: doc.channelID }, { role: role.id });
		return msg.util?.reply(`successfully set the role to **${role.name}**.`);
	}
}
