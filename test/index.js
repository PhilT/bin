'use strict';

// simpltest version 0.1
// @author Phil Thompson

var assertions = require('assert'),
    tests = [],
    failures = [],
    bar = '',
    testIndex = -1,
    timeoutId,
    testSubject,
    runSetup,
    runTests,
    timeoutError,
    done,
    fileLine,
    progress,
    count;

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

progress = function progress(type, message) {
  if (message) { failures.push(message); }
  bar += type;
  process.stdout.write(type);
};

count = function count(type) {
  return (bar.match(new RegExp('\\' + type, 'g')) || []).length;
};

global.assert = function assert(actual, expected) {
  try {
    assertions.strictEqual(actual, expected);
    progress('.');
  } catch (e) {
    progress('F', fileLine(e.stack));
  }
};

global.fail = function fail(message) {
  progress('F', message);
};

process.on('exit', function () {
  var message, i;

  console.log('\n');
  if (bar.match(/F|E|T/)) {
    message = 'FAILED - %d assertions passed, %d assertions failed, %d errors, %d timed out.';
    console.log(message, count('.'), count('F'), count('E'), count('T'));
    console.log('\nFailures:');
    for (i = 0; i < failures.length; i += 1) {
      console.log('  ' + failures[i]);
    }
  } else {
    console.log('PASSED - %d assertions.', bar.length);
  }
});

runTests = function runTests() {
  var test;

  testIndex += 1;
  test = tests[testIndex];
  if (!test) { return; }

  global.subject = test.subject;
  if (test.runSetup) { test.runSetup(); }
  if (test.async) {
    timeoutId = setTimeout(timeoutError, 1000);
  }
  try {
    test.runTest(done);
  } catch (e) {
    progress('E', fileLine(e.stack));
  }
  if (!test.async) { runTests(); }
};

fileLine = function fileLine(stack) {
  var line = stack.split('\n')[2];
  return line.match(/\((.*:[0-9]+):[0-9]+\)/)[1];
};

timeoutError = function timeoutError() {
  progress('T', 'Async timeout in test ' + fileLine(tests[testIndex].stack));
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
