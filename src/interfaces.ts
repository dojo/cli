import { Argv, Yargs } from 'yargs';

export interface Command {
	name: string;
	description: string;
	register: (yargs: Yargs) => any;
	run: (argv: Argv) => void;
}

export interface CommandConfig extends Command {
	type: string;
	subType: string;
}

export type CommandsMap = Map<string, CommandConfig[]>;

export type CommandSet = Set<string>;
