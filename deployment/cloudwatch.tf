resource "aws_cloudwatch_log_group" "client_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.client_lambda.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "client_gateway" {
  name              = "/aws/api_gw/${aws_apigatewayv2_api.client_gateway.name}"
  retention_in_days = 14
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}