import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import MockModule from '../../support/MockModule';
import * as sinon from 'sinon';

describe('cli .bin', () => {
	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockYargs: any;
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
		moduleUnderTest = mockModule.getModuleUnderTest();
	});

	afterEach(() => {
		mockModule.destroy();
	});

	it('should print help', () => {

	});
});
