import { Yargs, Argv, Options } from 'yargs';
import { getGroupDescription, CommandsMap, CommandWrapper } from './command';
import CommandHelper from './CommandHelper';
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

	const commandHelper = new CommandHelper(commandsMap, helperContext);
	const helper = new Helper(commandHelper, yargs, helperContext);

	yargsCommandNames.forEach((commandOptions, commandName) => {
		const groupDescription = getGroupDescription(commandOptions, commandsMap);
		const reportError = (error: Error) => console.error(chalk.red.bold(error.message));
		yargs.command(commandName, groupDescription, (yargs: Yargs) => {
			[...commandOptions].filter((command: string) => {
				return `${commandName}-` !== command;
			}).forEach((command: string) => {
				const {name, description, register, run} = <CommandWrapper> commandsMap.get(command);
				yargs.command(
					name,
					description,
					(yargs: Yargs) => {
						register(helper, (key: string, options: Options) => {
							yargs.option(key, options);
						});
						return yargs;
					},
					(argv: Argv) => {
						return run(helper, argv).catch(reportError);
					}
				)
				.strict();
			});
			return yargs;
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
