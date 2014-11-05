'use strict';

var describe = require('../test').describe,
    before = require('../test').before,
    it = require('../test').it,
    expect = require('../test').expect,
    commands = require('../../lib/pw/commands'),
    util = require('util'),
    passwords = [
      'github.com,phil@example.com,12345678',
      'http://bitbucket.com,phil@example.com,87654321',
      'github.com,another@example.com,11111111'
    ].join('\n') + '\n',
    createView,
    setup,
    view;

createView = function createView() {
  return {
    buffer: '',
    write: function write() {
      this.buffer += util.format.apply(this, arguments) + '\n';
    }
  };
};

setup = function setup(assertions, done) {
  commands.setFlow({
    attemptExit: function attemptExit() {
      assertions(view);
      done();
    },
    wantToExit: function wantToExit() {}
  });
};

describe('#query', function () {
  before(function () {
    view = createView();
    commands.setView(view);
  });

  it('copies a single password to clipboard', function (done) {
    setup(function (view) {
      var expected = 'Password for http://bitbucket.com copied to clipboard. ' +
        'Login: phil@example.com\n';
      expect(view.buffer).toEqual(expected);
    }, done);

    commands.query(passwords, {args: ['bitbucket']});
  });

  it('lists passwords sorted when matching more than one', function (done) {
    var expected = 'Multiple passwords matched. Displaying:\n' +
      'github.com,another@example.com,11111111\n' +
      'github.com,phil@example.com,12345678\n\n';

    commands.query(passwords, {args: ['github']});
    expect(view.buffer).toEqual(expected);
    done();
  });

  it('lists all passwords sorted when no search term', function (done) {
    var expected = 'Multiple passwords matched. Displaying:\n' +
      'http://bitbucket.com,phil@example.com,87654321\n' +
      'github.com,another@example.com,11111111\n' +
      'github.com,phil@example.com,12345678\n\n';

    commands.query(passwords, {args: []});
    expect(view.buffer).toEqual(expected);
    done();
  });
});
