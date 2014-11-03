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
    puts = require('lib/pw/util').puts,
    attemptExit = require('lib/pw/util').attemptExit,
    wantToExit = require('lib/pw/util').wantToExit,
    homePath = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE),
    commands = {},
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
  process.exit(0);
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
      puts();
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

gpg = function gpg(password, encrypt, input, callback) {
  var options = [
        '--no-permission-warning',
        '--no-secmem-warning',
        '--force-mdc',
        '--no-tty',
        '-q',
        '--no-use-agent',
        '--yes',
        '--passphrase=' + password,
        '--homedir',
        path.join(homePath, '.gnupg')
      ],
      child,
      passwords = '';

  if (encrypt) {
    options.push('--symetric').push('--encrypt');
  } else {
    options.push('--decrypt');
  }
  child = spawn('gpg', options);
  child.on('close', function () {
    callback(passwords);
  });
  child.stdout.on('data', function (data) {
    passwords += data.toString('utf8');
  });
  child.stdin.end(input);
};

loadConfig = function loadConfig(pathname) {
  var config = loadJson(pathname);
  config.passwordLength = config.passwordLength || 20;

  if (!config.dir || !config.file) {
    puts(pathname + ' must exist with, for example:');
    puts('{"dir": "path/to/password/file", "file": ".password.csv"}');
    process.exit(1);
  }
  return config;
};

loadFile = function loadFile(pathname, encoding) {
  var contents;
  try {
    contents = fs.readFileSync(pathname, encoding);
  } catch (e) {
    puts('Could not load file: ' + pathname);
    process.exit(1);
  }
  return contents;
};

loadJson = function loadJson(pathname) {
  return JSON.parse(loadFile(pathname, 'utf8')) || {};
};

loadPasswordFile = function loadPasswordFile(pathname, password, callback) {
  var encryptedPasswords = loadFile(pathname);
  if (!encryptedPasswords) { return callback(''); }
  gpg(password, false, fs.readFileSync(pathname), function (passwords) {
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
    process.exit(0);
  }

  return commands[index % (commands.length / 2)];
};

processCommand = function processCommand(command, password, passwordToAdd) {
  var pwconfigPath = path.join(homePath, '.pwconfig.json'),
      pwconfig = loadConfig(pwconfigPath),
      passwordFile = path.join(pwconfig.dir, pwconfig.file) + '.gpg';

  loadPasswordFile(passwordFile, password, function (passwords) {
    var newPasswords = commands[command](passwords, params, pwconfig, passwordToAdd);
    if (newPasswords !== passwords) {
      savePasswordFile(passwordFile, password, passwords);
    }
    process.exit();
  });
};

savePasswordFile = function savePasswordFile(filepath, password, passwords) {
  wantToExit();
  gpg(password, true, passwords, function (encryptedPasswords) {
    fs.writeFileSync(filepath, encryptedPasswords);
    puts('Password file updated.');
    attemptExit();
  });
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
            puts("Passwords don't match.");
          }
        });
        puts('Again to confirm:');
      });
      puts('Enter password to add:');
    } else {
      processCommand(command, password);
    }
  });
  puts('Enter encryption password:');
};

usage = function usage() {
  puts([
    'pw - generate, store and retrieve encrypted passwords',
    'install: npm install promise',
    'usage: pw command options',
    '',
    ' command:',
    '   g, generate url login   creates a new password',
    '   a, add url login        adds a password generated elsewhere',
    '   q, query [term]         finds a password or lists matches (or all)',
    '   r, remove url           removes a password, url and login',
    '',
    ' options:',
    '   --force   overwrite existing password',
    '',
    ' notes:',
    '   query will copy a password to clipboard if a single match is found.',
    '     otherwise it displays all matches',
    '   delete will only remove a password where the site matches exactly',
    ''
  ].join("\n"));
};

start();
