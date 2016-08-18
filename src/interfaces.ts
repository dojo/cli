import { Argv, Yargs } from 'yargs';

export interface RunResult {
	payload?: any;
}

export interface CommandHelper {
	run(group: string, commandName?: string, args?: Argv): Promise<RunResult>;
	exists(group: string, commandName?: string): Promise<boolean>;
}

export interface Helper {
	yargs: Yargs;
	command: CommandHelper;
	context: any;
}

export interface Command {
	description: string;
	register(helper: Helper): Promise<any>;
	run(helper: Helper, args?: Argv): Promise<RunResult>;
}
