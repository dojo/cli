const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');
import template from './../../src/template';
import * as fs from 'fs-extra';
import { stub, SinonStub } from 'sinon';

let writeFileStub: SinonStub;
let mkdirsStub: SinonStub;
let consoleStub: SinonStub;
let existsSyncStub: SinonStub;
let mkdirSyncStub: SinonStub;
const testEjsSrc = 'tests/support/template.ejs';
const testDest = '/tmp/test/destination';
const value = 'testValue';

registerSuite('template', {
	before() {
		consoleStub = stub(console, 'info');
	},
	after() {
		consoleStub.restore();
	},
	beforeEach() {
		writeFileStub = stub(fs, 'writeFile').callsArg(2);
		mkdirsStub = stub(fs, 'mkdirsSync');
		mkdirSyncStub = stub(fs, 'mkdirSync');
		existsSyncStub = stub(fs, 'existsSync').returns(true);
	},
	afterEach() {
		mkdirSyncStub.restore();
		existsSyncStub.restore();
		writeFileStub.restore();
		mkdirsStub.restore();
	},

	tests: {
		async 'directories are checked to exist'() {
			await template(testEjsSrc, testDest, { value });
			assert.isTrue(existsSyncStub.called);
			assert.strictEqual(existsSyncStub.firstCall.args[0], '/tmp/test');
		},
		async 'creates directories if they do not exist'() {
			existsSyncStub.onCall(0).returns(false);
			existsSyncStub.onCall(1).returns(false);
			existsSyncStub.onCall(2).returns(true);
			await template(testEjsSrc, testDest, { value });
			assert.isTrue(existsSyncStub.called);
			assert.strictEqual(existsSyncStub.firstCall.args[0], '/tmp/test');
			assert.strictEqual(existsSyncStub.secondCall.args[0], '/tmp');
			assert.strictEqual(existsSyncStub.thirdCall.args[0], '/');
			assert.strictEqual(mkdirSyncStub.callCount, 2);
		},
		async 'can render ejs file'() {
			await template(testEjsSrc, testDest, { value });
			assert.strictEqual(writeFileStub.firstCall.args[1].trim(), value);
		},
		async 'write file is called with dest path'() {
			await template(testEjsSrc, testDest, { value });
			assert.strictEqual(writeFileStub.firstCall.args[0], testDest);
		}
	}
});
