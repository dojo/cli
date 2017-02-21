import { NpmPackage } from './interfaces';
const cs: any = require('cross-spawn');

function convertToInlineDependencies(dependencies: {[key: string]: string}): string[] {
	return Object.keys(dependencies).reduce((inlineDependencies: string[], key: string) => {
		inlineDependencies.push(`${key}@${dependencies[key]}`);
		return inlineDependencies;
	}, []);
}

async function npmInstall(args: string[] = []) {
	return new Promise((resolve, reject) => {
		cs.spawn('npm', ['--silent', 'install', ...args], { stdio: 'inherit' })
			.on('close', () => {
				resolve();
			})
			.on('error', (err: Error) => {
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
