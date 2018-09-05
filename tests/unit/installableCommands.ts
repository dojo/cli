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
	let mockLibNpmSearch: any;

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
		mockModule.dependencies(['libnpmsearch', 'cross-spawn', 'configstore', './configurationHelper']);

		mockLibNpmSearch = mockModule.getMock('libnpmsearch');
		mockLibNpmSearch.ctor.resolves([]);

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

		mockConfigurationHelper = mockModule.getMock('./configurationHelper').default;
		configHelperGetStub = sandbox.stub().returns({ ejected: false });
		sandbox.stub(mockConfigurationHelper, 'sandbox').returns({
			get: configHelperGetStub
		});

		moduleUnderTest = mockModule.getModuleUnderTest();
		sandbox.stub(console, 'log');
		sandbox.stub(console, 'error');
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should check for installable commands if the config store is empty', () => {
		return moduleUnderTest.default('testName').then((commands: NpmPackageDetails[]) => {
			assert.isTrue(mockConfigStoreGet.calledWith('commands'), 'checks for stored commands');
			assert.isTrue(mockLibNpmSearch.ctor.calledWith('@dojo/cli-'), 'calls npm search');
		});
	});

	it('does not await check for installable commands if config store contains commands', () => {
		mockConfigStoreGet.withArgs('commands').returns([testCommandDetails]);
		return moduleUnderTest.default('testName').then((commands: NpmPackageDetails[]) => {
			assert.isTrue(mockConfigStoreGet.calledWith('commands'), 'checks for stored commands');
			assert.isTrue(mockLibNpmSearch.ctor.notCalled, 'does not call npm search');
		});
	});

	it('filters out none dojo scoped commands from search results', () => {
		mockLibNpmSearch.ctor.resolves([
			{
				name: '@company/cli-build-app',
				scope: 'company',
				version: '1.2.8',
				description: 'CLI command to build Company Framework applications'
			},
			{
				name: '@dojo/cli-build-app',
				scope: 'dojo',
				version: '3.0.7',
				description: 'CLI command to build Dojo applications'
			}
		]);
		return moduleUnderTest.default('testName').then((commands: NpmPackageDetails[]) => {
			assert.equal(commands.length, 1);
			assert.equal(commands[0].name, '@dojo/cli-build-app');
		});
	});

	it('filters out @dojo/cli from search results', () => {
		mockLibNpmSearch.ctor.resolves([
			{
				name: '@dojo/cli',
				scope: 'dojo',
				version: '3.0.0',
				description: 'Dojo CLI utility'
			},
			{
				name: '@dojo/cli-build-app',
				scope: 'dojo',
				version: '3.0.7',
				description: 'CLI command to build Dojo applications'
			}
		]);
		return moduleUnderTest.default('testName').then((commands: NpmPackageDetails[]) => {
			assert.equal(commands.length, 1);
			assert.equal(commands[0].name, '@dojo/cli-build-app');
		});
	});

	it('alerts the user if something went wrong in the search', async () => {
		const error = new Error('Test error');
		mockLibNpmSearch.ctor.rejects(error);
		await moduleUnderTest.default('testName');
		assert.equal((console.error as sinon.SinonStub).getCall(0).args[0], 'There was an error searching npm: ');
		assert.equal((console.error as sinon.SinonStub).getCall(0).args[1], 'Test error');
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
