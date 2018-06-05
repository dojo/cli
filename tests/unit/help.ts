const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import { formatHelp } from './../../src/help';
import { CommandWrapper, OptionsHelper, Helper } from '../../src/interfaces';

const groupMap = new Map();
const fooCommandMap = new Map<string, CommandWrapper>();
fooCommandMap.set('global', {
	name: 'global',
	group: 'foo',
	path: 'path/to/command',
	global: true,
	installed: true,
	description: 'a global command',
	default: true,
	register: (options: OptionsHelper, helper: Helper) => {
		options('foo', { description: 'a basic option' });
		options('bar', { defaultDescription: 'a required option', require: true });
	},
	run: () => Promise.resolve()
});
fooCommandMap.set('project', {
	name: 'project',
	group: 'foo',
	path: 'path/to/command',
	global: false,
	installed: true,
	description: 'a project command',
	default: false,
	register: (options: OptionsHelper, helper: Helper) => {
		options('foo', { desc: 'a basic option', alias: ['f', 'foooo '] });
		options('b', { defaultDescription: 'a required option', demandOption: true, alias: 'bar' });
	},
	run: () => Promise.resolve()
});
const barCommandMap = new Map<string, CommandWrapper>();
barCommandMap.set('default', {
	name: 'default',
	group: 'bar',
	path: 'path/to/command',
	global: false,
	installed: true,
	default: true,
	description: 'default installed command for bar',
	register: (options: OptionsHelper, helper: Helper) => {
		options('foo', { describe: 'a basic option', alias: ['f', 'foooo '] });
		options('b', { defaultDescription: 'a required option', required: true, alias: 'bar' });
	},
	run: () => Promise.resolve()
});
barCommandMap.set('other', {
	name: 'other',
	group: 'bar',
	path: 'path/to/command',
	global: true,
	installed: true,
	description: 'a another installed command for bar',
	register: (options: OptionsHelper, helper: Helper) => {
		options('foo', { defaultDescription: 'a basic option', alias: ['f', 'foooo '] });
		options('b', { defaultDescription: 'a required option', requiresArg: true, alias: 'bar' });
	},
	run: () => Promise.resolve()
});
barCommandMap.set('non-default', {
	name: 'non-default',
	group: 'bar',
	path: 'path/to/command',
	global: false,
	installed: true,
	description: 'An installable command for bar',
	register: (options: OptionsHelper, helper: Helper) => {
		options('foo', { alias: ['f', 'foooo '] });
		options('b', { defaultDescription: 'a required option', demand: true, alias: 'bar' });
		options('c', { defaultDescription: 'a choices option', choices: ['one', 'two'], alias: 'choice' });
	},
	run: () => Promise.resolve()
});
barCommandMap.set('installable', {
	name: 'installable',
	group: 'bar',
	path: 'npm i @dojo/cli-bar-installable',
	global: true,
	installed: false,
	description: 'An installable command for bar',
	register: (options: OptionsHelper, helper: Helper) => {},
	run: () => Promise.resolve()
});
groupMap.set('foo', fooCommandMap);
groupMap.set('bar', barCommandMap);

