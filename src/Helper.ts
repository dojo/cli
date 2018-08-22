import { Argv } from 'yargs';
import { ConfigurationHelperFactory } from './configurationHelper';
import { CommandHelper, Helper, ValidateHelper } from './interfaces';

/**
 * The Helper that is passed to each command's 'run' function. Provides
 * a 'context' object that can be used to share data between tasks and
 * a CommandHelper that allows tasks to 'run' and check the existance of
 * other tasks.
 */
export class HelperFactory {
	constructor(
		commandHelper: CommandHelper,
		yargs: Argv,
		context: any,
		configurationFactory: ConfigurationHelperFactory,
		validate: ValidateHelper
	) {
		this.command = commandHelper;
		this.yargs = yargs;
		this.context = context;
		this.configurationFactory = configurationFactory;
		this.validate = validate;
	}
	command: CommandHelper;
	yargs: Argv;
	context: any;
	configurationFactory: ConfigurationHelperFactory;
	validate: ValidateHelper;

	sandbox(groupName: string, commandName?: string): Helper {
		return {
			command: this.command,
			yargs: this.yargs,
			context: this.context,
			configuration: this.configurationFactory.sandbox(groupName, commandName),
			validation: this.validate
		};
	}
}

export default HelperFactory;
