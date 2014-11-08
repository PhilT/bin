'use strict';

var util = require('util'),
    generatePassword = require('./password').generate,
    view = require('./view'),
    copyPassword = require('./password').copy,
    sortPasswords = require('./password').sort;

exports.setView = function setView(v) { view = v; };
exports.setCopy = function setCopy(c) { copyPassword = c; };
exports.setPasswordGenerator = function setPasswordGenerator(p) {
  generatePassword = p;
};

exports.add = function add(passwords, params, pwconfig, password) {
  return this.generate(passwords, params, pwconfig, password);
};

exports.generate = function generate(passwords, params, pwconfig, password) {
  var url = params.args[0],
      login = params.args[1],
      urlLogin = url + ',' + login,
      siteMatched = passwords.indexOf(urlLogin) !== -1,
      line,
      newPasswords = passwords;

  password = password || generatePassword(pwconfig.passwordLength);
  line = [url, login, password + "\n"].join(',');

  if (!siteMatched) {
    if (passwords[passwords.length - 1] !== "\n") { passwords += "\n"; }
    newPasswords = passwords + line;
    copyPassword(url, login, password);
  } else if (params.force) {
    newPasswords = passwords.replace(new RegExp(urlLogin + ",.*\n"), line);
    copyPassword(url, login, password);
  } else {
    view.write('Password for %s already exists. Use --force to overwrite.', url);
  }

  return newPasswords;
};

exports.query = function query(passwords, params) {
  var term = params.args[0] || '',
      regexp = new RegExp(util.format(".*%s.*\n", term), 'g'),
      matches,
      parts;

  matches = passwords.match(regexp);
  if (!matches || matches.length === 0) {
    view.write('No matches.');
  } else if (matches.length === 1) {
    parts = matches[0].replace("\n", '').split(',');
    copyPassword(parts[0], parts[1], parts[2]);
  } else {
    view.write('Multiple passwords matched. Displaying:');
    view.write(sortPasswords(matches).join(''));
  }

  return passwords;
};

exports.remove = function remove(passwords, params) {
  var url = params.args[0],
      login = params.args[1],
      matchParams = [url],
      newPasswords = passwords,
      regexp,
      matches;

  if (login) { matchParams.push(login); }
  matchParams.push(".*\n");
  regexp = new RegExp(matchParams.join(','), 'g');
  matches = passwords.match(regexp);
  if (!matches) {
    view.write('No matches.');
  } else if (params.force || matches.length === 1) {
    newPasswords = passwords.replace(regexp, '');
  } else {
    view.write('Matches more than one password. Add login to qualify or --force.');
  }

  return newPasswords;
};
