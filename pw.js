#!/usr/bin/env node
'use strict';

var fs = require('fs'),
    path = require('path'),
    readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    }),
    exec = require('child_process').exec,
    commands = {},
    parseArgs,
    puts,
    readPassword,
    usage;

// process.stdin.resume();
// process.on('SIGINT', function () {
//   process.exit(0);
// });

commands.init = function init() {
  var password;
  password = readPassword();
  puts(password);
};

commands.edit = function edit() {

};

commands.generate = function generate() {

};

commands.query = function query() {

};

parseArgs = function parseArgs() {
  var args = process.argv.slice(2),
      command = args.shift(),
      validCommands = ['init', 'edit', 'generate', 'query', 'i', 'e', 'g', 'q'],
      index = validCommands.indexOf(command),
      safe = false,
      params = [],
      force = false,
      passwordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

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

  commands[validCommands[index % 4]]();
};

puts = function puts() {
  console.log.apply(this, arguments);
};

readPassword = function readPassword(callback) {
  readline.question('Enter encryption password:', function (answer) {
    readline.close();
    callback(answer);
  });
};

usage = function usage() {
  puts([
    'pw - generate, store and retrieve encrypted passwords',
    'usage: pw command options',
    '',
    ' command:',
    '   i, init                 encrypts a new passwords file',
    '   e, edit                 open passwords file in editor',
    '   g, generate url login   create a new password',
    '   q, query term           find a password',
    '',
    ' options:',
    '   --force   overwrite existing password',
    '   --safe    use only alphanumeric characters (no symbols)',
    ''
  ].join("\n"));
};

parseArgs();
