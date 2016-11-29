import { RootRequire } from 'dojo-interfaces/loader';
declare const require: RootRequire;

import * as mockery from 'mockery';
import * as sinon from 'sinon';

const dojoNodePlugin = 'intern/dojo/node';

function load(modulePath: string): any {
	const mid = `${dojoNodePlugin}!${modulePath}`;
	return require(mid);
}

function unload(modulePath: string): void {
	const abs = require.toUrl(modulePath);
	const plugin = require.toAbsMid(dojoNodePlugin);
	require.undef(`${plugin}!${abs}`);
}

function resolvePath(basePath: string, modulePath: string): string {

	if (modulePath.startsWith('./')) {
		return modulePath.replace('./', `${basePath}/`);
	} else if (modulePath.startsWith('..')) {
		return modulePath.replace('../', `${basePath.substr(0, basePath.lastIndexOf('/'))}/`);
	} else {
		return modulePath;
	}
}

function getBasePath(modulePath: string): string {
	const chunks = modulePath.split('/');
	chunks.pop();
	return chunks.join('/');
}

export default class MockModule {
	private basePath: string;
	private moduleUnderTestPath: string;
	private mocks: any;
	private sandbox: sinon.SinonSandbox;

	constructor(moduleUnderTestPath: string) {
		this.basePath = getBasePath(moduleUnderTestPath);
		this.moduleUnderTestPath = moduleUnderTestPath;
		this.sandbox = sinon.sandbox.create();
		this.mocks = {};
	}

	dependencies(dependencies: string[]): void {
		dependencies.forEach((dependencyName) => {
			let dependency = load(resolvePath(this.basePath, dependencyName));
			const mock: any = {};

			for (let prop in dependency) {
				if (typeof dependency[prop] === 'function') {
					mock[prop] = function () {};
					this.sandbox.stub(mock, prop);
				} else {
					mock[prop] = dependency[prop];
				}
			}

			if (typeof dependency === 'function') {
				const ctor = this.sandbox.stub().returns(mock);
				mockery.registerMock(dependencyName, ctor);
				mock.ctor = ctor;
			}
			else {
				mockery.registerMock(dependencyName, mock);
			}
			this.mocks[dependencyName] = mock;
		});
	}

	getMock(dependencyName: string): any {
		return this.mocks[dependencyName];
	}

	getModuleUnderTest(): any {
		mockery.enable({ warnOnUnregistered: false });
		const allowable = require.toUrl(this.moduleUnderTestPath) + '.js';
		mockery.registerAllowable(allowable, true);
		return load(this.moduleUnderTestPath);
	}

	destroy(): void {
		unload(this.moduleUnderTestPath);
		this.sandbox.restore();
		mockery.deregisterAll();
		mockery.disable();
	}
}
