const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');
import template from './../../src/template';
import * as fs from 'fs-extra';
import { stub, SinonStub } from 'sinon';

let writeFileStub: SinonStub;
let mkdirsStub: SinonStub;
let consoleStub: SinonStub;
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
	},
	afterEach() {
		writeFileStub.restore();
		mkdirsStub.restore();
	},

	tests: {
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
