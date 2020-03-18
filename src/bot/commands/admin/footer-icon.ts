import { Command } from 'discord-akairo';
import { Message, Permissions } from 'discord.js';
import path from 'path';

export default class FooterIconCommand extends Command {
	public constructor() {
		super('footer-icon', {
			category: 'admin',
			channel: 'guild',
			clientPermissions: [Permissions.FLAGS.EMBED_LINKS, Permissions.FLAGS.ATTACH_FILES],
			args: [
				{
					id: 'icon',
					type: msg => this.findAttachment(msg),
					prompt: {
						start: 'what would you like to set the embed footer icon to?',
						retry: 'please provide me with a valid image link or attachment.',
					},
				},
			],
			description: {
				content: 'Sets the icon for the tweet-embed footer.',
				usage: '<link>',
				examples: ['https://i.imgur.com/xyz', '*attaches image*', ''],
			},
		});
	}

	// @ts-ignore
	public async userPermissions(msg: Message): Promise<'noPerms' | null> {
		const guild = this.client.settings.cache.guilds.get(msg.guild!.id);
		const botMaster = guild?.botMaster;
		const hasStaff =
			msg.member!.permissions.has(Permissions.FLAGS.MANAGE_GUILD) ||
			(botMaster && msg.member!.roles.cache.has(botMaster));
		if (!hasStaff) return 'noPerms';
		return null;
	}

	public async exec(msg: Message, { icon }: { icon: string }): Promise<Message | Message[] | void> {
		const guild = this.client.settings.cache.guilds.get(msg.guild!.id);
		const i = guild!.footerIcon || undefined;

		if (!i) {
			if (i) return msg.util?.reply('this is the current embed footer-icon.', { files: [i] });
			return msg.util?.reply('there is no current embed footer-icon.');
		}

		await this.client.settings.set('guild', { id: msg.guild!.id }, { footerIcon: icon });

		return msg.util?.reply(`successfully set the embed color to this:`, { files: [icon] });
	}

	public findAttachment(msg: Message): string | undefined | null {
		let attachmentImage;
		const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
		const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|webp)/;

		const richEmbed = msg.embeds.find(
			embed => embed.type === 'rich' && embed.image && extensions.includes(path.extname(embed.image.url)),
		);
		if (richEmbed) {
			attachmentImage = richEmbed.image!.url;
		}

		const attachment = msg.attachments.find(file => extensions.includes(path.extname(file.url)));
		if (attachment) {
			attachmentImage = attachment.proxyURL;
		}

		if (!attachmentImage) {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const linkMatch = msg.content.match(linkRegex);
			if (linkMatch && extensions.includes(path.extname(linkMatch[0]))) {
				attachmentImage = linkMatch[0];
			}
		}

		return attachmentImage;
	}
}
