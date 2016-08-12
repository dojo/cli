import { add, remove, transports, log } from 'winston';

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

export function verbose(message: string) {
	log('verbose', message);
}

export function info(message: string) {
	log('info', message);
}
