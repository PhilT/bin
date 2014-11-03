'use strict';

var waitingToExit = 0;

exports.attemptExit = function attemptExit() {
  waitingToExit -= 1;
  if (waitingToExit === 0) {
    process.exit(1);
  }
};

exports.wantToExit = function wantToExit() {
  waitingToExit += 1;
};
