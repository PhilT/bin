'use strict';

var slotCount,
    charCount,
    numCount;

describe('Password', function () {
  before(function () {
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
  });

  describe('#generate', function () {
    before(function () {
      slotCount = 0;
      charCount = 0;
      numCount = 0;
    });

    it('returns a password with 4 numbers', function (done) {
      expect(subject.generate(20)).toEqual('B1234CDEFGHIJKLMNOPQ');
      done();
    });

    it('returns a password with 2 numbers', function (done) {
      expect(subject.generate(10)).toEqual('B34CDEFGHI');
      done();
    });
  });
});
