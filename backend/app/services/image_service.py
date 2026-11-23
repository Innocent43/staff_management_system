from io import BytesIO
from PIL import Image,ImageOps,UnidentifiedImageError

MAX_IMAGE_SIZE = 5 * 1024 * 1024 # 5 MB
MAX_IMAGE_PIXELS = 25_000_000
ALLOWED_FORMATS = {"JPEG","PNG","WEBP"}
PROFILE_IMAGE_SIZE = (512,512)


def process_profile_image(image_data: bytes) -> bytes:
    """
    Validate, resize, crop and convert a profile picture to WebP.

    Returns the processed image as bytes.
    """

    if not image_data:
        raise ValueError("The uploaded image is empty.")
    if len(image_data) > MAX_IMAGE_SIZE:
        raise ValueError("Image must not exceed 5 MB.")

    try:
        with Image.open(BytesIO(image_data)) as image:
            if image.format not in ALLOWED_FORMATS:
                raise ValueError("Only JPEG, PNG AND WebP images are supported.")
            
             # Reject excessively large images before processing.
            if image.width * image.height > MAX_IMAGE_PIXELS:
                raise ValueError("Image dimensions are too large.")

            image.verify()
        # Reopen because verify() invalidates the image object.
        
        with Image.open(BytesIO(image_data)) as image:
        # Respect camera orientation stored in EXIF metadata.
            image = ImageOps.exif_transpose(image)

            has_transparency = (
            "A" in image.getbands()
            or "transparency" in image.info

        )
            image = image.convert("RGBA" if has_transparency else "RGB")

            # Crop and resize to a consistent square image.
            image = ImageOps.fit(
                image,
                PROFILE_IMAGE_SIZE,
                method=Image.Resampling.LANCZOS,
            )
            # Re-encoding removes unnecessary original metadata.

            output = BytesIO()

            image.save(output,format="WEBP",quality=85,method=6,)

            return output.getvalue()
    except (UnidentifiedImageError,OSError,Image.DecompressionBombError):
        raise ValueError("The uploaded file is not a valid image.")




