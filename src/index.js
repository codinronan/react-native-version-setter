#!/usr/bin/env node
import {out, die, cliArgumentExists} from "./process";
import {emoji} from "./emoji";
import {readPackageJson} from "./helpers";

const replace = require('replace-in-file');

const packageJson = readPackageJson()
packageJson || die('Could not read package.json.')

/**
 * All possible command line flags
 */
const commandLineFlags = [
    {
        name: 'debugLog',
        argument: '-d',
        set: false
    }
]

/**
 * Loop through the commandLineFlags array,
 * searching for a symbol in the command line
 * call
 */
commandLineFlags.forEach(flag => {
    flag.set = cliArgumentExists(flag.argument)
})

const version = {
    validRegEx: /^[0-9, .]+[0-9]+$/,  // Test to validate version strings
                                      // Cannot end or start with .
                                      // Must be only digit and .

    raw: process.argv[2]              // The raw input version string
}

version.raw || die(`Please provide a version number. ${emoji.warning}`);
version.validRegEx.test(version.raw) || die(`Your version number should contain only digits and periods. ${emoji.warning} `)
version.stripped = version.raw.split('.').join('')

const locations = [
    {
        files: './android/app/build.gradle',
        from: new RegExp('versionCode [0-9]+', 'g'),
        to: `versionCode ${version.stripped}`,
    },
    {
        files: './android/app/build.gradle',
        from: new RegExp('versionName "[0-9, .]+"', 'g'),
        to: `versionName "${version.raw}"`,
    },
    {
        files: `./ios/${packageJson.name}.xcodeproj/project.pbxproj`,
        from: new RegExp('MARKETING_VERSION = [0-9, .]+', 'g'),
        to: `MARKETING_VERSION = ${version.raw}`,
    },
    {
        files: `./package.json`,
        from: new RegExp('"version": ".+"'),
        to: `"version": "${version.raw}"`,
    },
]

let changes = 0;

try {
    locations.forEach(location => {

        const result = replace.sync(location)

        result[0]?.file || out(`Could not find file: ${location.files} ${emoji.warning} `)

        if (result[0]?.hasChanged) {
            changes++
            commandLineFlags.debugLog.set && out(`Set ${location.files} to:  ${location.to} `)
        } else {
            commandLineFlags.debugLog.set && out(`${location.files} was not changed.`)
        }

    })

    if (locations.length > changes && changes !== 0) {
        out(`One or more files were not changed. Run with -d flag for debug log. ${emoji.warning}` )
    } else if (changes === 0) {
        if (packageJson.version === version.raw) {
            out(`Version is already ${version.raw} ${emoji.warning}  `)
        } else {
            out(`No files changed. Run with -d flag for debug log. ${emoji.warning} `)
        }
    } else if (changes === locations.length) {
        out(`${packageJson.name}: ${packageJson.version}: ==> ${version.raw} ${emoji.check} `)
    }

} catch (e) {
    die(e)
}