const expectedMainHelp = `\u001b[94m\u001b[39m\n\u001b[94m            ..\u001b[39m\n\u001b[94m          ';,,'..\u001b[39m\n\u001b[94m          .colllc,.                         .''''''...           .,,,.        ..         .,,,.\u001b[39m\n\u001b[94m        ...',:loooc.       ...''''''..      ;x'      ;;'      ':;,'.'',:;.    :o.    .:;,'..',;:.\u001b[39m\n\u001b[94m      .'''.     ....     .',;'..   ..'.     'l'       .c:    :c.        ,l'   ,l.   ,l'        'l;\u001b[39m\n\u001b[94m     .,,,.            ..;::,'..      ';.    'l'        .l,  ,l.          :c.  ,l.  .l,          'l.\u001b[39m\n\u001b[94m  .'..;;,.          .,:cc;'...       ,:'    'l'        .l;  :l.          ,l.  ,l.  'l.          .l,\u001b[39m\n\u001b[94m   ...;;;.       .':clc;.           .;:.    'l'        ,l.  'l'          c:   ,l.  .l;          ;l.\u001b[39m\n\u001b[94m      .:c:,..',:coooc,.           .';;'     'l'      .;c'    'c,.      .c:.   ,l.   .c:.      .;c.\u001b[39m\n\u001b[94m       .:okOOkkxo:,..   ........',,,'.      ,o:,,,,,,;'.        ;;,,,,;;      ,l.     ';;,,,,;;'\u001b[39m\n\u001b[94m       .''',;;,..  ....   ........                                            ,l.\u001b[39m\n\u001b[94m                   ',    .''.                                                .c:\u001b[39m\n\u001b[94m                   .'.. .;c;.                                                ..\u001b[39m\n\u001b[94m                     ..   .\u001b[39m\n\u001b[1mUsage:\u001b[22m\n\n  $ \u001b[92mdojo\u001b[39m \u001b[92m<group>\u001b[39m \u001b[32m[<command>]\u001b[39m [<options>] [--help]\n\n\u001b[1mGlobal Commands:\u001b[22m\n\n  \u001b[92mfoo\u001b[39m        \u001b[32mglobal\u001b[39m      A global command\n  \u001b[92mbar\u001b[39m        \u001b[32mother\u001b[39m       A another installed command for bar\n\n\u001b[1mProject Commands:\u001b[22m\n\n  \u001b[92mfoo\u001b[39m        \u001b[32mproject\u001b[39m     A project command\n  \u001b[92mbar\u001b[39m        \u001b[32mdefault\u001b[39m     Default installed command for bar\n             \u001b[32mnon-default\u001b[39m  An installable command for bar\n\n\u001b[1mInstallable Commands:\u001b[22m\n\n  \u001b[92mbar\u001b[39m        \u001b[32minstallable\u001b[39m  An installable command for bar\n`;
const expectedFooGroupHelp = `\u001b[94m\u001b[39m\n\u001b[94m            ..\u001b[39m\n\u001b[94m          ';,,'..\u001b[39m\n\u001b[94m          .colllc,.                         .''''''...           .,,,.        ..         .,,,.\u001b[39m\n\u001b[94m        ...',:loooc.       ...''''''..      ;x'      ;;'      ':;,'.'',:;.    :o.    .:;,'..',;:.\u001b[39m\n\u001b[94m      .'''.     ....     .',;'..   ..'.     'l'       .c:    :c.        ,l'   ,l.   ,l'        'l;\u001b[39m\n\u001b[94m     .,,,.            ..;::,'..      ';.    'l'        .l,  ,l.          :c.  ,l.  .l,          'l.\u001b[39m\n\u001b[94m  .'..;;,.          .,:cc;'...       ,:'    'l'        .l;  :l.          ,l.  ,l.  'l.          .l,\u001b[39m\n\u001b[94m   ...;;;.       .':clc;.           .;:.    'l'        ,l.  'l'          c:   ,l.  .l;          ;l.\u001b[39m\n\u001b[94m      .:c:,..',:coooc,.           .';;'     'l'      .;c'    'c,.      .c:.   ,l.   .c:.      .;c.\u001b[39m\n\u001b[94m       .:okOOkkxo:,..   ........',,,'.      ,o:,,,,,,;'.        ;;,,,,;;      ,l.     ';;,,,,;;'\u001b[39m\n\u001b[94m       .''',;;,..  ....   ........                                            ,l.\u001b[39m\n\u001b[94m                   ',    .''.                                                .c:\u001b[39m\n\u001b[94m                   .'.. .;c;.                                                ..\u001b[39m\n\u001b[94m                     ..   .\u001b[39m\n\u001b[1mUsage:\u001b[22m\n\n  $ \u001b[92mdojo\u001b[39m \u001b[92mfoo\u001b[39m \u001b[32m[<command>]\u001b[39m [<options>] [--help]\n\n\u001b[1mCommands:\u001b[22m\n\n  \u001b[92mfoo\u001b[39m        \u001b[32mglobal\u001b[39m      A global command (Default)\n             \u001b[32mproject\u001b[39m     A project command\n\n\u001b[1mDefault Command Options\u001b[22m\n\n  --\u001b[92mfoo\u001b[39m                A basic option\n  --\u001b[92mbar\u001b[39m                A required option [\u001b[33mrequired\u001b[39m]\n`;
const expectedBarGroupHelp = `\u001b[94m\u001b[39m\n\u001b[94m            ..\u001b[39m\n\u001b[94m          ';,,'..\u001b[39m\n\u001b[94m          .colllc,.                         .''''''...           .,,,.        ..         .,,,.\u001b[39m\n\u001b[94m        ...',:loooc.       ...''''''..      ;x'      ;;'      ':;,'.'',:;.    :o.    .:;,'..',;:.\u001b[39m\n\u001b[94m      .'''.     ....     .',;'..   ..'.     'l'       .c:    :c.        ,l'   ,l.   ,l'        'l;\u001b[39m\n\u001b[94m     .,,,.            ..;::,'..      ';.    'l'        .l,  ,l.          :c.  ,l.  .l,          'l.\u001b[39m\n\u001b[94m  .'..;;,.          .,:cc;'...       ,:'    'l'        .l;  :l.          ,l.  ,l.  'l.          .l,\u001b[39m\n\u001b[94m   ...;;;.       .':clc;.           .;:.    'l'        ,l.  'l'          c:   ,l.  .l;          ;l.\u001b[39m\n\u001b[94m      .:c:,..',:coooc,.           .';;'     'l'      .;c'    'c,.      .c:.   ,l.   .c:.      .;c.\u001b[39m\n\u001b[94m       .:okOOkkxo:,..   ........',,,'.      ,o:,,,,,,;'.        ;;,,,,;;      ,l.     ';;,,,,;;'\u001b[39m\n\u001b[94m       .''',;;,..  ....   ........                                            ,l.\u001b[39m\n\u001b[94m                   ',    .''.                                                .c:\u001b[39m\n\u001b[94m                   .'.. .;c;.                                                ..\u001b[39m\n\u001b[94m                     ..   .\u001b[39m\n\u001b[1mUsage:\u001b[22m\n\n  $ \u001b[92mdojo\u001b[39m \u001b[92mbar\u001b[39m \u001b[32m[<command>]\u001b[39m [<options>] [--help]\n\n\u001b[1mCommands:\u001b[22m\n\n  \u001b[92mbar\u001b[39m        \u001b[32mdefault\u001b[39m     Default installed command for bar (Default)\n             \u001b[32mother\u001b[39m       A another installed command for bar\n             \u001b[32mnon-default\u001b[39m  An installable command for bar\n             \u001b[32minstallable\u001b[39m  An installable command for bar\n\n\u001b[1mDefault Command Options\u001b[22m\n\n  -\u001b[92mf\u001b[39m, --\u001b[92mfoo\u001b[39m, --\u001b[92mfoooo \u001b[39m  A basic option\n  -\u001b[92mb\u001b[39m, --\u001b[92mbar\u001b[39m            A required option [\u001b[33mrequired\u001b[39m]\n`;
const expectedFooGlobalHelp = `\u001b[94m\u001b[39m\n\u001b[94m            ..\u001b[39m\n\u001b[94m          ';,,'..\u001b[39m\n\u001b[94m          .colllc,.                         .''''''...           .,,,.        ..         .,,,.\u001b[39m\n\u001b[94m        ...',:loooc.       ...''''''..      ;x'      ;;'      ':;,'.'',:;.    :o.    .:;,'..',;:.\u001b[39m\n\u001b[94m      .'''.     ....     .',;'..   ..'.     'l'       .c:    :c.        ,l'   ,l.   ,l'        'l;\u001b[39m\n\u001b[94m     .,,,.            ..;::,'..      ';.    'l'        .l,  ,l.          :c.  ,l.  .l,          'l.\u001b[39m\n\u001b[94m  .'..;;,.          .,:cc;'...       ,:'    'l'        .l;  :l.          ,l.  ,l.  'l.          .l,\u001b[39m\n\u001b[94m   ...;;;.       .':clc;.           .;:.    'l'        ,l.  'l'          c:   ,l.  .l;          ;l.\u001b[39m\n\u001b[94m      .:c:,..',:coooc,.           .';;'     'l'      .;c'    'c,.      .c:.   ,l.   .c:.      .;c.\u001b[39m\n\u001b[94m       .:okOOkkxo:,..   ........',,,'.      ,o:,,,,,,;'.        ;;,,,,;;      ,l.     ';;,,,,;;'\u001b[39m\n\u001b[94m       .''',;;,..  ....   ........                                            ,l.\u001b[39m\n\u001b[94m                   ',    .''.                                                .c:\u001b[39m\n\u001b[94m                   .'.. .;c;.                                                ..\u001b[39m\n\u001b[94m                     ..   .\u001b[39m\n\u001b[1mUsage:\u001b[22m\n\n  $ \u001b[92mdojo\u001b[39m \u001b[92mfoo\u001b[39m \u001b[32mglobal\u001b[39m [<options>] [--help]\n\n\u001b[1mDescription:\u001b[22m\n\n  A global command\n\n\u001b[1mCommand Options:\u001b[22m\n\n  --\u001b[92mfoo\u001b[39m                A basic option\n  --\u001b[92mbar\u001b[39m                A required option [\u001b[33mrequired\u001b[39m]\n`;
const expectedFooProjectHelp = `\u001b[94m\u001b[39m\n\u001b[94m            ..\u001b[39m\n\u001b[94m          ';,,'..\u001b[39m\n\u001b[94m          .colllc,.                         .''''''...           .,,,.        ..         .,,,.\u001b[39m\n\u001b[94m        ...',:loooc.       ...''''''..      ;x'      ;;'      ':;,'.'',:;.    :o.    .:;,'..',;:.\u001b[39m\n\u001b[94m      .'''.     ....     .',;'..   ..'.     'l'       .c:    :c.        ,l'   ,l.   ,l'        'l;\u001b[39m\n\u001b[94m     .,,,.            ..;::,'..      ';.    'l'        .l,  ,l.          :c.  ,l.  .l,          'l.\u001b[39m\n\u001b[94m  .'..;;,.          .,:cc;'...       ,:'    'l'        .l;  :l.          ,l.  ,l.  'l.          .l,\u001b[39m\n\u001b[94m   ...;;;.       .':clc;.           .;:.    'l'        ,l.  'l'          c:   ,l.  .l;          ;l.\u001b[39m\n\u001b[94m      .:c:,..',:coooc,.           .';;'     'l'      .;c'    'c,.      .c:.   ,l.   .c:.      .;c.\u001b[39m\n\u001b[94m       .:okOOkkxo:,..   ........',,,'.      ,o:,,,,,,;'.        ;;,,,,;;      ,l.     ';;,,,,;;'\u001b[39m\n\u001b[94m       .''',;;,..  ....   ........                                            ,l.\u001b[39m\n\u001b[94m                   ',    .''.                                                .c:\u001b[39m\n\u001b[94m                   .'.. .;c;.                                                ..\u001b[39m\n\u001b[94m                     ..   .\u001b[39m\n\u001b[1mUsage:\u001b[22m\n\n  $ \u001b[92mdojo\u001b[39m \u001b[92mfoo\u001b[39m \u001b[32mproject\u001b[39m [<options>] [--help]\n\n\u001b[1mDescription:\u001b[22m\n\n  A project command\n\n\u001b[1mCommand Options:\u001b[22m\n\n  -\u001b[92mf\u001b[39m, --\u001b[92mfoo\u001b[39m, --\u001b[92mfoooo \u001b[39m  A basic option\n  -\u001b[92mb\u001b[39m, --\u001b[92mbar\u001b[39m            A required option [\u001b[33mrequired\u001b[39m]\n`;
const expectedBarInstallableHelp = `\u001b[94m\u001b[39m\n\u001b[94m            ..\u001b[39m\n\u001b[94m          ';,,'..\u001b[39m\n\u001b[94m          .colllc,.                         .''''''...           .,,,.        ..         .,,,.\u001b[39m\n\u001b[94m        ...',:loooc.       ...''''''..      ;x'      ;;'      ':;,'.'',:;.    :o.    .:;,'..',;:.\u001b[39m\n\u001b[94m      .'''.     ....     .',;'..   ..'.     'l'       .c:    :c.        ,l'   ,l.   ,l'        'l;\u001b[39m\n\u001b[94m     .,,,.            ..;::,'..      ';.    'l'        .l,  ,l.          :c.  ,l.  .l,          'l.\u001b[39m\n\u001b[94m  .'..;;,.          .,:cc;'...       ,:'    'l'        .l;  :l.          ,l.  ,l.  'l.          .l,\u001b[39m\n\u001b[94m   ...;;;.       .':clc;.           .;:.    'l'        ,l.  'l'          c:   ,l.  .l;          ;l.\u001b[39m\n\u001b[94m      .:c:,..',:coooc,.           .';;'     'l'      .;c'    'c,.      .c:.   ,l.   .c:.      .;c.\u001b[39m\n\u001b[94m       .:okOOkkxo:,..   ........',,,'.      ,o:,,,,,,;'.        ;;,,,,;;      ,l.     ';;,,,,;;'\u001b[39m\n\u001b[94m       .''',;;,..  ....   ........                                            ,l.\u001b[39m\n\u001b[94m                   ',    .''.                                                .c:\u001b[39m\n\u001b[94m                   .'.. .;c;.                                                ..\u001b[39m\n\u001b[94m                     ..   .\u001b[39m\n\u001b[1mUsage:\u001b[22m\n\n  $ \u001b[92mdojo\u001b[39m \u001b[92mbar\u001b[39m \u001b[32minstallable\u001b[39m [<options>] [--help]\n\n\u001b[1mDescription:\u001b[22m\n\n  An installable command for bar\n\n\u001b[1mCommand Options:\u001b[22m\n\n  To install this command run \u001b[32mnpm i @dojo/cli-bar-installable\u001b[39m\n`;
const expectedBarNonDefaultHelp = `\u001b[94m\u001b[39m\n\u001b[94m            ..\u001b[39m\n\u001b[94m          ';,,'..\u001b[39m\n\u001b[94m          .colllc,.                         .''''''...           .,,,.        ..         .,,,.\u001b[39m\n\u001b[94m        ...',:loooc.       ...''''''..      ;x'      ;;'      ':;,'.'',:;.    :o.    .:;,'..',;:.\u001b[39m\n\u001b[94m      .'''.     ....     .',;'..   ..'.     'l'       .c:    :c.        ,l'   ,l.   ,l'        'l;\u001b[39m\n\u001b[94m     .,,,.            ..;::,'..      ';.    'l'        .l,  ,l.          :c.  ,l.  .l,          'l.\u001b[39m\n\u001b[94m  .'..;;,.          .,:cc;'...       ,:'    'l'        .l;  :l.          ,l.  ,l.  'l.          .l,\u001b[39m\n\u001b[94m   ...;;;.       .':clc;.           .;:.    'l'        ,l.  'l'          c:   ,l.  .l;          ;l.\u001b[39m\n\u001b[94m      .:c:,..',:coooc,.           .';;'     'l'      .;c'    'c,.      .c:.   ,l.   .c:.      .;c.\u001b[39m\n\u001b[94m       .:okOOkkxo:,..   ........',,,'.      ,o:,,,,,,;'.        ;;,,,,;;      ,l.     ';;,,,,;;'\u001b[39m\n\u001b[94m       .''',;;,..  ....   ........                                            ,l.\u001b[39m\n\u001b[94m                   ',    .''.                                                .c:\u001b[39m\n\u001b[94m                   .'.. .;c;.                                                ..\u001b[39m\n\u001b[94m                     ..   .\u001b[39m\n\u001b[1mUsage:\u001b[22m\n\n  $ \u001b[92mdojo\u001b[39m \u001b[92mbar\u001b[39m \u001b[32mnon-default\u001b[39m [<options>] [--help]\n\n\u001b[1mDescription:\u001b[22m\n\n  An installable command for bar\n\n\u001b[1mCommand Options:\u001b[22m\n\n  -\u001b[92mf\u001b[39m, --\u001b[92mfoo\u001b[39m, --\u001b[92mfoooo \u001b[39m  \n  -\u001b[92mb\u001b[39m, --\u001b[92mbar\u001b[39m            A required option [\u001b[33mrequired\u001b[39m]\n  -\u001b[92mc\u001b[39m, --\u001b[92mchoice\u001b[39m         A choices option [choices: \"\u001b[33mone\u001b[39m\", \"\u001b[33mtwo\u001b[39m\"]\n`;

