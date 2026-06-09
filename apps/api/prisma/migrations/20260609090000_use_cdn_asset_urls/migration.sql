UPDATE "business_documents"
SET "document_url" = REPLACE(
    "document_url",
    'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/',
    'https://cdn.todam.app/'
)
WHERE "document_url" LIKE 'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/%';

UPDATE "store_images"
SET
    "image_url" = REPLACE(
        "image_url",
        'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/',
        'https://cdn.todam.app/'
    ),
    "thumbnail_url" = REPLACE(
        "thumbnail_url",
        'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/',
        'https://cdn.todam.app/'
    )
WHERE
    "image_url" LIKE 'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/%'
    OR "thumbnail_url" LIKE 'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/%';

UPDATE "program_images"
SET
    "image_url" = REPLACE(
        "image_url",
        'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/',
        'https://cdn.todam.app/'
    ),
    "thumbnail_url" = REPLACE(
        "thumbnail_url",
        'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/',
        'https://cdn.todam.app/'
    )
WHERE
    "image_url" LIKE 'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/%'
    OR "thumbnail_url" LIKE 'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/%';

UPDATE "artwork_photos"
SET
    "image_url" = REPLACE(
        "image_url",
        'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/',
        'https://cdn.todam.app/'
    ),
    "thumbnail_url" = REPLACE(
        "thumbnail_url",
        'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/',
        'https://cdn.todam.app/'
    )
WHERE
    "image_url" LIKE 'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/%'
    OR "thumbnail_url" LIKE 'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/%';

UPDATE "review_photos"
SET
    "image_url" = REPLACE(
        "image_url",
        'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/',
        'https://cdn.todam.app/'
    ),
    "thumbnail_url" = REPLACE(
        "thumbnail_url",
        'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/',
        'https://cdn.todam.app/'
    )
WHERE
    "image_url" LIKE 'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/%'
    OR "thumbnail_url" LIKE 'https://todam-prod-assets.s3.ap-northeast-2.amazonaws.com/%';
