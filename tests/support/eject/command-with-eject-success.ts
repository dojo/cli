export const description = 'eject-description';
export const name = 'test-eject';
export const group = 'test-group';
export function register() {
	return 'registered';
};
export function	run() {
	return new Promise((resolve) => 'ran');
}
export function eject(helper: any, npm: any, files: any) {
	npm({
		dependencies: {
			foo: '1.0.0'
		},
		devDependencies: {
			bar: '1.0.0'
		},
		scripts: {
			baz: 'pwd'
		}
	});

	files([
		__dirname + '/../blah.js',
		__dirname + '/../another-valid-package/package.json',
		__dirname + '/../commands/invalid-built-in-command.js'
	]);
}
