// import * as yargs from 'yargs';
import * as create from '../commands/create';
import { setBasePaths } from '../util/path';
import * as winston from 'winston';

const pkgDir = require('pkg-dir');
const yargs = require('yargs');

interface VerboseOptions {
	verbose?: boolean;
}

function setUpLogger(verbose: boolean = false) {
	winston.remove(winston.transports.Console);
	winston.add(winston.transports.Console, {
		showLevel: false,
		level: verbose ? 'verbose' : 'info'
	});

	winston.add(winston.transports.File, {
		filename: '.dojo-cli.log',
		level: 'verbose'
	});
}

// Get verbose settings
const verboseArgvs: VerboseOptions = yargs.option({
	'verbose': {
		alias: 'v',
		describe: 'Set console logging level to verbose'
	}
}).argv;

setUpLogger(verboseArgvs.verbose);
setBasePaths(pkgDir.sync(__dirname), process.cwd());

// Get the rest
yargs
	.usage('Usage: $0 [global options] <command> [options]')
	.strict()
	.command(create)
	.help()
	.argv;
