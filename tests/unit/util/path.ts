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
	'setAppBasePath': {
		setup() {
			paths = pathUtil.setBasePaths(sourceBasePath, destBasePath);
		},
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
	'get': {},
	'createParentDir': {}
});
