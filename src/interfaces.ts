import { Argv, Yargs } from 'yargs';

export interface RunResult {
	success: boolean;
	payload: any;
}

export interface TaskHelper {
	run(group: string, taskName?: string, args?: Argv): Promise<RunResult>;
	exists(group: string, taskName?: string): Promise<boolean>;
}

export interface CommandHelper {
	yargs: Yargs;
	task: TaskHelper;
	context: any;
}

export interface Command {
	description: string;
	register(commandHelper: CommandHelper): Promise<any>;
	run(commandHelper: CommandHelper, args?: Argv): Promise<RunResult>;
}
