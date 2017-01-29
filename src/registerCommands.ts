import { Yargs, Argv, Options } from 'yargs';
import { getGroupDescription, CommandsMap, CommandWrapper } from './command';
import CommandHelper from './CommandHelper';
import ComfigurationHelper from './ConfigurationHelper';
import Helper from './Helper';
import { helpUsage, helpEpilog } from './text';
import * as chalk from 'chalk';
import { YargsCommandNames } from './loadCommands';

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

	const configurationHelper = new ComfigurationHelper();
	const commandHelper = new CommandHelper(commandsMap, helperContext);
	const helper = new Helper(commandHelper, yargs, helperContext, configurationHelper);
	yargsCommandNames.forEach((commandOptions, commandName) => {
		const groupDescription = getGroupDescription(commandOptions, commandsMap);
		const defaultCommand = <CommandWrapper> commandsMap.get(commandName);
		const defaultCommandAvailable = !!(defaultCommand && defaultCommand.register && defaultCommand.run);
		const reportError = (error: Error) => console.error(chalk.red.bold(error.message));
		yargs.command(commandName, groupDescription, (subYargs: Yargs) => {
			if (defaultCommandAvailable) {
				defaultCommand.register((key: string, options: Options) => {
					subYargs.option(key, {
						group: `Default Command Options ('${defaultCommand.name}')`,
						...options
					});
				});
			}

			[...commandOptions].filter((command: string) => {
				return `${commandName}-` !== command;
			}).forEach((command: string) => {
				const {name, description, register, run} = <CommandWrapper> commandsMap.get(command);
				subYargs.command(
					name,
					description,
					(optionsYargs: Yargs) => {
						register((key: string, options: Options) => {
							optionsYargs.option(key, options);
						});
						return optionsYargs;
					},
					(argv: Argv) => {
						return run(helper, argv).catch(reportError);
					}
				)
				.strict();
			});
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

		// Now handle aliases
		[...commandOptions].forEach((command: string) => {
			const {run, register, alias: aliases} = <CommandWrapper> commandsMap.get(command);
			if (aliases) {
				(Array.isArray(aliases) ? aliases : [aliases]).forEach((alias) => {
					yargs.command(
						alias.name,
						alias.description || '',
						(aliasYargs: Yargs) => {
							register((key: string, options: Options) => {
								if (!alias.options || !alias.options.find((option) => option.option === key)) {
									aliasYargs.option(key, options);
								}
							});
							return aliasYargs;
						},
						(argv: Argv) => {
							alias.options && alias.options.forEach((option) => {
								argv[option.option] = option.value;
							});
							return run(helper, argv).catch(reportError);
						});
				});
			}
		});
	});

	yargs.demand(1, '')
		.usage(helpUsage)
		.epilog(helpEpilog)
		.help('h')
		.alias('h', 'help')
		.strict()
		.argv;
}
