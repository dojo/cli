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

function resolvePath(base: string, mid: string): string {
	const isRelative = mid.match(/\.\//);
	let result = base;
	if (isRelative) {
		if (mid.match(/^\.\//)) {
			mid = mid.replace(/\.\//, '');
		}
		const up = mid.match(/^(\.\.\/)/);
		if (up) {
			const chunks = base.split('/');
			chunks.splice(chunks.length - (up.length - 1));
			result = chunks.join('/');
			mid = mid.replace(/\.\.\//g, '');
		}
		mid = result + '/' + mid;
	}
	return mid;
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
		unload(this.moduleUnderTestPath);

		dependencies
			.map((dep) => resolvePath(this.basePath, dep))
			.map((dep) => unload(dep));

		dependencies.forEach((dependencyName) => {
			let dependency;
			try {
				dependency = load(resolvePath(this.basePath, dependencyName));
			}
			catch (e) {
				dependency = {};
			}
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
		mockery.enable({ warnOnUnregistered: false, useCleanCache: true });
		const allowable = require.toUrl(this.moduleUnderTestPath) + '.js';
		mockery.registerAllowable(allowable, true);
		return load(this.moduleUnderTestPath);
	}

	destroy(): void {
		unload(this.moduleUnderTestPath);
		Object.keys(this.mocks)
			.map((dep) => resolvePath(this.basePath, dep))
			.map((dep) => unload(dep));
		this.sandbox.restore();
		mockery.deregisterAll();
		mockery.disable();
	}
}
