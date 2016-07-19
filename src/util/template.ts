import { renderFile } from 'ejs';
import { writeFile } from 'fs-extra';
import * as chalk from 'chalk';
import { log } from 'winston';
import { createParentDir } from './path';

function ejsRender(source: string, replacements: Object): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		renderFile(source, replacements, (err: Error, str: string) => {
			if (err) {
				reject(err);
			}
			resolve(str);
		});
	});
}

function writeRenderedFile(str: string, destination: string): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		writeFile(destination, str, (err?: Error) => {
			if (err) {
				reject(err);
			}
			resolve();
		});
	});
}

export async function render(source: string, destination: string, replacements: Object): Promise<void> {
	log('info', chalk.green('Rendering: ') + `${destination}`);

	createParentDir(destination);
	const str = await ejsRender(source, replacements);
	await writeRenderedFile(str, destination);
};
