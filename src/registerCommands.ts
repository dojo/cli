import { Yargs, Argv } from 'yargs';
import { getGroupDescription, CommandsMap, CommandWrapper } from './command';
import CommandHelper from './CommandHelper';
import Helper from './Helper';
import { helpUsage, helpEpilog } from './text';

export interface YargsCommandNames {
	[property: string]: string[];
};

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

	Object.keys(yargsCommandNames).forEach((group: string) => {
		const commandNames = yargsCommandNames[group];
		const groupDescription = getGroupDescription(commandNames, commandsMap);

		yargs.command(group, groupDescription, (yargs: Yargs) => {
			commandNames.forEach((command: string) => {
				const { name, description, register, run } = <CommandWrapper> commandsMap.get(command);
				yargs.command(
					name,
					description,
					(yargs: Yargs) => {
						register(helper);
						return yargs;
					},
					(argv: Argv) => {
						return run(helper, argv);
					}
				);
			});
			return yargs;
		});
	});

	yargs.demand(1, 'must provide a valid command')
		.usage(helpUsage)
		.epilog(helpEpilog)
		.help('h')
		.alias('h', 'help')
		.argv;
}
