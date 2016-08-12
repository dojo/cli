import { Config } from '../lib/config';
import { resolve } from 'path';
import { log } from 'winston';

export default function getGlobPaths({ searchPaths, searchPrefix }: Config): string[] {
	const globPaths: string[] = searchPaths.map((depPath) => {
		return resolve(depPath, `${searchPrefix}-*`);
	});
	log('verbose', `getGlobPaths - searchPaths: ${searchPaths}, searchPrefix: ${searchPrefix}, globPaths: ${globPaths}`);
	return globPaths;
}
