# @dojo/cli

[![Build Status](https://travis-ci.org/dojo/cli.svg?branch=master)](https://travis-ci.org/dojo/cli) [![Build status](https://ci.appveyor.com/api/projects/status/mvbjrd0jcv8itvho/branch/master?svg=true)](https://ci.appveyor.com/project/Dojo/cli/branch/master)
 [![codecov](https://codecov.io/gh/dojo/cli/branch/master/graph/badge.svg)](https://codecov.io/gh/dojo/cli) [![npm version](https://badge.fury.io/js/%40dojo%2Fcli.svg)](https://badge.fury.io/js/%40dojo%2Fcli)

The CLI is the officially supported way to create and maintain Dojo 2 apps.

- [Why use the CLI?](#why-use-the-cli)
- [Usage](#usage)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Features](#features)
- [dojorc](#dojorc)
- [A warning on ejecting](#a-warning-on-ejecting)
- [How can I contribute?](#how-can-i-contribute)
  - [Code Style](#code-style)
  - [Installation of source](#installation-of-source)
  - [Testing](#testing)
- [Licensing Information](#licensing-information)


## Why use the CLI?
It is designed to save you time by promoting a standardized workflow and automating away more mundane boilerplate tasks.

*Single dependency* - instead of having to download and configure multiple tools such as `webpack`, `Intern`, and `tslint`, you can just install the CLI and know that all of these tools will work together.

*Make the common tasks simple* - because you don't need to install and configure the individual tools yourself, you can be sure that the versions being used all work together and they are running with sensible defaults.

*Make the advanced tasks possible* - you can `eject` to a custom setup at any time. When you eject, all the configuration and build dependencies of the included tools will be moved into your project. The development process can then be tailored to the specific needs of your project.

## Usage

### Prerequisites

You will need node v6+.

### Installation

You can install from npm:

`npm i @dojo/cli -g`

In a terminal, run:

`dojo`

This should output the following:

```
dojo help

Usage: dojo <group> <command> [options]

Hey there, here are all the things you can do with @dojo/cli:
...
```

If you don't see the message above, then check that you have installed the CLI with the `-g` option.

You can list all your global npm dependencies by running:

`npm list -g --depth=0`

If you don't see `@dojo/cli` in the list of global dependencies, verify that the installation runs without errors.

## Features

The CLI has the following built-in commands:

* `dojo eject` - allows users to configure and run command instead of the cli.
* `dojo version` - provides information on the versions of installed commands and the cli itself.
* `dojo validate` - validates the `.dojorc` file for all installed commands

In addition to the built-in commands, additional commands are available and will show up in your command list even if they have not been installed.

* `dojo create` - provides scaffolding for new Dojo 2 projects.


* `dojo build` - for building Dojo 2 applications and custom elements
* `dojo test` - for testing Dojo 2 applications

If you try to use a command that is not installed, the CLI will give you instructions on how to install the command.

If you need help, you can use the `-h` option.

```shell
# print help for the CLI, listing all available commands
$ dojo -h

# print help for a single command
$ dojo create -h
```

Some additional commands are available but must be installed manually via npm.

* `cli-build-webpack`  - Legacy Dojo2 build command.
* `cli-test-intern` - Legacy Dojo2 testing command.

## dojorc

Dojo CLI commands support a JSON configuration file at the root of the project called `.dojorc` . Each command has a dedicated section in the `.dojorc` keyed by the command name minus the `cli-` prefix. For example the command `@dojo/cli-build-app` has the following section in the `.dojorc`:

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

The file will be validated when ever `dojo validate` is run or an installed command is attempted to be run.

## A warning on ejecting

Once you run `dojo eject`, the dependencies required by the bundled tools (`webpack`, `intern`, etc.) are included into your project's `package.json` and the configuration is added to a `config` directory in your project root.

This action is one-way and you cannot go back to having the tools managed by the CLI.

## How can I contribute?

We appreciate your interest!  Please see the [Dojo 2 Meta Repository](https://github.com/dojo/meta#readme) for the Contributing Guidelines.

### Code Style

This repository uses [`prettier`](https://prettier.io/) for code styling rules and formatting. A pre-commit hook is installed automatically and configured to run `prettier` against all staged files as per the configuration in the project's `package.json`.

You format all `src` and `test` project files by running:

```bash
npm run prettier
```

### Installation of source

To start working with this package, clone the repository and run `npm install`.

In order to build the project run `npm run build` or to watch files for local development run `npm run watch`.

### Testing

Test cases MUST be written using [Intern](https://theintern.github.io) using the `object` test interface and `assert` assertion interface.

90% branch coverage MUST be provided for all code submitted to this repository, as reported by istanbul’s combined coverage results for all supported platforms.

To test locally in node run:

`npm run test`

## Licensing information

© 2018 [JS Foundation](https://js.foundation/) & contributors. [New BSD](http://opensource.org/licenses/BSD-3-Clause) license.
