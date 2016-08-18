import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import { load, getGroupDescription, CommandsMap, GroupsMap } from './command';
import * as globby from 'globby';
import { helpUsage, helpEpilog } from './text';
import { resolve } from 'path';
import CommandHelper from './CommandHelper';
import Helper from './Helper';
import { RunResult } from './interfaces';
const pkg = <any> require('../package.json');

updateNotifier(pkg, 0);

function register(groupsMap: GroupsMap, commandHelper: CommandHelper): void {
	for (let [ group, commands ] of groupsMap.entries()) {
		const description = getGroupDescription(group, commands);
		const helper = new Helper(commandHelper, yargs, {});
		yargs.command(group, description, (yargs) => {
			for (let { name, description, register, run } of commands.values()) {
				yargs.command(
					name,
					description,
					(yargs: yargs.Yargs) => {
						register(helper);
						return yargs;
					},
					(argv: yargs.Argv): Promise<RunResult> => {
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

	const commandHelper = new CommandHelper(groupsMap);
	register(groupsMap, commandHelper);

	yargs.demand(1, 'must provide a valid command')
		.usage(helpUsage)
		.epilog(helpEpilog)
		.help('h')
		.alias('h', 'help')
		.argv;
});
