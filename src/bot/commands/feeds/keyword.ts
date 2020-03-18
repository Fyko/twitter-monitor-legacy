import { Command } from 'discord-akairo';
import { Message, TextChannel, Permissions } from 'discord.js';

export default class KeywordCommand extends Command {
	public constructor() {
		super('feed-keyword', {
			category: 'feeds',
			channel: 'guild',
			description: {
				content: 'Adds or removes a keyword to an existing feed.',
				usage: '<refID/channel ID> <--add/--del> <word>',
				examples: ['1 --add restock', '#twitter-monitor restock --del'],
			},
			flags: ['--add', '--del'],
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

	public *args(): object {
		const all = yield {
			match: 'flag',
			flag: '--all',
		};

		const feed = yield all
			? {}
			: {
					type: 'textChannel',
					prompt: {
						start:
							'What feed do you want to add this keyword to? Please provide a valid channel ID or feed reference ID.',
						retry: 'Please provide a valid channel ID or feed reference ID.',
					},
			  };

		const add = yield {
			match: 'flag',
			flag: '--add',
		};

		const del = yield {
			match: 'flag',
			flag: '--del',
		};

		const word = yield all
			? {}
			: add
			? {
					match: 'rest',
					type: 'string',
					prompt: {
						start: "What is the keyword you'd like to add to this feed?",
						retry: "Please provide a valid Twitter user that you'd like to add.",
					},
			  }
			: {
					match: 'rest',
					type: 'string',
					prompt: {
						start: "What is the keyword you'd like to remove from this feed?",
						retry: "Please provide a valid Twitter user that you'd like to remove.",
					},
			  };

		return { feed, add, del, all, word };
	}

	public async exec(
		msg: Message,
		{ feed, add, del, all, word }: { feed: TextChannel; add: boolean; del: boolean; all: boolean; word: string },
	): Promise<Message | Message[] | void> {
		word = word.toLowerCase();

		if (all) {
			const docs = this.client.settings.cache.feeds.filter(e => e.guildID === msg.guild!.id);
			if (!docs.size) return msg.util?.reply(`your server has no feeds!`);
			if (add) {
				for (const d of docs.values()) {
					const { keywords } = d;
					keywords.push(word);
					await this.client.settings.set('feed', { _id: d._id }, { keywords });
					return msg.util?.reply(`successfully added ${word} to \`${docs.size}\` feeds.`);
				}
			} else if (del) {
				for (const d of docs.values()) {
					const { keywords } = d;
					if (!keywords.includes(word)) continue;
					const index = keywords.indexOf(word);
					keywords.splice(index, 1);
					await this.client.settings.set('feed', { _id: d._id }, { keywords });
					return msg.util?.reply(`successfully removed ${word} from \`${docs.size}\` feeds.`);
				}
			}
			return msg.util?.send(`you must also provide an \`--add\` or \`--del\` flag.`);
		}

		const doc = this.client.settings.cache.feeds.find(f => f.channelID === feed.id);
		if (!doc) return msg.util?.reply("I could't find a feed within that channel");

		if (add) doc.keywords.push(word);
		else if (del) {
			const index = doc.keywords.indexOf(word);
			doc.keywords.splice(index, 1);
		} else return msg.util?.send('You must supply a `--add` or `--del`.');

		await this.client.settings.set('feed', { channelID: doc.channelID }, { keywords: doc.keywords });
		return msg.util?.reply(`successfully ${add ? `**added** ${word} to` : `**removed** ${word} from`} that feed.`);
	}
}
