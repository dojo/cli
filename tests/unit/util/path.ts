import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as pathUtil from 'src/util/path';

const sourceBasePath = 'testSourcePath';
const destBasePath = 'testDestPath';
const pathProperties: any = {
	templates: 'source',
	config: 'source',
	destRoot: 'dest',
	destSrc: 'dest',
	temp: 'dest',
	nodeModules: 'dest',
	projectCache: 'dest'
};

let paths: any;

registerSuite({
	name: 'util-path',
	beforeEach() {
		paths = pathUtil.setBasePaths(sourceBasePath, destBasePath);
	},
	'setBasePaths': {
		'setting returns paths object'() {
			assert.isObject(paths);
			const keys = Object.keys(pathProperties);
			keys.forEach(prop => {
				assert.isTrue(paths.hasOwnProperty(prop));
				assert.isString(paths[prop]);
			});
		},
		'generated paths should have the correct base directory'() {
			const keys = Object.keys(pathProperties);
			keys.forEach(prop => {
				const expectedBase = pathProperties[prop] === 'source' ? sourceBasePath : destBasePath;
				assert.isTrue(paths[prop].indexOf(expectedBase) === 0, `Expected base path of ${prop} to be ${expectedBase}`);
			});
		}
	},
	'get': {
		'should throw error if paths not set'() {
			pathUtil.setBasePaths(null, null);
			let resolvedPath: void | string;
			let errorThrown = false;
			try {
				resolvedPath = pathUtil.get('templates', 'testPath');
			}
			catch (e) {
				assert.isUndefined(resolvedPath);
				errorThrown = true;
			}
			assert.isTrue(errorThrown);
		},
		'should return joined path when given a base and a path'() {
			const pathStrs = [
				'testPath',
				'/testPath',
				'//testPath'
			];
			Object.keys(pathProperties).forEach(basePath => {
				const expected = paths[basePath] + '/testPath';
				pathStrs.forEach(pathStr => {
					const resolvedPath = pathUtil.get(<pathUtil.PathId> basePath, pathStr);
					assert.strictEqual(resolvedPath, expected);
				});
			});
		},
		'should return joined path when given multiple paths'() {
			const testPaths: [string[], string][] = [
				[['testPath1', 'testPath2'], '/testPath1/testPath2'],
				[['testPath1', 'testPath2', 'testPath3'], '/testPath1/testPath2/testPath3'],
				[['/testPath1', '/testPath2'], '/testPath1/testPath2'],
				[['//testPath1', '//testPath2', '//testPath3'], '/testPath1/testPath2/testPath3']
			];
			Object.keys(pathProperties).forEach(basePath => {
				testPaths.forEach(([testPath, expectedPathEnd]) => {
					const resolvedPath = pathUtil.get(<pathUtil.PathId> basePath, ...testPath);
					assert.strictEqual(resolvedPath, paths[basePath] + expectedPathEnd);
				});
			});
		}
	}
});
