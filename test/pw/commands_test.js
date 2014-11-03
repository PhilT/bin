'use strict';

var test = require('../test').test,
    commands = require('../../lib/pw/commands'),
    util = require('util'),
    passwords = "github.com,phil@example.com,12345678\nbitbucket.com,phil@example.com,87654321\n",
    view,
    flow,
    expected;

view = {
  buffer: '',
  write: function write() {
    this.buffer += util.format.apply(this, arguments);
  }
};

flow = {
  attemptExit: function attemptExit() {
    expected = 'Password for github.com copied to clipboard. Login: phil@example.com';
    test(view.buffer).equals(expected);
  },
  wantToExit: function wantToExit() {
  }
};

commands.setView(view);
commands.setFlow(flow);
commands.query(passwords, {args: ['github']});
