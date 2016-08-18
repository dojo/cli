import { GroupsMap, CommandsMap } from './command';
import { CommandHelper, RunResult, Command } from './interfaces';
import Helper from './Helper';
import * as yargs from 'yargs';

function getCommand(groupsMap: GroupsMap, group: string, taskName?: string): Command | undefined {
	const commandsMap: CommandsMap | undefined = groupsMap.get(group);
	if (commandsMap) {
		if (taskName) {
			return commandsMap.get(taskName);
		}
		else if (commandsMap.size === 0) {
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
	run(group: string, taskName?: string, args?: yargs.Argv): Promise<RunResult> {
		const command = getCommand(this.groupsMap, group, taskName);
		if (command) {
			return command.run(new Helper(this, yargs, this.context));
		}
		else {
			return Promise.reject({});
		}
	};
	exists(group: string, taskName?: string) {
		const command = getCommand(this.groupsMap, group, taskName);
		return Promise.resolve(command !== undefined);
	};
}
