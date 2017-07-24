export default {
	description: 'test-description',
	name: 'test-name',
	group: 'test-group',
	register() {
		return 'registered';
	},
	run() {
		return new Promise((resolve) => 'ran');
	}
};
