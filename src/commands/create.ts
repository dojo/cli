import * as chalk from 'chalk';
import renderFiles, { RenderFilesConfig} from '../util/renderFiles';
import { get as getPath } from '../util/path';
import { log } from 'winston';
import npmInstall from '../util/npmInstall';

interface CreateConfig {
	name: string;
	modules: ModuleConfigMap;
	typings: TypingsConfigMap;
	globalTypings: TypingsConfigMap;
}

interface ModuleConfigMap {
	[ moduleId: string ]: ModuleConfig;
}

interface ModuleConfig {
	version: string;
	packageLocation?: string;
	packageName?: string;
}

interface TypingsConfigMap {
	[ moduleId: string ]: string;
}

const isPosix = process.platform !== 'win32';
const SUCCESS_TICK = chalk.green(isPosix ? '✔' : '√');

export async function handler(commandConfig: { appName: string; }) {
	const createModulesConfig: CreateConfig = require(getPath('config', 'createModulesConfig.json'));
	const createFilesConfig: RenderFilesConfig = require(getPath('config', 'createFilesConfig.json'));

	createModulesConfig.name = commandConfig.appName;

	log('info', chalk.bold('-- Lets get started --'));

	await renderFiles(createFilesConfig, createModulesConfig);
	await npmInstall();

	log('info', chalk.green.bold('\n ' + SUCCESS_TICK + ' DONE'));
};

export const command = 'create <appName>';
export const describe = 'Create a new Dojo 2 application';
