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
    safe = false,
    params = [],
    force = false,
    passwordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    homePath = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE),
    waitingToExit = 0,
    commands = {},
    attemptExit,
    copyPassword,
    enterPassword,
    generatePassword,
    gpg,
    loadConfig,
    loadFile,
    loadJson,
    loadPasswordFile,
    parseArgs,
    processCommand,
    puts,
    savePasswordFile,
    sortPasswords,
    start,
    usage,
    wantToExit;

process.on('SIGINT', function () {
  process.exit(0);
});

attemptExit = function attemptExit() {
  waitingToExit -= 1;
  if (waitingToExit === 0) {
    process.exit(1);
  }
};

commands.add = function add(passwords, params, pwconfig, password) {
  return this.generate(passwords, params, pwconfig, password);
};

commands.generate = function generate(passwords, params, pwconfig, password) {
  var url = params[0],
      login = params[1],
      siteMatched = passwords.indexOf(url) !== -1,
      line = [url, login, password + "\n"].join(','),
      newPasswords;

  password = password || generatePassword(pwconfig.passwordLength);

  if (!siteMatched) {
    if (passwords[length.passwords - 1] !== "\n") { passwords += "\n"; }
    newPasswords = passwords + line;
    copyPassword(password);
  } else if (force) {
    newPasswords = passwords.replace(new RegExp(url + ",.*,.*\n"), line);
    copyPassword(password);
  } else {
    puts('Password for %s already exists. Use --force to overwrite', url);
  }

  return newPasswords;
};

commands.list = function list(passwords) {
  passwords.split("\n").forEach(function (password) {
    if (password.split(',').length > 3) {
      puts(password);
    }
  });
  return passwords;
};

commands.query = function query(passwords, params) {
  var term = params[0],
      regexp = new RegExp(util.format(".*%s.*\n", term), 'g'),
      matches,
      parts;
  matches = passwords.match(regexp);
  if (matches.length === 0) {
    puts('No matches.');
  } else if (matches === 1) {
    parts = matches[0].split(',').replace("\n", '');
    copyPassword(parts[0], parts[1], parts[2]);
  } else {
    puts('Multiple passwords matched. Displaying:');
    puts(matches.join(''));
  }

  return passwords;
};

commands.remove = function remove(passwords, params) {
  var url = params[0],
      regexp = new RegExp(url + ",.*\n"),
      newPasswords;

  newPasswords = passwords.replace(regexp, '');

  return newPasswords;
};

copyPassword = function copyPassword(url, login, password) {
  var noNewline = '-n ',
      command,
      child;

  if (os.platform() === 'win32') {
    noNewline = '|set /p=';
    command = 'clip';
  } else if (os.platform() === 'darwin') {
    command = 'pbcopy';
  } else {
    command = 'xsel -i';
  }

  wantToExit();
  child = spawn(util.format("echo %s%s|%s", noNewline, password, command));
  child.on('exit', function () {
    puts('Password for %s copied to clipboard. Login: %s', url, login);
    attemptExit();
  });
};

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

generatePassword = function generatePassword(length) {
  var password = '',
      max = passwordChars.length,
      i;

  for (i = 0; i < length; i += 1) {
    password += passwordChars[Math.floor(Math.random() * max)];
  }
  return password;
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
  config.passwordLength = config.passwordLength || 15;

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
  var args = process.argv.slice(2),
      command = args.shift(),
      commands = ['add', 'remove', 'generate', 'list', 'query'],
      index;

  commands = commands.concat(commands.map(function (command) { return command[0]; }));
  index = commands.indexOf(command);

  if (index === -1) {
    usage();
    process.exit(0);
  }

  args.forEach(function (arg) {
    if (arg === '--safe') {
      safe = true;
    } else if (arg === '--force') {
      force = true;
    } else {
      params.push(arg);
    }
  });

  if (safe) {
    puts('Using safe password characters');
  } else {
    passwordChars += '_!@#$%^*()\\-+=';
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

puts = function puts() {
  console.log.apply(this, arguments);
};

savePasswordFile = function savePasswordFile(filepath, password, passwords) {
  wantToExit();
  gpg(password, true, passwords, function (encryptedPasswords) {
    fs.writeFileSync(filepath, encryptedPasswords);
    puts('Password file updated.');
    attemptExit();
  });
};

sortPasswords = function sortPasswords(passwords) {
  var dropPrefixes = /^(https?:\/\/)?(www.)?/;

  return passwords.split("\n").sort(function (a, b) {
    a = a.replace(dropPrefixes, '');
    b = b.replace(dropPrefixes, '');
    if (a > b) { return 1; }
    if (a < b) { return -1; }
    return 0;
  }).join("\n");
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
    '   l, list                 displays all passwords',
    '   q, query term           finds a password',
    '   r, remove url           removes a password, url and login',
    '',
    ' options:',
    '   --force   overwrite existing password',
    '   --safe    use only alphanumeric characters (no symbols)',
    '',
    ' notes:',
    '   query will copy a password to clipboard if a single match is found.',
    '     otherwise it displays all matches',
    '   delete will only remove a password where the site matches exactly',
    ''
  ].join("\n"));
};

wantToExit = function wantToExit() {
  waitingToExit += 1;
};

start();
