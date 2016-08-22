import { Command } from './interfaces';
const cliui = require('cliui');

export interface CommandWrapper extends Command {
	name: string;
	group: string;
};

export type CommandsMap = Map<string, CommandWrapper>;

let commandRegExp: RegExp;

export function setSearchPrefix(searchPrefix: string): void {
	commandRegExp = new RegExp(`${searchPrefix}-(.*)-(.*)`);
}

export function load(path: string): CommandWrapper {
	const { description, register, run } = <Command> require(path);
	const [ , group, name] = <string[]> commandRegExp.exec(path);

	return {
		name,
		group,
		description,
		register,
		run
	};
}

export function getGroupDescription(commandNames: string[], commands: CommandsMap): string {
	const numCommands = commandNames.length;
	if (numCommands > 1) {
		return getMultiCommandDescription(commandNames, commands);
	}
	else {
		const { description } = <CommandWrapper> commands.get(commandNames[0]);
		return description;
	}
}

function getMultiCommandDescription(commandNames: string[], commands: CommandsMap): string {
	const descriptions = commandNames.map((commandName) => {
		const { name, description } = (<CommandWrapper> commands.get(commandName));
		return `${name}  \t${description}`;
	});
	const ui = cliui({
		width: 80
	});
	ui.div(descriptions.join('\n'));
	return ui.toString();
}
