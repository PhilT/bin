#!/usr/bin/env node
'use strict';

// pw.js
//
// Script for storing and retreiving account credentials encrypted using PGP.
// Store website, username/email and password.
// Places password into clipboard for easy pasting into website or app.
//
// Tested on Linux, Windows and Mac.
//
// Only dependency is node (No node modules are required).
//
// Find pw and other useful scripts at https://github.com/PhilT/bin
//
// version 0.8 - Convert to Node.js
//               Implemented new password generation algorithm
//               Removed safe option. Use only alphanumeric but 20 chars.
//               implemented query (all) (instead of edit)
//               commands explicitly specified now
// version 0.7 - Fixed incorrect use of extended bash if
//               Added description
// version 0.6 - Silence some verbose commands
// version 0.5 - Add support for OSX
//               Overwrite existing passwords (--force)
//               15 character passwords including symbols
//               Optional safe characters (--safe)
// version 0.4 - Add support for Git Bash aka MinGW
// version 0.3 - generate password and copy to clipboard
//               Don't re-encrypt file if not changed
//               Copy retrieved password to clipboard
//               Improve display of multiple passwords
// version 0.2 - Added --edit command
// version 0.1 - Not much error handling yet.
//
// Add to ~/bin/pw and chmod +x it.
// See bottom of file for usage or run `pw` without args.
//

var path = require('path'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    view = require('./lib/pw/view'),
    flow = require('./lib/pw/flow'),
    attemptExit = require('./lib/pw/flow').attemptExit,
    wantToExit = require('./lib/pw/flow').wantToExit,
    homePath = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE),
    commands = require('./lib/pw/commands'),
    params = {args: [], force: false},
    enterPassword,
    extractOptions,
    gpg,
    loadConfig,
    loadFile,
    loadJson,
    loadPasswordFile,
    parseArgs,
    processCommand,
    savePasswordFile,
    start,
    usage;

process.on('SIGINT', function () {
  process.exit();
});

enterPassword = function enterPassword(callback) {
  var password = '',
      stdin = process.stdin;

  stdin.setEncoding('utf8');
  stdin.setRawMode(true);
  stdin.on('readable', function () {
    var ch = stdin.read();
    if (ch === "\r") {
      stdin.setRawMode(false);
      stdin.setEncoding();
      callback(password);
    } else if (ch === "\u0003") {
      view.write();
      process.exit();
    } else if (ch !== null) {
      password += ch;
    }
  });
};

extractOptions = function extractOptions() {
  var index = params.args.indexOf('--force');
  if (index > -1) {
    params.args.splice(index, 1);
    params.force = true;
  }
};

gpg = function gpg(password, encrypt, input, done, to) {
  var options = {},
      args = [
        '--no-permission-warning',
        '--no-secmem-warning',
        '--force-mdc',
        '--no-tty',
        '--quiet',
        '--no-use-agent',
        '--yes',
        '--passphrase=' + password,
        '--homedir',
        path.join(homePath, '.gnupg')
      ],
      child,
      passwords = '';

  if (encrypt) {
    args.push('--symmetric');
  } else {
    args.push('--decrypt');
  }
  child = spawn('gpg', args, options);
  child.on('exit', function () {
    done(passwords);
  });
  if (to) {
    child.stdout.pipe(to);
  } else {
    child.stdout.on('data', function (data) {
      passwords += data;
    });
  }
  child.stderr.on('data', function (data) {
    view.write(data.toString());
  });

  child.stdin.end(input);
};

loadConfig = function loadConfig(pathname) {
  var config = loadJson(pathname);
  config.passwordLength = config.passwordLength || 15;

  if (!config.dir || !config.file) {
    view.write(pathname + ' must exist with, for example:');
    view.write('{"dir": "path/to/password/file", "file": ".password.csv"}');
    process.exit(1);
  }
  return config;
};

loadFile = function loadFile(pathname, encoding) {
  var contents;
  try {
    contents = fs.readFileSync(pathname, encoding);
  } catch (e) {
    view.write('Could not load file: ' + pathname);
    process.exit(1);
  }
  return contents;
};

loadJson = function loadJson(pathname) {
  return JSON.parse(loadFile(pathname, 'utf8')) || {};
};

loadPasswordFile = function loadPasswordFile(pathname, password, callback) {
  var encryptedPasswords = loadFile(pathname);
  if (!encryptedPasswords) { throw new Error('Could not load file'); }
  gpg(password, false, encryptedPasswords, function (passwords) {
    callback(passwords);
  });
};

parseArgs = function parseArgs() {
  var command,
      commands = ['add', 'remove', 'generate', 'query'],
      index;

  params.args = process.argv.slice(2);
  extractOptions(params);
  command = params.args.shift();

  commands = commands.concat(commands.map(function (command) { return command[0]; }));
  index = commands.indexOf(command);

  if (index === -1) {
    usage();
    process.exit();
  }

  return commands[index % (commands.length / 2)];
};

processCommand = function processCommand(command, password, passwordToAdd) {
  var pwconfigPath = path.join(homePath, '.pwconfig.json'),
      pwconfig = loadConfig(pwconfigPath),
      passwordFile = path.join(pwconfig.dir, pwconfig.file) + '.gpg';

  loadPasswordFile(passwordFile, password, function (passwords) {
    var newPasswords = commands[command](passwords, params, pwconfig, passwordToAdd);
    flow.wantToExit();
    if (newPasswords !== passwords && newPasswords && newPasswords !== '') {
      savePasswordFile(passwordFile, password, newPasswords);
    }
    flow.attemptExit();
  });
};

savePasswordFile = function savePasswordFile(filepath, password, passwords) {
  wantToExit();
  gpg(password, true, passwords, function () {
    view.write('Password file updated.');
    attemptExit();
  }, fs.createWriteStream(filepath));
};

start = function start() {
  var command = parseArgs();

  enterPassword(function (password) {
    if (command === 'add') {
      enterPassword(function (passwordToAdd) {
        enterPassword(function (passwordConfirmation) {
          if (passwordToAdd === passwordConfirmation) {
            processCommand(command, password, passwordToAdd);
          } else {
            view.write("Passwords don't match.");
          }
        });
        view.write('Again to confirm:');
      });
      view.write('Enter password to add:');
    } else {
      processCommand(command, password);
    }
  });
  view.write('Enter encryption password:');
};

usage = function usage() {
  view.write([
    'pw - generate, store and retrieve encrypted passwords',
    'install: npm install promise',
    'usage: pw command options',
    '',
    ' command:',
    '   g, generate url login   creates a new password',
    '   a, add url login        adds a password generated elsewhere',
    '   q, query [term]         finds a password or lists matches (or all)',
    '   r, remove url [login]   removes a password login required when url not unique',
    '',
    ' options:',
    '   --force   overwrite existing password or remove multiple entries',
    '',
    ' notes:',
    '   query will copy a password to clipboard if a single match is found.',
    '     otherwise it displays all matches',
    '   delete will only remove a password where the site matches exactly',
    ''
  ].join("\n"));
};

start();
