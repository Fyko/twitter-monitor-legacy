import { Listener } from 'discord-akairo';
import { Constants, Guild } from 'discord.js';

export default class ReadyListener extends Listener {
	public constructor() {
		super(Constants.Events.CLIENT_READY, {
			category: 'client',
			emitter: 'client',
			event: Constants.Events.CLIENT_READY,
		});
	}

	public async exec(): Promise<void> {
		this.client.logger.info(`[READY] ${this.client.user!.tag} is ready to forward some tweets!`);
		this.client.monitor.init();

		for (const [id] of this.client.guilds.cache) {
			const doc = this.client.settings.cache.guilds.get(id);
			if (!doc) this.client.settings.new('guild', { id });
		}

		setInterval(() => this._clearPresences(), 9e5);
	}

	private _clearPresences(): void {
		const i = this.client.guilds.cache.reduce((acc: number, g: Guild): number => {
			acc += g.presences.cache.size;
			g.presences.cache.clear();
			return acc;
		}, 0);
		this.client.emit('debug', `[PRESNCES]: Swept ${i} presences in ${this.client.guilds.cache.size} guilds.`);
	}
}
