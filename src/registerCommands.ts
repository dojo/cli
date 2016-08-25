import { Yargs, Argv } from 'yargs';
import { getGroupDescription, CommandsMap, CommandWrapper } from './command';
import CommandHelper from './CommandHelper';
import Helper from './Helper';
import { helpUsage, helpEpilog } from './text';

interface YargsCommandNames {
	[property: string]: string[];
};

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
