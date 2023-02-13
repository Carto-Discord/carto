resource "aws_iam_role" "iam_for_sfn" {
  name = "${var.app_name}-iam_for_sfn"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  inline_policy {
    name = "InvokeLambdas"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action = [
            "lambda:InvokeFunction"
          ]
          Effect   = "Allow"
          Resource = "*"
        },
      ]
    })
  }
}

data "template_file" "definition" {
  template = file("${path.module}/../state_machine.asl.json")
  vars = {
    getMapLambdaArn          = module.get_map_lambda.lambda_arn
    createMapLambdaArn       = module.create_map_lambda.lambda_arn
    addTokenLambdaArn        = module.add_token_lambda.lambda_arn
    moveDeleteTokenLambdaArn = module.move_delete_token_lambda.lambda_arn
    sendResponseLambdaArn    = module.send_response_lambda.lambda_arn

    channelTable = aws_dynamodb_table.channel_table.name
    mapTable     = aws_dynamodb_table.map_table.name
  }
}

resource "aws_sfn_state_machine" "state_machine" {
  name     = "${var.app_name}-workflow"
  role_arn = aws_iam_role.iam_for_sfn.arn

  definition = data.template_file.definition.rendered
}
