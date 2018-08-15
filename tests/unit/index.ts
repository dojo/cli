const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import MockModule from '../support/MockModule';
import * as sinon from 'sinon';
import { join } from 'path';
import chalk from 'chalk';

describe('cli main module', () => {
	let mockModule: MockModule;
	let mockPkgDir: any;
	let mockInstallableCommands: any;
	let sandbox: sinon.SinonSandbox;
	let mockUpdate: any;
	let mockAllCommands: any;
	let mockRegisterCommands: any;
	let mergeStub: sinon.SinonStub;
	let init: any;
	let warnStub: sinon.SinonStub;

	it('should run functions in order', () => {
		describe('inner', () => {
			beforeEach(() => {
				sandbox = sinon.sandbox.create();
				mockModule = new MockModule('../../src/index', require);
				mockModule.dependencies([
					'./updateNotifier',
					'pkg-dir',
					'yargs',
					'fs',
					'./allCommands',
					'./registerCommands',
					'./installableCommands'
				]);

				mockInstallableCommands = mockModule.getMock('./installableCommands');
				mockInstallableCommands.default = sandbox.stub().resolves([]);
				mergeStub = mockInstallableCommands.mergeInstalledCommandsWithAvailableCommands = sandbox
					.stub()
					.returnsArg(0);

				mockPkgDir = mockModule.getMock('pkg-dir');
				mockPkgDir.ctor.sync = sandbox.stub().returns(join(__dirname, '..', 'support/valid-package'));

				mockUpdate = mockModule.getMock('./updateNotifier');
				mockAllCommands = mockModule.getMock('./allCommands');
				mockAllCommands.default = sandbox.stub().resolves({
					commandsMap: new Map([
						['key1', { name: 'a', group: 'c', path: 'as' }],
						['key2', { name: 'b', group: 'd', path: 'asas' }]
					]),
					yargsCommandNames: new Map([['key3', new Set(['a', 'b'])], ['key4', new Set(['d', 'e'])]])
				});
				mockRegisterCommands = mockModule.getMock('./registerCommands');
				sandbox.stub(console, 'log');
				warnStub = sandbox.stub(console, 'warn');
				init = mockModule.getModuleUnderTest().init;
			});

			afterEach(() => {
				sandbox.restore();
				mockModule.destroy();
			});

			it('should run init to completion', async () => {
				await init();

				assert.isTrue(mockUpdate.default.calledOnce, 'should call update notifier');
				assert.isTrue(mockInstallableCommands.default.calledOnce, 'Should look for installable commands');
				assert.isTrue(mockAllCommands.default.calledOnce, 'should call init');
				assert.isTrue(mergeStub.calledAfter(mockAllCommands.default));
				assert.isTrue(mockRegisterCommands.default.calledOnce, 'should call register commands');
				assert.isTrue(
					mockRegisterCommands.default.calledAfter(mergeStub),
					'should call register commands after commands have been merged'
				);
			});

			it('warns the user if no package.json is present', async () => {
				const mockFs = mockModule.getMock('fs');
				mockFs.existsSync = sandbox.stub().returns(false);
				await init();
				assert.equal(
					warnStub.firstCall.args[0],
					chalk.yellow(
						'Warning: a package.json file was not found and is expected for many Dojo CLI commands. You can initialise one by running'
					)
				);
			});

			it('does not warn the user if package.json is present', async () => {
				const mockFs = mockModule.getMock('fs');
				mockFs.existsSync = sandbox.stub().returns(true);
				await init();
				assert.isFalse(warnStub.called);
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
				mockModule.dependencies(['./updateNotifier', 'pkg-dir', 'yargs']);
				mockPkgDir = mockModule.getMock('pkg-dir');
				mockPkgDir.ctor.sync = sandbox.stub().returns(join(__dirname, '..', 'support/valid-package'));

				mockUpdate = mockModule.getMock('./updateNotifier');
				mockUpdate.default = sandbox.stub().throws(expectedError);
				sandbox.stub(console, 'log');
				sandbox.stub(console, 'error');
				warnStub = sandbox.stub(console, 'warn');
				init = mockModule.getModuleUnderTest().init;
			});

			afterEach(() => {
				sandbox.restore();
				mockModule.destroy();
			});

			it('catches runtime error', async () => {
				await init();

				assert.throw(mockUpdate.default, Error, errMessage);
				assert.equal(
					(console.error as sinon.SinonStub).args[0][0],
					chalk.red(`Commands are not available: Error: ${errMessage}`)
				);
			});
		});
	});
});
