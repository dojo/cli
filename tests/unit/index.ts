const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import MockModule from '../support/MockModule';
import * as OrigSinon from 'sinon';
const sap = require('sinon-as-promised');
const sinon = new sap(Promise);
import { join, resolve as pathResolve } from 'path';

describe('cli main module', () => {

	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockPkgDir: any;
	let sandbox: any;
	let mockUpdate: any;
	let mockAllCommands: any;
	let mockRegisterCommands: any;

	it('should run functions in order', () => {
		describe('inner', () => {
			beforeEach(() => {

				sandbox = sinon.sandbox.create();
				mockModule = new MockModule('../../src/index', require);
				mockModule.dependencies([
					'./updateNotifier',
					'pkg-dir',
					'yargs',
					'./allCommands',
					'./registerCommands']);
				mockPkgDir = mockModule.getMock('pkg-dir');
				mockPkgDir.ctor.sync = sandbox.stub().returns(join(pathResolve('.'), '/_build/tests/support/valid-package'));

				mockUpdate = mockModule.getMock('./updateNotifier');
				mockAllCommands = mockModule.getMock('./allCommands');
				mockAllCommands.default = sandbox.stub().resolves({
					commandsMap: new Map([
							['key1', {name: 'a', group: 'c', path: 'as'}],
							['key2', {name: 'b', group: 'd', path: 'asas'}]
						]),
					yargsCommandNames: new Map([
						['key3', new Set(['a', 'b'])],
						['key4', new Set(['d', 'e'])]
					])
				});
				mockRegisterCommands = mockModule.getMock('./registerCommands');
				sandbox.stub(console, 'log');
				moduleUnderTest = mockModule.getModuleUnderTest();
			});

			afterEach(() => {
				sandbox.restore();
				mockModule.destroy();
			});

			it('should run init to completion', () => {
				assert.isTrue(mockUpdate.default.calledOnce, 'should call update notifier');
				assert.isTrue(mockAllCommands.default.calledOnce, 'should call init');
				assert.isTrue(mockRegisterCommands.default.calledOnce, 'should call register commands');
				assert.isTrue(mockRegisterCommands.default.calledAfter(mockAllCommands.default),
					'should call register commands after init');
			});
		});

	});
	it('should catch runtime errors', () => {
		describe('runtime error inner', () => {
			const errMessage = 'ugh - oh noes';
			const expectedError = new Error(errMessage);

			beforeEach(() => {

				sandbox = sinon.sandbox.create();
				mockModule = new MockModule('../../src/index', require);
				mockModule.dependencies([
					'./updateNotifier',
					'pkg-dir',
					'yargs']);
				mockPkgDir = mockModule.getMock('pkg-dir');
				mockPkgDir.ctor.sync = sandbox.stub().returns(join(pathResolve('.'), '/_build/tests/support/valid-package'));

				mockUpdate = mockModule.getMock('./updateNotifier');
				mockUpdate.default = sandbox.stub().throws(expectedError);
				sandbox.stub(console, 'log');
				moduleUnderTest = mockModule.getModuleUnderTest();
			});

			afterEach(() => {
				sandbox.restore();
				mockModule.destroy();
			});

			it('catches runtime error', () => {
				assert.throw(mockUpdate.default, Error, errMessage);
				assert.equal((<OrigSinon.SinonStub> console.log).args[0][0], `Commands are not available: Error: ${errMessage}`);
			});
		});

	});
});
