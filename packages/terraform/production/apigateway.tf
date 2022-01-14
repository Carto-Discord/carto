resource "aws_apigatewayv2_api" "client_gateway" {
  name          = "${var.app_name}-gateway"
  protocol_type = "HTTP"
}

resource "aws_cloudwatch_log_group" "client_gateway" {
  name              = "/aws/api_gw/${aws_apigatewayv2_api.client_gateway.name}"
  retention_in_days = 14
}

resource "aws_apigatewayv2_stage" "client_stage" {
  api_id        = aws_apigatewayv2_api.client_gateway.id
  name          = "production"
  auto_deploy   = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.client_gateway.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      }
    )
  }
}

resource "aws_apigatewayv2_integration" "client_integration" {
  api_id = aws_apigatewayv2_api.client_gateway.id
  
  integration_uri     = module.parse_command_lambda.lambda_invoke_arn
  integration_type    = "AWS_PROXY"
  integration_method  = "POST"
}

resource "aws_apigatewayv2_route" "client_route" {
  api_id    = aws_apigatewayv2_api.client_gateway.id
  
  route_key = "POST /"
  target    = "integrations/${aws_apigatewayv2_integration.client_integration.id}"
}

resource "aws_lambda_permission" "client_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = module.parse_command_lambda.lambda_function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.client_gateway.execution_arn}/*/*"
}