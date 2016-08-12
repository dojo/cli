import { add, remove, transports } from 'winston';
import config from '../lib/config';

export interface VerboseOptions {
	verbose?: boolean;
}

export default function setupLogger(verbose: boolean = false) {
	remove(transports.Console);
	add(transports.Console, {
		showLevel: false,
		level: verbose ? 'verbose' : 'info'
	});

	add(transports.File, {
		filename: config.logPath,
		level: 'verbose'
	});
}
