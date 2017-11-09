import { Argv, Options } from 'yargs';

export interface Config {
	[key: string]: any;
}

export interface ConfigurationHelper {
	set(config: Config): void;
	get(): {};
}

export interface CommandHelper {
	run(group: string, commandName?: string, args?: Argv): Promise<any>;
	exists(group: string, commandName?: string): boolean;
}

export interface Helper {
	yargs: Argv;
	command: CommandHelper;
	context: any;
	configuration: ConfigurationHelper;
}

export type OptionsHelper = (key: string, options: Options) => void;

export interface NpmPackage {
	devDependencies?: {
		[name: string]: string
	};
	dependencies?: {
		[name: string]: string
	};
}

export interface Alias {
	name: string;
	description?: string;
	options: AliasOption[];
}

/**
 * Represents one alias option. The option name is the full name of the option, and not the abbreviation. For
 * example, if an option is (-w or --watch), you will specify "watch" as the option name.
 */
export interface AliasOption {
	option: string;
	value: string | boolean | number;
}

export interface FileCopyConfig {
	path: string;
	files: string[];
}

export interface EjectOutput {
	npm?: NpmPackage;
	copy?: FileCopyConfig;
	hints?: string[];
}

/**
 * Inbuilt commands specify their name and group - installed commands have these props parsed out of their package dir name
 */
export interface Command<T = any> {
	description: string;
	register(options: OptionsHelper, helper: Helper): void;
	run(helper: Helper, args?: T): Promise<any>;
	eject?(helper: Helper): EjectOutput;
	name?: string;
	group?: string;
	alias?: Alias[] | Alias;
}

export interface CommandError {
	exitCode?: number;
	message: string;
}
