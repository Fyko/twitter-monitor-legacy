import PiggyClient from './bot';

new PiggyClient({
	token: process.env.TOKEN!,
	owner: process.env.OWNERS!.split(','),
	color: process.env.COLOR!,
}).launch();
