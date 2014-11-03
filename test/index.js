'use strict';

var normalizedPath = require('path').join(__dirname, "pw");

require("fs").readdirSync(normalizedPath).forEach(function (file) {
  require("./pw/" + file);
});
