import { Yargs, Argv, Options } from 'yargs';
import { getGroupDescription, CommandsMap, CommandWrapper } from './command';
import CommandHelper from './CommandHelper';
import configurationHelper from './configurationHelper';
import Helper from './Helper';
import { helpUsage, helpEpilog } from './text';
import * as chalk from 'chalk';
import { YargsCommandNames } from './loadCommands';

/**
 * Registers groups and initiates registration of commands
 *
 * @param yargs Yargs instance
 * @param helper Helper instance
 * @param groupName the name of the group
 * @param commandOptions The set of commandOption keys
 * @param commandsMap The map of composite keys to commands
 */
function registerGroups(yargs: Yargs, helper: Helper, groupName: string, commandOptions: Set<string>, commandsMap: CommandsMap): void {
	const groupDescription = getGroupDescription(commandOptions, commandsMap);
	const defaultCommand = <CommandWrapper> commandsMap.get(groupName);
	const defaultCommandAvailable = !!(defaultCommand && defaultCommand.register && defaultCommand.run);
	const reportError = (error: Error) => console.error(chalk.red.bold(error.message));
	yargs.command(groupName, groupDescription, (subYargs: Yargs) => {
		if (defaultCommandAvailable) {
			defaultCommand.register((key: string, options: Options) => {
				subYargs.option(key, {
					group: `Default Command Options ('${defaultCommand.name}')`,
					...options
				});
			}, helper);
		}
		registerCommands(subYargs, helper, groupName, commandOptions, commandsMap);
		return subYargs;
	},
	(argv: Argv) => {
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
 * @param yargs Yargs instance
 * @param helper Helper instance
 * @param groupName the name of the group
 * @param commandOptions The set of commandOption keys
 * @param commandsMap The map of composite keys to commands
 */
function registerCommands(yargs: Yargs, helper: Helper, groupName: string, commandOptions: Set<string>, commandsMap: CommandsMap): void {
	const reportError = (error: Error) => console.error(chalk.red.bold(error.message));
	[...commandOptions].filter((command: string) => {
		return `${groupName}-` !== command;
	}).forEach((command: string) => {
		const {name, description, register, run} = <CommandWrapper> commandsMap.get(command);
		yargs.command(
			name,
			description,
			(optionsYargs: Yargs) => {
				register((key: string, options: Options) => {
					optionsYargs.option(key, options);
				}, helper);
				return optionsYargs;
			},
			(argv: Argv) => {
				return run(helper, argv).catch(reportError);
			}
		)
		.strict();
	});
}

/**
 * Registers command aliases as new groups
 *
 * @param yargs Yargs instance
 * @param helper Helper instance
 * @param commandOptions The set of commandOption keys
 * @param commandsMap The map of composite keys to commands
 */
function registerAliases(yargs: Yargs, helper: Helper, commandOptions: Set<string>, commandsMap: CommandsMap): void {
	const reportError = (error: Error) => console.error(chalk.red.bold(error.message));
	[...commandOptions].forEach((command: string) => {
		const {run, register, alias: aliases} = <CommandWrapper> commandsMap.get(command);
		if (aliases) {
			(Array.isArray(aliases) ? aliases : [aliases]).forEach((alias) => {
				const { name, description, options: aliasOpts } = alias;
				yargs.command(
					name,
					description || '',
					(aliasYargs: Yargs) => {
						register((key: string, options: Options) => {
							if (!aliasOpts || !aliasOpts.some((option) => option.option === key)) {
								aliasYargs.option(key, options);
							}
						}, helper);
						return aliasYargs;
					},
					(argv: Argv) => {
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
 * a map of YargsCommandNames which links composite keys to groups.
 * Subcommands have to be registered when a group is registered, this is a restriction of
 * yargs.
 * @param yargs Yargs instance
 * @param commandsMap The map of composite keys to commands
 * @param yargsCommandNames Map of groups and names to composite keys
 */
export default function(yargs: Yargs, commandsMap: CommandsMap, yargsCommandNames: YargsCommandNames): void {
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
