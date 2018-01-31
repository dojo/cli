const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { stub, SinonStub } from 'sinon';
const cs: any = require('cross-spawn');
let spawnStub: SinonStub;
let spawnOnStub: SinonStub;
let npmInstall: any;

registerSuite('npmInstall', {
	before() {
		npmInstall = require('../../src/npmInstall');
	},
	beforeEach() {
		spawnOnStub = stub();
		const spawnOnResponse = {
			on: spawnOnStub
		};

		spawnOnStub.returns(spawnOnResponse);
		spawnStub = stub(cs, 'spawn').returns(spawnOnResponse);
	},
	afterEach() {
		spawnStub.restore();
	},

	tests: {
		async 'Should call spawn to run an npm process'() {
			spawnOnStub.onFirstCall().callsArg(1);
			await npmInstall.default();
			assert.isTrue(spawnStub.calledOnce);
		},
		async 'Should reject with an error when spawn throws an error'() {
			const errorMessage = 'test error message';
			spawnOnStub.onSecondCall().callsArgWith(1, new Error(errorMessage));
			try {
				await npmInstall.default();
				assert.fail(null, null, 'Should not get here');
			} catch (error) {
				assert.equal(errorMessage, error.message);
			}
		},
		async 'Should install dependencies'() {
			spawnOnStub.onFirstCall().callsArg(1);
			await npmInstall.installDependencies({ dependencies: { foo: '1.2.3' } });
			assert.isTrue(spawnStub.calledOnce);
			assert.isTrue(spawnStub.firstCall.args[1].indexOf('--save') > -1);
			assert.isTrue(spawnStub.firstCall.args[1].indexOf('foo@1.2.3') > -1);
		},
		async 'Should install dev dependencies'() {
			spawnOnStub.onFirstCall().callsArg(1);
			await npmInstall.installDevDependencies({ devDependencies: { bar: '1.2.3' } });
			assert.isTrue(spawnStub.calledOnce);
			assert.isTrue(spawnStub.firstCall.args[1].indexOf('--save-dev') > -1);
			assert.isTrue(spawnStub.firstCall.args[1].indexOf('bar@1.2.3') > -1);
		}
	}
});
