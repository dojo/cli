export default {
	description: 'test-description',
	register() {
		return 'registered';
	},
	run() {
		return new Promise((resolve) => 'ran');
	}
};
