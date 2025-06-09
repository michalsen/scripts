import os
import hashlib
from collections import defaultdict

def hash_image(image_path):
    """Compute a hash for the image content."""
    hasher = hashlib.md5()  # You can use sha256() for a stronger hash
    with open(image_path, 'rb') as f:
        # Read in chunks to handle large files
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def bytes_to_megabytes(size_in_bytes):
    """Convert bytes to megabytes."""
    return size_in_bytes / (1024 * 1024)  # 1 MB = 1024 * 1024 bytes

def find_duplicate_images(directory):
    """Find duplicate images in the specified directory."""
    image_hashes = defaultdict(list)

    for root, _, files in os.walk(directory):
        for filename in files:
            # Check if the file is an image (you can expand this list)
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff')):
                image_path = os.path.join(root, filename)
                image_size = os.path.getsize(image_path)
                image_hash = hash_image(image_path)

                # Use (hash, size) as a key
                image_hashes[(image_hash, image_size)].append(image_path)

    # Filter out unique images
    duplicates = {k: v for k, v in image_hashes.items() if len(v) > 1}

    return duplicates

if __name__ == "__main__":
    directory_to_search = input("Enter the directory to search for duplicate images: ")
    duplicates = find_duplicate_images(directory_to_search)

    if duplicates:
        print("Found duplicate images:")
        for (image_hash, size), paths in duplicates.items():
            size_in_mb = bytes_to_megabytes(size)
            print(f"Hash: {image_hash}, Size: {size_in_mb:.2f} MB")
            for path in paths:
                print(f" - {path}")
    else:
        print("No duplicate images found.")
