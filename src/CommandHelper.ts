import * as yargs from 'yargs';
import { ConfigurationHelperFactory } from './configurationHelper';
import HelperFactory from './Helper';
import template from './template';
import { CommandHelper, Command, CommandsMap } from './interfaces';

function getCommand(commandsMap: CommandsMap, group: string, commandName?: string): Command | undefined {
	const commandKey = commandName ? `${group}-${commandName}` : group;
	return commandsMap.get(commandKey);
}

export type RenderFilesConfig = {
	src: string;
	dest: string;
}[];

/**
 * CommandHelper class which is passed into each command's run function
 * allowing commands to call one another. Provides 'run' and 'exists' functions
 */
export class SingleCommandHelper implements CommandHelper {
	private _commandsMap: CommandsMap;
	private _configurationFactory: ConfigurationHelperFactory;
	private _context: any;

	constructor(commandsMap: CommandsMap, context: any, configurationHelperFactory: ConfigurationHelperFactory) {
		this._commandsMap = commandsMap;
		this._context = context;
		this._configurationFactory = configurationHelperFactory;
	}

	renderFiles(renderFilesConfig: RenderFilesConfig, renderData: any) {
		renderFilesConfig.forEach(({ src, dest }) => {
			template(src, dest, renderData);
		});
	}

	run(group: string, commandName?: string, args?: yargs.Argv): Promise<any> {
		const command = getCommand(this._commandsMap, group, commandName);
		if (command) {
			const helper = new HelperFactory(this, yargs, this._context, this._configurationFactory);
			return command.run(helper.sandbox(group, command.name), args);
		}
		else {
			return Promise.reject(new Error('The command does not exist'));
		}
	}

	exists(group: string, commandName?: string) {
		const command = getCommand(this._commandsMap, group, commandName);
		return !!command;
	}
}

export default SingleCommandHelper;
