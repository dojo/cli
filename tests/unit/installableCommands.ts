const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

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
	let mockCrossSpawn: any;
	let mockExeca: any;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/installableCommands', require);
		mockModule.dependencies([
			'execa',
			'cross-spawn',
			'configstore']);

		mockConfigStore = mockModule.getMock('configstore');
		mockConfigStoreGet = sinon.stub();
		mockConfigStoreGet.withArgs('commands').returns([]);
		mockConfigStoreGet.withArgs('lastUpdated').returns(Date.now());
		mockConfigStoreSet = sinon.stub();
		mockConfigStore.ctor.returns({
			get: mockConfigStoreGet,
			set: mockConfigStoreSet
		});

		mockCrossSpawn = mockModule.getMock('cross-spawn');
		mockCrossSpawn.spawn = sinon.stub();

		mockExeca = mockModule.getMock('execa');
		mockExeca.ctor.resolves({ stdout: '[]' });
		moduleUnderTest = mockModule.getModuleUnderTest();
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
});
