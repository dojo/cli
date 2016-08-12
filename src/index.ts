import * as yargs from 'yargs';
import logger, { VerboseOptions, verbose } from './logger';
import updateNotifier from './updateNotifier';
import globPaths from './globPaths';
import config from './config';
import * as command from './command';
import * as chalk from 'chalk';
import * as globby from 'globby';
const pkg = require('../package.json');

// Get verbose log settings first
const verboseArgvs: VerboseOptions = yargs.option({
	'v': {
		alias: 'verbose',
		describe: 'Set console logging level to verbose',
		type: 'boolean'
	}
}).argv;

logger(verboseArgvs.verbose);
updateNotifier(pkg, 0);

const commandsMap: command.CommandsMap = new Map();

const helpUsage = `${chalk.bold('dojo help')}

Usage: dojo <command> [subCommand] [options]

Hey there, here are all the things you can do with dojo-cli:`;

const helpEpilog = `For more information on any of these commands just run them with '-h'.

e.g. 'dojo run -h' will give you the help for the 'run' command.

(You are running dojo-cli ${pkg.version})`;

globby(globPaths(config)).then((paths) => {
	verbose(`index - loading commands`);
	const commandSet: command.CommandSet = new Set();
	paths.forEach((path) => {
		const commandConfig = command.load(path, commandSet);
		const commandType = commandConfig.type;

		if (commandsMap.has(commandType)) {
			commandsMap.get(commandType).push(commandConfig);
		} else {
			commandsMap.set(commandType, [ commandConfig ]);
		}
	});

	verbose(`index - registering commands`);
	command.register(commandsMap);

	yargs.demand(1, 'must provide a valid command')
		.usage(helpUsage)
		.epilog(helpEpilog)
		.help('h')
		.alias('h', 'help')
		.argv;
});
