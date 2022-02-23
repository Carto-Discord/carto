data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "parse_command_role" {
  name = "parse_command_role"

  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy" "start_state_machine" {
  name = "start_state_machine"
  role = aws_iam_role.parse_command_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "states:StartExecution"
        ]
        Effect   = "Allow"
        Resource = "${aws_sfn_state_machine.state_machine.arn}"
      }
    ]
  })
}

resource "aws_iam_policy" "access_dynamodb" {
  name        = "access_dynamodb"
  description = "Access required commands on specific DynamoDB tables"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "dynamodb:BatchWriteItem",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
        ]
        Effect = "Allow"
        Resource = [
          "${aws_dynamodb_table.map_table.arn}",
          "${aws_dynamodb_table.channel_table.arn}"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "access_s3" {
  name        = "access_s3"
  description = "Access required commands on specific S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:GetObjectAcl",
          "s3:DeleteObject",
          "s3:PutObject",
          "s3:PubObjectAcl"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.maps_bucket.arn}",
          "${aws_s3_bucket.maps_bucket.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "get_map_role" {
  name = "get_map_role"

  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role" "create_map_role" {
  name = "create_map_role"

  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role" "delete_map_role" {
  name = "delete_map_role"

  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role" "add_token_role" {
  name = "add_token_role"

  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role" "move_delete_token_role" {
  name = "move_delete_token_role"

  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role" "send_response_role" {
  name = "send_response_role"

  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role" "janitor_role" {
  name = "janitor_role"

  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_policy_attachment" "dynamodb_attach" {
  name = "dynamodb-attachment"
  roles = [
    aws_iam_role.get_map_role.name,
    aws_iam_role.create_map_role.name,
    aws_iam_role.delete_map_role.name,
    aws_iam_role.add_token_role.name,
    aws_iam_role.move_delete_token_role.name,
    aws_iam_role.janitor_role.name
  ]
  policy_arn = aws_iam_policy.access_dynamodb.arn
}

resource "aws_iam_policy_attachment" "s3_attach" {
  name = "s3-attachment"
  roles = [
    aws_iam_role.create_map_role.name,
    aws_iam_role.delete_map_role.name,
    aws_iam_role.add_token_role.name,
    aws_iam_role.move_delete_token_role.name,
    aws_iam_role.janitor_role.name
  ]
  policy_arn = aws_iam_policy.access_s3.arn
}
