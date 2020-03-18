import { Listener } from 'discord-akairo';
import { Constants, Guild } from 'discord.js';

export default class GuildCreateListener extends Listener {
	public constructor() {
		super(Constants.Events.GUILD_CREATE, {
			category: 'client',
			emitter: 'client',
			event: Constants.Events.GUILD_CREATE,
		});
	}

	public async exec(guild: Guild): Promise<void> {
		if (!this.client.settings.cache.guilds.has(guild.id)) this.client.settings.new('guild', { id: guild.id });
		this.client.logger.info(`[NEW GUILD] Joined ${guild.name} with ${guild.memberCount} people.`);
	}
}
