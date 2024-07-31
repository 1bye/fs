// main.tf
provider "google" {
  project = "spending-money-762d0"
  region  = "europe-west3"
}

resource "google_storage_bucket" "bucket" {
  name     = "fs-dev-files"
  location = "EU"
}

data "archive_file" "function_zip" {
  type        = "zip"
  source_dir  = "${path.module}/function"
  output_path = "${path.module}/function.zip"
}

resource "google_cloudfunctions2_function" "function" {
  name        = "background-job-on-file-creation"
  location    = "europe-west3"
  description = "Background job triggered on file creation"

  build_config {
    runtime     = "nodejs18"
    entry_point = "backgroundJobOnFileCreation"

    source {
      storage_source {
        bucket = google_storage_bucket.bucket.name
        object = google_storage_bucket_object.function_zip.name
      }
    }
  }

  service_config {
    available_memory_mb = 256
    timeout_seconds     = 60
    max_instance_count  = 10
    min_instance_count  = 1
    vpc_connector_egress_settings = "ALL_TRAFFIC"
    ingress_settings             = "ALLOW_ALL"
    environment_variables = {
      "NODE_ENV" = "production"
    }
    service_account_email = "nouro-fs@spending-money-762d0.iam.gserviceaccount.com"
  }

  event_trigger {
    event_type = "google.cloud.storage.object.v1.finalized"
    resource   = google_storage_bucket.bucket.name
  }
}

resource "google_storage_bucket_object" "function_zip" {
  name   = "function.zip"
  bucket = google_storage_bucket.bucket.name
  source = data.archive_file.function_zip.output_path
}
