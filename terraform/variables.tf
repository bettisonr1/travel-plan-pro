variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "travel-plan"
}

variable "environment" {
  description = "The deployment environment (e.g., dev, prod)"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "The Azure region to deploy resources"
  type        = string
  default     = "eastus"
}

variable "app_image" {
  description = "The container image for the application"
  type        = string
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT Secret for authentication"
  type        = string
  sensitive   = true
}
