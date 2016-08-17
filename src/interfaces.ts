import { Argv, Yargs } from 'yargs';

export interface RunResult {
	success: boolean;
	payload: any;
}

export interface CommandHelper {
	run(group: string, taskName?: string, args?: Argv): Promise<RunResult>;
	exists(group: string, taskName?: string): Promise<boolean>;
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
