output "xplorers_bot_function_https_url" {
  value     = google_cloudfunctions_function.xplorers_bot_function.https_trigger_url
  sensitive = true
}
