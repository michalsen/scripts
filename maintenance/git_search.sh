#!/bin/bash

# Check if a file name was provided as an argument
if [ $# -eq 0 ]; then
  echo "Error: Please provide a file name to search for."
  echo "Usage: $0 FILE_NAME"
  exit 1
fi

# Get the file name from the first argument
FILE_NAME="$1"

# Fetch all remote branches
echo "Fetching all remote branches..."
git fetch --all

# Get a list of all remote branches
REMOTE_BRANCHES=$(git branch -r | grep -v HEAD | sed 's/origin\///')

# Loop through each remote branch and search for the file
for BRANCH in $REMOTE_BRANCHES; do
  echo "Checking branch: $BRANCH"

  # Check if the file exists in the branch
  if git ls-tree -r --name-only origin/$BRANCH | grep "$FILE_NAME"; then
    echo "File '$FILE_NAME' found in branch: $BRANCH"
  else
    echo "File '$FILE_NAME' not found in branch: $BRANCH"
  fi
done

echo "Search complete."
