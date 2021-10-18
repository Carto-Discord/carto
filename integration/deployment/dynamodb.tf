resource "aws_dynamodb_table" "map-table" {
  name           = "maps"
  billing_mode   = "PROVISIONED"
  read_capacity  = 20
  write_capacity = 20
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table_item" "map-1" {
  table_name = aws_dynamodb_table.map-table.name
  hash_key   = aws_dynamodb_table.map-table.hash_key

  item = <<ITEM
{
  "id": {"S": "123"},
  "tokens": {
      "L": [
          {
              "M": {
                "colour": {"S": "blue"}
              }
            }
        ]
    }
}
ITEM
}