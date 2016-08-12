import * as yargs from 'yargs';
import setupLogger, { VerboseOptions } from '../util/setupLogger';
import setupUpdateNotifier from '../util/setupUpdateNotifier';
import getGlobPaths from '../util/getGlobPaths';
import * as chalk from 'chalk';
import * as globby from 'globby';
import config from './config';
const pkg = require('../../package.json');

type TaskConfig = {
	name: string;
	description: string;
	register: Function;
	run: Function;
};

type TasksMap = Map<string, TaskConfig[]>;

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

const taskSet = new Set<string>();
const tasksMap: TasksMap = new Map();

const helpUsage = `${chalk.bold('dojo help')}

Usage: dojo <task> [subTask] [options]

Hey there, here are all the things you can do with dojo-cli:`;

const helpEpilog = `For more information on any of these commands just run them with '-h'.

e.g. 'dojo run -h' will give you the help for the 'run' command.

(You are running dojo-cli ${pkg.version})`;

function getTaskDescription(taskType: string, taskSubTypes: TaskConfig[]): string {
	return taskSubTypes.length > 1 ?
		`There are ${taskSubTypes.length} ${taskType} subTasks: ${taskSubTypes.map((taskSubType: TaskConfig) => taskSubType.name).join(', ')}` :
		taskSubTypes[0].description;
}

function loadTaskFromPath(path: string): void {
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

	const taskConfig: TaskConfig = {
		name: computedName,
		description,
		register,
		run
	};

	if (tasksMap.has(taskType)) {
		tasksMap.get(taskType).push(taskConfig);
	} else {
		tasksMap.set(taskType, [ taskConfig ]);
	}
}

function registerTasks(tasksMap: TasksMap): void {
	for (let [ taskType, taskSubTypes ] of tasksMap.entries()) {
		const description = getTaskDescription(taskType, taskSubTypes);

		yargs.command(taskType, description, (yargs) => {
			taskSubTypes.map(({ name, description, register, run }) => yargs.command.apply(null, [ name, description, register, run ]));
			return yargs;
		});
	}
}

// Get paths, load tasks, register tasks
globby(getGlobPaths(config)).then((paths) => {
	paths.forEach(loadTaskFromPath);
	registerTasks(tasksMap);

	yargs.demand(1, 'must provide a valid command')
		.usage(helpUsage)
		.epilog(helpEpilog)
		.help('h')
		.alias('h', 'help')
		.argv;
});
