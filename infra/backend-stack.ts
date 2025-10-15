import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for /upload demo
    const demoBucket = new s3.Bucket(this, "DemoBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda for /hello and /upload
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
      handler: "dist/routes/surveys.routes.handler",
      code: lambda.Code.fromAsset("../backend"),
    });

    // Lambda for projects endpoints
    const projectsLambda = new lambda.Function(this, "ProjectsLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/routes/projects.routes.handler",
      code: lambda.Code.fromAsset("../backend"),
    });

    // Lambda for personas endpoints
    const personasLambda = new lambda.Function(this, "PersonasLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/routes/personas.routes.handler",
      code: lambda.Code.fromAsset("../backend"),
    });

    demoBucket.grantReadWrite(helloLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, "BackendApi", {
      restApiName: "Backend Service"
    });

    // /hello endpoint
    const hello = api.root.addResource("hello");
    hello.addMethod("GET", new apigateway.LambdaIntegration(helloLambda));
    hello.addMethod("OPTIONS", new apigateway.MockIntegration({ /* ...CORS config... */ }));

    // /upload endpoint
    const upload = api.root.addResource("upload");
    upload.addMethod("POST", new apigateway.LambdaIntegration(helloLambda));
    upload.addMethod("OPTIONS", new apigateway.MockIntegration({ /* ...CORS config... */ }));

    // /api root
    const apiRoot = api.root.addResource("api");

    // ----- SURVEY ENDPOINTS -----
    const surveys = apiRoot.addResource("surveys");
    surveys.addMethod("POST", new apigateway.LambdaIntegration(surveysLambda));
    const surveyId = surveys.addResource("{surveyId}");
    surveyId.addMethod("DELETE", new apigateway.LambdaIntegration(surveysLambda));
    const questions = surveyId.addResource("questions");
    questions.addMethod("POST", new apigateway.LambdaIntegration(surveysLambda));
    const run = surveyId.addResource("run");
    run.addMethod("POST", new apigateway.LambdaIntegration(surveysLambda));
    const results = surveyId.addResource("results");
    results.addMethod("GET", new apigateway.LambdaIntegration(surveysLambda));

    // /api/projects endpoints (new)
    const projects = apiRoot.addResource("projects");
    projects.addMethod("POST", new apigateway.LambdaIntegration(projectsLambda)); // create
    projects.addMethod("GET", new apigateway.LambdaIntegration(projectsLambda)); // list
    const projectId = projects.addResource("{projectId}");
    projectId.addMethod("GET", new apigateway.LambdaIntegration(projectsLambda)); // get
    projectId.addMethod("DELETE", new apigateway.LambdaIntegration(projectsLambda)); // delete
    // /api/projects/{projectId}/surveys
    const projectSurveys = projectId.addResource("surveys");
    projectSurveys.addMethod("GET", new apigateway.LambdaIntegration(surveysLambda)); // list surveys for a project

    // /api/personas endpoints (new)
    const personas = apiRoot.addResource("personas");
    personas.addMethod("GET", new apigateway.LambdaIntegration(personasLambda)); // list
    const personaId = personas.addResource("{personaId}");
    personaId.addMethod("GET", new apigateway.LambdaIntegration(personasLambda)); // get details

    // Add CORS OPTIONS for new endpoints as before
    [
      surveys, surveyId, questions, run, results, projectSurveys,
      projects, projectId, personas, personaId
    ].forEach(resource => {
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