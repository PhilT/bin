#!/bin/bash
while(true)
do
  inotifywait -r /c/data/Studio
  sleep 30
  unison studio
done
