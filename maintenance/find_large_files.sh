#!/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <directory> <number_of_files>"
    exit 1
fi

DIRECTORY=$1
NUMBER_OF_FILES=$2

# Find and display the largest files
echo "Finding the largest files in directory: $DIRECTORY"
find "$DIRECTORY" -type f -exec du -h {} + | sort -rh | head -n "$NUMBER_OF_FILES"
