resource "aws_cloudwatch_event_rule" "every_day" {
  name                = "every-day"
  description         = "Fires every day"
  schedule_expression = "rate(1 day)"
}

resource "aws_cloudwatch_event_target" "run_janitor_every_day" {
  rule      = aws_cloudwatch_event_rule.every_day.name
  target_id = "lambda"
  arn       = module.janitor_lambda.lambda_arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_janitor" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = module.janitor_lambda.lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.every_day.arn
}

resource "aws_cloudwatch_metric_alarm" "errors" {
  alarm_name                = "${var.app_name}-lambda-errors"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  evaluation_periods        = "2"
  metric_name               = "Errors"
  namespace                 = "AWS/Lambda"
  period                    = "60"
  statistic                 = "Average"
  threshold                 = "30"
  alarm_description         = "This metric monitors lambda error count accross all Lambdas"
  insufficient_data_actions = []
}
