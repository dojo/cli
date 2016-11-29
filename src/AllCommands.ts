import config from './config';
import { loadCommands, enumerateInstalledCommands, enumerateBuiltInCommands, YargsCommandNames } from './loadCommands';
import { initCommandLoader, createBuiltInCommandLoader, CommandsMap } from './command';

class AllCommands {
	public commands: CommandsMap;
	public yargsCommandNames: YargsCommandNames;

	public constructor() {}

	public async init() {
		if (!this.commands) {
			const builtInCommandLoader = createBuiltInCommandLoader();
			const installedCommandLoader = initCommandLoader(config.searchPrefix);

			// look for commands in a 'commands` subdir of our current location
			const builtInCommandsPaths = await enumerateBuiltInCommands(config);
			const installedCommandsPaths = await enumerateInstalledCommands(config);

			const builtInCommands = await loadCommands(builtInCommandsPaths, builtInCommandLoader);
			const installedCommands = await loadCommands(installedCommandsPaths, installedCommandLoader);

			// combine the inbuilt and installed commands - last in wins when keys clash
			this.commands = new Map([...installedCommands.commandsMap, ...builtInCommands.commandsMap]);
			this.yargsCommandNames = new Map([...installedCommands.yargsCommandNames, ...builtInCommands.yargsCommandNames]);
		}
	}
}
export let allCommands = new AllCommands();
