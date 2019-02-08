import { Command, CommandWrapper, GroupMap, OptionsHelper, Helper } from './interfaces';
import * as Configstore from 'configstore';
import config from './config';
const conf = new Configstore(config.configStore);
const ONE_DAY = 1000 * 60 * 60 * 24;
const moduleCache: { [key: string]: Command } = {};

/**
 * Function to create a loader instance, this allows the config to be injected
 * @param: searchPrefix A string that tells the command loader how cli commands will be named, ie.
 * 	'@dojo/cli-' is the default meaning commands could be
 * 		- '@dojo/cli-build-webpack'
 * 		- '@dojo/cli-serve-dist'
 */
export function initCommandLoader(searchPrefixes: string[]): (path: string) => CommandWrapper {
	const commandRegExp = new RegExp(`(?:${searchPrefixes.join('|').replace('/', '\\/')})-([^-]+)-(.+)$`);

	return function load(path: string): CommandWrapper {
		try {
			const lastUpdated = conf.get('loadLastUpdated');
			if (Date.now() - lastUpdated >= ONE_DAY) {
				conf.delete(path);
			}

			let command = conf.get(path);

			if (!command) {
				command = getCommandModule(path);
				conf.set(path, command);
			}

			const { description, register, run, alias, eject, global = false, validate } = command;

			//  derive the group and name from the module directory name, e.g. dojo-cli-group-name
			const [, group, name] = <string[]>commandRegExp.exec(path);

			// Lazy load modules if they haven't been loaded up front
			return {
				name,
				group,
				alias,
				description,
				installed: true,
				global: group === 'create' && name === 'app' ? true : global,
				run: run
					? run
					: function(helper: Helper) {
							return getCommandModule(path).run(helper);
					  },
				path,
				eject: eject
					? eject
					: function(helper: Helper) {
							const mod = getCommandModule(path);
							if (mod.eject) {
								return mod.eject(helper);
							}
					  },
				validate: validate
					? validate
					: function(helper: Helper) {
							const mod = getCommandModule(path);
							if (mod.validate) {
								return mod.validate(helper);
							}
					  },
				register: register
					? register
					: function(options: OptionsHelper, helper: Helper) {
							return getCommandModule(path).register(options, helper);
					  }
			};
		} catch (err) {
			throw new Error(`Path: ${path} returned module that does not satisfy the Command interface. ${err}`);
		}
	};
}

/**
 * Creates a builtIn command loader function.
 */
export function createBuiltInCommandLoader(): (path: string) => CommandWrapper {
	return function load(path: string): CommandWrapper {
		const module = require(path);

		try {
			const command = convertModuleToCommand(module);
			//  derive the name and group of the built in commands from the command itself (these are optional props)
			const { name = '', group = '', alias, description, register, run, global = false } = command;

			return {
				name,
				group,
				alias,
				global,
				installed: true,
				description,
				register,
				run,
				path
			};
		} catch (err) {
			throw new Error(`Path: ${path} returned module that does not satisfy the Command interface: ${err}`);
		}
	};
}

function getCommandModule(path: string): Command {
	if (!moduleCache[path]) {
		const moduleObj = require(path);
		const command = convertModuleToCommand(moduleObj);
		moduleCache[path] = command;
	}

	return moduleCache[path];
}

export function convertModuleToCommand(module: any): Command {
	if (module.__esModule && module.default) {
		module = module.default;
	}

	if (module.description && module.register && module.run) {
		return module;
	} else {
		throw new Error(`Module does not satisfy the Command interface`);
	}
}

export function getCommand(groupMap: GroupMap, groupName: string, commandName?: string): CommandWrapper {
	const commandMap = groupMap.get(groupName);
	if (!commandMap) {
		throw new Error(`Unable to find command group: ${groupName}`);
	}
	if (commandName) {
		const command = commandMap.get(commandName);
		if (!command) {
			throw new Error(`Unable to find command: ${commandName} for group: ${groupName}`);
		}
		return command;
	}
	return [...commandMap.values()].find((wrapper) => {
		return !!wrapper.default;
	})!;
}
