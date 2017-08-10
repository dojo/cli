import { Argv } from 'yargs';
import { ConfigurationHelperFactory } from './configurationHelper';
import { CommandHelper, Helper } from '@dojo/interfaces/cli';

/**
 * The Helper that is passed to each command's 'run' function. Provides
 * a 'context' object that can be used to share data between tasks and
 * a CommandHelper that allows tasks to 'run' and check the existance of
 * other tasks.
 */
export class HelperFactory {
	constructor(commandHelper: CommandHelper, yargs: Argv, context: any, configurationFactory: ConfigurationHelperFactory) {
		this.command = commandHelper;
		this.yargs = yargs;
		this.context = context;
		this.configurationFactory = configurationFactory;
	};
	command: CommandHelper;
	yargs: Argv;
	context: any;
	configurationFactory: ConfigurationHelperFactory;

	sandbox(groupName: string, commandName?: string): Helper {
		return {
			command: this.command,
			yargs: this.yargs,
			context: this.context,
			configuration: this.configurationFactory.sandbox(groupName, commandName)
		};
	}
}

export default HelperFactory;
