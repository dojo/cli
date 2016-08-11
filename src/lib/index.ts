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
		describe: 'Set console logging level to verbose',
		type: 'boolean'
	}
}).argv;

setupLogger(verboseArgvs.verbose);
setupUpdateNotifier(pkg, 0);

const taskSet = new Set();
const taskTypes = new Map();

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

// TODO: fix :any usages
function getTaskDescription(taskType: string, taskSubTypes: any) {
	return taskSubTypes.length > 1 ?
		`There are ${taskSubTypes.length} ${taskType} subTasks: ${taskSubTypes.map((taskSubType: any) => taskSubType.name).join(', ')}` :
		taskSubTypes[0].description;
}

globby(globs(config.searchPaths, config.searchPrefixes)).then((paths) => {
	paths.forEach((path) => {
		const { description, register, run } = require(path);
		const pluginParts = /dojo-cli-(.*)-(.*)/.exec(path);
		const taskType = pluginParts[1];
		const taskSubType = pluginParts[2];
		let computedName = taskSubType;
		let count = 1;

		while (taskSet.has(computedName)) {
			computedName = `${computedName}-${count}`;
			count++;
		}

		taskSet.add(computedName);

		const taskConfig = {
			name: computedName,
			description,
			register,
			run
		};

		if (taskTypes.has(taskType)) {
			taskTypes.get(taskType).push(taskConfig);
		} else {
			taskTypes.set(taskType, [ taskConfig ]);
		}
	});

	// TODO: Fix this :any
	let taskType: string, taskSubTypes: any[];
	for ([ taskType, taskSubTypes ] of taskTypes.entries()) {
		const description = getTaskDescription(taskType, taskSubTypes);

		yargs.command(taskType, description, (yargs) => {
			taskSubTypes.map(({ name, description, register, run }) => yargs.command.apply(null, [ name, description, register, run ]));
			return yargs;
		});
	}

	yargs.demand(1, 'must provide a valid command')
		.usage(helpUsage)
		.epilog(helpEpilog)
		.help('h')
		.alias('h', 'help')
		.argv;
});
