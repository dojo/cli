import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';
import { stub, SinonStub } from 'sinon';
const cs: any = require('cross-spawn');
let spawnStub: SinonStub;
let spawnOnStub: SinonStub;
const stopAndPersistStub: SinonStub = stub();
const startStub: SinonStub = stub().returns({
	stopAndPersist: stopAndPersistStub
});
let npmInstall: any;

registerSuite({
	name: 'npmInstall',
	setup() {
		mockery.enable({
			warnOnUnregistered: false
		});

		mockery.registerMock('ora', () => {
			return {
				start: startStub
			};
		});

		npmInstall = require('intern/dojo/node!./../../src/npmInstall');
	},
	teardown() {
		mockery.deregisterAll();
		mockery.disable();
	},
	'beforeEach'() {
		spawnOnStub = stub();
		const spawnOnResponse = {
			'on': spawnOnStub
		};

		startStub.reset();
		stopAndPersistStub.reset();
		spawnOnStub.returns(spawnOnResponse);
		spawnStub = stub(cs, 'spawn').returns(spawnOnResponse);
	},
	'afterEach'() {
		spawnStub.restore();
	},
	async 'Should call spawn to run an npm process'() {
		spawnOnStub.onFirstCall().callsArg(1);
		await npmInstall.default();
		assert.isTrue(spawnStub.calledOnce);
	},
	async 'Should use a loading spinner'() {
		spawnOnStub.onFirstCall().callsArg(1);
		await npmInstall.default();
		assert.isTrue(startStub.calledOnce, 'Should call start on the spinner');
		assert.isTrue(stopAndPersistStub.calledOnce, 'Should stop the spinner');
		assert.isTrue(stopAndPersistStub.firstCall.calledWithMatch('completed'),
			'Should persist completed message');
	},
	async 'Should reject with an error when spawn throws an error'() {
		const errorMessage = 'test error message';
		spawnOnStub.onSecondCall().callsArgWith(1, new Error(errorMessage));
		try {
			await npmInstall.default();
			assert.fail(null, null, 'Should not get here');
		}
		catch (error) {
			assert.equal(errorMessage, error.message);
			assert.isTrue(stopAndPersistStub.calledOnce, 'Should stop the spinner');
			assert.isTrue(stopAndPersistStub.firstCall.calledWithMatch('failed'),
				'Should persis the failed message');
		}
	}
});
