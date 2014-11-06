'use strict';

var util = require('util'),
    passwords = [
      'github.com,phil@example.com,12345678',
      'http://bitbucket.com,phil@example.com,87654321',
      'github.com,another@example.com,11111111'
    ].join('\n') + '\n',
    createView,
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
  view = createView();
  subject.setView(view);
});

test(function (done) {
  subject.setFlow({
    attemptExit: function attemptExit() {
      var expected = 'Password for http://bitbucket.com copied to clipboard. ' +
        'Login: phil@example.com\n';

      assert(view.buffer, expected);
      done();
    },
    wantToExit: function wantToExit() {}
  });

  subject.query(passwords, {args: ['bitbucket']});
});

test(function () {
  var expected = 'Multiple passwords matched. Displaying:\n' +
    'github.com,another@example.com,11111111\n' +
    'github.com,phil@example.com,12345678\n\n';

  subject.query(passwords, {args: ['github']});
  assert(view.buffer, expected);
});

test(function () {
  var expected = 'Multiple passwords matched. Displaying:\n' +
    'http://bitbucket.com,phil@example.com,87654321\n' +
    'github.com,another@example.com,11111111\n' +
    'github.com,phil@example.com,12345678\n\n';

  subject.query(passwords, {args: []});
  assert(view.buffer, expected);
});
