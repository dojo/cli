import { Argv, Yargs, Options } from 'yargs';

export interface CommandHelper {
	run(group: string, commandName?: string, args?: Argv): Promise<any>;
	exists(group: string, commandName?: string): boolean;
}

export interface Helper {
	yargs: Yargs;
	command: CommandHelper;
	context: any;
}

/**
 * Inbuilt commands specify their name and group - installed commands have these props parsed out of their package dir name
 */
export interface Command {
	description: string;
	register(options: (key: string, options: Options) => void): void;
	run(helper: Helper, args?: Argv): Promise<any>;
	name?: string;
	group?: string;
}
