'use strict';

var test = require('../test').test,
    commands = require('../../lib/pw/commands'),
    util = require('util'),
    passwords = [
      'github.com,phil@example.com,12345678',
      'http://bitbucket.com,phil@example.com,87654321',
      'github.com,another@example.com,11111111'
    ].join('\n') + '\n',
    createView,
    setup,
    testMultipleMatches,
    testSingleMatch,
    testListingAll;

createView = function createView() {
  return {
    buffer: '',
    write: function write() {
      this.buffer += util.format.apply(this, arguments) + '\n';
    }
  };
};

setup = function setup(assertions, done) {
  var view = createView();
  commands.setView(view);
  commands.setFlow({
    attemptExit: function attemptExit() {
      assertions(view);
      if (done) { done(); }
    },
    wantToExit: function wantToExit() {}
  });
};

testSingleMatch = function testSingleMatch() {
  setup(function (view) {
    var expected = 'Password for http://bitbucket.com copied to clipboard. ' +
      'Login: phil@example.com\n';
    test(view.buffer).equals(expected);
  });
  commands.query(passwords, {args: ['bitbucket']});
};

testMultipleMatches = function testMultipleMatches() {
  var expected = 'Multiple passwords matched. Displaying:\n' +
    'github.com,another@example.com,11111111\n' +
    'github.com,phil@example.com,12345678\n\n',
    view = createView();

  commands.setView(view);
  commands.query(passwords, {args: ['github']});
  test(view.buffer).equals(expected);
};

testListingAll = function testListingAll() {
  var expected = 'Multiple passwords matched. Displaying:\n' +
    'http://bitbucket.com,phil@example.com,87654321\n' +
    'github.com,another@example.com,11111111\n' +
    'github.com,phil@example.com,12345678\n\n',
    view = createView();

  commands.setView(view);
  commands.query(passwords, {args: []});
  test(view.buffer).equals(expected);
};

testListingAll();
testMultipleMatches();
testSingleMatch();
