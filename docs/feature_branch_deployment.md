## Deploy your own version of XplorersBot for testing and feature development

As developers, we want to be able to deploy a test version of the application for adding a new feature, testing or debugging. This guide covers how to deploy your own version of XplorersBot to Google Cloud.

### Terraform workspaces

Terraform [workspaces](https://www.terraform.io/docs/state/workspaces.html) allow multiple instances of infrastructure to be provisioned from the same Terraform configuration. Using workspaces, you can maintain different environments like `dev`, `staging` and `production` from the same code base.

Run the following commands to create and switch to a `dev` workspace:

```
terraform workspace new dev
terraform workspace select dev
```

### Create a slack secret in Google Secret Manager

Create a secret with name `slack-oauth-token-dev` to store your slack token to be used by your feature branch based deployment where `dev` refers to the terraform workspace name.


### Deploy your feature branch

Run the following commands to check the deployment plan and to deploy your feature branch to the `dev` workspace:
```
task terraform-plan
task terraform-apply
```
