import * as yargs from 'yargs';
import setupLogger, { VerboseOptions } from '../util/setupLogger';
import setupUpdateNotifier from '../util/setupUpdateNotifier';
import * as chalk from 'chalk';
import * as globby from 'globby';
import * as path from 'path';
import config from './config';

const pkg = require('../../package.json');

// Get verbose settings
const verboseArgvs: VerboseOptions = yargs.option({
	'v': {
		alias: 'verbose',
		describe: 'Set console logging level to verbose'
	}
}).argv;

setupLogger(verboseArgvs.verbose);
setupUpdateNotifier(pkg, 0);

const pluginMap = new Map();
const taskTypes = new Set();

const helpUsage = `${chalk.bold('dojo help')}

Usage: dojo <task> [subTask] [options]

Hey there, here are all the things you can do with dojo-cli:`;

const helpEpilog = `For more information on any of these commands just run them with '-h'.

e.g. 'dojo run -h' will give you the help for the 'run' command.

(You are running dojo-cli ${pkg.version})`;

function globs(searchPaths: string[], searchPrefixes: string[]) {
	const globPaths: string[] = [];
	searchPaths.forEach((depPath) => {
		searchPrefixes.forEach((folderPrefix) => {
			globPaths.push(path.resolve(depPath, `${folderPrefix}-*`));
		});
	});
	return globPaths;
}

globby(globs(config.searchPaths, config.searchPrefixes)).then((paths) => {
	const tasks = paths.map((path) => {
		const task = require(path);
		const pluginParts = /dojo-cli-(.*)-(.*)/.exec(path);
		const taskType = pluginParts[1];
		const taskSubType = pluginParts[2];
		let computedName = taskSubType;
		let count = 1;

		taskTypes.add(taskType);

		while (pluginMap.has(computedName)) {
			computedName = `${computedName}-${count}`;
			count++;
		}

		pluginMap.set(computedName, task);

		return {
			type: taskType,
			args: [
				computedName,
				`${task.description} (${path})`,
				task.register,
				task.run
			]
		};
	});

	taskTypes.forEach((taskType) => {
		yargs.command(taskType, 'Compile list of subTasks for here', (yargs) => {
			tasks
				.filter((task) => task.type === taskType)
				.map((command) => yargs.command.apply(null, command.args));
			return yargs;
		});
	});

	yargs.demand(1, 'must provide a valid command')
		.usage(helpUsage)
		.help('h')
		.alias('h', 'help')
		.epilog(helpEpilog)
		.argv;
});
