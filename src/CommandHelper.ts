import { GroupsMap, CommandsMap } from './command';
import { CommandHelper, RunResult, Command } from './interfaces';
import Helper from './Helper';
import * as yargs from 'yargs';

function getCommand(groupsMap: GroupsMap, group: string, commandName?: string): Command | undefined {
	const commandsMap: CommandsMap | undefined = groupsMap.get(group);
	if (commandsMap) {
		if (commandName) {
			return commandsMap.get(commandName);
		}
		else if (commandsMap.size === 1) {
			return Array.from(commandsMap.values())[0];
		}
	}
	else {
		return undefined;
	}
}

export default class implements CommandHelper {
	constructor(groupsMap: GroupsMap, context: any) {
		this.groupsMap = groupsMap;
		this.context = context;
	};
	groupsMap: GroupsMap;
	readonly context: any;
	run(group: string, commandName?: string, args?: yargs.Argv): Promise<RunResult> {
		const command = getCommand(this.groupsMap, group, commandName);
		if (command) {
			return command.run(new Helper(this, yargs, this.context));
		}
		else {
			return Promise.reject(new Error('The command does not exist'));
		}
	};
	exists(group: string, commandName?: string) {
		const command = getCommand(this.groupsMap, group, commandName);
		return command !== undefined;
	};
}
