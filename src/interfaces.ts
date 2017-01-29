import { Argv, Yargs, Options } from 'yargs';

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

export type OptionsHelper = (key: string, options: Options) => void;

export interface NpmPackage {
	devDependencies: {
		[name: string]: string
	};
	dependencies: {
		[name: string]: string
	};
	scripts: {
		[name: string]: string
	};
};

export interface Alias {
	name: string;
	description?: string;
	options: AliasOption[];
}

export interface AliasOption {
	option: string;
	value?: string | boolean | number;
}

/**
 * Inbuilt commands specify their name and group - installed commands have these props parsed out of their package dir name
 */
export interface Command {
	description: string;
	register(options: OptionsHelper): void;
	run(helper: Helper, args?: Argv): Promise<any>;
	eject?(helper: Helper, npm: (pkg: NpmPackage) => Promise<void>, files: (files: string[]) => void): void;
	name?: string;
	group?: string;
	alias?: Alias[] | Alias;
}
