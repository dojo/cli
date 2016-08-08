import * as path from 'path';
import { log } from 'winston';

export type PathId = 'templates'
	| 'config'
	| 'destRoot'
	| 'destSrc'
	| 'temp'
	| 'nodeModules'
	| 'projectCache';

interface PathMap {
	[ moduleId: string ]: string;
}

let paths: PathMap;

export function get(base: PathId, ...pathStr: string[]): string {
	if (!paths) {
		throw new Error('GET Config not called');
	}
	const resolvedPath = path.join(paths[base], ...pathStr);
	return resolvedPath;
}

export function setBasePaths(sourceBasePath: string, destBasePath: string): PathMap {
	if (!sourceBasePath || !destBasePath) {
		paths = undefined;
		return paths;
	}

	paths = {
		templates: path.join(sourceBasePath, 'templates'),
		config: path.join(sourceBasePath, 'config'),
		destRoot: destBasePath,
		destSrc: path.join(destBasePath, 'src'),
		temp: path.join(destBasePath, '_temp'),
		nodeModules: path.join(destBasePath, 'node_modules'),
		projectCache: path.join(destBasePath, '.dojo/cache')
	};

	log('verbose', 'paths:config - ' + JSON.stringify(paths));

	return paths;
}
