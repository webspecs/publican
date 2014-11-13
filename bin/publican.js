#!/usr/bin/env node

var chalk = require("chalk")
,   cmd = process.argv.splice(2, 1)[0]
,   version = require("../package.json").version
,   man = require("../lib/manager")
;

// helpers
function exitOK () {
    process.exit(0);
}

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
