/* eslint-disable @typescript-eslint/no-namespace */
import { oneLine } from 'common-tags';
import { Util, WebhookClient } from 'discord.js';
import { Tesseract } from 'tesseract.ts';
import Twit, { Stream, Twitter } from 'twit';
import { Feed } from '../../database/models/Feed';
import { Guild } from '../../database/models/Guild';
import PiggyClient from '../client/MonitorClient';

declare module 'twit' {
	namespace Twitter {
		interface Status {
			extended_tweet: {
				full_text: string;
			};
		}
	}
}

export default class Monitor {
	protected client: PiggyClient;

	public stream!: Stream;

	protected interval!: NodeJS.Timeout;

	protected readonly twitter: Twit = new Twit({
		consumer_key: process.env.CONSUMER_KEY!,
		consumer_secret: process.env.CONSUMER_SECRET!,
		access_token: process.env.ACCESS_TOKEN!,
		access_token_secret: process.env.ACCESS_TOKEN_SECRET!,
	});

	public toFollow: string[] = [];

	public constructor(client: PiggyClient) {
		this.client = client;
	}

	public async handleTweet(tweet: Twitter.Status): Promise<void> {
		const feeds = this.client.settings.cache.feeds.filter(f => f.accounts.includes(tweet.user.id_str));
		for (const f of feeds.values()) {
			const guild = this.client.settings.cache.guilds.get(f.guildID)!;
			if (this.isReply(tweet) && feeds.filter) continue;
			if (!f.webhookID || !f.webhookToken) continue;
			if (guild.ocr && tweet.entities.media && tweet.entities.media.length) {
				for (const i of tweet.entities.media)
					this.handleOCR(
						f,
						i.media_url_https,
						guild,
						tweet.user.profile_image_url_https.replace(/_normal/gi, ''),
						tweet.user.name,
					);
			}
			if (f.invites) await this.checkInvites(tweet, f);
			if (f.keywords.length) await this.checkKeywords(tweet, f);
			const embed = this.client.util
				.embed()
				.setColor(this.client.config.color)
				.setFooter(guild.footerText, guild.footerIcon)
				.setAuthor(
					`New Tweet from ${tweet.user.name}!`,
					tweet.user.profile_image_url_https,
					`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
				)
				.setDescription(
					tweet.extended_tweet && tweet.extended_tweet.full_text ? tweet.extended_tweet.full_text : tweet.text,
				)
				.setImage(tweet.entities.media ? tweet.entities.media[0].media_url : '')
				.setTimestamp();
			if (tweet.entities.urls[0]) {
				embed.addField('Links', tweet.entities.urls.map(i => i.expanded_url).join('\n'), true);
			}
			if (tweet.entities.user_mentions[0]) {
				embed.addField(
					'Mentioned Users',
					tweet.entities.user_mentions
						.map(user => `[@${user.screen_name} - ${user.name}](https://twitter.com/${user.screen_name}/)`)
						.join('\n'),
					true,
				);
			}
			embed.addField(
				'Useful Info',
				oneLine`
				**[Profile](https://twitter.com/${tweet.user.screen_name}#${guild.id})** - 
				**[Tweet](https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}#${guild.id})** - 
				**[Following](https://twitter.com/${tweet.user.screen_name}/following#${guild.id})** - 
				**[Likes](https://twitter.com/${tweet.user.screen_name}/likes#${guild.id})** - 
			`,
			);
			const hook = this.createWebhook(f.webhookID, f.webhookToken);

			try {
				await hook.send({
					embeds: [embed],
					avatarURL: tweet.user.profile_image_url_https.replace(/_normal/gi, ''),
					username: tweet.user.name,
				});
				this.client.logger.verbose(`[MONITOR] Sent from ${tweet.user.name}.`);
			} catch (err) {
				this.handleWebhookError(err, hook);
				this.client.logger.error(err);
			}
		}
	}

	private async handleOCR(feed: Feed, link: string, guild: Guild, avatarURL: string, username: string): Promise<void> {
		const text = await this.recognizeImage(link);
		const embed = this.client.util
			.embed()
			.setColor(this.client.config.color)
			.setFooter(guild.footerText, guild.footerIcon)
			.setTimestamp()
			.setTitle('Optical Character Recognition Output 🔎')
			.setDescription('No text detected.');
		if (text) {
			const clean = Util.escapeMarkdown(text);
			embed.setDescription(clean);
		}
		const hook = this.createWebhook(feed.webhookID, feed.webhookToken);
		try {
			await hook.send({
				embeds: [embed],
				avatarURL,
				username,
			});
			this.client.logger.verbose(`[OCR] Processed OCR for from ${username}.`);
		} catch (err) {
			this.handleWebhookError(err, hook);
		}
	}

