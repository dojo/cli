import { getLatestCommands } from './installableCommands';
import * as Configstore from 'configstore';

const options = JSON.parse(process.argv[2]);
const conf = new Configstore(options.name);

getLatestCommands(options.name, conf).then(() => {
	process.exit();
}).catch(() => {
	process.exit(1);
});
