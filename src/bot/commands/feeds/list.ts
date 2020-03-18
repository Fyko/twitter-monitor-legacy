import { oneLine } from 'common-tags';
import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, Permissions } from 'discord.js';

export default class DeleteCommand extends Command {
	public constructor() {
		super('feed-list', {
			category: 'feeds',
			channel: 'guild',
			aliases: ['feeds'],
			description: {
				content: 'Lists all current, ongoing feeds.',
			},
			clientPermissions: [Permissions.FLAGS.EMBED_LINKS],
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const prefix = (this.handler.prefix as PrefixSupplier)(msg);
		const feeds = this.client.settings.cache.feeds.filter(f => f.guildID === msg.guild!.id);
		if (!feeds.size)
			return msg.util?.reply(
				`you have no active feeds! You can learn how to make one with \`${(this.handler.prefix as PrefixSupplier)(
					msg,
				)}help feed\`.`,
			);
		const embed = this.client.util
			.embed()
			.setColor(msg.guild?.me?.displayColor || this.client.config.color)
			.setAuthor('Current Feeds', msg.guild!.iconURL() || this.client.user!.displayAvatarURL())
			.setFooter('© 2019 - Sycer Development');
		embed.setDescription(
			`${feeds
				.map(
					f => oneLine`[\`${f.refID}\`]. ${this.client.channels.cache.get(f.channelID) || '#deleted-channel'} - \`${
						f.accounts.length
					}\` Accounts
		`,
				)
				.join('\n')
				.substring(0, 2000)}\n\nIf you want more info on a specific feed, run \`${prefix}feed info #channel\`.`,
		);

		return msg.util?.send({ embed });
	}
}
