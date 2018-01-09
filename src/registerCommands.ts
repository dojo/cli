import chalk from 'chalk';
import { Argv, Options } from 'yargs';
import { getGroupDescription, CommandsMap, CommandWrapper } from './command';
import CommandHelper from './CommandHelper';
import configurationHelperFactory from './configurationHelper';
import HelperFactory from './Helper';
import { CommandError } from './interfaces';
import { YargsCommandNames } from './loadCommands';
import { helpUsage, helpEpilog } from './text';
import { NpmPackageDetails } from './interfaces';

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
 * @param yargs Yargs instance
 * @param helper Helper instance
 * @param groupName the name of the group
 * @param commandOptions The set of commandOption keys
 * @param commandsMap The map of composite keys to commands
 */
function registerGroups(yargs: Argv, helper: HelperFactory, groupName: string, commandOptions: Set<string>, commandsMap: CommandsMap): void {
	const groupDescription = getGroupDescription(commandOptions, commandsMap);
	const defaultCommand = <CommandWrapper> commandsMap.get(groupName);
	const defaultCommandAvailable = !!(defaultCommand && defaultCommand.register && defaultCommand.run);
	const defaultCommandName = defaultCommand && defaultCommand.name;

	yargs.command(groupName, groupDescription, (subYargs: Argv) => {
		if (defaultCommandAvailable) {
			defaultCommand.register((key: string, options: Options) => {
				subYargs.option(key, {
					group: `Default Command Options ('${defaultCommand.name}')`,
					...options
				});
			}, helper.sandbox(groupName, defaultCommandName));
		}
		registerCommands(subYargs, helper, groupName, commandOptions, commandsMap);
		return subYargs;
	},
	(argv: any) => {
		// argv._ is an array of commands.
		// if `dojo example` was called, it will only be size one,
		// so we call default command, else, the subcommand will
		// have been ran and we don't want to run the default.
		if (defaultCommandAvailable && argv._.length === 1) {
			return defaultCommand.run(helper.sandbox(groupName, defaultCommandName), argv).catch(reportError);
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
function registerCommands(yargs: Argv, helper: HelperFactory, groupName: string, commandOptions: Set<string>, commandsMap: CommandsMap): void {
	[...commandOptions].filter((command: string) => {
		return `${groupName}-` !== command;
	}).forEach((command: string) => {
		const {name, description, register, run} = <CommandWrapper> commandsMap.get(command);
		yargs.command(
			name,
			description,
			(optionsYargs: Argv) => {
				register((key: string, options: Options) => {
					optionsYargs.option(key, options);
				}, helper.sandbox(groupName, name));
				return optionsYargs;
			},
			(argv: any) => {
				return run(helper.sandbox(groupName, name), argv).catch(reportError);
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
function registerAliases(yargs: Argv, helper: HelperFactory, commandOptions: Set<string>, commandsMap: CommandsMap): void {
	[...commandOptions].forEach((command: string) => {
		const { run, register, alias: aliases, group } = <CommandWrapper> commandsMap.get(command);
		if (aliases) {
			(Array.isArray(aliases) ? aliases : [aliases]).forEach((alias) => {
				const { name, description, options: aliasOpts } = alias;
				yargs.command(
					name,
					description || '',
					(aliasYargs: Argv) => {
						register((key: string, options: Options) => {
							if (!aliasOpts || !aliasOpts.some((option) => option.option === key)) {
								aliasYargs.option(key, options);
							}
						}, helper.sandbox(group, name));
						return aliasYargs;
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
						return run(helper.sandbox(group, name), argv).catch(reportError);
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
export default function(yargs: Argv, commandsMap: CommandsMap, yargsCommandNames: YargsCommandNames): void {
	const helperContext = {};

	const commandHelper = new CommandHelper(commandsMap, helperContext, configurationHelperFactory);
	const helperFactory = new HelperFactory(commandHelper, yargs, helperContext, configurationHelperFactory);

	yargsCommandNames.forEach((commandOptions, commandName) => {
		registerGroups(yargs, helperFactory, commandName, commandOptions, commandsMap);
		registerAliases(yargs, helperFactory, commandOptions, commandsMap);
	});

	yargs.demand(1, '')
		.usage(helpUsage)
		.epilog(helpEpilog)
		.help('h')
		.alias('h', 'help')
		.strict()
		.argv;
}
