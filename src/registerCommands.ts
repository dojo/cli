import chalk from 'chalk';
import { Argv, Options } from 'yargs';
import CommandHelper from './CommandHelper';
import configurationHelperFactory from './configurationHelper';
import HelperFactory from './Helper';
import { CommandError, CommandWrapper, GroupMap, CommandMap } from './interfaces';
import { formatHelp } from './help';
import { createOptionValidator } from './validation';
import { getCommand } from './command';
import { builtInCommandValidation } from './commands/validate';

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

function searchForOption(option: string) {
	return process.argv.indexOf(`-${option}`) > -1 || process.argv.indexOf(`--${option}`) > -1;
}

function userSetOption(option: string, aliases: Aliases) {
	if (searchForOption(option)) {
		return true;
	}

	// Handle aliases for same option
	for (let aliasIndex in aliases[option]) {
		let alias = aliases[option][aliasIndex];
		if (searchForOption(alias)) {
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

function saveCommandLineOptions(configuration: any, args: any) {
	const configToSave = Object.keys(args).reduce(
		(config, key) => {
			if (searchForOption(key)) {
				try {
					config[key] = JSON.parse(args[key]);
				} catch {
					config[key] = args[key];
				}
			}
			return config;
		},
		{} as any
	);
	configuration.set(configToSave);
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
				.option('dojorc', { default: '.dojorc', type: 'string', description: 'The dojorc config file' })
				.showHelpOnFail(false, formatHelp({ _: [groupName] }, groupMap))
				.strict();
		},
		async (argv: any) => {
			if (defaultCommand && argv._.length === 1) {
				const { h, help, save, ...args } = argv;

				if (h || help) {
					console.log(formatHelp(args, groupMap));
					return Promise.resolve({});
				}

				const configurationHelper = helper.sandbox(groupName, defaultCommand.name).configuration;
				const config = configurationHelper.get();
				const combinedArgs = getOptions(aliases, config, args);

				if (save) {
					saveCommandLineOptions(configurationHelper, combinedArgs);
				}

				if (typeof defaultCommand.validate === 'function') {
					const valid = await defaultCommand.validate(helper.sandbox(groupName, defaultCommand.name));
					if (!valid) {
						return;
					}
				}
				return defaultCommand
					.run(helper.sandbox(groupName, defaultCommand.name), combinedArgs)
					.catch(reportError);
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

				return optionsYargs
					.option('dojorc', { default: '.dojorc', type: 'string', description: 'The dojorc config file' })
					.showHelpOnFail(false, formatHelp({ _: [groupName, name] }, groupMap))
					.strict();
			},
			async (argv: any) => {
				const { h, help, save, ...args } = argv;

				if (h || help) {
					console.log(formatHelp(args, groupMap));
					return Promise.resolve({});
				}

				const configurationHelper = helper.sandbox(groupName, name).configuration;
				const config = configurationHelper.get();
				const combinedArgs = getOptions(aliases, config, args);

				if (save) {
					saveCommandLineOptions(configurationHelper, combinedArgs);
				}

				if (typeof command.validate === 'function') {
					const valid = await command.validate(helper.sandbox(groupName, command.name));
					if (!valid) {
						return;
					}
				}
				return run(helper.sandbox(groupName, name), combinedArgs).catch(reportError);
			}
		);
	});
}

export default function(yargs: Argv, groupMap: GroupMap): void {
	const helperContext = {};
	const commandHelper = new CommandHelper(groupMap, helperContext, configurationHelperFactory);
	const validateHelper = { validate: builtInCommandValidation }; // Provide the default validation helper
	const helperFactory = new HelperFactory(
		commandHelper,
		yargs,
		helperContext,
		configurationHelperFactory,
		validateHelper
	);

	groupMap.forEach((commandMap, group) => {
		registerGroups(yargs, helperFactory, group, commandMap);
	});

	yargs.option('save', {
		describe: 'Save arguments to .dojorc',
		type: 'boolean'
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
