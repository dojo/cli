import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import createDir from 'src/util/createDir';
import * as fs from 'fs-extra';
import { stub, SinonStub } from 'sinon';

let existsStub: SinonStub;
let mkdirsStub: SinonStub;

registerSuite({
	name: 'util-createDir',
	'beforeEach'() {
		existsStub = stub(fs, 'existsSync');
		mkdirsStub = stub(fs, 'mkdirsSync');
	},
	'afterEach'() {
		existsStub.restore();
		mkdirsStub.restore();
	},
	'should check if folder exists and mkdir if not'() {
		createDir('/tmp/parentFolder/childFolder');
		assert.isTrue(existsStub.firstCall.calledWith('/tmp/parentFolder/childFolder'));
		assert.isTrue(mkdirsStub.firstCall.calledWith('/tmp/parentFolder/childFolder'));
	},
	'should not call mkdir if folder exists'() {
		existsStub.returns(true);
		createDir('/tmp/parentFolder/childFolder');
		assert.isTrue(existsStub.firstCall.calledWith('/tmp/parentFolder/childFolder'));
		assert.isTrue(mkdirsStub.notCalled);
	}
});
