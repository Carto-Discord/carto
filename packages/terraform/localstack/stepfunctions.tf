resource "aws_iam_role" "iam_for_sfn" {
  name = "iam_for_lambda"

  assume_role_policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": [
                ${aws_lambda_function.parse_command.arn}
            ]
        }
    ]
}
EOF
}

resource "aws_sfn_state_machine" "state_machine" {
  name     = "${var.app_name}-workflow"
  role_arn = aws_iam_role.iam_for_sfn.arn

  definition = file("./state_machine.asl.json")
}