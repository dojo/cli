import chalk from 'chalk';
import { LoggingHelper as LoggingHelperInterface } from './interfaces';

export class LoggingHelper implements LoggingHelperInterface {
	info(...args: any[]) {
		console.info(chalk.green(args.join(' ')));
	}

	log(...args: any[]) {
		console.log(...args);
	}

	warn(...args: any[]) {
		console.warn(chalk.yellow(args.join(' ')));
	}

	error(...args: any[]) {
		console.error(chalk.red(args.join(' ')));
	}
}

export default LoggingHelper;
