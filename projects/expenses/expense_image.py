"""Expense Image Module - Handle receipt image storage."""
import os
import shutil
from datetime import datetime
from typing import Optional, Tuple

# Base image storage path
IMAGES_BASE_PATH = os.path.expanduser("~/projects/bim/expenses/images")


def ensure_directory(path: str) -> None:
    """Create directory if it doesn't exist."""
    os.makedirs(path, exist_ok=True)


def get_image_directory(date_str: str) -> str:
    """Get the image directory for a given date.
    
    Args:
        date_str: Date in YYYY-MM-DD format
        
    Returns:
        Path to the month directory
    """
    month_key = date_str[:7]  # YYYY-MM
    return os.path.join(IMAGES_BASE_PATH, month_key)


def generate_image_filename(receipt_id: str, date_str: str, extension: str = ".jpg") -> str:
    """Generate filename for receipt image.
    
    Args:
        receipt_id: The receipt ID
        date_str: Date in YYYY-MM-DD format
        extension: File extension
        
    Returns:
        Filename string
    """
    return f"receipt_{receipt_id}_{date_str}{extension}"


def save_receipt_image(
    source_path: str,
    receipt_id: str,
    date_str: str,
    extension: Optional[str] = None
) -> str:
    """Save a receipt image to the storage location.
    
    Args:
        source_path: Path to the source image file
        receipt_id: The receipt ID
        date_str: Date in YYYY-MM-DD format
        extension: Optional file extension override
        
    Returns:
        Path to the saved image
    """
    # Determine extension
    if extension is None:
        _, ext = os.path.splitext(source_path)
        if not ext:
            ext = ".jpg"
        extension = ext.lower()
    
    # Get target directory and filename
    target_dir = get_image_directory(date_str)
    ensure_directory(target_dir)
    
    filename = generate_image_filename(receipt_id, date_str, extension)
    target_path = os.path.join(target_dir, filename)
    
    # Copy the file
    shutil.copy2(source_path, target_path)
    
    return target_path


def move_receipt_image(
    source_path: str,
    receipt_id: str,
    date_str: str,
    extension: Optional[str] = None
) -> str:
    """Move a receipt image to the storage location.
    
    Args:
        source_path: Path to the source image file
        receipt_id: The receipt ID
        date_str: Date in YYYY-MM-DD format
        extension: Optional file extension override
        
    Returns:
        Path to the moved image
    """
    # Determine extension
    if extension is None:
        _, ext = os.path.splitext(source_path)
        if not ext:
            ext = ".jpg"
        extension = ext.lower()
    
    # Get target directory and filename
    target_dir = get_image_directory(date_str)
    ensure_directory(target_dir)
    
    filename = generate_image_filename(receipt_id, date_str, extension)
    target_path = os.path.join(target_dir, filename)
    
    # Move the file
    shutil.move(source_path, target_path)
    
    return target_path


def get_image_path(receipt_id: str, date_str: str, extension: str = ".jpg") -> str:
    """Get the expected path for a receipt image.
    
    Args:
        receipt_id: The receipt ID
        date_str: Date in YYYY-MM-DD format
        extension: File extension
        
    Returns:
        Path to the image
    """
    target_dir = get_image_directory(date_str)
    filename = generate_image_filename(receipt_id, date_str, extension)
    return os.path.join(target_dir, filename)


def image_exists(receipt_id: str, date_str: str, extension: str = ".jpg") -> bool:
    """Check if receipt image exists.
    
    Args:
        receipt_id: The receipt ID
        date_str: Date in YYYY-MM-DD format
        extension: File extension
        
    Returns:
        True if image exists
    """
    return os.path.exists(get_image_path(receipt_id, date_str, extension))


def delete_image(receipt_id: str, date_str: str, extension: str = ".jpg") -> bool:
    """Delete a receipt image.
    
    Args:
        receipt_id: The receipt ID
        date_str: Date in YYYY-MM-DD format
        extension: File extension
        
    Returns:
        True if deleted or didn't exist
    """
    path = get_image_path(receipt_id, date_str, extension)
    if os.path.exists(path):
        os.remove(path)
        return True
    return False


def list_images_for_month(month_key: str) -> list:
    """List all receipt images for a month.
    
    Args:
        month_key: Month in YYYY-MM format
        
    Returns:
        List of image paths
    """
    month_dir = os.path.join(IMAGES_BASE_PATH, month_key)
    
    if not os.path.exists(month_dir):
        return []
    
    images = []
    for filename in os.listdir(month_dir):
        if filename.startswith("receipt_") and filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            images.append(os.path.join(month_dir, filename))
    
    return sorted(images)


def extract_id_from_filename(filename: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract receipt ID and date from image filename.
    
    Args:
        filename: Image filename
        
    Returns:
        Tuple of (receipt_id, date_str) or (None, None)
    """
    # Format: receipt_{id}_{date}.ext
    import re
    
    match = re.match(r'receipt_(.+?)_(\d{4}-\d{2}-\d{2})\.', filename)
    if match:
        return match.group(1), match.group(2)
    
    return None, None


if __name__ == "__main__":
    # Test
    print("Images base path:", IMAGES_BASE_PATH)
    
    test_date = "2026-02-22"
    test_id = "RZE-20260222-ABC123"
    
    print("Image directory:", get_image_directory(test_date))
    print("Generated filename:", generate_image_filename(test_id, test_date))
    print("Full path:", get_image_path(test_id, test_date))
