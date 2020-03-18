import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { ColorResolvable, Message } from 'discord.js';
import { join } from 'path';
import { Logger } from 'winston';
import { logger } from '../util/logger';
import Monitor from '../structures/Monitor';
import { SettingsProvider } from '../../database';

declare module 'discord-akairo' {
	interface AkairoClient {
		logger: Logger;
		commandHandler: CommandHandler;
		config: ClientConfig;
		settings: SettingsProvider;
		monitor: Monitor;
	}
}

interface ClientConfig {
	token: string;
	owner: string | string[];
	color: ColorResolvable;
}

export default class PiggyClient extends AkairoClient {
	public constructor(config: ClientConfig) {
		super({
			messageCacheMaxSize: 25,
			messageCacheLifetime: 300,
			messageSweepInterval: 900,
			ownerID: config.owner,
		});

		this.config = config;

		this.on(
			'shardError',
			(err: Error, id: any): Logger => this.logger.error(`[SHARD ${id} ERROR] ${err.message}`, err.stack),
		).on('warn', (warn: any): Logger => this.logger.warn(`[CLIENT WARN] ${warn}`));
	}

	public logger: Logger = logger;

	public commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: (msg: Message): string => {
			if (msg.guild) {
				const doc = this.settings.cache.guilds.get(msg.guild.id);
				if (doc?.prefix) return doc.prefix;
			}
			return ';';
		},
		aliasReplacement: /-/g,
		allowMention: true,
		handleEdits: true,
		commandUtil: true,
		commandUtilLifetime: 3e5,
		defaultCooldown: 3000,
		argumentDefaults: {
			prompt: {
				modifyStart: (msg: Message, str: string) =>
					`${msg.author}, ${str}\n...or type \`cancel\` to cancel this command.`,
				modifyRetry: (msg: Message, str: string) =>
					`${msg.author}, ${str}\n... or type \`cancel\` to cancel this command.`,
				timeout: 'You took too long to respond - command timed out.',
				ended: 'Too many failed attempts - command cancelled.',
				cancel: 'If you say so - command cancelled.',
				retries: 3,
				time: 30000,
			},
			otherwise: '',
		},
	});

	public inhibitorHandler: InhibitorHandler = new InhibitorHandler(this, {
		directory: join(__dirname, '..', 'inhibitors'),
	});

	public listenerHandler: ListenerHandler = new ListenerHandler(this, {
		directory: join(__dirname, '..', 'listeners'),
	});

	public readonly monitor: Monitor = new Monitor(this);

	public readonly settings: SettingsProvider = new SettingsProvider(this);

	private async load(): Promise<this> {
		await this.settings.init();

		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			inhibitorHandler: this.inhibitorHandler,
			listenerHandler: this.listenerHandler,
		});
		this.commandHandler.loadAll();
		this.inhibitorHandler.loadAll();
		this.listenerHandler.loadAll();

		return this;
	}

	public async launch(): Promise<string> {
		await this.load();
		return this.login(this.config.token);
	}
}
