module.exports = function (grunt) {
	require('grunt-dojo2').initConfig(grunt, {
		intern: {
			options: {
				nodeOptions: [
					'--harmony',
					'--harmony_default_parameters'
				]
			}
		}
	});
};
