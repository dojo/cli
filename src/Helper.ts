import { CommandHelper, Helper } from './interfaces';
import { Yargs } from 'yargs';

export default class implements Helper {
	constructor(commandHelper: CommandHelper, yargs: Yargs, context: any) {
		this.commandHelper = commandHelper;
		this.yargs = yargs;
		this.context = context;
	};
	commandHelper: CommandHelper;
	yargs: Yargs;
	context: any;
}
