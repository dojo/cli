module.exports = function (grunt) {
	var staticFiles = [ 'templates/**', 'config/**' ];

	require('grunt-dojo2').initConfig(grunt, {
		ts: {
			dist: {
				exclude: [
					'./src/templates',
					"./tests/**/*.ts"
				]
			}
		},
		copy: {
			staticDevFiles: {
				expand: true,
				cwd: 'src',
				src: staticFiles,
				dest: '<%= devDirectory %>/src'
			},
			staticDistFiles: {
				expand: true,
				cwd: 'src',
				src: staticFiles,
				dest: '<%= distDirectory %>'
			}
		},
		typedoc: {
			options: {
				ignoreCompilerErrors: true // Remove this once compile errors are resolved
			}
		}
	});

	grunt.registerTask('dev', grunt.config.get('devTasks').concat(['copy:staticDevFiles']));
	grunt.registerTask('dist', grunt.config.get('distTasks').concat(['copy:staticDistFiles']));

	grunt.registerTask('ci', [
		'intern:node'
	]);
};
