import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import { load, getGroupDescription, CommandsMap, CommandWrapper, setSearchPrefix } from './command';
import * as globby from 'globby';
import { helpUsage, helpEpilog } from './text';
import { resolve } from 'path';
import CommandHelper from './CommandHelper';
import Helper from './Helper';
const pkg = <any> require('../../package.json');

interface YargsCommands {
	[property: string]: string[];
};

updateNotifier(pkg, 0);

function register(commandsMap: CommandsMap, yargsCommands: YargsCommands): void {
	const helperContext = {};
	const commandHelper = new CommandHelper(commandsMap, helperContext);
	const helper = new Helper(commandHelper, yargs, helperContext);

	Object.keys(yargsCommands).forEach((group: string) => {
		const commandNames = yargsCommands[group];
		const groupDescription = getGroupDescription(commandNames, commandsMap);

		yargs.command(group, groupDescription, (yargs) => {
			commandNames.forEach((command: string) => {
				const { name, description, register, run } = <CommandWrapper> commandsMap.get(command);
				yargs.command(
					name,
					description,
					(yargs: yargs.Yargs) => {
						register(helper);
						return yargs;
					},
					(argv: yargs.Argv) => {
						return run(helper, argv);
					}
				);
			});
			return yargs;
		});
	});
}

const globPaths = config.searchPaths.map((depPath) => resolve(depPath, `${config.searchPrefix}-*`));
setSearchPrefix(config.searchPrefix);

globby(globPaths).then((paths) => {
	const commandsMap: CommandsMap = new Map();
	const yargsCommands: YargsCommands = {};

	paths.forEach((path) => {
		const commandWrapper = load(path);
		const { group, name } = commandWrapper;
		const compositeKey = `${group}-${name}`;

		// First of each type will be 'default' for now
		if (!commandsMap.has(group)) {
			commandsMap.set(group, commandWrapper);
			yargsCommands[group] = [];
		}
		commandsMap.set(compositeKey, commandWrapper);
		yargsCommands[group].push(compositeKey);
	});

	register(commandsMap, yargsCommands);

	yargs.demand(1, 'must provide a valid command')
		.usage(helpUsage)
		.epilog(helpEpilog)
		.help('h')
		.alias('h', 'help')
		.argv;
});
