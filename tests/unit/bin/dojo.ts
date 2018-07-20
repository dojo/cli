const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import MockModule from '../../support/MockModule';
import * as sinon from 'sinon';

describe('cli .bin', () => {
	let mockModule: MockModule;
	let mockIndex: any;
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../../src/bin/dojo', require);
		mockModule.dependencies(['../index']);
		mockIndex = mockModule.getMock('../index');
		mockIndex.init = sandbox.stub().returns(Promise.resolve());

		mockModule.getModuleUnderTest();
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should call init', (test) => {
		assert.isTrue(mockIndex.init.called);
	});
});
