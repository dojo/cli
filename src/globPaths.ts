import { Config } from './config';
import { resolve } from 'path';
import { verbose } from './logger';

export default function globPaths({ searchPaths, searchPrefix }: Config): string[] {
	const globPaths: string[] = searchPaths.map((depPath) => {
		return resolve(depPath, `${searchPrefix}-*`);
	});
	verbose(`getGlobPaths - searchPaths: ${searchPaths}, searchPrefix: ${searchPrefix}, globPaths: ${globPaths}`);
	return globPaths;
}
