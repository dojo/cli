import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as detectIndent from 'detect-indent';
import { Helper } from '@dojo/interfaces/cli';
import { loadExternalCommands } from '../allCommands';
import { white } from 'chalk';

const pkgDir = require('pkg-dir');

async function run(helper: Helper, args: {}) {
	const rootDir = pkgDir.sync(process.cwd());
	const dojoRcPath = join(rootDir, '.dojorc');
	const file = existsSync(dojoRcPath) && readFileSync(dojoRcPath, 'utf8');
	let json: { [name: string]: {} } = {};
	let indent = '\t';

	if (file) {
		indent = detectIndent(file).indent || indent;
		json = JSON.parse(file);
	}

	const { commandsMap } = await loadExternalCommands();
	const values = [];

	for (let [ , value ] of commandsMap.entries()) {
		const name = `${value.group}-${value.name}`;
		if (values.indexOf(value) === -1 && json[name] === undefined) {
			json[name] = {};
			values.push(value);
		}
	}

	writeFileSync(dojoRcPath, JSON.stringify(json, null, indent));
	console.log(white(`Successfully wrote .dojorc to ${dojoRcPath}`));
}

export default {
	name: '',
	group: 'init',
	description: 'create a .dojorc file',
	run,
	register: () => {}
};