	public async checkInvites(tweet: Twitter.Status, feed: Feed): Promise<void> {
		this.client.logger.info('[MONITOR] Checking for Discord Invites!');
		const regex = /discord(?:app\.com\/invite|\.gg(?:\/invite)?)\/([\w-]{2,255})/i;
		if (!tweet.entities || !tweet.entities.urls.length || !tweet.entities.urls[0].expanded_url) return;
		const text = tweet.entities.urls[0].expanded_url
			? tweet.entities.urls[0].expanded_url
			: tweet.extended_tweet && tweet.extended_tweet.full_text
			? tweet.extended_tweet.full_text
			: tweet.text;
		if (!text) return;

		const match = regex.exec(text);
		if (!match || !match[0]) return;
		try {
			const hook = this.createWebhook(feed.webhookID, feed.webhookToken);
			const guild = this.client.guilds.cache.get(feed.guildID);
			if (!guild) return;
			const role = feed.role ? guild.roles.cache.get(feed.role) : null;
			if (role && !role.mentionable) {
				try {
					await role.setMentionable(true);
					await hook.send(`${role}, new tweet from ${tweet.user.name} contains a Discord invite link! ${match[0]}`, {
						avatarURL: tweet.user.profile_image_url_https,
						username: tweet.user.screen_name,
					});
					await role.setMentionable(false);
				} catch {}
			} else {
				hook
					.send(`${role}, new tweet from ${tweet.user.name} contains a Discord invite link! ${match[0]}`, {
						avatarURL: tweet.user.profile_image_url_https,
						username: tweet.user.screen_name,
					})
					.catch(e => this.handleWebhookError(e, hook));
			}
		} catch {}
	}

	public async checkKeywords(tweet: Twitter.Status, feed: Feed): Promise<void> {
		const text = this.tweetText(tweet).toLowerCase();
		const words = [];
		for (let w of feed.keywords) {
			if (!w) continue;
			w = w.toLowerCase();
			text.includes(w) ? words.push(w) : '';
		}
		if (!words.length) return;
		try {
			const hook = this.createWebhook(feed.webhookID, feed.webhookToken);
			const guild = this.client.guilds.cache.get(feed.guildID);
			if (!guild) return;
			const role = feed.role ? guild.roles.cache.get(feed.role) : null;
			if (role && !role.mentionable) {
				try {
					await role.setMentionable(true);
					await hook.send(
						`${role}, new tweet from ${tweet.user.name} contains ${words.length} keyword${
							words.length > 1 ? 's' : ''
						}: ${words.map(w => `${w}`).join(', ')}`,
						{
							avatarURL: tweet.user.profile_image_url_https,
							username: tweet.user.screen_name,
						},
					);
					await role.setMentionable(false);
				} catch {}
			} else {
				hook
					.send(
						`${role}, new tweet from ${tweet.user.name} contains ${words.length} keyword${
							words.length > 1 ? 's' : ''
						}: ${words.map(w => `${w}`).join(', ')}`,
						{
							avatarURL: tweet.user.profile_image_url_https,
							username: tweet.user.screen_name,
						},
					)
					.catch(e => this.handleWebhookError(e, hook));
			}
		} catch {}
	}

	private async recognizeImage(image: string): Promise<string> {
		const { text } = await Tesseract.recognize(image);
		return text;
	}

	public tweetText(tweet: Twitter.Status): string {
		const text = tweet.extended_tweet && tweet.extended_tweet.full_text ? tweet.extended_tweet.full_text : tweet.text;
		return text || 'No text provided.';
	}

	public isReply(tweet: Twitter.Status): boolean {
		return Boolean(
			tweet.retweeted_status ||
				tweet.in_reply_to_status_id ||
				tweet.in_reply_to_status_id_str ||
				tweet.in_reply_to_user_id ||
				tweet.in_reply_to_user_id_str ||
				tweet.in_reply_to_screen_name,
		);
	}

	public updateFollowing(): string[] {
		this.stream.stop();

		this.toFollow = [];
		this.client.settings.cache.feeds.array().forEach(u => {
			u.accounts.forEach(a => {
				if (!this.toFollow.includes(a)) this.toFollow.push(a);
			});
		});

		this.client.logger.verbose('[MONITOR] Updated stream following...');
		return this.toFollow;
	}

	public async update(): Promise<void> {
		this.client.logger.verbose('[MONITOR] Updating stream!');
		this.updateFollowing();
		this.createStream();
	}

