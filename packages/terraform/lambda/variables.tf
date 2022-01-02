variable "app_name" {
  description = "Name of the app the functions sits under"
}

variable "function_name" {
  description = "Name of the package directory"
}

variable "runtime" {
  description = "Programmatic runtime to run the function"
}

variable "environment_variables" {
  type        = map(string)
  description = "Environment variables to pass to the function"
}
