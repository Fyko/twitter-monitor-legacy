import MonitorClient from './bot';

new MonitorClient({
	token: process.env.TOKEN!,
	owner: process.env.OWNERS!.split(','),
	color: process.env.COLOR!,
}).launch();
