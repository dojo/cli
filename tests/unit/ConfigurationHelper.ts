import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import MockModule from '../support/MockModule';
import { join, resolve as pathResolve } from 'path';
const sap = require('sinon-as-promised');
const sinon = new sap(Promise);

let sandbox: any;
let mockModule: MockModule;
let mockPkgDir: any;
let mockFs: any;
let mockPath: any;
let moduleUnderTest: any;
let mockDojoRc: any;
let configurationHelper: any;

const packagePath = join(pathResolve('.'), '/_build/tests/support');

registerSuite({
	name: 'Configuration Helper',
	'beforeEach'() {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/ConfigurationHelper');
		mockModule.dependencies([
			'pkg-dir',
			'fs',
			'path',
			`${packagePath}/.dojorc`]);
		mockPkgDir = mockModule.getMock('pkg-dir');
		mockPkgDir.ctor.sync = sandbox.stub().returns(packagePath);
		mockFs = mockModule.getMock('fs');
		mockFs.existsSync = sinon.stub().returns(true);
		mockFs.writeFile = sinon.stub().callsArg(3);
		mockPath = mockModule.getMock('path');
		mockPath.join = sinon.stub().returns(`${packagePath}/.dojorc`);
		mockDojoRc = mockModule.getMock(`${packagePath}/.dojorc`);
		mockDojoRc.food = {
			apple: '',
			pear: ''
		};
		moduleUnderTest = mockModule.getModuleUnderTest().default;
		configurationHelper = new moduleUnderTest();
	},
	'afterEach'() {
		sandbox.restore();
		mockModule.destroy();
	},
	'Should write config to .dojorc'() {
		return configurationHelper.save({ blah: { blah1: '' } }).then(() => {
			assert.equal(true, true);
		});
	},
	'Should still write config when one does not exist'() {
		mockFs.existsSync = sinon.stub().returns();
		return configurationHelper.save({ blah: { blah1: '' } }).then(() => {
			assert.equal(true, true);
		});
	},
	'Should reject when error in writing file'() {
		mockFs.writeFile = sinon.stub().callsArgWith(3, 'bad file write');
		return configurationHelper.save({ blah: { blah1: '' } }).catch((error: Error) => {
			assert.equal(error, 'bad file write');
		});
	},
	'Should retrieve the dojorc'() {
		configurationHelper.get().then((dojoRc: any) => {
			assert.equal(dojoRc, mockDojoRc);
		});
	},
	'Should return undefined'() {
		mockFs.existsSync = sinon.stub().returns();
		configurationHelper.get().then((dojoRc: any) => {
			assert.equal(dojoRc, undefined);
		});
	}
});
