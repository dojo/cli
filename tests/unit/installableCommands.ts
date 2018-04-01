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
		name: '@dojo/cli-other-foo',
		description: 'testDescription2',
		version: 'testVersion2'
	};

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/installableCommands', require);
		mockModule.dependencies(['execa', 'cross-spawn', 'configstore', './configurationHelper']);

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
			assert.isTrue(
				mockExeca.ctor.calledWithMatch('npm', ['search', '@dojo', 'cli-', '--json', '--searchstaleness', '0']),
				'calls npm search'
			);
		});
	});

	it('does not await check for installable commands if config store contains commands', () => {
		mockConfigStoreGet.withArgs('commands').returns([testCommandDetails]);
		return moduleUnderTest.default('testName').then((commands: NpmPackageDetails[]) => {
			assert.isTrue(mockConfigStoreGet.calledWith('commands'), 'checks for stored commands');
			assert.isTrue(mockExeca.ctor.notCalled, 'does not call npm search');
		});
	});

	it('filters out @dojo/cli from search results', () => {
		mockExeca.ctor.resolves({
			stdout: `[{"name": "dojo-cli-helper"}, {"name": "@dojo/cli"}, {"name": "@dojo/cli-test"}]`
		});
		return moduleUnderTest.default('testName').then((commands: NpmPackageDetails[]) => {
			assert.equal(commands.length, 1);
			assert.equal(commands[0].name, '@dojo/cli-test');
		});
	});

	it('creates installable command prompts', () => {
		const groupMap = moduleUnderTest.mergeInstalledCommandsWithAvailableCommands(new Map(), [
			testCommandDetails,
			testCommandDetails2
		]);
		assert.equal(groupMap.size, 2);

		assert.equal(groupMap.get('test').get('command').name, 'command');
		assert.equal(groupMap.get('other').get('foo').name, 'foo');
	});

	it('does not generate duplicate command prompts', () => {
		const groupMap = moduleUnderTest.mergeInstalledCommandsWithAvailableCommands(new Map(), [
			testCommandDetails,
			testCommandDetails
		]);
		assert.equal(groupMap.size, 1);
		assert.equal(groupMap.get('test').size, 1);
	});

	it('does not create command prompts for ejected commands', () => {
		configHelperGetStub.returns({ ejected: true });
		const groupMap = moduleUnderTest.mergeInstalledCommandsWithAvailableCommands(new Map(), [testCommandDetails]);
		assert.equal(groupMap.size, 0);
	});

	it('shows installation instructions for installable commands', () => {
		const groupMap = moduleUnderTest.mergeInstalledCommandsWithAvailableCommands(new Map(), [testCommandDetails]);
		return groupMap
			.get('test')
			.get('command')
			.run()
			.then(() => {
				(console.log as sinon.SinonStub).calledWith(
					`\nTo install this command run ${chalk.green('npm i @dojo/cli-test-command')}\n`
				);
			});
	});

	it('can merge installed commands with available commands', () => {
		const groupMap = new Map();
		const commandMap = new Map();
		groupMap.set('test', commandMap);
		commandMap.set('installed', {});
		moduleUnderTest.mergeInstalledCommandsWithAvailableCommands(groupMap, [testCommandDetails]);

		assert.equal(groupMap.size, 1);
		assert.equal(groupMap.get('test').size, 2);
		assert.isTrue(groupMap.get('test').has('command'));
		assert.isTrue(groupMap.get('test').has('installed'));
	});
});
