'use strict';

var assert = require('assert'),
    errors = [],
    passed,
    passCount = 0,
    tests = [],
    currentTest = -1,
    i,
    runTests;

process.on('SIGINT', function () {
  process.exit(0);
});

//TODO: support multiple describes in different files.
exports.describe = function describe(description, func) {
  func();
  runTests();
};

exports.it = function it(description, func) {
  tests.push({
    description: description,
    runItFunc: func
  });
};

exports.expect = function expect(actual) {
  passed = '.';
  return {
    toEqual: function toEqual(expected) {
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

runTests = function runTests() {
  var nextTest;
  currentTest += 1;
  nextTest = tests[currentTest];
  if (nextTest) { nextTest.runItFunc(runTests); }
};
