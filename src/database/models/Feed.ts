import { Document, Schema, model } from 'mongoose';

export interface Feed extends Document {
	refID: string;
	channelID: string;
	guildID: string;
	webhookID: string;
	webhookToken: string;
	invites: boolean;
	accounts: string[];
	keywords: string[];
	role: string;
	filter: boolean;
}

const Feed: Schema = new Schema(
	{
		refID: String,
		channelID: String,
		guildID: String,
		webhookID: String,
		webhookToken: String,
		invites: Boolean,
		accounts: Array,
		keywords: Array,
		role: String,
		filter: Boolean,
	},
	{
		strict: false,
	},
);

export default model<Feed>('Feed', Feed);
