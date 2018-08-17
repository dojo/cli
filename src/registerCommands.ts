import chalk from 'chalk';
import { Argv, Options } from 'yargs';
import CommandHelper from './CommandHelper';
import configurationHelperFactory from './configurationHelper';
import HelperFactory from './Helper';
import { CommandError, CommandWrapper, GroupMap, CommandMap } from './interfaces';
import { formatHelp } from './help';
import { createOptionValidator } from './validation';
import { getCommand } from './command';
import { isValidateableCommandWrapper, validateCommand } from './commands/validate';

const requireOptions = {
	demand: false,
	demandOption: false,
	requiresArg: false,
	require: false,
	required: false
};

function reportError(error: CommandError) {
	let exitCode = 1;
	if (error.exitCode !== undefined) {
		exitCode = error.exitCode;
	}

	console.error(chalk.red.bold(error.message));
	process.exit(exitCode);
}

function userSetOption(option: string, aliases: Aliases) {
	function searchForOption(option: string) {
		if (process.argv.indexOf(option) > -1) {
			return true;
		}
		return false;
	}

	if (searchForOption(`-${option}`) || searchForOption(`--${option}`)) {
		return true;
	}

	// Handle aliases for same option
	for (let aliasIndex in aliases[option]) {
		let alias = aliases[option][aliasIndex];
		if (searchForOption(`-${alias}`) || searchForOption(`--${alias}`)) {
			return true;
		}
	}

	return false;
}

function getRcOption(rcConfig: any, option: string, aliases: Aliases) {
	if (rcConfig === undefined) {
		return undefined;
	}

	if (rcConfig[option] !== undefined) {
		return option;
	}

	for (let aliasIndex in aliases[option]) {
		let alias = aliases[option][aliasIndex];
		if (rcConfig[alias] !== undefined) {
			return alias;
		}
	}
	return undefined;
}

function getOptions(aliases: Aliases, rcOptions: any, commandLineArgs: any = {}) {
	const result = Object.keys(commandLineArgs).reduce(
		(config, key) => {
			if (userSetOption(key, aliases)) {
				config[key] = commandLineArgs[key];
				return config;
			}

			const rcOption = getRcOption(rcOptions, key, aliases);
			if (rcOption) {
				config[key] = rcOptions[rcOption];
				aliases[key].forEach((alias) => {
					config[alias] = rcOptions[rcOption];
				});
			} else {
				config[key] = commandLineArgs[key];
			}

			return config;
		},
		{} as any
	);
	return { ...rcOptions, ...result };
}

type Aliases = { [index: string]: string[] };

function parseAliases(aliases: Aliases, key: string, optionAlias: string | string[] = []) {
	if (typeof optionAlias === 'string') {
		aliases[key] = [optionAlias];
		aliases[optionAlias] = [key];
	} else {
		aliases[key] = optionAlias;
		optionAlias.forEach((option, index) => {
			const optionsCopy = [...optionAlias];
			optionsCopy.splice(index, 1);
			aliases[option] = [key, ...optionsCopy];
		});
	}
	return aliases;
}

function registerGroups(yargs: Argv, helper: HelperFactory, groupName: string, commandMap: CommandMap): void {
	const groupMap = new Map().set(groupName, commandMap);
	const defaultCommand = getCommand(groupMap, groupName);
	let aliases: Aliases = {};
	yargs.command(
		groupName,
		false,
		(subYargs: Argv) => {
			defaultCommand.register((key: string, options: Options) => {
				aliases = parseAliases(aliases, key, options.alias);
				subYargs.option(key, { ...options, ...requireOptions });
			}, helper.sandbox(groupName, defaultCommand.name));

			registerCommands(subYargs, helper, groupName, commandMap);
			return subYargs
				.option('h', {
					alias: 'help'
				})
				.showHelpOnFail(false, formatHelp({ _: [groupName] }, groupMap))
				.strict();
		},
		(argv: any) => {
			if (defaultCommand && argv._.length === 1) {
				if (argv.h || argv.help) {
					console.log(formatHelp(argv, groupMap));
					return Promise.resolve({});
				}
				const config = helper.sandbox(groupName, defaultCommand.name).configuration.get();
				const args = getOptions(aliases, config, argv);

				if (isValidateableCommandWrapper(defaultCommand)) {
					if (!validateCommand(defaultCommand, config, true)) {
						return;
					}
				}
				return defaultCommand.run(helper.sandbox(groupName, defaultCommand.name), args).catch(reportError);
			}
		}
	);
}

function registerCommands(yargs: Argv, helper: HelperFactory, groupName: string, commandMap: CommandMap): void {
	[...commandMap.values()].forEach((command: CommandWrapper) => {
		const { name, register, run } = command;
		let aliases: Aliases = {};
		const groupMap = new Map().set(groupName, commandMap);
		yargs.command(
			name,
			false,
			(optionsYargs: Argv) => {
				register((key: string, options: Options) => {
					aliases = parseAliases(aliases, key, options.alias);
					optionsYargs.option(key, { ...options, ...requireOptions });
				}, helper.sandbox(groupName, name));

				return optionsYargs.showHelpOnFail(false, formatHelp({ _: [groupName, name] }, groupMap)).strict();
			},
			(argv: any) => {
				if (argv.h || argv.help) {
					console.log(formatHelp(argv, groupMap));
					return Promise.resolve({});
				}

				const config = helper.sandbox(groupName, name).configuration.get();
				const args = getOptions(aliases, config, argv);

				if (isValidateableCommandWrapper(command)) {
					if (!validateCommand(command, config, true)) {
						return;
					}
				}

				return run(helper.sandbox(groupName, name), args).catch(reportError);
			}
		);
	});
}

export default function(yargs: Argv, groupMap: GroupMap): void {
	const helperContext = {};
	const commandHelper = new CommandHelper(groupMap, helperContext, configurationHelperFactory);
	const helperFactory = new HelperFactory(commandHelper, yargs, helperContext, configurationHelperFactory);

	groupMap.forEach((commandMap, group) => {
		registerGroups(yargs, helperFactory, group, commandMap);
	});

	yargs
		.demand(1, '')
		.command(
			'$0',
			false,
			(dojoYargs: Argv) => {
				dojoYargs.option('h', {
					alias: 'help'
				});
				return dojoYargs;
			},
			(argv: any) => {
				console.log(formatHelp(argv, groupMap));
			}
		)
		.check(createOptionValidator(groupMap), true)
		.help(false)
		.showHelpOnFail(false)
		.strict().argv;
}
