import { existsSync, mkdirsSync } from 'fs-extra';
import { log } from 'winston';

export default function (dirPath: string) {
	log('verbose', `createDir - called with ${dirPath}`);
	if (!existsSync(dirPath)) {
		log('verbose', `createDir - making folder ${dirPath}`);
		mkdirsSync(dirPath);
	}
};
