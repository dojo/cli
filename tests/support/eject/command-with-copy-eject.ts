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
	return {
		copy: {
			path: 'testPath',
			files: [
				'./file1',
				'./file2'
			]
		}
	};
}
