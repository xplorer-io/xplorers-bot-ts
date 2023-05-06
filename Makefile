SHELL = /bin/bash
SHELLFLAGS = -ex

FUNCTION_ARTIFACT?=terraform/handler.zip
GIT_VERSION ?= $(shell git rev-parse --short HEAD)
GIT_BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD)

# Import default configuration
include ./configuration/defaults.conf

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(firstword $(MAKEFILE_LIST)) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

clean:
	rm -rf dist/
	rm -rf $(FUNCTION_ARTIFACT)
	rm -rf src/index.js src/helpers/*.js index.js

install: ## installs all the dependencies (node modules)
	npm install

test:
	npm run test

start-local-server:
	npm run start-local-server

compile: ## compile the typescript code
	tsc

package: clean install compile ## packages the app into a ZIP file+
	mkdir -p dist
	cp -R node_modules src/* package*.json dist

####################### SCRIPTS #######################
create-slack-token-secret: ## Create slack token secret in Google Cloud Secret Manager. Don't forget to set SLACK_OAUTH_TOKEN env var before running this command
	$(info [+] Create slack token in Google Cloud Secret Manager....)
	-printf $(SLACK_OAUTH_TOKEN) | gcloud secrets create slack-oauth-token --data-file=- --replication-policy=automatic

####################### TERRAFORM #######################

init: ## Initialize terraform's backend and providers
	$(info [+] Running terraform init....)
	@terraform -chdir=terraform init \
		-backend-config="bucket=$(XPLORERS_ARTIFACTS_BUCKET_NAME)" \
		-backend-config="prefix=$(XPLORERS_ARTIFACTS_BUCKET_TERRAFORM_PREFIX)" \

plan: ## Run terraform pre-flight checks using terraform plan
	$(info [+] Running terraform plan....)
	@terraform -chdir=terraform plan \
		-var "project_id=$(GOOGLE_CLOUD_PROJECT_ID)" \
		-var "region=$(GOOGLE_CLOUD_PROJECT_REGION)" \
		-var "zone=$(GOOGLE_CLOUD_PROJECT_ZONE)" \
		-var "xplorers_artifacts_bucket_name=$(XPLORERS_ARTIFACTS_BUCKET_NAME)"

apply: init package ## Run terraform pre-flight checks using terraform plan
	$(info [+] Deploying Xplorers infra resources, standby...)
	@terraform -chdir=terraform apply -auto-approve \
		-var "project_id=$(GOOGLE_CLOUD_PROJECT_ID)" \
		-var "region=$(GOOGLE_CLOUD_PROJECT_REGION)" \
		-var "zone=$(GOOGLE_CLOUD_PROJECT_ZONE)" \
		-var "xplorers_artifacts_bucket_name=$(XPLORERS_ARTIFACTS_BUCKET_NAME)"

destroy: ## Delete all resources deployed via terraform
	$(info [+] Deleting all resources, standby...)
	@terraform -chdir=terraform destroy -auto-approve \
		-var "project_id=$(GOOGLE_CLOUD_PROJECT_ID)" \
		-var "region=$(GOOGLE_CLOUD_PROJECT_REGION)" \
		-var "zone=$(GOOGLE_CLOUD_PROJECT_ZONE)" \
		-var "xplorers_artifacts_bucket_name=$(XPLORERS_ARTIFACTS_BUCKET_NAME)"

.PHONY: init plan apply destroy create-slack-token-secret test start-local-server clean package compile install
