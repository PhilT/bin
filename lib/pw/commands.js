'use strict';

var spawn = require('child_process').spawn,
    util = require('util'),
    os = require('os'),
    generatePassword = require('./password').generate,
    flow = require('./flow'),
    view = require('./view'),
    copyPassword,
    sortPasswords;

exports.setView = function setView(v) {
  view = v;
};

exports.setFlow = function setFlow(f) {
  flow = f;
};

exports.add = function add(passwords, params, pwconfig, password) {
  return this.generate(passwords, params, pwconfig, password);
};

exports.generate = function generate(passwords, params, pwconfig, password) {
  var url = params.args[0],
      login = params.args[1],
      siteMatched = passwords.indexOf(url) !== -1,
      line = [url, login, password + "\n"].join(','),
      newPasswords;

  password = password || generatePassword(pwconfig.passwordLength);

  if (!siteMatched) {
    if (passwords[length.passwords - 1] !== "\n") { passwords += "\n"; }
    newPasswords = passwords + line;
    copyPassword(password);
  } else if (params.force) {
    newPasswords = passwords.replace(new RegExp(url + ",.*,.*\n"), line);
    copyPassword(password);
  } else {
    view.write('Password for %s already exists. Use --force to overwrite', url);
  }

  return newPasswords;
};

exports.query = function query(passwords, params) {
  var term = params.args[0] || '',
      regexp = new RegExp(util.format(".*%s.*\n", term), 'g'),
      matches,
      parts;
  matches = passwords.match(regexp);
  if (matches.length === 0) {
    view.write('No matches.');
  } else if (matches.length === 1) {
    parts = matches[0].replace("\n", '').split(',');
    copyPassword(parts[0], parts[1], parts[2]);
  } else {
    view.write('Multiple passwords matched. Displaying:');
    view.write(sortPasswords(matches.join('')));
  }

  return passwords;
};

exports.remove = function remove(passwords, params) {
  var url = params.args[0],
      regexp = new RegExp(url + ",.*\n"),
      newPasswords;

  newPasswords = passwords.replace(regexp, '');

  return newPasswords;
};

copyPassword = function copyPassword(url, login, password) {
  var noNewline = '-n ',
      interpreter = 'bash',
      clipper,
      child;

  if (os.platform() === 'win32') {
    interpreter = 'cmd';
    noNewline = '|set /p=';
    clipper = 'clip';
  } else if (os.platform() === 'darwin') {
    clipper = 'pbcopy';
  } else {
    clipper = 'xsel -i';
  }

  flow.wantToExit();
  child = spawn(interpreter, [util.format("-c echo %s%s|%s", noNewline, password, clipper)]);
  child.on('exit', function () {
    view.write('Password for %s copied to clipboard. Login: %s', url, login);
    flow.attemptExit();
  });
  child.stdin.end();
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
