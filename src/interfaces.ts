import { Argv, Yargs } from 'yargs';

export interface RunResult {
	payload?: any;
}

export interface CommandHelper {
	run(group: string, commandName?: string, args?: Argv): Promise<RunResult>;
	exists(group: string, commandName?: string): boolean;
}

export interface Helper {
	yargs: Yargs;
	command: CommandHelper;
	context: any;
}

export interface Command {
	description: string;
	register(helper: Helper): Yargs;
	run(helper: Helper, args?: Argv): Promise<RunResult>;
}
