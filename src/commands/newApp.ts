import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import { readdirSync } from 'fs-extra';
import { render } from  '../util/template';
import { get as getPath, PathId } from '../util/path';
import { log } from 'winston';

// Not a TS module
const spawn = require('cross-spawn');

interface AppConfig {
	name: string;
	modules: ModuleConfigMap;
	description: string;
	typings: TypingsConfigMap;
	globalTypings: TypingsConfigMap;
}

interface CreateAnswers extends inquirer.Answers {
	version: string;
	modules: string[];
	name: string;
	description: string;
}

interface ModuleConfig {
	version: string;
	buildFromSource?: boolean;
	peerDependencies?: string[];
	typings?: TypingsConfigMap;
	globalTypings?: TypingsConfigMap;
}

interface ModuleConfigMap {
	[ moduleId: string ]: ModuleConfig;
}

interface ProceedAnswers extends inquirer.Answers {
	proceed: boolean;
}

interface SkipConfig {
	npm: boolean;
	git: boolean;
	render: boolean;
	force: boolean;
}

interface TypingsConfigMap {
	[ moduleId: string ]: string;
}

let appConfig: AppConfig;
let skip: SkipConfig;

function checkForAppName(name: any): void {
	if (!name || name.length === 0) {
		log('error', chalk.red('Error: ') + 'App Name is Required');
		process.exit(1);
	}
};

function checkForEmptyDir(dirPath: string, exit: boolean = false): void | boolean {
	const folderContents = readdirSync(dirPath);
	const isEmpty = folderContents.length === 0;

	if (!isEmpty && exit) {
		log('error', chalk.red('Error: ') + 'Directory is not empty');
		process.exit(1);
	} else {
		return isEmpty;
	}
};

async function proceedCheck(name: string) {
	let response = await inquirer.prompt([{
		type: 'confirm',
		name: 'proceed',
		message: `Do you wish to proceed with creating ${name}?`,
		default: true
	}]);

	if (!(<ProceedAnswers> response).proceed) {
		log('error', chalk.red('\nExiting: ') + 'User chose to exit');
		process.exit(1);
	}
}

const filesToRender: [PathId, string, PathId, string][] = [
	[ 'templates', '_package.json', 'destRoot', 'package.json' ],
	[ 'templates', '_Gruntfile.js', 'destRoot', 'Gruntfile.js' ],
	[ 'templates', '_typings.json', 'destRoot', 'typings.json' ],
	[ 'templates', 'tsconfig.json', 'destRoot', 'tsconfig.json' ],
	[ 'templates', 'tslint.json', 'destRoot', 'tslint.json' ],
	[ 'templates', '_editorconfig', 'destRoot', '.editorconfig' ],
	[ 'templates', 'index.html', 'destSrc', 'index.html' ],
	[ 'templates', 'index.ts', 'destSrc', 'index.ts' ],
	[ 'templates', 'app.ts', 'destSrc', 'app.ts' ],
	[ 'templates', 'app.styl', 'destSrc', 'app.styl']
];

async function renderFiles() {
	if (skip.render) { return; }

	log('info', chalk.bold('-- Rendering Files --'));
	let renderPromises: Promise<void>[] = [];

	await filesToRender.forEach(async ([srcBase, srcFile, destBase, destFile]) => {
		renderPromises.push(render(getPath(srcBase, srcFile), getPath(destBase, destFile), appConfig));
	});

	const renderResponses = await Promise.all(renderPromises);
	const renderDisplayCount = chalk.green(renderResponses.length.toString());

	log('info', chalk.bold.green('Summary: ') + `Rendered: ${renderDisplayCount}`);
};

function getSelectedModuleConfig(selectedModuleIds: string[], availableModuleConfig: ModuleConfigMap): ModuleConfigMap {
	let modules: ModuleConfigMap = {};

	// Get just the module config we care about
	Object.keys(availableModuleConfig).forEach((moduleId) => {
		if (selectedModuleIds.indexOf(moduleId) > -1) {
			modules[moduleId] = availableModuleConfig[moduleId];
		}
	});

	return modules;
}

