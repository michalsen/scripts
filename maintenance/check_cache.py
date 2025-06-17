import subprocess
import time

site = 'https://<SITE_URL>'
# Array of URLs to check
paths = [
    '/page1',
    '/page2',
    '/page3'
]

def get_cache_age(url):
    # Uses curl to fetch the 'Age' header from the response.
    # Returns the cache age as an integer, or None if the header is missing.
    try:
        # Run curl command to fetch headers
        result = subprocess.run(
            ["curl", "-sI", url],  # -sI: silent, fetch headers only
            capture_output=True,
            text=True
        )
        headers = result.stdout.splitlines()
        # Extract the 'Age' header
        for header in headers:
            if header.lower().startswith("age:"):
                return int(header.split(":")[1].strip())
        return None  # 'Age' header not found
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None
def check_cache_age(url):
    # Checks the cache age of a URL.
    # Retries once if the cache age is 0.
    # Prints the URL if the cache age is still 0 after retry.
    cache_age = get_cache_age(url)
    # print(f"first pass {cache_age}")
    if cache_age == 0:
        # Retry once
        time.sleep(2)
        # print(f"reloading: " +url)
        cache_age = get_cache_age(url)
        if cache_age == 0:
            print(f"Cache age is 0 for URL: {url}")
# Iterate through the URLs and check their cache age
for url in paths:
    full_url = site + url
    check_cache_age(full_url)
