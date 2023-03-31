locals {
  timestamp = formatdate("YYMMDD", timestamp())
}

data "google_project" "current" {
  project_id = var.project_id
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
  title       = "Role for Xplorers bot function"
  description = "Role for Xplorers bot function"
  permissions = [
    "storage.objects.get"
  ]
}

resource "google_service_account" "xplorers_bot_function_service_account" {
  account_id   = "xplorers-bot-service-account"
  display_name = "Service Account used by Xplorers Bot function"
}

resource "google_cloudfunctions2_function" "xplorers_bot_function" {
  name        = var.function_name
  location    = var.region
  description = "Xplorers Bot function that receives events from Slack and processes them accordingly"

  build_config {
    runtime     = var.function_runtime
    entry_point = var.function_entry_point
    source {
      storage_source {
        bucket = var.xplorers_artifacts_bucket_name
        object = google_storage_bucket_object.xplorers_artifact.name
      }
    }
  }

  service_config {
    max_instance_count    = 5
    timeout_seconds       = 60
    service_account_email = google_service_account.xplorers_bot_function_service_account.email

    secret_volumes {
      mount_path = var.slack_oauth_token_mount_path
      project_id = var.project_id
      secret     = var.slack_oauth_token_secret_name
    }
  }
}

resource "google_storage_bucket_iam_member" "member" {
  bucket = var.xplorers_artifacts_bucket_name
  role   = google_project_iam_custom_role.xplorers_bot_function_storage_role.name
  member = "serviceAccount:${google_service_account.xplorers_bot_function_service_account.email}"
}

resource "google_cloud_run_service_iam_binding" "xplorers_bot_invoker_binding" {
  location = google_cloudfunctions2_function.xplorers_bot_function.location
  service  = google_cloudfunctions2_function.xplorers_bot_function.name
  role     = "roles/run.invoker"
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

resource "google_project_iam_member" "xplorers_bot_function_secret_accessor" {
  project = var.project_id
  role    = google_project_iam_custom_role.xplorers_bot_function_role.name
  member  = "serviceAccount:${google_service_account.xplorers_bot_function_service_account.email}"
}

resource "google_project_iam_custom_role" "cloud_build_service_account_role" {
  role_id     = var.cloud_build_service_account_role_id
  title       = "Allow Cloud Build to interact with other GCP services"
  description = "Allow Cloud Build to interact with other GCP services"
  permissions = [
    "artifactregistry.repositories.deleteArtifacts" # Cloud build builds a new image and pushes it to the registry everytime we change the source code and deletes the old one
  ]
}

resource "google_project_iam_binding" "cloud_build_service_account_permissions" {
  project = var.project_id
  role    = google_project_iam_custom_role.cloud_build_service_account_role.name

  members = [
    "serviceAccount:${data.google_project.current.number}@cloudbuild.gserviceaccount.com",
  ]
}
