'use strict';

var assert = require('assert'),
    errors = [],
    passed,
    passCount = 0,
    tests = [],
    currentTest = -1,
    doc = process.argv[2],
    description,
    i;

process.on('SIGINT', function () {
  process.exit(0);
});

exports.describe = function describe(desc, func) {
  description = desc;
  func();
};

exports.it = function it(title, func) {
  tests.push({
    description: description + ' ' + title,
    runItFunc: func
  });
};

exports.expect = function expect(actual) {
  var error = {
    test: tests[currentTest]
  };
  passed = '.';
  return {
    toEqual: function toEqual(expected) {
      try {
        if (passed !== 'F') {
          assert.strictEqual(actual, expected);
          passCount += 1;
        }
      } catch (e) {
        error.stack = e.stack;
        errors.push(error);
        passed = 'F';
      }
      process.stdout.write(passed);
      if (doc === 'doc') { console.log(' %s', error.test.description); }
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
      console.log("\n%d >>> %s %s", i + 1, errors[i].test.description);
      console.log(errors[i].stack);
    }
  } else {
    console.log('PASSED %d assertions.', passCount);
  }
});

exports.runTests = function runTests() {
  var nextTest;
  currentTest += 1;
  nextTest = tests[currentTest];
  if (nextTest) { nextTest.runItFunc(runTests); }
};
