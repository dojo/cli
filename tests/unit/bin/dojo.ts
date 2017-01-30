import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import MockModule from '../../support/MockModule';
import * as sinon from 'sinon';

const allCommands = require('intern/dojo/node!../../../src/allCommands');

describe('cli .bin', () => {
	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockYargs: any;
	let mockAllCommandsPromise: Promise<any>;
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/bin/dojo');
		mockModule.dependencies(['yargs']);
		mockYargs = mockModule.getMock('yargs');
		mockYargs.ctor.command = sandbox.stub();
		mockYargs.ctor.demand = sandbox.stub().returns(mockYargs.ctor);
		mockYargs.ctor.usage = sandbox.stub().returns(mockYargs.ctor);
		mockYargs.ctor.epilog = sandbox.stub().returns(mockYargs.ctor);
		mockYargs.ctor.help = sandbox.stub().returns(mockYargs.ctor);
		mockYargs.ctor.alias = sandbox.stub().returns(mockYargs.ctor);
		mockYargs.ctor.strict = sandbox.stub().returns(mockYargs.ctor);
		mockAllCommandsPromise = new Promise((resolve) => setTimeout(resolve, 1000));
		sandbox.stub(allCommands, 'default').resolves(mockAllCommandsPromise);
		moduleUnderTest = mockModule.getModuleUnderTest();
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should call yargs', () => {
		mockAllCommandsPromise.then(() => {
			assert.isTrue(mockYargs.ctor.command.called);
			assert.isTrue(mockYargs.ctor.demand.called);
			assert.isTrue(mockYargs.ctor.usage.called);
			assert.isTrue(mockYargs.ctor.epilog.called);
			assert.isTrue(mockYargs.ctor.help.called);
			assert.isTrue(mockYargs.ctor.alias.called);
			assert.isTrue(mockYargs.ctor.strict.called);
		});
	});
});
