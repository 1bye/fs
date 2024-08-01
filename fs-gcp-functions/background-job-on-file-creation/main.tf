// main.tf
locals {
  envs = { for tuple in regexall("(.*)=(.*)", file("${path.module}/.env")) : tuple[0] => sensitive(tuple[1]) }

  GC_QUEUE_ID       = local.envs["GC_QUEUE_ID"]
  GC_QUEUE_LOCATION = local.envs["GC_QUEUE_LOCATION"]
  SERVER_URL        = local.envs["SERVER_URL"]
  GC_PROJECT_ID     = local.envs["GC_PROJECT_ID"]
  GC_TRIGGER_BUCKET     = local.envs["GC_PROJECT_ID"]
}

provider "google" {
  project = local.GC_PROJECT_ID
  region  = "europe-west3"
}

# resource "google_storage_bucket" "trigger_bucket" {
#   name     = "fs-dev-files"
#   location = "EU"
# }

resource "random_id" "default" {
  byte_length = 8
}

resource "google_storage_bucket" "default" {
  name                        = "${random_id.default.hex}-gcf-source" # Every bucket name must be globally unique
  location                    = "US"
  uniform_bucket_level_access = true
}

data "archive_file" "default" {
  type        = "zip"
  source_dir  = "${path.module}/dist"
  output_path = "${path.module}/function.zip"
}

resource "google_cloudfunctions2_function" "function" {
  name        = "background-job-on-file-creation"
  location    = "europe-west3"
  description = "Creates background job triggered on file creation"

  build_config {
    runtime     = "nodejs18"
    entry_point = "onFileUpload"

    source {
      storage_source {
        bucket = google_storage_bucket.default.name
        object = google_storage_bucket_object.object.name
      }
    }
  }

  service_config {
    available_memory = "256M"
    timeout_seconds     = 60
    max_instance_count  = 10
    min_instance_count  = 1
    service_account_email = "nouro-fs@spending-money-762d0.iam.gserviceaccount.com"
    environment_variables = {
      GC_QUEUE_ID       = local.GC_QUEUE_ID
      GC_QUEUE_LOCATION = local.GC_QUEUE_LOCATION
      SERVER_URL        = local.SERVER_URL
      GC_PROJECT_ID     = local.GC_PROJECT_ID
    }
  }

  event_trigger {
    event_type = "google.cloud.storage.object.v1.finalized"
    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.trigger_bucket.name
    }
#     bucket   = google_storage_bucket.trigger_bucket.name
  }
}

resource "google_storage_bucket_object" "object" {
  name   = "function.zip"
  bucket = google_storage_bucket.default.name
  source = data.archive_file.default.output_path
}
