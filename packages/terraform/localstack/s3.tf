resource "aws_s3_bucket" "maps_bucket" {
  bucket = "${var.app_name}-maps"
  acl    = "private"
}
