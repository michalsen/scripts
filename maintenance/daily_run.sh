#!/bin/bash

# This script collects logs from Pantheon app servers and aggregates them.
# It also parses the logs to generate HTML reports for search queries and GoAccess statistics.
# Make sure you have Terminus installed and authenticated before running this script.

terminus auth:login

# Site UUID is REQUIRED: Site UUID from Dashboard URL, e.g. 12345678-1234-1234-abcd-0123456789ab
SITE_UUID=UUID
# Environment is REQUIRED: dev/test/live/or a Multidev
ENV=live

########### Additional settings you don't have to change unless you want to ###########
# OPTIONAL: Set AGGREGATE_NGINX to true if you want to aggregate nginx logs.
#  WARNING: If set to true, this will potentially create a large file
AGGREGATE_NGINX=false
# if you just want to aggregate the files already collected, set COLLECT_LOGS to FALSE
COLLECT_LOGS=true
# CLEANUP_AGGREGATE_DIR removes all logs except combined.logs from aggregate-logs directory.
CLEANUP_AGGREGATE_DIR=false

if [ $COLLECT_LOGS == true ]; then
echo 'COLLECT_LOGS set to $COLLECT_LOGS. Beginning the process...'
for app_server in $(dig +short -4 appserver.$ENV.$SITE_UUID.drush.in);
do
    rsync -rlvz --size-only --ipv4 --progress -e "ssh -p 2222" "$ENV.$SITE_UUID@$app_server:logs" "app_server_$app_server"
done

# Include MySQL logs
for db_server in $(dig +short -4 dbserver.$ENV.$SITE_UUID.drush.in);
do
    rsync -rlvz --size-only --ipv4 --progress -e "ssh -p 2222" "$ENV.$SITE_UUID@$db_server:logs" "db_server_$db_server"
done
else
echo 'skipping the collection of logs..'
fi

if [ $AGGREGATE_NGINX == true ]; then
echo 'AGGREGATE_NGINX set to $AGGREGATE_NGINX. Starting the process of combining nginx-access logs...'
mkdir aggregate-logs

for d in $(ls -d app*/logs/nginx); do
    for f in $(ls -f "$d"); do
    if [[ $f == "nginx-access.log" ]]; then
        cat "$d/$f" >> aggregate-logs/nginx-access.log
        cat "" >> aggregate-logs/nginx-access.log
    fi
    if [[ $f =~ \.gz ]]; then
        cp -v "$d/$f" aggregate-logs/
    fi
    done
done

echo "unzipping nginx-access logs in aggregate-logs directory..."
for f in $(ls -f aggregate-logs); do
    if [[ $f =~ \.gz ]]; then
    gunzip aggregate-logs/"$f"
    fi
done

echo "combining all nginx access logs..."
for f in $(ls -f aggregate-logs); do
    cat aggregate-logs/"$f" >> aggregate-logs/combined.logs
done
echo 'the combined logs file can be found in aggregate-logs/combined.logs'
else
echo "AGGREGATE_NGINX set to $AGGREGATE_NGINX. So we're done."
fi

if [ $CLEANUP_AGGREGATE_DIR == true ]; then
echo 'CLEANUP_AGGREGATE_DIR set to $CLEANUP_AGGREGATE_DIR. Cleaning up the aggregate-logs directory'
find ./aggregate-logs/ -name 'nginx-access*' -print -exec rm {} \;
fi

############# GoAccess Parse Log File ###########

touch working/file.log

# Define the target directory for the concatenated log file
output_file="working/file.log"

# Create the output directory if it doesn't exist
mkdir -p "$(dirname "$output_file")"

# Clear the output file if it already exists
> "$output_file"

# Get the previous day in the format YYYYMM
previous_day=$(date -v -1d +%Y%m%d)
echo $previous_day

