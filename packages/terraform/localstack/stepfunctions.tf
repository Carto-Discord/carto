resource "aws_iam_role" "iam_for_sfn" {
  name = "iam_for_sfn"

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
                "arn:aws:lambda:::*"
            ]
        }
    ]
}
EOF
}

data "template_file" "definition" {
  template = "${file("${path.module}/state_machine.asl.json")}"
  vars = {
    getMapLambdaArn = module.get_map_lambda.lambda_invoke_arn
    sendResponseLambdaArn = module.send_response_lambda.lambda_invoke_arn
  }
}

resource "aws_sfn_state_machine" "state_machine" {
  name     = "${var.app_name}-workflow"
  role_arn = aws_iam_role.iam_for_sfn.arn

  definition = data.template_file.definition.rendered
}