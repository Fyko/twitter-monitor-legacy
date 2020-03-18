import { Document, Schema, model } from 'mongoose';

export interface Guild extends Document {
	id: string;
	prefix: string;
	footerText: string;
	footerIcon: string;
	botMaster: string;
	ocr: boolean;
}

const Guild: Schema = new Schema(
	{
		id: String,
		prefix: {
			type: String,
			default: process.env.PREFIX,
		},
		footerText: {
			type: String,
			default: 'Powered by Sycer Development',
		},
		footerIcon: {
			type: String,
			default: '',
		},
		botMaster: String,
		ocr: {
			type: Boolean,
			default: false,
		},
	},
	{
		strict: false,
	},
);

export default model<Guild>('Guild', Guild);
