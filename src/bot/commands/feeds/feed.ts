import { stripIndents } from 'common-tags';
import { Command, Flag, PrefixSupplier } from 'discord-akairo';
import { Message } from 'discord.js';

export default class FeedCommand extends Command {
	public constructor() {
		super('feed', {
			category: 'feeds',
			aliases: ['feed', 'stream', 'f'],
			description: {
				content: stripIndents`
					Valid Methods:
					
					• account [--add/--del] <feedID/channel ID> <user>
					• delete <feedID/channel ID>
					• info <feedID/channel ID>
					• invite <true/false>
					• keywords [--add/--del] <feedID/channel ID> <word/phrase>
					• list
					• new <channel ID>

					Required: \`<>\` - Optional: \`[]\`
				`,
				usage: '<method> <...content>',
				examples: [
					'account --add #bots @FykoPK',
					'account --del #bots @FykoPK',
					'accounts #bots ',
					'delete #cyber',
					'filter #bots true',
					'filter #bots false',
					'info #twitter-monitor',
					'invite #bots true',
					'invite #bots false',
					'invite #bots',
					'keyword --add #pd restock',
					'keyword --del #sole-links https',
					'keyword --all restock',
					'keywords',
					'list',
					'new #twitter-monitor',
					'new 222086648706498562',
					'role #bots @Member',
					'role #bots(must provide a channel even for all) --all @Member',
				],
			},
			ratelimit: 2,
		});
	}

	public *args(): object {
		const method = yield {
			type: [
				['feed-account', 'account', 'accounts'],
				['feed-delete', 'delete', 'del'],
				['feed-filter', 'replies', 'reply', 'retweets', 'filter'],
				['feed-info', 'info', 'i'],
				['feed-invite', 'invites', 'invite'],
				['feed-keyword', 'keywords', 'keyword', 'kw'],
				['feed-list', 'list', 'show'],
				['feed-new', 'new', 'n'],
				['feed-role', 'role'],
			],
			otherwise: (msg: Message) => {
				return stripIndents`
					There's a lot to learn here pal.
					Use \`${(this.handler.prefix as PrefixSupplier)(msg)} help feed\` for more info.
				`;
			},
		};

		return Flag.continue(method);
	}
}
