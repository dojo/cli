const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import MockModule from '../support/MockModule';
import * as sinon from 'sinon';
import chalk from 'chalk';

describe('LoggingHelper', () => {
	let mockModule: MockModule;
	let loggingHelper: any;

	let sandbox: sinon.SinonSandbox;
	let logStub: sinon.SinonStub;
	let warnStub: sinon.SinonStub;
	let infoStub: sinon.SinonStub;
	let errorStub: sinon.SinonStub;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		logStub = sandbox.stub(console, 'log');
		warnStub = sandbox.stub(console, 'warn');
		infoStub = sandbox.stub(console, 'info');
		errorStub = sandbox.stub(console, 'error');

		mockModule = new MockModule('../../src/LoggingHelper', require);
		const moduleUnderTest = mockModule.getModuleUnderTest();
		loggingHelper = new moduleUnderTest.default();
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should call console.log with arguments', () => {
		loggingHelper.log('one', 'two', 'three');
		assert.isTrue(logStub.alwaysCalledWithExactly('one', 'two', 'three'));
	});

	it('should call info and wrap args in green', () => {
		loggingHelper.info('one', 'two', 'three');
		assert.isTrue(infoStub.alwaysCalledWithExactly(chalk.green('one two three')));
	});

	it('should call warn and wrap args in yellow', () => {
		loggingHelper.warn('one', 'two', 'three');
		assert.isTrue(warnStub.alwaysCalledWithExactly(chalk.yellow('one two three')));
	});

	it('should call error and wrap args in red', () => {
		loggingHelper.error('one', 'two', 'three');
		assert.isTrue(errorStub.alwaysCalledWithExactly(chalk.red('one two three')));
	});
});
