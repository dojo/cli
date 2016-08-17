import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import { load, getGroupDescription, CommandsMap } from './command';
import * as globby from 'globby';
import { helpUsage, helpEpilog } from './text';
import { resolve } from 'path';
const pkg = <any> require('../package.json');

type GroupsMap = Map<string, CommandsMap>;

updateNotifier(pkg, 0);

const groupsMap: GroupsMap = new Map();

function register(groupsMap: GroupsMap): void {
	for (let [ group, commands ] of groupsMap.entries()) {
		const description = getGroupDescription(group, commands);

		yargs.command(group, description, (yargs) => {
			Array.from(commands.values()).map(({ name, description, register, run }) => yargs.command.apply(null, [ name, description, register, run ]));
			return yargs;
		});
	}
}

const globPaths = config.searchPaths.map(depPath => resolve(depPath, `${config.searchPrefix}-*`));
globby(globPaths).then((paths) => {
	paths.forEach((path) => {
		const commandWrapper = load(path);
		const { group, name } = commandWrapper;

		const commandsMap = groupsMap.get(group) || new Map();
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
