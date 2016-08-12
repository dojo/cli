import { verbose } from './logger';
import config from './config';
import { command } from 'yargs';

export type CommandConfig = {
	type: string;
	subType: string;
	name: string;
	description: string;
	register: Function;
	run: Function;
}

export type CommandsMap = Map<string, CommandConfig[]>;

export type CommandSet = Set<string>;

const commandRegExp = new RegExp(`${config.searchPrefix}-(.*)-(.*)`);

export function load(path: string, commandSet: CommandSet): CommandConfig {
	verbose(`command:load - path: ${path}`);
	const { description, register, run } = require(path);
	const pluginParts = commandRegExp.exec(path);
	const type = pluginParts[1];
	const subType = pluginParts[2];

	let computedName = subType;
	let count = 1;

	while (commandSet.has(computedName)) {
		computedName = `${computedName}-${count}`;
		count++;
	}
	commandSet.add(computedName);

	return {
		type,
		subType,
		name: computedName,
		description,
		register,
		run
	};
}

export function getDescription(commandType: string, commandSubTypes: CommandConfig[]): string {
	return commandSubTypes.length > 1 ?
		`There are ${commandSubTypes.length} ${commandType} commands: ${commandSubTypes.map((commandSubType: CommandConfig) => commandSubType.name).join(', ')}` :
		commandSubTypes[0].description;
}

export function register(commandsMap: CommandsMap): void {
	for (let [ commandType, commandSubTypes ] of commandsMap.entries()) {
		verbose(`index:registerCommand - commandType: ${commandType}, commandSubTypes: ${JSON.stringify(commandSubTypes)}`);
		const description = getDescription(commandType, commandSubTypes);

		command(commandType, description, (yargs) => {
			commandSubTypes.map(({ name, description, register, run }) => command.apply(null, [ name, description, register, run ]));
			return yargs;
		});
	}
}