function getPeerDependencies(modules: ModuleConfigMap, allVersionedModules: ModuleConfigMap): ModuleConfigMap {
	const returnModules = Object.assign({}, modules);
	let addedCount = 0;

	for (let moduleId in returnModules) {
		const module = returnModules[moduleId];
		const modulePeerDeps = module.peerDependencies;

		if (modulePeerDeps) {
			const currentDependencies = Object.keys(returnModules);
			modulePeerDeps.forEach(peerDepId => {
				if (currentDependencies.indexOf(peerDepId) < 0) {
					log('info', chalk.green('Dependency Added: ') + `Module: ${moduleId} requires PeerDependency of ${peerDepId}`);
					addedCount++;
					returnModules[peerDepId] = allVersionedModules[peerDepId];
				}
			});
		}
	}

	const addedDisplayCount = chalk.green(addedCount.toString());
	log('info', chalk.bold.green('Summary: ') + `Added: ${addedDisplayCount}`);

	return returnModules;
}

function mergeTypings(moduleId: string, source: TypingsConfigMap, destination: TypingsConfigMap) {
	for (let typingId in source) {
		const typingVersion = source[typingId];
		if (!destination[typingId]) {
			destination[typingId] = typingVersion;
		} else if (destination[typingId] !== typingVersion) {
			log('info', chalk.yellow('Typing Dependency Warning: ') + `Module: ${moduleId} requires typing of ${typingId}:${typingVersion} but conflict found`);
		}
	}
}

function getTypings(modules: ModuleConfigMap): [TypingsConfigMap, TypingsConfigMap] {
	const typings: TypingsConfigMap = {};
	const globalTypings: TypingsConfigMap = {};

	for (let moduleId in modules) {
		const module = modules[moduleId];
		module.typings && mergeTypings(moduleId, module.typings, typings);
		module.globalTypings && mergeTypings(moduleId, module.globalTypings, globalTypings);
	}

	return [typings, globalTypings];
}

function createAppConfig(answers: CreateAnswers, availableModules: any) {
	log('info', chalk.bold('-- Creating AppConfig From Answers --'));

	const allVersionedModules: ModuleConfigMap = availableModules[answers.version].modules;
	const selectedModuleConfig = getSelectedModuleConfig(answers.modules, allVersionedModules);
	const allDependencies = getPeerDependencies(selectedModuleConfig, allVersionedModules);
	const [typings, globalTypings] = getTypings(allDependencies);

	appConfig = {
		name: answers.name,
		description: answers.description,
		modules: allDependencies,
		typings,
		globalTypings
	};
};

async function installDependencies() {
	if (skip.npm) { return; }

	log('info', chalk.bold('-- Running npm install --'));

	return new Promise((resolve, reject) => {
		spawn('npm', ['install'], { stdio: 'inherit' })
			.on('close', resolve)
			.on('error', (err: Error) => {
				log('info', 'ERROR: ' + err);
				reject();
			});
	});
}

export async function createNew(name: string, skipConfig: SkipConfig) {
	const modPath = getPath('config', 'availableModules.json');
	const availableModules = require(modPath);
	const questions: inquirer.Questions = [
		{
			type: 'text',
			name: 'description',
			message: 'Enter a brief description of the app you are creating'
		},
		{
			type: 'list',
			name: 'version',
			message: 'What configuration of Dojo modules would you like?',
			choices: (): inquirer.ChoiceType[] => {
				return Object.keys(availableModules)
					.map((key) => {
						let config = availableModules[key];
						return { name: config.name, value: key };
					});
			},
			default: 0
		},
		{
			type: 'checkbox',
			name: 'modules',
			message: 'Which modules would you like to use?',
			choices: (answers: CreateAnswers): inquirer.ChoiceType[] => {
				let chosenModules = availableModules[answers.version].modules;
				return Object.keys(chosenModules)
					.filter(name => !chosenModules[name].hidden)
					.map((name) => {
						return { name, checked: !!chosenModules[name].checked };
					});
			}
		}
	];
	skip = skipConfig;

	checkForAppName(name);

	if (!skip.force) {
		checkForEmptyDir(getPath('destRoot', ''), true);
	}

	log('info', chalk.bold('-- Lets get started --\n'));

	await proceedCheck(name);
	let answers = await inquirer.prompt(questions);
	(<CreateAnswers> answers).name = name;
	await createAppConfig(<CreateAnswers> answers, availableModules);
	await renderFiles();
	await installDependencies();

	log('info', chalk.green.bold('\n ✔ DONE'));
};
