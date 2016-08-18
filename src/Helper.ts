import { CommandHelper, Helper } from './interfaces';
import { Yargs } from 'yargs';

export default class implements Helper {
	constructor(commandHelper: CommandHelper, yargs: Yargs, context: any) {
		this.command = commandHelper;
		this.yargs = yargs;
		this.context = context;
	};
	command: CommandHelper;
	yargs: Yargs;
	context: any;
}
