#!/bin/bash

DOCUMENTS=/c/data/workspace/documents
TIMEOUT=120

while(true)
do
  inotifywait -r --exclude "\.git" $DOCUMENTS
  sleep $TIMEOUT
  cd $DOCUMENTS && git add -A && git commit -m 'autocommitted by ~/bin/watch_documents.sh' && git push
done

