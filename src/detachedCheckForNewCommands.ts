import { getLatestCommands } from './installableCommands';
import LoggingHelper from './LoggingHelper';

const options = JSON.parse(process.argv[2]);

getLatestCommands(options.name, new LoggingHelper())
	.then(() => {
		process.exit();
	})
	.catch(() => {
		process.exit(1);
	});
