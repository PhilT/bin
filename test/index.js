'use strict';

var assert = require('assert'),
    errors = [],
    passed,
    passCount = 0,
    tests = [],
    currentTest = -1,
    doc = process.argv[2],
    description,
    beforeFunc,
    currentFile,
    i,
    runTests;

process.on('SIGINT', function () {
  process.exit(0);
});

global.describe = function describe(desc, func) {
  description = desc;
  func();
};

global.before = function before(func) {
  beforeFunc = func;
};

global.it = function it(title, func) {
  tests.push({
    subject: require('../lib/pw/' + currentFile.replace('_test.js', '')),
    description: description + ' ' + title,
    beforeFunc: beforeFunc,
    runItFunc: func
  });
};

global.expect = function expect(actual) {
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

global.fail = function fail(message) {
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

runTests = function runTests() {
  var nextTest;
  currentTest += 1;
  nextTest = tests[currentTest];
  if (nextTest) {
    if (nextTest.beforeFunc) { nextTest.beforeFunc(); }
    nextTest.runItFunc(runTests);
  }
};

require("fs").readdirSync('./test/pw').forEach(function (file) {
  currentFile = file;
  require("./pw/" + currentFile);
});

runTests();
