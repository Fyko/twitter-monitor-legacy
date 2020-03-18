import { stripIndents } from 'common-tags';
import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, Permissions, TextChannel } from 'discord.js';

export default class NewCommand extends Command {
	public constructor() {
		super('feed-new', {
			category: 'feeds',
			channel: 'guild',
			aliases: ['new'],
			description: {
				content: 'Creates a new feed in the provided channel.',
				usage: '<channel>',
				examples: ['#twitter-monitor', 'project-destroyer'],
			},
			args: [
				{
					id: 'channel',
					type: 'textChannel',
					prompt: {
						start: 'In what channel would you like to create this new feed?',
						retry: "Please provide a valid channel for where you'd like to create this feed.",
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
			msg.member!.permissions.has(Permissions.FLAGS.EMBED_LINKS) ||
			(botMaster && msg.member!.roles.cache.has(botMaster));
		if (!hasStaff) return 'noPerms';
		return null;
	}

	public async exec(msg: Message, { channel }: { channel: TextChannel }): Promise<Message | Message[] | void> {
		const feedCount = this.client.settings.cache.feeds.filter(f => f.guildID === msg.guild!.id).size;
		if (feedCount >= 25) return msg.util?.reply("you've alread hit the max feed count of 25!");

		const existing = this.client.settings.cache.feeds.find(f => f.channelID === channel.id);
		if (existing)
			return msg.util?.reply(
				'there is a feed already running in that channel! Please provide a different channel to run it in.',
			);

		if (!channel.permissionsFor(this.client.user!)!.has(Permissions.FLAGS.MANAGE_WEBHOOKS))
			return msg.util?.send("I'm missing `Manage Webhooks` in that channel!");

		const hook = await channel.createWebhook(`Twitter Monitor`, {
			reason: `New feed creation by ${msg.author.tag}`,
			avatar: this.client.user?.displayAvatarURL(),
		});

		await this.client.settings.new('feed', {
			refID: `${this.client.settings.cache.feeds.size + 1}`,
			channelID: hook.channelID,
			guildID: msg.guild!.id,
			webhookID: hook.id,
			webhookToken: hook.token!,
			invites: false,
			accounts: [],
			keywords: [],
			role: undefined,
		});

		const prefix = (this.handler.prefix as PrefixSupplier)(msg);
		return msg.util?.reply(stripIndents`
			successfully created a new feed in ${channel}!

			You can add accounts with \`${prefix}feed account --add #${channel.name} <account>\`.
			You can add keywords with \`${prefix}feed keyword --add #${channel.name} <word>\`.
			You can toggle invite pinging with \`${prefix} feed invite\`.
			You can add a role to ping on keywords and sensed invites with \`${prefix} feed role <role>\`.
		`);
	}
}
