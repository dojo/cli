import * as yargs from 'yargs';
import setupLogger, { VerboseOptions } from '../util/setupLogger';
import setupUpdateNotifier from '../util/setupUpdateNotifier';
import getGlobPaths from '../util/getGlobPaths';
import * as chalk from 'chalk';
import * as globby from 'globby';
import config from './config';
const pkg = require('../../package.json');

type CommandConfig = {
	name: string;
	description: string;
	register: Function;
	run: Function;
};

type CommandsMap = Map<string, CommandConfig[]>;

// Get verbose log settings first
const verboseArgvs: VerboseOptions = yargs.option({
	'v': {
		alias: 'verbose',
		describe: 'Set console logging level to verbose',
		type: 'boolean'
	}
}).argv;

setupLogger(verboseArgvs.verbose);
setupUpdateNotifier(pkg, 0);

const commandSet = new Set<string>();
const commandsMap: CommandsMap = new Map();

const helpUsage = `${chalk.bold('dojo help')}

Usage: dojo <command> [subCommand] [options]

Hey there, here are all the things you can do with dojo-cli:`;

const helpEpilog = `For more information on any of these commands just run them with '-h'.

e.g. 'dojo run -h' will give you the help for the 'run' command.

(You are running dojo-cli ${pkg.version})`;

function getCommandDescription(commandType: string, commandSubTypes: CommandConfig[]): string {
	return commandSubTypes.length > 1 ?
		`There are ${commandSubTypes.length} ${commandType} subCommands: ${commandSubTypes.map((commandSubType: CommandConfig) => commandSubType.name).join(', ')}` :
		commandSubTypes[0].description;
}

function loadCommandFromPath(path: string): void {
	const { description, register, run } = require(path);
	const pluginParts = /dojo-cli-(.*)-(.*)/.exec(path);
	const commandType = pluginParts[1];
	const commandSubType = pluginParts[2];
	let computedName = commandSubType;
	let count = 1;

	while (commandSet.has(computedName)) {
		computedName = `${computedName}-${count}`;
		count++;
	}

	commandSet.add(computedName);

	const commandConfig: CommandConfig = {
		name: computedName,
		description,
		register,
		run
	};

	if (commandsMap.has(commandType)) {
		commandsMap.get(commandType).push(commandConfig);
	} else {
		commandsMap.set(commandType, [ commandConfig ]);
	}
}

function registerCommands(commandsMap: CommandsMap): void {
	for (let [ commandType, commandSubTypes ] of commandsMap.entries()) {
		const description = getCommandDescription(commandType, commandSubTypes);

		yargs.command(commandType, description, (yargs) => {
			commandSubTypes.map(({ name, description, register, run }) => yargs.command.apply(null, [ name, description, register, run ]));
			return yargs;
		});
	}
}

// Get paths, load commands, register commands
globby(getGlobPaths(config)).then((paths) => {
	paths.forEach(loadCommandFromPath);
	registerCommands(commandsMap);

	yargs.demand(1, 'must provide a valid command')
		.usage(helpUsage)
		.epilog(helpEpilog)
		.help('h')
		.alias('h', 'help')
		.argv;
});
