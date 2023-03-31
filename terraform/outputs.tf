output "xplorers_bot_function_uri" {
  value     = google_cloudfunctions2_function.xplorers_bot_function.service_config[0].uri
  sensitive = true
}
