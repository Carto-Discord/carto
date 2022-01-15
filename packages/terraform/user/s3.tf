resource "aws_s3_bucket" "backend" {
  bucket = "carto-bot-tf-state"
  acl    = "private"

  versioning {
    enabled = true
  }
}
