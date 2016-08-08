import * as chalk from 'chalk';
import { log } from 'winston';
// Not a TS module
const spawn = require('cross-spawn');

export default async function () {
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
