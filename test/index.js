'use strict';

var assertions = require('assert'),
    failures = [],
    passed,
    passCount = 0,
    failureCount = 0,
    errorCount = 0,
    tests = [],
    testIndex = -1,
    testCount,
    timeoutId,
    testSubject,
    runSetup,
    i,
    runTests,
    timeoutError,
    done,
    fileLine;

process.on('SIGINT', function () {
  process.exit(0);
});

global.setup = function setup(func) {
  runSetup = func;
};

global.test = function test(func) {
  var caller;

  try { throw new Error(); } catch (e) { caller = e.stack; }
  tests.push({
    stack: caller,
    subject: testSubject,
    runSetup: runSetup,
    runTest: func,
    async: (func.length === 1)
  });
};

global.assert = function assert(actual, expected) {
  passed = '.';

  try {
    if (passed !== 'F') {
      assertions.strictEqual(actual, expected);
      passCount += 1;
    }
  } catch (e) {
    failures.push(e.stack);
    failureCount += 1;
    passed = 'F';
  }
  process.stdout.write(passed);
};

global.fail = function fail(message) {
  failures.push(message);
  process.stdout.write('F');
};

process.on('exit', function () {
  var message;

  console.log('\n');
  if (errorCount > 0 || failureCount > 0) {
    message = 'FAILED - %d assertions passed, %d assertions failed, %d errors.';
    console.log(message, passCount, failureCount, errorCount);
    console.log('\nFailures:');
    for (i = 0; i < failures.length; i += 1) {
      console.log('  ' + fileLine(failures[i]));
    }
  } else {
    console.log('PASSED - %d assertions.', passCount);
  }
});

runTests = function runTests() {
  var test;

  testCount = tests.length;
  testIndex += 1;
  test = tests[testIndex];
  if (!test) { return; }

  global.subject = test.subject;
  if (test.runSetup) { test.runSetup(); }
  if (test.async) {
    timeoutId = setTimeout(timeoutError, 1000);
  }
  test.runTest(done);
  if (!test.async) { runTests(); }
};

fileLine = function fileLine(stack) {
  var line = stack.split('\n')[2];
  line = line.match(/\((.*:[0-9]+):[0-9]+\)/);
  return line[1];
};

timeoutError = function timeoutError() {
  errorCount += 1;
  failures.push('Async timeout in test ' + fileLine(tests[testIndex].stack));
  process.stdout.write('E');
  runTests();
};

done = function done() {
  clearTimeout(timeoutId);
  runTests();
};

require("fs").readdirSync('./test/pw').forEach(function (file) {
  testSubject = require('../lib/pw/' + file.replace('_test.js', ''));
  require("./pw/" + file);
});

runTests();
