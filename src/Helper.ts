import { Yargs } from 'yargs';
import { CommandHelper, Helper as HelperInterface, ConfigurationHelper } from './interfaces';

/**
 * The Helper that is passed to each command's 'run' function. Provides
 * a 'context' object that can be used to share data between tasks and
 * a CommandHelper that allows tasks to 'run' and check the existance of
 * other tasks.
 */
class Helper implements HelperInterface {
	constructor(commandHelper: CommandHelper, yargs: Yargs, context: any, configuration: ConfigurationHelper) {
		this.command = commandHelper;
		this.yargs = yargs;
		this.context = context;
		this.configuration = configuration;
	};
	command: CommandHelper;
	yargs: Yargs;
	context: any;
	configuration: ConfigurationHelper;

	sandbox(groupName: string, commandName?: string): HelperInterface {
		return new Helper(
			this.command,
			this.yargs,
			this.context,
			this.configuration.sandbox(groupName, commandName)
		);
	}
}

export default Helper;
