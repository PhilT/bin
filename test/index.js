'use strict';

var runTests = require('./test').runTests,
    normalizedPath = require('path').join(__dirname, "pw");

require("fs").readdirSync(normalizedPath).forEach(function (file) {
  require("./pw/" + file);
});

runTests();