# Loop through all directories starting with app_server_
for dir in app_server_*; do
    if [ -d "$dir/logs/nginx" ]; then
        # Define the path to the gzipped log file
        log_file="$dir/logs/nginx/nginx-access.log-$previous_day.gz"
        echo $log_file

        # Check if the gzipped log file exists
        if [ -f "$log_file" ]; then
            # Uncompress the log file and concatenate its content to the output file
            gunzip -c "$log_file" >> "$output_file"
            echo "Processed: $log_file"
        else
            echo "Log file not found: $log_file"
        fi
    fi
done

# parse search
cat working/file.log |
    awk '{print $7}' |
    sed -n 's/.*search=\([^&]*\).*/\1/p' |
    sed 's/%20/ /g' |
    sed 's/%[2-3][8-9CF]//g' |
    sort |
    uniq -c |
    sort -nr |
    awk '$1 > 4 {print "<li>" $2 " (" $1 ")</li>"}' > sites/default/files/Search_$previous_day.html

# Wrap the output in HTML tags
{
    echo "<html>"
    echo "<body>"
    echo "<h1>"
    echo $previous_day | awk '{print substr($0, 5, 2) "/" substr($0, 7, 2) "/" substr($0, 1, 4)}'
    echo "</h1>"
    echo "<ul>"
    cat sites/default/files/Search_$previous_day.html
    echo "</ul>"
    echo "</body>"
    echo "</html>"
} > sites/default/files/Search_$previous_day.html.tmp

# Replace the original file with the new HTML file
mv sites/default/files/Search_$previous_day.html.tmp sites/default/files/Search_$previous_day.html

# parse log file to html format
goaccess working/file.log > sites/default/files/$previous_day.html

# rsync to dailylogs.dev
terminus rsync sites/default/files/. dailylogs.dev:files

## clean up
rm working/file.log
rm -rf app_server_*
rm -rf db_server_*

# Function to convert timestamp to MM/DD/YYYY HH:MM format
convert_timestamp() {
    local timestamp="$1"

    # Check if timestamp is empty
    if [[ -z "$timestamp" ]]; then
        echo "Error: No timestamp returned from Terminus command"
        return 1
    fi

    # Remove any whitespace
    timestamp=$(echo "$timestamp" | tr -d '[:space:]')

   # Check if timestamp is numeric (Unix timestamp) - handle decimal timestamps
    if [[ "$timestamp" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
        # Strip decimal portion from timestamp if present
        timestamp_int="${timestamp%.*}"
        # Convert Unix timestamp to MM/DD/YYYY HH:MM
        date -d "@$timestamp_int" "+%m/%d/%Y %H:%M" 2>/dev/null || \
        date -r "$timestamp_int" "+%m/%d/%Y %H:%M" 2>/dev/null
    else
        # Try to parse various date formats
        if [[ "$timestamp" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2} ]]; then
            date -d "$timestamp" "+%m/%d/%Y %H:%M" 2>/dev/null
        else
            date -d "$timestamp" "+%m/%d/%Y %H:%M" 2>/dev/null
        fi
    fi
}

Site=("<SITE>1" "<SITE>2" "<SITE>3") # Replace with your actual site names
for site in "${Site[@]}"; do
    echo ""
    echo "Processing site: ${site}.live"
    echo "-----------------------------------------"

    # Run the Terminus command for the current site
    backup_date=$(terminus backup:info "${site}.live" --field=Date 2>/dev/null)

    # Check if the command was successful
    if [[ $? -ne 0 ]]; then
        echo "❌ Error: Failed to get backup info for ${site}.live"
        echo "   Please check site access and authentication"
        continue
    fi

    # Check if we got a result
    if [[ -z "$backup_date" ]]; then
        echo "❌ Error: No backup date found for ${site}.live"
        continue
    fi

    # echo "Raw date: $backup_date"

    # Convert the timestamp
    formatted_date=$(convert_timestamp "$backup_date")

    if [[ $? -eq 0 && -n "$formatted_date" ]]; then
        echo "✅ Backup date: $formatted_date"
    else
        echo "⚠️  Could not format date: $backup_date"
    fi
done
