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
  role_id     = "${var.xplorers_bot_function_storage_role_id}_${terraform.workspace}"
  title       = "Custom Storage Role for Xplorers bot function"
  description = "Custom Storage Role for Xplorers bot function"
  permissions = [
    "storage.objects.get"
  ]
}

resource "google_service_account" "xplorers_bot_function_service_account" {
  account_id   = "xplorers-bot-sa-${terraform.workspace}"
  display_name = "Service Account used by Xplorers Bot function"
}

resource "google_cloudfunctions_function" "xplorers_bot_function" {
  name                         = "${var.function_name}-${terraform.workspace}"
  description                  = "Xplorers Bot function that receives events from Slack and processes them accordingly"
  runtime                      = var.function_runtime
  entry_point                  = var.function_entry_point
  available_memory_mb          = var.function_memory_in_mb
  source_archive_bucket        = var.xplorers_artifacts_bucket_name
  source_archive_object        = google_storage_bucket_object.xplorers_artifact.name
  timeout                      = var.function_timeout_in_seconds
  service_account_email        = google_service_account.xplorers_bot_function_service_account.email
  trigger_http                 = true
  https_trigger_security_level = "SECURE_ALWAYS"
  max_instances                = var.function_max_instances

  secret_volumes {
    mount_path = var.secret_mount_path
    project_id = var.project_id
    secret     = "slack-oauth-token-${terraform.workspace}"
  }

  environment_variables = {
    TF_WORKSPACE                     = "${terraform.workspace}"
    CLOUD_TASK_QUEUE_NAME            = google_cloud_tasks_queue.xplorers_bot_queue.name
    PROJECT_ID                       = var.project_id
    REGION                           = var.region
    XPLORERS_OPENAI_SLACK_CHANNEL_ID = var.xplorers_openai_slack_channel_id
    CLOUD_TASK_SERVICE_ACCOUNT_EMAIL = google_service_account.xplorers_bot_function_service_account.email
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
  role_id     = "${var.xplorers_bot_function_role_id}_${terraform.workspace}"
  title       = "Xplorers bot function role to interact with other GCP services"
  description = "Allow xplorers bot function to interact with other GCP services"
  permissions = var.xplorers_bot_function_role_permissions
}

resource "google_project_iam_member" "xplorers_bot_function_custom_role_binding" {
  project = var.project_id
  role    = google_project_iam_custom_role.xplorers_bot_function_role.name
  member  = "serviceAccount:${google_service_account.xplorers_bot_function_service_account.email}"
}

resource "google_cloud_tasks_queue" "xplorers_bot_queue" {
  /* Todo: remove the -tmp in the next Pull Request
  https://cloud.google.com/tasks/docs/deleting-appengine-queues-and-tasks#deleting_queues*/
  name     = "xplorers-bot-queue-${terraform.workspace}-tmp"
  project  = var.project_id
  location = var.region
  rate_limits {
    max_concurrent_dispatches = 3
    max_dispatches_per_second = 2
  }

  retry_config {
    max_attempts = 5
  }
}

resource "google_cloudfunctions_function" "xplorers_bot_openai_function" {
  name                         = "${var.function_name}-openai-${terraform.workspace}"
  description                  = "Xplorers Bot OpenAI function that receives user input from Slack and asks OpenAI for a response"
  runtime                      = var.function_runtime
  entry_point                  = "xplorersbotOpenAI"
  available_memory_mb          = var.function_memory_in_mb
  source_archive_bucket        = var.xplorers_artifacts_bucket_name
  source_archive_object        = google_storage_bucket_object.xplorers_artifact.name
  timeout                      = var.function_timeout_in_seconds
  service_account_email        = google_service_account.xplorers_bot_function_service_account.email
  trigger_http                 = true
  https_trigger_security_level = "SECURE_ALWAYS"
  max_instances                = var.function_max_instances


  secret_volumes {
    mount_path = var.secret_mount_path
    project_id = var.project_id
    secret     = "slack-oauth-token-${terraform.workspace}"
  }

  secret_volumes {
    mount_path = var.secret_mount_path
    project_id = var.project_id
    secret     = "azure-openai-key-${terraform.workspace}"
  }

  secret_volumes {
    mount_path = var.secret_mount_path
    project_id = var.project_id
    secret     = "azure-openai-endpoint-${terraform.workspace}"
  }

  environment_variables = {
    TF_WORKSPACE               = "${terraform.workspace}"
    AZURE_OPENAI_DEPLOYMENT_ID = var.azure_openai_deployment_id
  }

  lifecycle {
    ignore_changes = [
      https_trigger_url
    ]
  }
}

resource "google_cloudfunctions_function_iam_binding" "xplorers_bot_openai_function_invoker_binding" {
  project        = var.project_id
  region         = var.region
  cloud_function = google_cloudfunctions_function.xplorers_bot_openai_function.name
  role           = "roles/cloudfunctions.invoker"
  members = [
    "serviceAccount:${google_service_account.xplorers_bot_function_service_account.email}"
  ]
}
