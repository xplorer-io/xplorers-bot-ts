locals {
  timestamp = formatdate("YYMMDD", timestamp())
}

# Generates an archive of the source code compressed as a .zip file.
data "archive_file" "xplorers_artifact" {
  type        = "zip"
  source_dir  = "../dist"
  output_path = "handler.zip"
}

# Add source code zip to the Cloud Function's bucket
resource "google_storage_bucket_object" "xplorers_artifact" {
  source       = data.archive_file.xplorers_artifact.output_path
  content_type = "application/zip"

  # Append to the MD5 checksum of the files's content
  # to force the zip to be updated as soon as a change occurs
  name   = "src-${data.archive_file.xplorers_artifact.output_md5}.zip"
  bucket = var.xplorers_artifacts_bucket_name
}

resource "google_project_iam_custom_role" "xplorers_bot_function_storage_role" {
  role_id     = var.xplorers_bot_function_storage_role_id
  title       = "Custom Storage Role for Xplorers bot function"
  description = "Custom Storage Role for Xplorers bot function"
  permissions = [
    "storage.objects.get"
  ]
}

resource "google_service_account" "xplorers_bot_function_service_account" {
  account_id   = "xplorers-bot-service-account"
  display_name = "Service Account used by Xplorers Bot function"
}

resource "google_cloudfunctions_function" "xplorers_bot_function" {
  name                         = var.function_name
  description                  = "Xplorers Bot function that receives events from Slack and processes them accordingly"
  runtime                      = var.function_runtime
  entry_point                  = var.function_entry_point
  available_memory_mb          = var.xplorers_bot_function_memory_in_mb
  source_archive_bucket        = var.xplorers_artifacts_bucket_name
  source_archive_object        = google_storage_bucket_object.xplorers_artifact.name
  timeout                      = var.xplorers_bot_function_timeout_in_seconds
  service_account_email        = google_service_account.xplorers_bot_function_service_account.email
  trigger_http                 = true
  https_trigger_security_level = "SECURE_ALWAYS"
  max_instances                = var.xplorers_bot_function_max_instances

  secret_volumes {
    mount_path = var.slack_oauth_token_mount_path
    project_id = var.project_id
    secret     = var.slack_oauth_token_secret_name
  }

  lifecycle {
    ignore_changes = [
      https_trigger_url
    ]
  }
}

resource "google_storage_bucket_iam_member" "xplorers_bot_function_storage_role_binding" {
  bucket = var.xplorers_artifacts_bucket_name
  role   = google_project_iam_custom_role.xplorers_bot_function_storage_role.name
  member = "serviceAccount:${google_service_account.xplorers_bot_function_service_account.email}"
}

resource "google_cloudfunctions_function_iam_binding" "xplorers_bot_invoker_binding" {
  project        = var.project_id
  region         = var.region
  cloud_function = google_cloudfunctions_function.xplorers_bot_function.name
  role           = "roles/cloudfunctions.invoker"
  members = [
    "allUsers"
  ]
}

resource "google_project_iam_custom_role" "xplorers_bot_function_role" {
  role_id     = var.xplorers_bot_function_role_id
  title       = "Xplorers bot function role to interact with other GCP services"
  description = "Allow xplorers bot function to interact with other GCP services"
  permissions = var.xplorers_bot_function_role_permissions
}

resource "google_project_iam_member" "xplorers_bot_function_custom_role_binding" {
  project = var.project_id
  role    = google_project_iam_custom_role.xplorers_bot_function_role.name
  member  = "serviceAccount:${google_service_account.xplorers_bot_function_service_account.email}"
}
