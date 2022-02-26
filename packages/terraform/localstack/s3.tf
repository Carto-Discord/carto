resource "aws_s3_bucket" "maps_bucket" {
  bucket = "${var.app_name}-maps"
}

resource "aws_s3_bucket_acl" "maps_bucket_acl" {
  bucket = aws_s3_bucket.maps_bucket.id
  acl    = "public-read"
}

resource "aws_s3_bucket_policy" "allow_public_access" {
  bucket = aws_s3_bucket.maps_bucket.id
  policy = data.aws_iam_policy_document.allow_public_access.json
}

data "aws_iam_policy_document" "allow_public_access" {
  statement {
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject",
    ]

    resources = [
      "${aws_s3_bucket.maps_bucket.arn}/*",
    ]
  }
}
