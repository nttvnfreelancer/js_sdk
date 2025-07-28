#!/bin/bash
# $1 retry count
# $2 command
# e.g. ./scripts/retry.sh 5 yarn ci-test-e2e-banner

count=${1:-5}
if [ $# != 3 ]; then
    exit 1
fi
shift
cmd="$@"

counter=1
while [ $counter -le $count ]
do
  $cmd
  if [ $? -eq 0 ]; then
    exit 0
  fi
  ((counter++))
done
exit 1
