import { Document, Schema, model } from 'mongoose';
import { Twitter } from 'twit';

export interface User extends Document {
	id: string;
	user: Twitter.User;
}

const User: Schema = new Schema(
	{
		id: String,
		user: Object,
	},
	{
		strict: false,
	},
);

export default model<User>('User', User);
