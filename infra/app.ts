import * as cdk from "aws-cdk-lib";
import { BackendStack } from "./backend-stack";

const app = new cdk.App();
new BackendStack(app, "BackendStack");