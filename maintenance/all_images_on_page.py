import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def list_images_on_webpage(url):
    # Send a GET request to the webpage
    response = requests.get(url)

    # Check if the request was successful
    if response.status_code != 200:
        print(f"Failed to retrieve the webpage. Status code: {response.status_code}")
        return

    # Parse the webpage content using BeautifulSoup
    soup = BeautifulSoup(response.content, 'html.parser')

    # Find all image tags
    images = soup.find_all('img')

    # Check if there are any images on the page
    if not images:
        print("No images found on the webpage.")
        return

    # Iterate over each image and print the details
    for i, img in enumerate(images, start=1):
        # Get the image source (URL or path)
        src = img.get('src', 'No src attribute')

        # Skip SVG images
        if src.lower().endswith('.svg'):
            continue

        # Construct the full URL if the src is a relative path
        full_url = urljoin(url, src)

        # Get the image name from the src (last part of the URL)
        image_name = src.split('/')[-1] if src else 'No image name'

        # Get the title and alt attributes
        title = img.get('title', 'No title attribute')
        alt = img.get('alt', 'No alt text')

        # Print the details
        print(f"Image {i}:")
        print(f"  Path/URL: {full_url}")
        print(f"  Name: {image_name}")
        print(f"  Title: {title}")
        print(f"  Alt Text: {alt}")
        print("-" * 40)

if __name__ == "__main__":
    # URL of the webpage you want to scrape
    url = input("Enter the URL of the webpage: ")

    # Call the function to list images
    list_images_on_webpage(url)
