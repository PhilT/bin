'use strict';

var util = require('util'),
    passwords = [
      'github.com,phil@example.com,12345678',
      'http://bitbucket.com,phil@example.com,87654321',
      'github.com,another@example.com,11111111'
    ].join('\n') + '\n',
    createView,
    params,
    pwconfig,
    password,
    copyCalled,
    newPasswords,
    view;

createView = function createView() {
  return {
    buffer: '',
    write: function write() {
      this.buffer += util.format.apply(this, arguments) + '\n';
    }
  };
};

setup(function () {
  pwconfig = {passwordLength: 15};
  params = {args: ['mail.google.com', 'phil@example.com']};
  password = '12345678';
  copyCalled = false;

  view = createView();
  subject.setView(view);
  subject.setCopy(function copy() { copyCalled = true; });
});

test('new password', function () {
  subject.setPasswordGenerator(function generatePassword(length) {
    assert(15, length);
    return '11112222';
  });
  newPasswords = subject.generate(passwords, params, pwconfig, null);
  assert(newPasswords.split('\n')[3], 'mail.google.com,phil@example.com,11112222');
  assert(copyCalled, true);
});

test('add existing password', function () {
  subject.setPasswordGenerator(function generatePassword() {
    fail('Not expecting to call generatePassword');
  });

  newPasswords = subject.generate(passwords, params, pwconfig, password);
  assert(newPasswords.split('\n')[3], 'mail.google.com,phil@example.com,12345678');
  assert(copyCalled, true);
});

test('password exists', function () {
  params.args = ['http://bitbucket.com', 'phil@example.com'];
  subject.generate(passwords, params, pwconfig, password);
  assert(view.buffer,
    'Password for http://bitbucket.com already exists. Use --force to overwrite.\n');
});

test('overwrite existing password', function () {
  params.args = ['github.com', 'another@example.com'];
  params.force = true;
  newPasswords = subject.generate(passwords, params, pwconfig, password);
  assert(newPasswords.split('\n')[2], 'github.com,another@example.com,12345678');
  assert(copyCalled, true);
});

test('single match copies password', function () {
  subject.query(passwords, {args: ['bitbucket']});
  assert(copyCalled, true);
});

test('multiple matches', function () {
  var expected = 'Multiple passwords matched. Displaying:\n' +
    'github.com,another@example.com,11111111\n' +
    'github.com,phil@example.com,12345678\n\n';

  subject.query(passwords, {args: ['github']});
  assert(view.buffer, expected);
});

test('list all', function () {
  var expected = 'Multiple passwords matched. Displaying:\n' +
    'http://bitbucket.com,phil@example.com,87654321\n' +
    'github.com,another@example.com,11111111\n' +
    'github.com,phil@example.com,12345678\n\n';

  subject.query(passwords, {args: [null]});
  assert(view.buffer, expected);
});

test('remove with login', function () {
  newPasswords = subject.remove(passwords, {args: ['github.com', 'phil@example.com']});
  assert(newPasswords.split('\n')[0], passwords.split('\n')[1]);
});

test('remove without login', function () {
  newPasswords = subject.remove(passwords, {args: ['http://bitbucket.com']});
  assert(newPasswords.split('\n')[1], passwords.split('\n')[2]);
});

test('will not remove when more than one match', function () {
  newPasswords = subject.remove(passwords, {args: ['github.com']});
  assert(newPasswords.split('\n')[0], passwords.split('\n')[0]);
  assert(newPasswords.split('\n')[2], passwords.split('\n')[2]);
  assert(view.buffer, 'Matches more than one password. Add login to qualify or --force.\n');
});

test('removes when more than one match and --force', function () {
  newPasswords = subject.remove(passwords, {args: ['github.com'], force: true});
  assert(newPasswords.split('\n').length, 2);
});

test('warns when no matches', function () {
  newPasswords = subject.remove(passwords, {args: ['bla'], force: true});
  assert(view.buffer, 'No matches.\n');
  assert(newPasswords.split('\n').length, 4);
});
