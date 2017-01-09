import { CommandsMap } from './command';
import { CommandHelper, Command } from './interfaces';
import Helper from './Helper';
import ConfigurationHelper from './ConfigurationHelper';
import * as yargs from 'yargs';

function getCommand(commandsMap: CommandsMap, group: string, commandName?: string): Command | undefined {
	const commandKey = commandName ? `${group}-${commandName}` : group;
	return commandsMap.get(commandKey);
}

/**
 * CommandHelper class which is passed into each command's run function
 * allowing commands to call one another. Provides 'run' and 'exists' functions
 */
export default class implements CommandHelper {
	constructor(commandsMap: CommandsMap, context: any) {
		this.commandsMap = commandsMap;
		this.context = context;
		this.configuration = new ConfigurationHelper();
	};
	private commandsMap: CommandsMap;
	private context: any;
	private configuration: ConfigurationHelper;
	run(group: string, commandName?: string, args?: yargs.Argv): Promise<any> {
		const command = getCommand(this.commandsMap, group, commandName);
		if (command) {
			const helper = new Helper(this, yargs, this.context, this.configuration);
			return command.run(helper, args);
		}
		else {
			return Promise.reject(new Error('The command does not exist'));
		}
	};
	exists(group: string, commandName?: string) {
		const command = getCommand(this.commandsMap, group, commandName);
		return !!command;
	};
}
