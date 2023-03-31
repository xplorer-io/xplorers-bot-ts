terraform {
  required_providers {
    google = {
      version = "4.55.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}
