import * as mockery from 'mockery';
import * as sinon from 'sinon';
import * as path from 'path';

function resolvePath(base: string, mid: string): string {
	if (mid[0] !== '.') {
		return mid;
	}
	return path.resolve(base, mid);
}

export default class MockModule {
	private basePath: string;
	private moduleUnderTestPath: string;
	private mocks: any;
	private sandbox: sinon.SinonSandbox;

	constructor(moduleUnderTestPath: string, require: NodeRequire) {
		this.moduleUnderTestPath = require.resolve(moduleUnderTestPath);
		this.basePath = path.dirname(this.moduleUnderTestPath);
		this.sandbox = sinon.sandbox.create();
		this.mocks = {};
	}

	dependencies(dependencies: string[]): void {
		dependencies.forEach((dependencyName) => {
			let dependency;
			try {
				if (dependencyName.startsWith('.')) {
					dependency = require(resolvePath(this.basePath, dependencyName));
				} else {
					dependency = require(dependencyName);
				}
			} catch (e) {
				dependency = {};
			}
			const mock: any = {};

			for (let prop in dependency) {
				if (typeof dependency[prop] === 'function') {
					mock[prop] = function() {};
					this.sandbox.stub(mock, prop);
				} else {
					mock[prop] = dependency[prop];
				}
			}

			if (typeof dependency === 'function') {
				const ctor = this.sandbox.stub().returns(mock);
				mockery.registerMock(dependencyName, ctor);
				mock.ctor = ctor;
			} else {
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
		mockery.registerAllowable(this.moduleUnderTestPath, true);
		return require(this.moduleUnderTestPath);
	}

	destroy(): void {
		this.sandbox.restore();
		mockery.deregisterAll();
		mockery.disable();
	}
}
