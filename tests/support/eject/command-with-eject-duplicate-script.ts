export const description = 'test-description';
export const name = 'test-builtin';
export const group = 'test-group';
export function register() {
	return 'registered';
};
export function	run() {
	return new Promise((resolve) => 'ran');
};
export function eject(helper: any, npm: any, files: any) {
	npm({
		scripts: {
			blah: 'pwd'
		}
	});
	files([]);
};
