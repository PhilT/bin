#!/bin/bash

# pw
#
# Commandline bash script for storing and retreiving passwords
# encrypted using PGP. Store website, username/email and password.
# Places password into clipboard for easy pasting into website or app.
#
# Works on Linux, Windows and Mac.
#
# Find pw and other useful scripts at https://github.com/PhilT/bin
#
# version 0.7 - Fixed incorrect use of extended bash if
#               Added description
# version 0.6 - Silence some verbose commands
# version 0.5 - Add support for OSX
#               Overwrite existing passwords (--force)
#               15 character passwords including symbols
#               Optional safe characters (--safe)
# version 0.4 - Add support for Git Bash aka MinGW
# version 0.3 - generate password and copy to clipboard
#               Don't re-encrypt file if not changed
#               Copy retrieved password to clipboard
#               Improve display of multiple passwords
# version 0.2 - Added --edit command
# version 0.1 - Not much error handling yet.
#
# Add to ~/bin/pw and chmod +x it.
# See bottom of file for usage or run `pw` without args.

if [[ -f ~/.pwconfig ]]; then
  source ~/.pwconfig
fi

if [[ -z $PASSWORD_DIR || -z $PASSWORD_FILE || -z $EDIT ]]; then
  echo 'A ~/.pwconfig file must exist with the following configuration:'
  echo 'PASSWORD_DIR=password/dir (no trailing slash)'
  echo 'PASSWORD_FILE=.password.csv (no gpg extension)'
  echo 'EDIT=path/to/editor'
  echo ''
  exit 1
fi

PASSWORD_GPG=$PASSWORD_DIR/$PASSWORD_FILE.gpg
PASSWORD_TEMP=/tmp/$PASSWORD_FILE

if [[ ! -d $PASSWORD_DIR ]]; then
  echo $PASSWORD_DIR does not exist. Check ~/.pwconfig
  exit 1
fi

if [[ ! -f $PASSWORD_GPG ]]; then
  echo $PASSWORD_GPG does not exist. Check ~/.pwconfig
  exit 1
fi

if [[ $# > 0 ]]; then
  echo 'Enter encryption password:'
  read -s secret
  OPTIONS=--no-permission-warning\ --no-secmem-warning\ --force-mdc\ --no-tty\ -q\ --no-use-agent\ --yes\ --passphrase=$secret\ --homedir\ ~/.gnupg
fi

function encrypt {
  gpg $OPTIONS -c -o $PASSWORD_GPG $PASSWORD_TEMP > /dev/null 2>&1
  cleanup
  echo 'Password file updated.'
}

function decrypt {
  gpg $OPTIONS -o $PASSWORD_TEMP $PASSWORD_GPG > /dev/null 2>&1
}

function backup_decrypted_file {
  cp $PASSWORD_TEMP $PASSWORD_TEMP.bak > /dev/null 2>&1
}

function cleanup {
  rm -f $PASSWORD_TEMP $PASSWORD_TEMP.bak > /dev/null 2>&1
}

function init_password_csv {
  encrypt
}

function edit_password_csv {
  decrypt
  backup_decrypted_file
  $EDIT $PASSWORD_TEMP
  if diff $PASSWORD_TEMP $PASSWORD_TEMP.bak > /dev/null 2>&1; then
    cleanup
    echo 'No changes made.'
  else
    encrypt
  fi
}

function add_password {
  decrypt
  site_matched=`cat $PASSWORD_TEMP | grep -q "$1,.*,.*"`
  if [[ $site_matched == 0 || $FORCE ]]; then
    pass=`LC_ALL=C tr -dc $PASSWORD_CHARS < /dev/urandom | head -c15`

    copy_password
    echo Password copied to clipboard.

    if [[ $site_matched == 0 ]]; then
      echo $1,$2,$pass >> $PASSWORD_TEMP
    else
      if [[ `uname` == 'Darwin' ]]; then
        INLINE="-i ''"
      else
        INLINE="-i"
      fi
      sed $INLINE "s/$1,.*,.*/$1,$2,$pass/" $PASSWORD_TEMP
    fi
    encrypt
  else
    cleanup
    echo Password for $1 already exists. Use --force to overwrite
  fi
}

function copy_password {
  if [[ $TERM == 'cygwin' ]]; then
    echo -n $pass > /dev/clipboard
  elif which pbcopy > /dev/null 2>&1; then
    echo -n $pass | pbcopy
  else
    echo -n $pass | xsel -i
  fi
}

function match_command {
  cat $PASSWORD_TEMP | sed -n "s/.*$1.*,\(.*\)/\1/p"
}

function matched_site {
  cat $PASSWORD_TEMP | sed -n "s/\(.*$1.*\),.*,.*/\1/p"
}

function matched_login {
  cat $PASSWORD_TEMP | sed -n "s/.*$1.*,\(.*\),.*/\1/p"
}

function find_password {
  decrypt
  matches=`match_command $1 | wc -l`
  if [ $matches -eq 0 ]; then
    echo No matches.
  elif [ $matches -eq 1 ]; then
    pass=`match_command $1 | tr -d '\n'`
    copy_password
    echo Password for $(matched_site $1) copied to clipboard. Login: $(matched_login $1)
  else
    echo Multiple passwords matched. Displaying:
    cat $PASSWORD_TEMP | grep $1
  fi
  rm -f $PASSWORD_TEMP
}

if [[ $1 == '--safe' ]]; then
  shift
  PASSWORD_CHARS='A-Za-z0-9'
  echo Using safe password characters
else
  PASSWORD_CHARS='A-Za-z0-9_!@#$%^&*()\-+='
fi

if [[ $1 == '--force' ]]; then
  FORCE=true
  shift
fi

if [ $# == 2 ]; then
  add_password $1 $2
elif [ $# == 1 ]; then
  if [ $1 == '--init' ]; then
    init_password_csv
  elif [ $1 == '--edit' ]; then
    edit_password_csv
  else
    find_password $1
  fi
else
  echo 'Usage (1): pw --init          Encrypts a prepared .passwords.csv file'
  echo 'Usage (2): pw --edit          Edit the .passwords.csv file'
  echo 'Usage (3): pw TERM            find a password containing TERM'
  echo 'Usage (4): pw [--safe] [--force] URL/NAME LOGIN  add a password (generated and copied to clipboard)'
  echo 'Add or view a password from a GPG encrypted password file.'
  echo 'Parameters are in strict order (until getopts is used)'
  echo
  echo '--safe        Use upper and lower alphanumeric characters only (no symbols)'
  echo '--force       Overwrite existing password with new one'
  echo 'TERM          Enter a partial site name or URL'
  echo 'URL/NAME      A name or URL of a site'
  echo 'LOGIN         Email address or username used to login'
  echo
  exit
fi
