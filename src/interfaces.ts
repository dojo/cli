import { Argv, Yargs } from 'yargs';

export interface ConfigurationHelper {
	save(config: any): Promise<any>;
	get(): Promise<any>;
}

export interface CommandHelper {
	run(group: string, commandName?: string, args?: Argv): Promise<any>;
	exists(group: string, commandName?: string): boolean;
}

export interface Helper {
	yargs: Yargs;
	command: CommandHelper;
	context: any;
	configuration: ConfigurationHelper;
}

/**
 * Inbuilt commands specify their name and group - installed commands have these props parsed out of their package dir name
 */
export interface Command {
	description: string;
	register(helper: Helper): Yargs;
	run(helper: Helper, args?: Argv): Promise<any>;
	name?: string;
	group?: string;
}
