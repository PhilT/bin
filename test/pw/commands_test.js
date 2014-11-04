'use strict';

var test = require('../test').test,
    commands = require('../../lib/pw/commands'),
    util = require('util'),
    passwords = [
      'github.com,phil@example.com,12345678',
      'bitbucket.com,phil@example.com,87654321',
      'github.com,another@example.com,11111111'
    ].join('\n'),
    viewCount = 0,
    createView,
    setup,
    testMultipleMatches,
    testSingleMatch;

createView = function createView() {
  viewCount += 1;
  return {
    view: viewCount,
    buffer: '',
    write: function write() {
      this.buffer += util.format.apply(this, arguments);
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
    var expected = 'Password for bitbucket.com copied to clipboard. Login: phil@example.com';
    test(view.buffer).equals(expected);
  }, testMultipleMatches);
  commands.query(passwords, {args: ['bitbucket']});
};

testMultipleMatches = function testMultipleMatches() {
  var expected = 'Multiple passwords matched. Displaying:' +
    'github.com,another@example.com,11111111\n' +
    'github.com,phil@example.com,12345678',
    view = createView();
  commands.setView(view);
  commands.query(passwords, {args: ['github']});
  test(view.buffer).equals(expected);
};

testSingleMatch();
