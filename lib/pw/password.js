'use strict';

var passwordChars = ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', '0123456789'],
    maxChars = [passwordChars[0].length, 10],
    minNumbers = 2,
    maxNumbersPercent = 0.25;

exports.rand = function rand(min, max) {
  if (!max) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min) + min);
};

exports.generate = function generate(length) {
  var password = '',
      maxNumbers = length * maxNumbersPercent,
      numCount = exports.rand(minNumbers, maxNumbers),
      pool = Array.apply(null, new Array(length)).map(Number.prototype.valueOf, 0),
      slot,
      i;

  for (i = 0; i < numCount;) {
    slot = exports.rand(pool.length);
    if (pool[slot] === 0) {
      pool[slot] = 1;
      i += 1;
    }
  }

  for (i = 0; i < length; i += 1) {
    password += passwordChars[pool[i]][exports.rand(maxChars[pool[i]])];
  }
  return password;
};
