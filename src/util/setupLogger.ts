import { add, remove, transports } from 'winston';

export interface VerboseOptions {
	verbose?: boolean;
}

export default function setupLogger(verbose: boolean = false) {
	remove(transports.Console);
	add(transports.Console, {
		showLevel: false,
		level: verbose ? 'verbose' : 'info'
	});
}
