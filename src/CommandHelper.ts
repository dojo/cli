import * as yargs from 'yargs';
import { ConfigurationHelperFactory } from './configurationHelper';
import HelperFactory from './Helper';
import template from './template';
import { CommandHelper, GroupMap } from './interfaces';
import { getCommand } from './command';
import { builtInCommandValidation } from './commands/validate';

export type RenderFilesConfig = {
	src: string;
	dest: string;
}[];

/**
 * CommandHelper class which is passed into each command's run function
 * allowing commands to call one another. Provides 'run' and 'exists' functions
 */
export class SingleCommandHelper implements CommandHelper {
	private _groupMap: GroupMap;
	private _configurationFactory: ConfigurationHelperFactory;
	private _context: any;

	constructor(commandsMap: GroupMap, context: any, configurationHelperFactory: ConfigurationHelperFactory) {
		this._groupMap = commandsMap;
		this._context = context;
		this._configurationFactory = configurationHelperFactory;
	}

	renderFiles(renderFilesConfig: RenderFilesConfig, renderData: any) {
		renderFilesConfig.forEach(({ src, dest }) => {
			template(src, dest, renderData);
		});
	}

	run(group: string, commandName?: string, args?: yargs.Argv): Promise<any> {
		try {
			const command = getCommand(this._groupMap, group, commandName);
			if (command) {
				const validateHelper = { validate: builtInCommandValidation };
				const helper = new HelperFactory(
					this,
					yargs,
					this._context,
					this._configurationFactory,
					validateHelper
				);
				return command.run(helper.sandbox(group, command.name), args);
			} else {
				return Promise.reject(new Error('The command does not exist'));
			}
		} catch {
			return Promise.reject(new Error('The command does not exist'));
		}
	}

	exists(group: string, commandName?: string) {
		try {
			return !!getCommand(this._groupMap, group, commandName);
		} catch {
			return false;
		}
	}
}

export default SingleCommandHelper;
