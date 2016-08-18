import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import { load, getGroupDescription, CommandsMap, GroupsMap } from './command';
import * as globby from 'globby';
import { helpUsage, helpEpilog } from './text';
import { resolve } from 'path';
import CommandHelper from './CommandHelper';
import Helper from './Helper';
const pkg = <any> require('../package.json');

updateNotifier(pkg, 0);

function register(groupsMap: GroupsMap): void {
	const helperContext = {};
	const commandHelper = new CommandHelper(groupsMap, helperContext);
	const helper = new Helper(commandHelper, yargs, helperContext);

	for (let [ group, commands ] of groupsMap.entries()) {
		const description = getGroupDescription(group, commands);
		yargs.command(group, description, (yargs) => {
			for (let { name, description, register, run } of commands.values()) {
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
			}
			return yargs;
		});
	}
}

const globPaths = config.searchPaths.map((depPath) => resolve(depPath, `${config.searchPrefix}-*`));
globby(globPaths).then((paths) => {
	const groupsMap: GroupsMap = new Map();

	paths.forEach((path) => {
		const commandWrapper = load(path);
		const { group, name } = commandWrapper;
		const commandsMap: CommandsMap = groupsMap.get(group) || new Map() ;
		commandsMap.set(name, commandWrapper);
		groupsMap.set(group, commandsMap);
	});

	register(groupsMap);

	yargs.demand(1, 'must provide a valid command')
		.usage(helpUsage)
		.epilog(helpEpilog)
		.help('h')
		.alias('h', 'help')
		.argv;
});
