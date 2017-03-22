# @dojo/cli

[![Build Status](https://travis-ci.org/dojo/cli.svg?branch=master)](https://travis-ci.org/dojo/cli) [![codecov](https://codecov.io/gh/dojo/cli/branch/master/graph/badge.svg)](https://codecov.io/gh/dojo/cli) [![npm version](https://badge.fury.io/js/%40dojo%2Fcli.svg)](https://badge.fury.io/js/%40dojo%2Fcli)

The CLI is the officially supported way to create and maintain Dojo 2 apps.

**WARNING** This is *alpha* software. It is not yet production ready, so you should use at your own risk.

- [Why use?](#why)
- [Usage](#usage)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Features](#features)



## Why use this cli?
It is designed to save you time, by promoting a standardised workflow, and automating away more mundane boilerplate tasks.

*Single dependency* - instead of having to download and configure multiple tools such as `Webpack`, `Intern` and `tslint`, you can just install the `cli` and know that all of these tools will work together.

*Make the common tasks simple* - because you don't need to install and configure the individual tools yourself, you can be sure that the versions being used all work together and they they are running with sensible defaults.

*Make the advanced tasks possible* - you can `eject` to a custom setup at any time. When you `eject`, all the configuration and build dependencies of the included tools will be moved into your project. If you are adept at configuring these tools, then you can now do so without the `cli` imposing its defaults.

## Usage

### Prerequisites

You will need node v6+.

### Installation

Getting the cli

You can install from npm:

`npm i @dojo/cli -g`

In a terminal, run:

`dojo`

This should output the following:

```
dojo help

Usage: dojo <command> [subCommand] [options]

Hey there, here are all the things you can do with @dojo/cli:
...
```

If you don't see the message above, then check that you have installed the CLI with the `-g` option.

You can list all your global npm dependencies by running:

`npm list -g –depth=0`

If you don't see `@dojo/cli` in the list of global dependencies, then please re-install and make sure the installation runs without errors.

## Features

The CLI has the following format:

`dojo group [command]` - where [command] is optional

e.g. (no command specified)

`dojo help`

where `help` is the group, and no command is specified, will run the default help command (in this case, generic help for the cli is outputted).

e.g. (command specified)

`dojo help create`

where `help` is the group and `create` is the command, will run the `create` command in the `help` group (in this case, it will output help for the `create` command).

The CLI has the following in-built options:

`dojo -h, --help` - provides a list of help as detailed above.

The CLI has the following in-built groups:

`dojo create` - provides scaffolding for new Dojo 2 projects.
`dojo eject` - allows users to configure and run command instead of the cli.
`dojo version` - provides information on the versions of installed commands and the cli itself.

`dojo build` and `dojo test` are not installed by default with `@dojo/cli`. To use them, you must install them separately, e.g. with `npm i @dojo/cli-build-webpack` and `npm i @dojo/cli-test-intern`. The reason for not bundling these 2 groups, is so you can run different versions of these group per-project.

## A warning on `eject`ing

Once you run `dojo eject`, the configuration and dependencies for the bundled tools are now part of your project.
This action is one-way and you cannot go back to having the tools managed by the `cli`.

## How do I contribute?

We appreciate your interest!  Please see the [Dojo 2 Meta Repository](https://github.com/dojo/meta#readme) for the
Contributing Guidelines and Style Guide.

### Installation

To start working with this package, clone the repository and run `npm install`.

In order to build the project run `grunt dev` or `grunt dist`.

### Testing

Test cases MUST be written using [Intern](https://theintern.github.io) using the Object test interface and Assert assertion interface.

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

© 2004–2017 [JS Foundation](https://js.foundation/) & contributors. [New BSD](http://opensource.org/licenses/BSD-3-Clause) license.
