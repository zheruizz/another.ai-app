import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for demo (used by helloLambda for /upload, can be removed later)
    const demoBucket = new s3.Bucket(this, "DemoBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT for production!
      autoDeleteObjects: true, // NOT for production!
    });

    // Lambda for /hello and /upload endpoints
    const helloLambda = new lambda.Function(this, "HelloLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/hello.handler",
      code: lambda.Code.fromAsset("../backend"),
      environment: {
        BUCKET_NAME: demoBucket.bucketName,
      },
    });

    // Lambda for all survey endpoints
    const surveysLambda = new lambda.Function(this, "SurveysLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/routes/surveys.routes.handler", // compiled surveys router
      code: lambda.Code.fromAsset("../backend"),
      environment: {
        // Add required environment variables here (DB config, etc)
      },
    });

    // Grant Lambda access to S3 (only needed for helloLambda)
    demoBucket.grantReadWrite(helloLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, "BackendApi", {
      restApiName: "Backend Service"
    });

    // /hello endpoint
    const hello = api.root.addResource("hello");
    hello.addMethod("GET", new apigateway.LambdaIntegration(helloLambda));
    hello.addMethod("OPTIONS", new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Origin": "'*'",
          "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
          "method.response.header.Access-Control-Allow-Methods": "'GET,OPTIONS'"
        },
        responseTemplates: {
          "application/json": "{\"status\": \"OK\"}"
        }
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": "{\"status\": \"OK\"}"
      }
    }), {
      methodResponses: [{
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Origin": true,
          "method.response.header.Access-Control-Allow-Headers": true,
          "method.response.header.Access-Control-Allow-Methods": true,
        }
      }],
    });

    // /upload endpoint for S3 demo
    const upload = api.root.addResource("upload");
    upload.addMethod("POST", new apigateway.LambdaIntegration(helloLambda));
    upload.addMethod("OPTIONS", new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Origin": "'*'",
          "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
          "method.response.header.Access-Control-Allow-Methods": "'POST,OPTIONS'"
        },
        responseTemplates: {
          "application/json": "{\"status\": \"OK\"}"
        }
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": "{\"status\": \"OK\"}"
      }
    }), {
      methodResponses: [{
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Origin": true,
          "method.response.header.Access-Control-Allow-Headers": true,
          "method.response.header.Access-Control-Allow-Methods": true,
        }
      }],
    });

    // ----- SURVEY ENDPOINTS -----
    // /api root
    const apiRoot = api.root.addResource("api");

    // /api/surveys
    const surveys = apiRoot.addResource("surveys");
    surveys.addMethod("POST", new apigateway.LambdaIntegration(surveysLambda)); // create survey

    // /api/surveys/{surveyId}/questions
    const surveyId = surveys.addResource("{surveyId}");
    const questions = surveyId.addResource("questions");
    questions.addMethod("POST", new apigateway.LambdaIntegration(surveysLambda)); // add question

    // /api/surveys/{surveyId}/run
    const run = surveyId.addResource("run");
    run.addMethod("POST", new apigateway.LambdaIntegration(surveysLambda)); // run survey

    // /api/surveys/{surveyId}/results
    const results = surveyId.addResource("results");
    results.addMethod("GET", new apigateway.LambdaIntegration(surveysLambda)); // get survey results

    // /api/surveys/{surveyId}
    surveyId.addMethod("DELETE", new apigateway.LambdaIntegration(surveysLambda)); // delete survey

    // /api/projects
    const projects = apiRoot.addResource("projects");
    const projectId = projects.addResource("{projectId}");

    // /api/projects/{projectId}/surveys
    const projectSurveys = projectId.addResource("surveys");
    projectSurveys.addMethod("GET", new apigateway.LambdaIntegration(surveysLambda)); // list surveys for a project

    // CORS OPTIONS for all survey endpoints
    [surveys, questions, run, results, surveyId, projectSurveys].forEach(resource => {
      resource.addMethod("OPTIONS", new apigateway.MockIntegration({
        integrationResponses: [{
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            "method.response.header.Access-Control-Allow-Methods": "'GET,POST,DELETE,OPTIONS'"
          },
          responseTemplates: {
            "application/json": "{\"status\": \"OK\"}"
          }
        }],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          "application/json": "{\"status\": \"OK\"}"
        }
      }), {
        methodResponses: [{
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
          }
        }],
      });
    });
  }
}