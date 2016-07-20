import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as template from 'src/util/template';
import * as fs from 'fs-extra';
import { stub, SinonStub } from 'sinon';

let writeFileStub: SinonStub;
let mkdirsStub: SinonStub;
const testEjsSrc = 'tests/template.ejs';
const testDest = '/tmp/test/destination';
const value = 'testValue';

registerSuite({
	name: 'util-template',
	beforeEach() {
		writeFileStub = stub(fs, 'writeFile').callsArg(2);
		mkdirsStub = stub(fs, 'mkdirsSync');
		// paths = pathUtil.setBasePaths(sourceBasePath, destBasePath);
	},
	afterEach() {
		writeFileStub.restore();
		mkdirsStub.restore();
	},
	'render': {
		'can render ejs file'() {
			return template.render(testEjsSrc, testDest, { value }).then(function () {
				assert.strictEqual(writeFileStub.firstCall.args[1], value);
			});
		},
		'write file is called with dest path'() {
			return template.render(testEjsSrc, testDest, { value }).then(function () {
				assert.strictEqual(writeFileStub.firstCall.args[0], testDest);
			});
		},
		'parent folder is made for template destination'() {
			return template.render(testEjsSrc, testDest, { value }).then(function () {
				assert.strictEqual(mkdirsStub.firstCall.args[0], '/tmp/test');
			});
		}
	}
});
