## Prerequisites

### Required software
* [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
* [Terraform CLI](https://developer.hashicorp.com/terraform/cli)
* [Taskfile](https://taskfile.dev/installation)

### Login to Google Cloud via gcloud cli + setup application default credentials via Application Default Credentials (ADC) {#authenticate-to-google-cloud}

Run [***gcloud init***](https://cloud.google.com/sdk/gcloud/reference/init) to authorize gcloud and other SDK tools to access Google Cloud using your user account credentials.

Run [***gcloud auth application-default login***](https://cloud.google.com/sdk/gcloud/reference/auth/login) to obtain access credentials for your user account via a web-based authorization flow. When this command completes successfully, it sets the active account in the current configuration to the account specified. If no configuration exists, it creates a configuration named default.

> ***Your gcloud credentials are not the same as the credentials you provide to ADC using the gcloud CLI.***

### Default configuration variables

The entrypoint for this repository is in the file `configuration/defaults.conf` which stores necessary environment variables used by Taskfile to orchestrate and apply the changes using Terraform. Change these values according to your project configuration,

* `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project ID to use
* `GOOGLE_CLOUD_PROJECT_REGION` - Google Cloud region to use
* `GOOGLE_CLOUD_PROJECT_ZONE` - Google Cloud zone to use
* `XPLORERS_ARTIFACTS_BUCKET_NAME` - Bucket to use to store artifacts and terraform state information
* `XPLORERS_ARTIFACTS_BUCKET_TERRAFORM_PREFIX` - Bucket prefix to store terraform state information
