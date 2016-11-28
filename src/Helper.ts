import { CommandHelper, Helper } from './interfaces';
import { Yargs } from 'yargs';
import { CommandsMap } from './command';

/**
 * The Helper that is passed to each command's 'run' function. Provides
 * a 'context' object that can be used to share data between tasks and
 * a CommandHelper that allows tasks to 'run' and check the existance of
 * other tasks.
 */
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
