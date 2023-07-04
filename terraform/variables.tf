variable "git_branch" {
  type        = string
  description = "Branch of the xplorers-bot-ts repository to deploy"
  default     = "master"
}

variable "project_id" {
  type      = string
  sensitive = true
  nullable  = false
}

variable "region" {
  type      = string
  sensitive = true
  nullable  = false
}

variable "zone" {
  type      = string
  sensitive = true
  nullable  = false
}

variable "xplorers_artifacts_bucket_name" {
  type        = string
  description = "Bucket storing xplorers bot artifacts"
}

variable "function_name" {
  type        = string
  description = "Name of the google cloud function"
  default     = "xplorers-bot"
}

variable "function_runtime" {
  type        = string
  description = "Runtime for the google cloud function"
  default     = "nodejs18"
}

variable "function_entry_point" {
  type        = string
  description = "Entry point for the application"
  default     = "xplorersbot"
}

variable "slack_oauth_token_mount_path" {
  type        = string
  description = "Path where the secret will be mounted in the function container"
  default     = "/etc/secrets"
}

variable "slack_oauth_token_secret_name" {
  type        = string
  description = "Name of the secret containing the slack oauth token that is mounted to the function"
  default     = "slack-oauth-token"
}

variable "xplorers_bot_function_storage_role_id" {
  type        = string
  description = "ID of the custom role that is assigned to the service account used by the function to interact with google storage bucket"
  default     = "xplorersBotFunctionStorageRole"
}

variable "xplorers_bot_function_role_id" {
  type        = string
  description = "ID of the custom role that is assigned to the service account used by the function"
  default     = "xplorersBotFunctionRole"
}

variable "xplorers_bot_function_memory_in_mb" {
  type        = number
  description = "Memory in mb to allocate to the cloud function"
  default     = 128
}

variable "xplorers_bot_function_timeout_in_seconds" {
  type        = number
  description = "Number of seconds after which the function times out"
  default     = 60
}

variable "xplorers_bot_function_max_instances" {
  type        = number
  description = "Maximum number of function instances that can coexist at any given time"
  default     = 5
}

variable "xplorers_bot_function_role_permissions" {
  type        = list(string)
  description = "Permissions for the custom role that is assigned to the service account used by the function"
  default = [
    "secretmanager.versions.access",
    "logging.logEntries.create",
  ]
}
