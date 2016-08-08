import { get as getPath, PathId } from './path';
import template from './template';
import * as chalk from 'chalk';
import { log } from 'winston';

export type RenderFilesConfig = [PathId, string, PathId, string][]

export default async function (renderFilesConfig: RenderFilesConfig, renderData: any) {
	log('info', chalk.bold('-- Rendering Files --'));
	let renderPromises: Promise<void>[] = [];

	await renderFilesConfig.forEach(([srcBase, srcFile, destBase, destFile]) => {
		renderPromises.push(template(getPath(srcBase, srcFile), getPath(destBase, destFile), renderData));
	});

	const renderResponses = await Promise.all(renderPromises);
	const renderDisplayCount = chalk.green(renderResponses.length.toString());

	log('info', chalk.bold.green('Summary: ') + `Rendered: ${renderDisplayCount}`);
};
