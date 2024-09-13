/* jshint esversion:6, node: true */
/* eslint-env node */

/**
 * This is a modified version of ripgrep.js to remove the dependency on ripgrep
 * and use VSCode's native APIs for searching text.
 */

'use strict';
const vscode = require('vscode');
const utils = require('./utils');

function RipgrepError(error, stderr) {
    this.message = error;
    this.stderr = stderr;
}

function formatResults(stdout, multiline) {
    if (!stdout || stdout.length === 0) {
        return [];
    }

    if (multiline === true) {
        const formattedResults = [];
        let buffer = [];
        let matches = [];
        let text = "";

        for (const result of stdout) {
            const line = result.preview.text;
            const resultMatch = new Match(result);
            buffer.push(line);
            matches.push(resultMatch);

            text = (text === "") ? resultMatch.match : text + '\n' + resultMatch.match;
            const fullMatch = text.match(utils.getRegexForEditorSearch(true));

            if (fullMatch) {
                const firstMatch = matches[0];
                matches.shift();
                firstMatch.extraLines = matches;
                formattedResults.push(firstMatch);
                buffer = [];
                matches = [];
                text = "";
            }
        }
        return formattedResults;
    }

    return stdout.map(result => new Match(result));
}

module.exports.search = function ripGrep(cwd, options) {
    function debug(text) {
        if (options.outputChannel) {
            const now = new Date();
            options.outputChannel.appendLine(`${now.toLocaleTimeString('en', { hour12: false })}.${String(now.getMilliseconds()).padStart(3, '0')} ${text}`);
        }
    }

    if (!cwd) {
        return Promise.reject({ error: 'No `cwd` provided' });
    }

    if (arguments.length === 1) {
        return Promise.reject({ error: 'No search term provided' });
    }

    const searchOptions = {
        include: options.globs.length > 0 ? options.globs : undefined,
        usePCRE2: options.multiline,
    };

    return new Promise((resolve, reject) => {
        const results = [];

        const searchQuery = {
            pattern: options.regex
        };

        // Call vscode.workspace.findTextInFiles with the correct structure
        vscode.workspace.findTextInFiles(searchQuery, searchOptions, (result) => {
            // Push the results as they are streamed
            results.push(result);
            debug(`Search result: ${result.preview.text}`);
        }).then(() => {
            // When the search completes, resolve with the formatted results
            resolve(formatResults(results, options.multiline));
        }, error => {
            // Handle any errors here (as findTextInFiles uses error in the then() second parameter)
            debug(`Search failed: ${error.message}`);
            reject(new RipgrepError(error.message, ""));
        });
    });
};

class Match {
    constructor(result) {
        this.fsPath = result.uri.fsPath;
        this.line = result.range.start.line + 1; // Convert to 1-based indexing
        this.column = result.range.start.character + 1; // Convert to 1-based indexing
        this.match = result.preview.text;
    }
}

module.exports.Match = Match;