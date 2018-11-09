import { Argv, Options } from 'yargs';

export interface NpmPackageDetails {
	name: string;
	description: string;
	version: string;
}

export type CliConfig = {
	searchPaths: string[];
	searchPrefixes: string[];
	builtInCommandLocation: string;
};

export interface Config {
	[key: string]: any;
}

export interface ConfigWrapper {
	packageJsonConfig?: Config;
	packageJsonIndent?: number | string;
	dojoRcConfig?: Config;
	dojoRcIndent?: number | string;
}

export interface ConfigurationHelper {
	set(config: Config): void;
	get(command?: string): {};
}

export type RenderFilesConfig = {
	src: string;
	dest: string;
}[];

export type ValidationWrapper = {
	commandGroup: string;
	commandName?: string;
	commandSchema: any;
	commandConfig: any;
	silentSuccess: boolean;
};

export interface ValidateHelper {
	validate(validateOpts: ValidationWrapper): Promise<boolean>;
}
export interface CommandHelper {
	run(group: string, commandName?: string, args?: Argv): Promise<any>;
	exists(group: string, commandName?: string): boolean;
	renderFiles(renderFilesConfig: RenderFilesConfig, renderData: object): void;
}

export interface Helper {
	yargs: Argv;
	command: CommandHelper;
	context: any;
	configuration: ConfigurationHelper;
	validation: ValidateHelper;
}

export type OptionsHelper = (key: string, options: Options) => void;

export interface NpmPackage {
	devDependencies?: {
		[name: string]: string;
	};
	dependencies?: {
		[name: string]: string;
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
	validate?: (helper: Helper) => Promise<boolean>;
	name?: string;
	group?: string;
	alias?: Alias[] | Alias;
	global?: boolean;
}

export interface CommandError {
	exitCode?: number;
	message: string;
}

export interface CommandWrapper extends Command {
	name: string;
	group: string;
	path: string;
	global: boolean;
	installed: boolean;
	default?: boolean;
}

export type CommandMap = Map<string, CommandWrapper>;

export type GroupMap = Map<string, CommandMap>;
