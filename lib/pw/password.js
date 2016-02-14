var util = require('util'),
    exec = require('child_process').exec,
    os = require('os'),
    view = require('./view'),
    flow = require('./flow'),
    passwordChars = ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', '0123456789'],
    maxChars = [passwordChars[0].length, 10],
    minNumbers = 2,
    maxNumbersPercent = 0.25

exports.setView = function setView(v) { view = v }
exports.setFlow = function setFlow(f) { flow = f }

exports.rand = function rand(min, max) {
  if (!max) {
    max = min
    min = 0
  }
  return Math.floor(Math.random() * (max - min) + min)
}

exports.generate = function generate(length) {
  var password = '',
      maxNumbers = length * maxNumbersPercent,
      numCount = exports.rand(minNumbers, maxNumbers),
      pool = Array.apply(null, new Array(length)).map(Number.prototype.valueOf, 0),
      slot,
      i

  for (i = 0; i < numCount;) {
    slot = exports.rand(pool.length)
    if (pool[slot] === 0) {
      pool[slot] = 1
      i += 1
    }
  }

  for (i = 0; i < length; i += 1) {
    password += passwordChars[pool[i]][exports.rand(maxChars[pool[i]])]
  }
  return password
}

exports.copy = function copy(url, login, password) {
  var noNewline = '-n ',
      command = 'echo',
      options,
      clipper

  if (os.platform() === 'win32') {
    noNewline = '|set /p='
    clipper = 'clip'
  } else if (os.platform() === 'darwin') {
    command = 'printf'
    noNewline = ''
    clipper = 'pbcopy'
  } else {
    clipper = 'xsel -i'
  }

  flow.wantToExit()

  options = util.format("%s %s%s|%s", command, noNewline, password, clipper)

  exec(options, function () {
    view.write('Password for %s copied to clipboard. Login: %s', url, login)
    flow.attemptExit()
  })
}

exports.sort = function sort(passwords) {
  var dropPrefixes = /^(https?:\/\/)?(www.)?/

  return passwords.sort(function (a, b) {
    a = a.replace(dropPrefixes, '')
    b = b.replace(dropPrefixes, '')
    if (a > b) { return 1 }
    if (a < b) { return -1 }
    return 0
  })
}
