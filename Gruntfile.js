module.exports = function (grunt) {
	require('grunt-dojo2').initConfig(grunt, {
		copy: {
			staticTestFiles: {
				expand: true,
				cwd: '.',
				src: 'tests/**/*.json',
				dest: '<%= tsconfig.compilerOptions.outDir %>'
			}
		}
	});
};