	public async createStream(): Promise<void> {
		this.client.logger.verbose('[MONITOR] Loading monitor.');

		this.stream = this.twitter.stream('statuses/filter', { follow: this.toFollow });

		this.stream.on('tweet', (tweet: Twitter.Status) => {
			this.handleTweet(tweet);
		});

		this.stream.on('connect', () => this.client.logger.verbose('[MONITOR]: Connecting to Twitters API...'));
		this.stream.on('connected', () =>
			this.client.logger.verbose(
				`[MONITOR]: Successfully connected to Twitter API. Monitoring ${this.toFollow.length} accounts.`,
			),
		);
		this.stream.on('limit', (event: any) => this.client.logger.verbose(`[MONITOR]: Limit ${event}`));
		this.stream.on('warning', (warning: any) => this.client.logger.verbose(`[MONITOR]: Warning: ${warning}`));
		this.stream.on('error', (err: Error) => this.client.logger.error(`[MONITOR]: ${err}`));
	}

	public async getUser(account: string): Promise<Twitter.User | null> {
		const existing = this.client.settings.cache.users.find(u =>
			[u.id, u.user.screen_name, u.user.name].includes(account),
		);
		if (existing) {
			return existing.user;
		}

		try {
			const get = await this.twitter.get('users/show', { screen_name: account });
			if (get && get.data && get.resp.statusCode === 200) {
				const data = get.data as Twitter.User;
				await this.client.settings.new('user', { id: data.id_str, user: data });
				this.client.logger.verbose(`[GETUSER] Fetched and made new document for ${data.id_str}.`);
				return data;
			}
			this.client.logger.verbose(`[GETUSER]: Failed on request to Twitter API. Code: ${get.resp.statusCode}`);
		} catch (err) {
			this.client.logger.error(`[GETUSER]: ${err}`);
		}
		return null;
	}

	public async getUserById(id: string): Promise<Twitter.User | null> {
		const existing = this.client.settings.cache.users.find(u => u.id === id);
		if (existing) {
			return existing.user;
		}

		try {
			const get = await this.twitter.get('users/show', { id });
			if (get && get.data && get.resp.statusCode === 200) {
				const data = get.data as Twitter.User;
				await this.client.settings.new('user', { id: data.id_str, user: data });
				this.client.logger.verbose(`[GETUSERBYID] Fetched and made new document for ${data.id_str}.`);
				return data;
			}
			this.client.logger.verbose(`[GETUSERBYID]: Failed on request to Twitter API. Code: ${get.resp.statusCode}`);
		} catch (err) {
			this.client.logger.error(`[GETUSERBYID]: ${err}`);
			if (err.toString().includes('suspended')) this.handleSuspended(id);
		}
		return null;
	}

	private handleSuspended(id: string): void {
		this.client.logger.info(`[SUSPENDED]: ${id} has been suspended... Taking precautionary actions.`);
		const feeds = this.client.settings.cache.feeds.filter(f => f.accounts && f.accounts.includes(id));
		if (!feeds.size) return;
		for (const f of feeds.values()) {
			const index = f.accounts.indexOf(id);
			f.accounts.splice(index, 1);
			this.client.settings.set('feed', { _id: f._id }, { accounts: f.accounts });
			this.client.logger.verbose(`[SUSPENDED]: Removed ${id} from Feed ${f._id}`);
		}
	}

	private async handleWebhookError(err: Error, hook: WebhookClient): Promise<void> {
		if (err.message.includes('Unknown Webhook')) {
			this.client.logger.verbose(`[WEBHOOK]: Webhook ${hook.id} is returning unknown. Deleting all relevent feeds.`);
			const feeds = this.client.settings.cache.feeds.filter(f => f.webhookID === hook.id);
			if (!feeds.size) this.client.logger.verbose(`[WEBHOOK]: No relevent feeds found for unknown webhook ${hook.id}.`);
			await Promise.all(feeds.map(f => this.client.settings.remove('feed', { _id: f._id })));
			this.client.logger.verbose(`[WEBHOOK]: Removed ${feeds.size} feeds funneled to ${hook.id}.`);
		}
	}

	public createWebhook(id: string, token: string): WebhookClient {
		return new WebhookClient(id, token);
	}

	public async init(): Promise<void> {
		this.client.settings.cache.feeds.array().forEach(u => {
			u.accounts.forEach(a => {
				if (!this.toFollow.includes(a)) this.toFollow.push(a);
			});
		});

		await this.createStream();
		this.interval = this.client.setInterval(this.update.bind(this), 300000);
		this.client.logger.info('[MONITOR] Successfully booted monitor.');
	}
}
