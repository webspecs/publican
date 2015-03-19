#!/usr/bin/env node

var chalk = require("chalk")
,   cmd = process.argv.splice(2, 1)[0]
,   version = require("../package.json").version
,   man = require("../lib/manager")
,   nopt = require("nopt")
,   pth = require("path")
,   knownOpts = {
                config:     pth
    }
,   shortHands = {
                c:      ["--config"]
    }
,   options = nopt(knownOpts, shortHands, process.argv, 2)
;

// helpers
function exitOK () {
    process.exit(0);
}

// XXX
//  we should add commands here that basically work for any task that makes sense, and can take
//  arguments that are required by them
//  this implies moving initSetup from manager to here
//  Tasks:
//      - init
//      - process-index
//      - process-spec
//      - purge-all
//      - rsync-all
//
// this tool should check that you have a config available, otherwise things just blow up

function showHelp () {
    var help = [
    ,   ""
    ,   chalk.bold.green("publican -- Automated WebSpecs publishing")
    ,   "------------------------------------------------------------------------------------------"
    ,   ""
    ,   chalk.blue("Available commands: version, help, init")
    ,   ""
    ,   chalk.bold("version")
    ,   "Prints the version number and exits. No parameters."
    ,   ""
    ,   chalk.bold("help")
    ,   "Prints this help message and exits. No parameters."
    ,   ""
    ,   chalk.bold("init")
    ,   "Initialises the publishing system by getting and publishing everything afresh."
    ,   "This can be slow, it may leave your system in a broken state."
    ,   "Can be used to repair or diagnose a broken system. Use with care."
    ,   ""
    ].join("\n");
    console.log(help);
}

// version
if (cmd === "version") {
    console.log(version);
    exitOK();
}

// help
if (cmd === "help") {
    showHelp();
    exitOK();
}

// init
if (cmd === "init") man.initSetup(exitOK);
else {
    console.error("\n" + chalk.red("Unknown command: " + chalk.bold(cmd)));
    showHelp();
    process.exit(1);
}
