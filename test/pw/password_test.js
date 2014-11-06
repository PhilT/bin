'use strict';

var slotCount,
    charCount,
    numCount,
    createFlow;

setup(function () {
  subject.rand = function rand(min, max) {
    if (min === 2 && max === 5) {
      return 4;
    }
    if (min === 20) {
      return slotCount += 1;
    }
    if (min === 26 * 2) {
      return charCount += 1;
    }
    if (min === 10) {
      return numCount += 1;
    }
    if (min === 2 && max === 2.5) {
      return 2;
    }
    fail('Unexpected call: rand(' + min + ', ' + (max || '') + ')');
  };

  slotCount = 0;
  charCount = 0;
  numCount = 0;
});

test('generate long password', function () {
  assert(subject.generate(20), 'B1234CDEFGHIJKLMNOPQ');
});

test('generate short password', function () {
  assert(subject.generate(10), 'B34CDEFGHI');
});


/*
createFlow = function createFlow(expected, done) {
  return {
    attemptExit: function attemptExit() {
      if (expected) {
        assert(view.buffer, expected);
        done();
      }
    },
    wantToExit: function wantToExit() {}
  };
};


subject.setFlow(createFlow(
  'Password for http://bitbucket.com copied to clipboard. ' +
    'Login: phil@example.com\n',
  done
));


*/
