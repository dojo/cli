# dojo-cli

[![Build Status](https://travis-ci.org/dojo/cli.svg?branch=master)](https://travis-ci.org/dojo/cli) [![codecov](https://codecov.io/gh/dojo/cli/branch/master/graph/badge.svg)](https://codecov.io/gh/dojo/cli) [![npm version](https://badge.fury.io/js/dojo-cli.svg)](http://badge.fury.io/js/dojo-cli)

The CLI is the officially supported way to create and maintain Dojo 2 apps.

Its designed to save you time, by promoting a stadardised workflow, and automating away lots of the boring boilerplate tasks.

## Prerequisites
You will need node V4 or v6+.

## Installation
Getting the cli
You can install from npm:

`npm i dojo-cli -g`

In a terminal, run:

`dojo`

This should output the following:

```
dojo help

Usage: dojo <command> [subCommand] [options]

Hey there, here are all the things you can do with dojo-cli:
...
```

If you don't see the message above, then check that you have installed the CLI with the `-g` option.

You can list all your global npm dependencies by running:

`npm list -g –depth=0`

If you don't see `dojo-cli` in the list of global dependencies, then please re-install and make sure the installation runs without errors.

## How to use


### The basic groups and commands
The CLI has the following format:

`dojo group [command]` - where [command] is optional

e.g. 

`dojo help`

where `help` is the group, and no command is specified, so the default help command is run. 

This will output generic help information.

`dojo help create`

where `help` is the group and the command is `create`. This will output help for the `create` command.

The CLI has the following basic commands:

`dojo help` - provides a list of help as detailed above.
`dojo -v` - provides the current version of the CLI

## How do I contribute?

We appreciate your interest!  Please see the [Dojo 2 Meta Repository](https://github.com/dojo/meta#readme) for the
Contributing Guidelines and Style Guide.

## Testing

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

© 2004–2016 Dojo Foundation & contributors. [New BSD](http://opensource.org/licenses/BSD-3-Clause) license.
