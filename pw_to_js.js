#!/bin/env node

// pw
//
// Commandline bash script for storing and retreiving passwords
// encrypted using PGP. Store website, username/email and password.
// Places password into clipboard for easy pasting into website or app.
//
// Works on Linux, Windows and Mac.
//
// Find pw and other useful scripts at https://github.com/PhilT/bin
//
// version 0.8 - Convert to Node.js (straight port to start with)
// version 0.7 - Fixed incorrect use of extended bash if
//               Added description
// version 0.6 - Silence some verbose commands
// version 0.5 - Add support for OSX
//               Overwrite existing passwords (--force)
//               15 character passwords including symbols
//               Optional safe characters (--safe)
// version 0.4 - Add support for Git Bash aka MinGW
// version 0.3 - generate password and copy to clipboard
//               Don't re-encrypt file if not changed
//               Copy retrieved password to clipboard
//               Improve display of multiple passwords
// version 0.2 - Added --edit command
// version 0.1 - Not much error handling yet.
//
// Add to ~/bin/pw and chmod +x it.
// See bottom of file for usage or run `pw` without args.
//

// 'use strict';

// var argv = require('optimist').boolean(['init', 'edit', 'safe', 'force']).argv,
    // fs = require('fs'),
    // path = require('path'),
    // readline = require('readline'),
    // exec = require('child_process').exec,
    // paths = {},
    // config = {},
    // rli;

// function cleanup() {
//   fs.unlinkSync(paths.temp);
//   fs.unlinkSync(paths.tempBak);
// }

// function execSync(command) {
//   exec(command, function (error, stdout, stderr) {
//     if (error !== null) {
//       console.log("Error %d running '%s'.", error.code, command);
//       console.log(stderr);
//       process.exit(1);
//     }
//   });
// }

// function encrypt() {
//   var options = (config.options + ['-o', paths.gpg, paths.temp]).join(' ');
//   execSync('gpg ' + options);
//   cleanup();
//   console.log('Password file updated.');
// }

// function decrypt() {
//   var options = (config.options + ['-o', paths.temp, paths.gpg]).join(' ');
//   execSync('gpg ' + options);
// }

// function backupDecruptedFile() {
//   fs.createReadStream(paths.temp).pipe(fs.createWriteStream(paths.tempBak));
// }

// function initPasswordCsv() {
//   encrypt();
// }

// function editPasswordCsv() {
//   decrypt();
//   backupDecruptedFile();
//   exec(util.format("%s %s", config.editor, paths.temp), function (error) {
//     if (error !== null) {
//       exec(util.format("diff %s %s", paths.temp, paths.tempBak), function (error) {
//         if (error !== null) {
//           if (error.code === 1) {
//             encrypt();
//           } else {
//             console.log(util.format("Error diffing %s with %s", paths.temp, paths.tempBak));
//             cleanup();
//             process.exit(1);
//           }
//         } else {
//           cleanup();
//           console.log('No changes made.');
//         }
//       });
//     }
//   });
// }

// function generatePassword() {
//   var password = '',
//       max = config.chars.length,
//       i = 0;
//   for (; i < config.passwordLength; i += 1) {
//     password += config.chars[Math.floor(Math.random() * max)];
//   }
//   return password;
// }

// function copyPassword(password) {
//   if (os.platform() === 'win32') {
//     exec('echo ' + password + ' | clip');
//   } else if (os.platform() === 'darwin') {
//     exec('echo -n ' + password + ' | pbcopy');
//   } else {
//     exec('echo -n ' + password + ' | xsel -i');
//   }
// }

// function loadPasswords() {
//   return fs.readFileSync(paths.temp, {encoding: 'UTF-8'});
// }

