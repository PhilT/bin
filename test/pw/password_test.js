'use strict';

var test = require('../test').test,
    fail = require('../test').fail,
    password = require('../../lib/pw/password'),
    slotCount = 0,
    charCount = 0,
    numCount = 0;

password.rand = function rand(min, max) {
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

test(password.generate(20)).equals('B1234CDEFGHIJKLMNOPQ');
test(password.generate(10)).equals('RSTUV78WXY');
