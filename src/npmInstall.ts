import { red, green } from 'chalk';
import { NpmPackage } from './interfaces';
const cs: any = require('cross-spawn');
const ora: any = require('ora');

function convertToInlineDependencies(dependencies: {[key: string]: string}): string[] {
	return Object.keys(dependencies).reduce((inlineDependencies: string[], key: string) => {
		inlineDependencies.push(`${key}@${dependencies[key]}`);
		return inlineDependencies;
	}, []);
}

async function npmInstall(args: string[] = []) {
	return new Promise((resolve, reject) => {
		const spinner = ora({
			spinner: 'dots',
			color: 'white',
			text: 'npm install'
		}).start();
		cs.spawn('npm', ['install', ...args], { stdio: 'ignore' })
			.on('close', () => {
				spinner.stopAndPersist(green.bold(' completed'));
				resolve();
			})
			.on('error', (err: Error) => {
				spinner.stopAndPersist(red.bold(' failed'));
				reject(err);
			});
	});
}

export async function installDevDependencies({ devDependencies = {} }: NpmPackage) {
	return npmInstall(['--save-dev', ...convertToInlineDependencies(devDependencies)]);
}

export async function installDependencies({ dependencies = {} }: NpmPackage) {
	return npmInstall(['--save', ...convertToInlineDependencies(dependencies)]);
}

export default npmInstall;
