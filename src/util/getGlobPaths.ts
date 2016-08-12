import { Config } from '../lib/config';
import { resolve } from 'path';

export default function getGlobPaths({ searchPaths, searchPrefixes }: Config): string[] {
	const globPaths: string[] = [];
	searchPaths.forEach((depPath) => {
		searchPrefixes.forEach((folderPrefix) => {
			globPaths.push(resolve(depPath, `${folderPrefix}-*`));
		});
	});
	return globPaths;
}
