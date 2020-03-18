import { Command } from 'discord-akairo';
import { Message, TextChannel, Permissions } from 'discord.js';

export default class AccountCommand extends Command {
	public constructor() {
		super('feed-account', {
			category: 'feeds',
			channel: 'guild',
			description: {
				content: 'Adds or removes an account to an existing feed.',
				usage: '<refID/channel ID> <--add/--del> <account>',
				examples: ['1 --add @SycerDev', '#twitter-monitor --del example'],
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
		const feed = yield {
			type: 'textChannel',
			prompt: {
				start: 'What feed do you want to add this account to? Please provide a valid channel.',
				retry: 'Please provide a valid channel.',
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

		const account = yield add
			? {
					match: 'rest',
					type: 'string',
					prompt: {
						start: "What is the Twitter user you'd like to add to this feed?",
						retry: "Please provide a valid Twitter user that you'd like to add.",
					},
			  }
			: {
					match: 'rest',
					type: 'string',
					prompt: {
						start: "What is the Twitter user you'd like to remove from feed?",
						retry: "Please provide a valid Twitter user that you'd like to remove.",
					},
			  };

		return { feed, add, del, account };
	}

	public async exec(
		msg: Message,
		{ feed, add, del, account }: { feed: TextChannel; add: boolean; del: boolean; account: string },
	): Promise<Message | Message[] | undefined> {
		const doc = this.client.settings.cache.feeds.find(f => f.channelID === feed.id);
		if (!doc) return msg.util?.reply("I could't find a feed within that channel");
		if (!add && !del) return msg.util?.reply('you must supply a `--add` or `--del` flag.');

		try {
			const user = await this.client.monitor.getUser(account);
			if (!user)
				return msg.util?.reply(
					"I couldn't find that user and/or we can't fetch that user because Twitter is ratelimiting us 😠!",
				);

			if (add) doc.accounts.push(user.id_str);
			else if (del) {
				const index = doc.accounts.indexOf(user.id_str);
				doc.accounts.splice(index, 1);
			} else return msg.util?.reply('you must supply a `--add` or `--del` flag.');

			await this.client.settings.set('feed', { _id: doc._id }, { accounts: doc.accounts });
			return msg.util?.reply(
				`successfully ${add ? `**added** ${user.name} to` : `**removed** ${user.name} from`} that feed.`,
			);
		} catch (err) {
			return msg.util?.reply(`an error occured when searching for that user: \`${err}\`.`);
		}
	}
}
