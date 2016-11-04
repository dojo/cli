import { Command } from './interfaces';
const cliui = require('cliui');

export interface CommandWrapper extends Command {
	name: string;
	group: string;
	path: string;
};

export type CommandsMap = Map<string, CommandWrapper>;

/**
 * Function to create a loader instance, this allows the config to be injected
 * @param: searchPrefix A string that tells the command loader how cli commands
 * will be named, ie.
 * 	'dojo-cli-' is the default meaning commands could be
 * 		- 'dojo-cli-build-webpack'
 * 		- 'dojo-cli-serve-dist'
 */
export function initCommandLoader(searchPrefix: string): (path: string) => CommandWrapper {
	const commandRegExp = new RegExp(`${searchPrefix}-(.*)-(.*)`);

	return function load(path: string): CommandWrapper {
		let module = require(path);

		if (module.__esModule && module.default) {
			module = module.default;
		}

		if (module.description && module.register && module.run) {
			const { description, register, run } = <Command> module;
			const [ , group, name] = <string[]> commandRegExp.exec(path);

			return {
				name,
				group,
				description,
				register,
				run,
				path
			};
		}
		else {
			throw new Error(`Path: ${path} returned module that does not satisfy the Command interface`);
		}
	};
}

export function getGroupDescription(commandNames: Set<string>, commands: CommandsMap): string {
	const numCommands = commandNames.size;
	if (numCommands > 1) {
		return getMultiCommandDescription(commandNames, commands);
	}
	else {
		const { description } = <CommandWrapper> commands.get(Array.from(commandNames.keys())[0]);
		return description;
	}
}

function getMultiCommandDescription(commandNames: Set<string>, commands: CommandsMap): string {
	const descriptions = Array.from(commandNames.keys(), (commandName) => {
		const { name, description } = (<CommandWrapper> commands.get(commandName));
		return `${name}  \t${description}`;
	});
	const ui = cliui({
		width: 80
	});
	ui.div(descriptions.join('\n'));
	return ui.toString();
}
