import * as chalk from 'chalk';
import { Argv, Options } from 'yargs';
import { getGroupDescription, CommandsMap, CommandWrapper } from './command';
import CommandHelper from './CommandHelper';
import configurationHelper from './configurationHelper';
import Helper from './Helper';
import { CommandError } from './interfaces';
import { YargsCommandNames } from './loadCommands';
import { helpUsage, helpEpilog } from './text';

/**
 * General purpose error handler for commands. If the command has an exit code, it is considered
 * critical and we exit immediately. Otherwise we just let things run their course.
 *
 * @param error
 */
function reportError(error: CommandError) {
	let exitCode = 0;

	if (error.exitCode !== undefined) {
		exitCode = error.exitCode;
	}

	console.error(chalk.red.bold(error.message));

	// only process.exit if we need to explicitly set the exit code
	if (exitCode !== 0) {
		process.exit(exitCode);
	}
}

/**
 * Registers groups and initiates registration of commands
 *
 * @param yargs Argv instance
 * @param helper Helper instance
 * @param groupName the name of the group
 * @param commandOptions The set of commandOption keys
 * @param commandsMap The map of composite keys to commands
 */
function registerGroups(yargs: Argv, helper: Helper, groupName: string, commandOptions: Set<string>, commandsMap: CommandsMap): void {
	const groupDescription = getGroupDescription(commandOptions, commandsMap);
	const defaultCommand = <CommandWrapper> commandsMap.get(groupName);
	const defaultCommandAvailable = !!(defaultCommand && defaultCommand.register && defaultCommand.run);
	yargs.command(groupName, groupDescription, (subArgv: Argv) => {
		if (defaultCommandAvailable) {
			defaultCommand.register((key: string, options: Options) => {
				subArgv.option(key, {
					group: `Default Command Options ('${defaultCommand.name}')`,
					...options
				});
			}, helper);
		}
		registerCommands(subArgv, helper, groupName, commandOptions, commandsMap);
		return subArgv;
	},
	(argv: any) => {
		// argv._ is an array of commands.
		// if `dojo example` was called, it will only be size one,
		// so we call default command, else, the subcommand will
		// have been ran and we don't want to run the default.
		if (defaultCommandAvailable && argv._.length === 1) {
			return defaultCommand.run(helper, argv).catch(reportError);
		}
	});
}

/**
 * Register commands
 *
 * @param yargs Argv instance
 * @param helper Helper instance
 * @param groupName the name of the group
 * @param commandOptions The set of commandOption keys
 * @param commandsMap The map of composite keys to commands
 */
function registerCommands(yargs: Argv, helper: Helper, groupName: string, commandOptions: Set<string>, commandsMap: CommandsMap): void {
	[...commandOptions].filter((command: string) => {
		return `${groupName}-` !== command;
	}).forEach((command: string) => {
		const {name, description, register, run} = <CommandWrapper> commandsMap.get(command);
		yargs.command(
			name,
			description,
			(optionsArgv: Argv) => {
				register((key: string, options: Options) => {
					optionsArgv.option(key, options);
				}, helper);
				return optionsArgv;
			},
			(argv: any) => {
				return run(helper, argv).catch(reportError);
			}
		)
		.strict();
	});
}

/**
 * Registers command aliases as new groups
 *
 * @param yargs Argv instance
 * @param helper Helper instance
 * @param commandOptions The set of commandOption keys
 * @param commandsMap The map of composite keys to commands
 */
function registerAliases(yargs: Argv, helper: Helper, commandOptions: Set<string>, commandsMap: CommandsMap): void {
	[...commandOptions].forEach((command: string) => {
		const {run, register, alias: aliases} = <CommandWrapper> commandsMap.get(command);
		if (aliases) {
			(Array.isArray(aliases) ? aliases : [aliases]).forEach((alias) => {
				const { name, description, options: aliasOpts } = alias;
				yargs.command(
					name,
					description || '',
					(aliasArgv: Argv) => {
						register((key: string, options: Options) => {
							if (!aliasOpts || !aliasOpts.some((option) => option.option === key)) {
								aliasArgv.option(key, options);
							}
						}, helper);
						return aliasArgv;
					},
					(argv: any) => {
						if (aliasOpts) {
							argv = aliasOpts.reduce((accumulator, option) => {
								return {
									...accumulator,
									[option.option]: option.value
								};
							}, argv);
						}
						return run(helper, argv).catch(reportError);
					});
			});
		}
	});
}

/**
 * Registers commands and subcommands using yargs. Receives a CommandsMap of commands and
 * a map of ArgvCommandNames which links composite keys to groups.
 * Subcommands have to be registered when a group is registered, this is a restriction of
 * yargs.
 * @param yargs Argv instance
 * @param commandsMap The map of composite keys to commands
 * @param yargsCommandNames Map of groups and names to composite keys
 */
export default function(yargs: Argv, commandsMap: CommandsMap, yargsCommandNames: YargsCommandNames): void {
	const helperContext = {};

	const commandHelper = new CommandHelper(commandsMap, helperContext);
	const helper = new Helper(commandHelper, yargs, helperContext, configurationHelper);
	yargsCommandNames.forEach((commandOptions, commandName) => {
		registerGroups(yargs, helper, commandName, commandOptions, commandsMap);
		registerAliases(yargs, helper, commandOptions, commandsMap);
	});

	yargs.demand(1, '')
		.usage(helpUsage)
		.epilog(helpEpilog)
		.help('h')
		.alias('h', 'help')
		.strict()
		.argv;
}
