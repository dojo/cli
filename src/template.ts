import { renderFile } from 'ejs';
import { writeFile, ensureDir } from 'fs-extra';
import chalk from 'chalk';

export function ejsRender(source: string, replacements: Object): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		renderFile(source, replacements, (err: Error, str?: string) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(str);
		});
	});
}

export function writeRenderedFile(str: string, destination: string): Promise<void> {
	return ensureDir(destination).then(() => {
		return writeFile(destination, str);
	});
}

export default async function(source: string, destination: string, replacements: Object): Promise<void> {
	console.info(chalk.green.bold(' create ') + destination);
	const str = await ejsRender(source, replacements);
	await writeRenderedFile(str, destination);
}
