import { Argv, Yargs } from 'yargs';
import {CommandsMap} from "./command";


export interface CommandHelper {
	run(group: string, commandName?: string, args?: Argv): Promise<any>;
	exists(group: string, commandName?: string): boolean;
}

export interface Helper {
	yargs: Yargs;
	command: CommandHelper;
	context: any;
	commandsMap: CommandsMap;
}

export interface Command {
	description: string;
	register(helper: Helper): Yargs;
	run(helper: Helper, args?: Argv): Promise<any>;
	name?: string;
	group?: string;
}
