const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');
import template from './../../src/template';
import * as fs from 'fs-extra';
import { stub, SinonStub } from 'sinon';

let writeFileStub: SinonStub;
let consoleStub: SinonStub;
let ensureDirStub: SinonStub;
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
		writeFileStub = stub(fs, 'writeFile').resolves();
		ensureDirStub = stub(fs, 'ensureDir').resolves();
	},
	afterEach() {
		ensureDirStub.restore();
		writeFileStub.restore();
	},

	tests: {
		async 'directories are checked to exist'() {
			await template(testEjsSrc, testDest, { value });
			assert.isTrue(ensureDirStub.called);
			assert.strictEqual(ensureDirStub.firstCall.args[0], '/tmp/test/destination');
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
