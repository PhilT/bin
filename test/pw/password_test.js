'use strict';

var describe = require('../test').describe,
    it = require('../test').it,
    expect = require('../test').expect,
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

//describe('generate', function () {
  it('generates a password with at least 2 numbers', function (done) {
    expect(password.generate(20)).toEqual('B1234CDEFGHIJKLMNOPQ');
    expect(password.generate(10)).toEqual('RSTUV78WXY');
    done();
  });
//});
