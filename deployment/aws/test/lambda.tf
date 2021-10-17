resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

data "archive_file" "client_zip" {
  type             = "zip"
  source_dir       = "${path.module}/../../../client/package/"
  output_file_mode = "0666"
  output_path      = "${path.module}/files/client.zip"
}

resource "aws_lambda_function" "client_lambda" {
  filename      = data.archive_file.client_zip.output_path
  function_name = "${var.app_name}-client"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "build/src/index.slashFunction"

  source_code_hash = filebase64sha256(data.archive_file.client_zip.output_path)

  runtime = "nodejs14.x"

  environment {
    variables = {
      PUBLIC_KEY = var.discord_public_key
      API_TRIGGER_URL = var.api_trigger_url
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs,
    aws_cloudwatch_log_group.client-lambda,
  ]
}