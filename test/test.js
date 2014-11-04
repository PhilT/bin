'use strict';

var assert = require('assert'),
    errors = [],
    passed,
    passCount = 0,
    i;

process.on('SIGINT', function () {
  process.exit(0);
});

exports.test = function test(actual) {
  passed = '.';
  return {
    equals: function equals(expected) {
      try {
        if (passed !== 'F') {
          assert.strictEqual(actual, expected);
          passCount += 1;
        }
      } catch (e) {
        errors.push(e);
        passed = 'F';
      }
      process.stdout.write(passed);
    }
  };
};

exports.fail = function fail(message) {
  errors.push(message);
  passed = 'F';
};

process.on('exit', function () {
  console.log('\n');
  if (errors.length > 0) {
    console.log('FAILED - %d assertions passed, %d assertions failed.', passCount, errors.length);
    for (i = 0; i < errors.length; i += 1) {
      console.log("\n%d >>>", i + 1);
      console.log(errors[i]);
    }
  } else {
    console.log('PASSED %d assertions.', passCount);
  }
});
