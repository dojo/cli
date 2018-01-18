const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');
import chalk from 'chalk';

import { NpmPackageDetails } from '../../src/interfaces';

import MockModule from '../support/MockModule';
import * as sinon from 'sinon';

describe('installableCommands', () => {

	let moduleUnderTest: any;
	let mockModule: MockModule;
	let sandbox: sinon.SinonSandbox;
	let mockConfigStore: any;
	let mockConfigStoreGet: sinon.SinonStub;
	let mockConfigStoreSet: sinon.SinonStub;
	let mockConfigurationHelper: any;
	let configHelperGetStub: sinon.SinonStub;
	let mockCrossSpawn: any;
	let mockExeca: any;
	const ONE_DAY = 1000 * 60 * 60 * 24;
	const testCommandDetails = {
		name: '@dojo/cli-test-command',
		description: 'testDescription',
		version: 'testVersion'
	};
	const testCommandDetails2 = {
		name: '@dojo/cli-test-foo',
		description: 'testDescription2',
		version: 'testVersion2'
	};

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/installableCommands', require);
		mockModule.dependencies([
			'execa',
			'cross-spawn',
			'configstore',
			'./configurationHelper'
		]);

		mockConfigStore = mockModule.getMock('configstore');
		mockConfigStoreGet = sinon.stub();
		mockConfigStoreGet.withArgs('commands').returns([]);
		mockConfigStoreGet.withArgs('lastUpdated').returns(Date.now() - ONE_DAY);
		mockConfigStoreSet = sinon.stub();
		mockConfigStore.ctor.returns({
			get: mockConfigStoreGet,
			set: mockConfigStoreSet
		});

		mockCrossSpawn = mockModule.getMock('cross-spawn');
		mockCrossSpawn.ctor.returns({
			unref: sandbox.stub()
		});

		mockExeca = mockModule.getMock('execa');
		mockExeca.ctor.resolves({ stdout: '[]' });

		mockConfigurationHelper = mockModule.getMock('./configurationHelper').default;
		configHelperGetStub = sandbox.stub().returns({ ejected: false });
		sandbox.stub(mockConfigurationHelper, 'sandbox').returns({
			get: configHelperGetStub
		});

		moduleUnderTest = mockModule.getModuleUnderTest();

		sandbox.stub(console, 'log');
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should check for installable commands if the config store is empty', () => {
		return moduleUnderTest.default('testName').then((commands: NpmPackageDetails[]) => {
			assert.isTrue(mockConfigStoreGet.calledWith('commands'), 'checks for stored commands');
			assert.isTrue(mockExeca.ctor.calledWithMatch('npm', [ 'search', '@dojo', 'cli-', '--json', '--searchstaleness', '0' ]), 'calls npm search');
		});
	});

	it('does not await check for installable commands if config store contains commands', () => {
		mockConfigStoreGet.withArgs('commands').returns([ testCommandDetails ]);
		return moduleUnderTest.default('testName').then((commands: NpmPackageDetails[]) => {
			assert.isTrue(mockConfigStoreGet.calledWith('commands'), 'checks for stored commands');
			assert.isTrue(mockExeca.ctor.notCalled, 'does not call npm search');
		});
	});

	it('filters out @dojo/cli from search results', () => {
		mockExeca.ctor.resolves({ stdout: `[{"name": "@dojo/cli"}, {"name": "@dojo/cli-test"}]` });
		return moduleUnderTest.default('testName').then((commands: NpmPackageDetails[]) => {
			assert.equal(commands.length, 1);
			assert.equal(commands[0].name, '@dojo/cli-test');
		});
	});

	it('creates installable command prompts', () => {
		const { commandsMap, yargsCommandNames } = moduleUnderTest.createInstallableCommandPrompts([ testCommandDetails, testCommandDetails2 ]);
		assert.equal(commandsMap.size, 3);
		assert.isTrue(commandsMap.has('test'));
		assert.equal(commandsMap.get('test').name, 'command');
		assert.equal(commandsMap.get('test').group, 'test');

		assert.equal(yargsCommandNames.size, 1);
		assert.isTrue(yargsCommandNames.has('test'));
		assert.isTrue(yargsCommandNames.get('test').has('test-command'));
		assert.isTrue(yargsCommandNames.get('test').has('test-foo'));
	});

	it('does not create command prompts for ejected commands', () => {
		configHelperGetStub.returns({ ejected: true });
		const { commandsMap, yargsCommandNames } = moduleUnderTest.createInstallableCommandPrompts([ testCommandDetails ]);
		assert.equal(commandsMap.size, 0);
		assert.equal(yargsCommandNames.size, 0);
	});

	it('shows installation instructions for installable commands', () => {
		const { commandsMap } = moduleUnderTest.createInstallableCommandPrompts([ testCommandDetails ]);
		return commandsMap.get('test').run().then(() => {
			(console.log as sinon.SinonStub).calledWith(`\nTo install this command run ${chalk.green('npm i @dojo/cli-test-command')}\n`);
		});
	});

	it('can merge installed commands with available commands', () => {
		const commandsMap = new Map();
		const yargsCommandNames = new Map();
		commandsMap.set('installed', { name: 'installed-command' });
		yargsCommandNames.set('installed', new Set());
		const installedCommands = {
			commandsMap,
			yargsCommandNames
		};
		const mergedCommands = moduleUnderTest.mergeInstalledCommandsWithAvailableCommands(installedCommands, [ testCommandDetails ]);

		assert.equal(mergedCommands.commandsMap.size, 3);
		assert.isTrue(mergedCommands.commandsMap.has('test'));
		assert.isTrue(mergedCommands.commandsMap.has('test-command'));
		assert.isTrue(mergedCommands.commandsMap.has('installed'));
		assert.equal(mergedCommands.yargsCommandNames.size, 2);
		assert.isTrue(mergedCommands.yargsCommandNames.has('test'));
		assert.isTrue(mergedCommands.yargsCommandNames.has('installed'));
	});
});
