# @dojo/cli

[![Build Status](https://travis-ci.org/dojo/cli.svg?branch=master)](https://travis-ci.org/dojo/cli) [![Build status](https://ci.appveyor.com/api/projects/status/mvbjrd0jcv8itvho/branch/master?svg=true)](https://ci.appveyor.com/project/Dojo/cli/branch/master)
 [![codecov](https://codecov.io/gh/dojo/cli/branch/master/graph/badge.svg)](https://codecov.io/gh/dojo/cli) [![npm version](https://badge.fury.io/js/%40dojo%2Fcli.svg)](https://badge.fury.io/js/%40dojo%2Fcli)

`@dojo/cli` is the officially supported way to create and maintain Dojo 2 apps.

- [Why use this cli?](#why-use-this-cli)
- [Usage](#usage)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Features](#features)
- [A warning on ejecting](#a-warning-on-ejecting)


## Why use this cli?
`@dojo/cli` is designed to save you time, by promoting a standardized workflow and automating away more mundane boilerplate tasks.

*Single dependency* - instead of having to download and configure multiple tools such as `webpack`, `Intern`, and `tslint`, you can install the `cli` and know that all of these tools will work together.

*Make the common tasks simple* - because you don't need to install and configure the individual tools yourself, you can be sure that the versions being used all work together and they are running with sensible defaults.

*Make the advanced tasks possible* - you can `eject` to a custom setup at any time. When you `eject`, all the configuration and build dependencies of the included tools will be moved into your project. If you are adept at configuring these tools, then you can now do so without the `cli` using its defaults.

## Usage

### Prerequisites

You will need node v6+.

### Installation

Getting the cli

You can install from npm:

`npm i @dojo/cli -g`

In a terminal, run:

`dojo`

This command should output the following:

```
dojo help

Usage: dojo <group> <command> [options]

Hey there, here are all the things you can do with @dojo/cli:
...
```

If you don't see the message above, then check that you have installed `@dojo/cli` with the `-g` option.

You can list all your global npm dependencies by running:

`npm list -g –depth=0`

If you don't see `@dojo/cli` in the list of global dependencies, then please re-install and make sure the installation runs without errors.

## Features

`@dojo/cli` has the following format:

`dojo <group> [command] [options]` - where [command] and [options] are optional

e.g. (group specified, no command specified)

`dojo help`

where `help` is the group, and no command is specified, will run the default help command (in this case, generic help for the cli is outputted).

e.g. (group specified, command specified)

`dojo help create`

where `help` is the group and `create` is the command, will run the `create` command in the `help` group (in this case, it will output help for the `create` command).

`@dojo/cli` has the following built-in options:

`dojo -h, --help` - provides a list of help as detailed above.

`@dojo/cli` has the following built-in groups:

`dojo create` - provides scaffolding for new Dojo 2 projects.
`dojo eject` - allows users to configure and run command instead of `@dojo/cli`.
`dojo version` - provides information on the versions of installed commands and `@dojo/cli`  itself.

`dojo build` and `dojo test` are not installed by default with `@dojo/cli`. To use these commands, you must install them separately, e.g.

`npm i @dojo/cli-build-app` and `npm i @dojo/cli-test-intern`
These two groups are not included by default to allow different versions of these groups to be installed per project.

## dojorc

`@dojo/cli` commands support a JSON configuration file at the root of the project called `.dojorc` . Each command has a dedicated section in the `.dojorc` keyed by the command name minus the `cli-` prefix. For example the command `@dojo/cli-build-app` has the following section in the `.dojorc`:

```json
{
	"build-app": {

	}
}
```

Each command supports different `.dojorc` configuration but every command supports storing command options in the `.dojorc` that can be overridden by explicitly passing options on the command line:


```json
{
	"build-app": {
		"build-app-option": "foo"
	}
}
```

This configuration would automatically pass the `build-app-option: foo` to the command but is overridden by passing the option on the command line:

```shell
$ dojo build app --build-app-option bar
```

## A warning on ejecting

Once you run `dojo eject`, the configuration and dependencies for the bundled tools are now part of your project.
This action is one-way and you cannot go back to having the tools managed by `@dojo/cli`.

## How do I contribute?

We appreciate your interest!  Please see the [Dojo 2 Meta Repository](https://github.com/dojo/meta#readme) for the
Contributing Guidelines.

### Code Style

This repository uses [`prettier`](https://prettier.io/) for code styling rules and formatting. A pre-commit hook is installed automatically and configured to run `prettier` against all staged files as per the configuration in the project's `package.json`.

An additional npm script to run `prettier` (with write set to `true`) against all `src` and `test` project files is available by running:

```bash
npm run prettier
```

### Installation of source

To start working with this package, clone the repository and run `npm install`.

In order to build the project run `grunt dev` or `grunt dist`.

### Testing

Test cases MUST be written using [Intern](https://theintern.github.io) using the object test interface and assert assertion interface.

90% branch coverage MUST be provided for all code submitted to this repository, as reported by istanbul’s combined coverage results for all supported platforms.

To test locally in node run:

`grunt test`

To test against browsers with a local selenium server run:

`grunt test:local`

To test against BrowserStack or Sauce Labs run:

`grunt test:browserstack`

or

`grunt test:saucelabs`

## Licensing information

© 2018 [JS Foundation](https://js.foundation/) & contributors. [New BSD](http://opensource.org/licenses/BSD-3-Clause) license.