describe('help', () => {
	it('should return formatted main help', () => {
		const argv = {
			_: []
		};
		const help = formatHelp(argv, groupMap);
		assert.strictEqual(help, expectedMainHelp);
	});

	it('should return formatted group help', () => {
		const fooHelp = formatHelp({ _: ['foo'] }, groupMap);
		const barHelp = formatHelp({ _: ['bar'] }, groupMap);
		assert.strictEqual(fooHelp, expectedFooGroupHelp);
		assert.strictEqual(barHelp, expectedBarGroupHelp);
	});

	it('should return formatted command help', () => {
		const fooGlobalHelp = formatHelp({ _: ['foo', 'global'] }, groupMap);
		const fooProjectHelp = formatHelp({ _: ['foo', 'project'] }, groupMap);
		const barInstallableHelp = formatHelp({ _: ['bar', 'installable'] }, groupMap);
		const barNonDefaultHelp = formatHelp({ _: ['bar', 'non-default'] }, groupMap);
		assert.strictEqual(fooGlobalHelp, expectedFooGlobalHelp);
		assert.strictEqual(fooProjectHelp, expectedFooProjectHelp);
		assert.strictEqual(barInstallableHelp, expectedBarInstallableHelp);
		assert.strictEqual(barNonDefaultHelp, expectedBarNonDefaultHelp);
	});
});
