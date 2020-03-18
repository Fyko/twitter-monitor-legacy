import { stripIndents } from 'common-tags';
import { Command, Flag, PrefixSupplier } from 'discord-akairo';
import { Message } from 'discord.js';

export default class FooterCommand extends Command {
	public constructor() {
		super('footer', {
			category: 'admin',
			aliases: ['footer', 'foot'],
			description: {
				content: stripIndents`
					Valid Methods:

					• icon <image url>
					• text <text>

					Required: \`<>\` - Optional: \`[]\`
				`,
				usage: '<method> <...content>',
				examples: ['icon', 'icon https://i.imgur.com/xyz', 'text', 'text Imagination Cooks ✨'],
			},
		});
	}

	public *args(): object {
		const method = yield {
			type: [
				['footer-icon', 'icon', 'i'],
				['footer-text', 'text', 't'],
			],
			otherwise: (msg: Message) => {
				return stripIndents`
					There's a lot to learn here pal.
					Use \`${(this.handler.prefix as PrefixSupplier)(msg)} help footer\` for more info.
				`;
			},
		};

		return Flag.continue(method);
	}
}
