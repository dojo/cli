import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
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
	let mockCommand: any;
	let mockLoadCommands: any;
	let mockRegisterCommands: any;

	it('should run functions in order', () => {
		describe('inner', () => {
			beforeEach(() => {

				sandbox = sinon.sandbox.create();
				mockModule = new MockModule('../../src/index');
				mockModule.dependencies([
					'./updateNotifier',
					'pkg-dir',
					'yargs',
					'./command',
					'./loadCommands',
					'./config',
					'./registerCommands']);
				mockPkgDir = mockModule.getMock('pkg-dir');
				mockPkgDir.ctor.sync = sandbox.stub().returns(join(pathResolve('.'), '/_build/tests/support/valid-package'));

				mockUpdate = mockModule.getMock('./updateNotifier');
				mockCommand = mockModule.getMock('./command');
				mockLoadCommands = mockModule.getMock('./loadCommands');
				mockRegisterCommands = mockModule.getMock('./registerCommands');

				mockLoadCommands.loadCommands = sandbox.stub().resolves({
					commandsMap: new Map([
						['key1', {name: 'a', group: 'c', path: 'as'}],
						['key2', {name: 'b', group: 'd', path: 'asas'}]
					]),
					yargsCommandNames: new Map([
						['key3', new Set(['a', 'b'])],
						['key4', new Set(['d', 'e'])]
					])
				});
				moduleUnderTest = mockModule.getModuleUnderTest().default;
				sandbox.stub(console, 'log');
			});

			afterEach(() => {
				sandbox.restore();
				mockModule.destroy();
			});

			it('should run init to completion', () => {
				assert.isTrue(mockUpdate.default.calledOnce, 'should call update notifier');

				assert.isTrue(mockCommand.createBuiltInCommandLoader.calledOnce, 'should call builtin command loader');
				assert.isTrue(mockCommand.initCommandLoader.calledOnce, 'should call installed command loader');

				assert.isTrue(mockLoadCommands.enumerateBuiltInCommands.calledOnce, 'should call builtin command enumerator');
				assert.isTrue(mockLoadCommands.enumerateInstalledCommands.calledOnce, 'should call installed command enumerator');
				assert.isTrue(mockLoadCommands.enumerateInstalledCommands.calledAfter(mockLoadCommands.enumerateBuiltInCommands));
				assert.isTrue(mockLoadCommands.loadCommands.calledTwice, 'should call load commands twice');
				assert.isTrue(mockLoadCommands.loadCommands.calledAfter(mockLoadCommands.enumerateInstalledCommands),
					'should call loadcommands after both enumerations');

				assert.isTrue(mockRegisterCommands.default.calledOnce, 'should call register commands');
				assert.isTrue(mockRegisterCommands.default.calledAfter(mockLoadCommands.loadCommands),
					'should call register commands after load commands');
			});
		});

	});
	it('should catch runtime errors', () => {
		describe('inner', () => {
			const errMessage = 'ugh - oh noes';
			const expectedError = new Error(errMessage);

			beforeEach(() => {

				sandbox = sinon.sandbox.create();
				mockModule = new MockModule('../../src/index');
				mockModule.dependencies([
					'./updateNotifier',
					'pkg-dir',
					'yargs',
					'./command',
					'./config']);
				mockPkgDir = mockModule.getMock('pkg-dir');
				mockPkgDir.ctor.sync = sandbox.stub().returns(join(pathResolve('.'), '/_build/tests/support/valid-package'));

				mockUpdate = mockModule.getMock('./updateNotifier');
				mockCommand = mockModule.getMock('./command');
				mockCommand.createBuiltInCommandLoader = sandbox.stub().throws(expectedError);

				sandbox.stub(console, 'log');
				moduleUnderTest = mockModule.getModuleUnderTest().default;
			});

			afterEach(() => {
				sandbox.restore();
				mockModule.destroy();
			});

			it('does', () => {
				assert.throw(mockCommand.createBuiltInCommandLoader, Error, errMessage);
				assert.equal((<OrigSinon.SinonStub> console.log).args[0][0], `Commands are not available: Error: ${errMessage}`);
			});
		});

	});
});
