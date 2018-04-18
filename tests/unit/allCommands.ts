const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import MockModule from '../support/MockModule';
import * as sinon from 'sinon';

describe('AllCommands', () => {
	let moduleUnderTest: any;
	let mockModule: MockModule;
	let sandbox: any;
	let mockCommand: any;
	let mockLoadCommands: any;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/allCommands', require);
		mockModule.dependencies(['./command', './loadCommands', './config']);
		mockCommand = mockModule.getMock('./command');
		mockLoadCommands = mockModule.getMock('./loadCommands');

		const groupCCommandMap = new Map().set('a', { name: 'a', group: 'c', path: 'as' });
		const groupDCommandMap = new Map().set('b', { name: 'b', group: 'd', path: 'asas' });
		const groupMap = new Map().set('c', groupCCommandMap).set('d', groupDCommandMap);

		mockLoadCommands.loadCommands = sandbox.stub().resolves(groupMap);
		moduleUnderTest = mockModule.getModuleUnderTest();
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should run loadCommands to completion', () => {
		return moduleUnderTest
			.default()
			.then(function() {
				assert.isTrue(mockCommand.createBuiltInCommandLoader.calledOnce, 'should call builtin command loader');
				assert.isTrue(mockCommand.initCommandLoader.calledOnce, 'should call installed command loader');
				assert.isTrue(
					mockLoadCommands.enumerateBuiltInCommands.calledOnce,
					'should call builtin command enumerator'
				);
				assert.isTrue(
					mockLoadCommands.enumerateInstalledCommands.calledOnce,
					'should call installed command enumerator'
				);
				assert.isTrue(
					mockLoadCommands.enumerateInstalledCommands.calledAfter(mockLoadCommands.enumerateBuiltInCommands)
				);
				assert.isTrue(mockLoadCommands.loadCommands.calledTwice, 'should call load commands twice');
				assert.isTrue(
					mockLoadCommands.loadCommands.calledAfter(mockLoadCommands.enumerateInstalledCommands),
					'should call loadcommands after both enumerations'
				);
			})
			.catch(() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			});
	});
});
