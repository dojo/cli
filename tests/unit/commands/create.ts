// import * as registerSuite from 'intern!object';
// import * as assert from 'intern/chai!assert';
// import * as create from 'src/commands/create';
// import * as pathUtil from 'src/util/path';
// // import * as fs from 'fs-extra';
// import { stub, SinonStub } from 'sinon';

// let promptStub: SinonStub;
// const appName = 'testApp';
// const sourceBasePath = 'testSourcePath';
// const destBasePath = 'testDestPath';
// let paths: any;
// let pathGetStub: SinonStub;
// // let mkdirsStub: SinonStub;
// // const testEjsSrc = 'tests/template.ejs';
// // const testDest = '/tmp/test/destination';
// // const value = 'testValue';

// registerSuite({
// 	name: 'command-newApp',
// 	beforeAll() {
// 		paths = pathUtil.setBasePaths(sourceBasePath, destBasePath);
// 	},
// 	'createNew': {
// 		beforeAll() {
// 			// console.log('stubbing: ' + paths.config + '/availableModules.json');
// 			// requireAvailaleStub = stub(require, 'nodeRequire').withArgs(paths.config + '/availableModules.json').returns({'test': 'value'});
// 			pathGetStub = stub(pathUtil, 'get').withArgs('config', 'createConfig.json').returns('../../support/availableModules.json');
// 		},
// 		afterAll() {
// 			pathGetStub.restore();
// 		},
// 		beforeEach() {
// 			// promptStub = stub(inquirer, 'prompt');
// 			// mkdirsStub = stub(fs, 'mkdirsSync');
// 		},
// 		afterEach() {
// 			promptStub.restore();
// 			// mkdirsStub.restore();
// 		},
// 		'should ask the user if they wish to proceed'() {
// 			return create.handler(appName).then(function () {
// 				assert.isTrue(true);
// 			});
// 		}
// 	}
// });
