
from functools import lru_cache

import boto3
from botocore.config import Config

from app.core.config import settings


@lru_cache(maxsize=1)
def get_r2_client():
    """Create and reuse a Cloudflare R2 S3 client."""

    required_settings = {
        "R2_ENDPOINT_URL": settings.r2_endpoint_url,
        "R2_ACCESS_KEY_ID": settings.r2_access_key_id,
        "R2_SECRET_ACCESS_KEY": settings.r2_secret_access_key,
        "R2_BUCKET_NAME": settings.r2_bucket_name,
    }

    missing_settings = [
        name for name, value in required_settings.items() if not value
    ]

    if missing_settings:
        raise RuntimeError(
            f"Missing Cloudflare R2 configuration: {', '.join(missing_settings)}"
        )

    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


def upload_image(object_key: str, image_data: bytes) -> None:
    """Upload a processed profile image to the private R2 bucket."""

    client = get_r2_client()

    client.put_object(
        Bucket=settings.r2_bucket_name,
        Key=object_key,
        Body=image_data,
        ContentType="image/webp",
        CacheControl="private, max-age=300",
    )


def delete_image(object_key: str) -> None:
    """Delete an image from the R2 bucket."""

    client = get_r2_client()

    client.delete_object(
        Bucket=settings.r2_bucket_name,
        Key=object_key,
    )


def generate_image_url(object_key: str, expires_in: int = 900) -> str:
    """Generate a temporary viewing URL for a private profile image."""

    client = get_r2_client()

    return client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.r2_bucket_name,
            "Key": object_key,
        },
        ExpiresIn=expires_in,
    )
