import { red, green } from 'chalk';
const cs: any = require('cross-spawn');
const ora: any = require('ora');

export default async function () {
	return new Promise((resolve, reject) => {
		const spinner = ora({
			spinner: 'dots',
			color: 'white',
			text: 'npm install'
		}).start();
		cs.spawn('npm', ['install'], { stdio: 'ignore' })
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
