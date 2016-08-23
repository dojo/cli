module.exports = function (grunt) {
	require('grunt-dojo2').initConfig(grunt, {
		'ts': {
			'tests-umd': {
				'compilerOptions': {
					'module': 'umd',
					'outDir': '_build/tests/'
				},
				'include': [
					'./tests/**/*.ts',
					"./typings/index.d.ts"
				]
			},
			'src-cjs': {
				'compilerOptions': {
					'module': 'commonjs',
					'outDir': '_build/src'
				},
				'include': [
					"./typings/index.d.ts",
					'./src/**/*.ts'
				]
			}
		}
	});

	grunt.registerTask('dev', [
		'typings',
		'tslint',
		'clean:dev',
		'ts:tests-umd',
		'ts:src-cjs',
		'updateTsconfig'
	]);
};
