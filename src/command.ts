import config from './config';
import { Command } from './interfaces';

export interface CommandWrapper extends Command {
	name: string;
	group: string;
};

export type CommandsMap = Map<string, CommandWrapper>;

const commandRegExp = new RegExp(`${config.searchPrefix}-(.*)-(.*)`);

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

export function getGroupDescription(group: string, commands: CommandsMap): string {
	const commandNames: string[] = Array.from(commands.keys());
	const numCommands = commandNames.length;
	if (numCommands > 1) {
		return `There are ${numCommands} ${group} commands: ${commandNames.join(', ')}`;
	} else {
		const { description } = <CommandWrapper> commands.get(commandNames[0]);
		return description;
	}
}
