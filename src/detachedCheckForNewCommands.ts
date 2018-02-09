import { getLatestCommands } from './installableCommands';

const options = JSON.parse(process.argv[2]);

getLatestCommands(options.name)
	.then(() => {
		process.exit();
	})
	.catch(() => {
		process.exit(1);
	});