// function addPassword(site, login) {
  // var siteMatched,
      // passwords,
      // password,
      // newPassword;
  // decrypt();
  // passwords = loadPasswords();
  // siteMatched = passwords.indexOf(site) !== -1;
  // newPassword = [site, login, password + "\n"].join(',');

  // if (!siteMatched || argv.force) {
    // password = generatePassword();
    // copyPassword(password);
    // console.log('Password copied to clipboard.');

    // if (!siteMatched) {
    //   if (passwords[length.passwords - 1] !== "\n") { passwords += "\n"; }
    //   passwords += newPassword;
    // } else {
    //   passwords.replace(new RegExp(site + ",.*,.*\n"), newPassword);
    // }
    // encrypt();
  // } else {
    // cleanup();
    // console.log('Password for %s already exists. Use --force to overwrite', site);
//   }
// }

// function findPassword(site) {
//   var regexp = new RegExp(".*" + site + ".*\n", 'g'),
//       passwords,
//       matches,
//       parts;
//   decrypt();
//   passwords = loadPasswords();
//   matches = passwords.match(regexp);
//   if (matches.length === 0) {
//     console.log('No matches.');
//   } else if (matches === 1) {
//     parts = matches[0].split(',').replace("\n", '');
//     copyPassword(parts[2]);
//     console.log('Password for %s copied to clipboard. Login: %s', parts[0], parts[1]);
//   } else {
//     console.log('Multiple passwords matched. Displaying:');
//     console.log(matches.join(''));
//   }
//   cleanup();
// }

// paths.home = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE);
// paths.config = path.join(paths.home, '.pwconfig.json');

// try {
//   config = JSON.parse(fs.readFileSync(paths.config, {encoding: 'UTF-8'}));
//   paths.dir = config.dir;
//   paths.file = paths.file;
// } catch (e) {}
//
// if (!paths.dir || !paths.file || !config.editor) {
//   console.log(paths.config + ' must exist. For example:');
//   console.log('{"dir": "password/dir", "file": ".password.csv", "editor": "vim"}');
//   process.exit(1);
// }

// config.passwordLength = 15;
// paths.gpg = path.join(config.dir, paths.file) + '.gpg';
// paths.temp = path.join(os.tmpdir(), paths.file);
// paths.tempBak = paths.temp + '.bak';
//
// if (!fs.existsSync(config.dir)) {
//   console.log(config.dir + ' does not exist. Check ' + paths.config);
//   process.exit(1);
// }
//
// if (!fs.existsSync(paths.gpg)) {
//   console.log(paths.gpg + ' does not exist. Check ' + paths.config);
//   process.exit(1);
// }

// rli = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// if (argv.size > 0) {
//   rli.question('Enter encryption password:', function (answer) {
//     rli.close();
//     config.options = [
//       '--no-permission-warning',
//       '--no-secmem-warning',
//       '--force-mdc',
//       '--no-tty',
//       '-q',
//       '--no-use-agent',
//       '--yes',
//       '--passphrase=' + answer,
//       '--homedir ' + path.join(path.home, '.gnupg')
//     ];
//   });
// }

// config.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//
// if (argv.safe) {
//   console.log('Using safe password characters');
// } else {
//   config.chars += '_!@#$%^*()\\-+=';
// }

// if (argv._.length === 2)  {
//   addPassword(argv._[0], argv._[1]);
// } else if (argv._.length === 1) {
//   findPassword(argv._[0]);
// } else {
//   if (argv.init) {
//     initPasswordCsv();
//   } else if (argv.edit) {
//     editPasswordCsv();
//   } else {
    // console.log('pw --init          Encrypts a prepared .passwords.csv file');
    // console.log('pw --edit          Edit the .passwords.csv file');
    // console.log('pw TERM            find a password containing TERM');
    // console.log('pw [options] URL/NAME LOGIN  generate password (copied to clipboard)');
    // console.log('Add or view a password from a GPG encrypted password file.');
    // console.log('');
    // console.log('options:');
    // console.log('   --safe     Use upper and lower alphanumeric characters only (no symbols)');
    // console.log('   --force    Overwrite existing password with new one');
    // console.log('TERM          Enter a partial site name or URL');
    // console.log('URL/NAME      A name or URL of a site');
    // console.log('LOGIN         Email address or username used to login');
    // console.log('');
    // process.exit(1);
//   }
// }
