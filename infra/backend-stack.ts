import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC, Subnets, Security Group for Lambda <-> RDS
    const vpc = ec2.Vpc.fromVpcAttributes(this, "AppVPC", {
      vpcId: "vpc-004303f540511f4e6",
      availabilityZones: ["us-east-1d"], // You can add more if needed
      privateSubnetIds: [
        "subnet-0b12559a29fa04790",
        "subnet-043f5252ea218d1da",
        "subnet-0ebc8ff15884a84b9",
        "subnet-0f2c9953441f05d8c",
        "subnet-08a1a7e857a96af6a",
        "subnet-00aadc11d067e33ac",
      ],
    });

    const lambdaSG = ec2.SecurityGroup.fromSecurityGroupId(this, "LambdaSG", "sg-0dedb76750f96ebbd");

    // S3 bucket for /upload demo
    const demoBucket = new s3.Bucket(this, "DemoBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Common DB environment variables
    const dbEnv = {
      DB_HOST: "another-ai-db.c6bec2a8cygx.us-east-1.rds.amazonaws.com",
      DB_PORT: "5432",
      DB_USER: "master",
      DB_PASSWORD: "OniiohnVY^8134#$45naf^3e", // For production, use Secrets Manager!
      DB_NAME: "postgres", // Change if your DB name is different
      DB_SSL: "true"
    };

    // Lambda for /hello and /upload
    const helloLambda = new lambda.Function(this, "HelloLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/hello.handler",
      code: lambda.Code.fromAsset("../backend"),
      vpc,
      securityGroups: [lambdaSG],
      vpcSubnets: { subnets: [
        ec2.Subnet.fromSubnetId(this, "subnet1", "subnet-0b12559a29fa04790"),
        ec2.Subnet.fromSubnetId(this, "subnet2", "subnet-043f5252ea218d1da"),
        ec2.Subnet.fromSubnetId(this, "subnet3", "subnet-0ebc8ff15884a84b9"),
        ec2.Subnet.fromSubnetId(this, "subnet4", "subnet-0f2c9953441f05d8c"),
        ec2.Subnet.fromSubnetId(this, "subnet5", "subnet-08a1a7e857a96af6a"),
        ec2.Subnet.fromSubnetId(this, "subnet6", "subnet-00aadc11d067e33ac"),
      ]},
      environment: {
        ...dbEnv,
        BUCKET_NAME: demoBucket.bucketName,
      },
    });

    // Lambda for all survey endpoints
    const surveysLambda = new lambda.Function(this, "SurveysLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/routes/surveys.routes.handler",
      code: lambda.Code.fromAsset("../backend"),
      vpc,
      securityGroups: [lambdaSG],
      vpcSubnets: { subnets: [
        ec2.Subnet.fromSubnetId(this, "subnet1s", "subnet-0b12559a29fa04790"),
        ec2.Subnet.fromSubnetId(this, "subnet2s", "subnet-043f5252ea218d1da"),
        ec2.Subnet.fromSubnetId(this, "subnet3s", "subnet-0ebc8ff15884a84b9"),
        ec2.Subnet.fromSubnetId(this, "subnet4s", "subnet-0f2c9953441f05d8c"),
        ec2.Subnet.fromSubnetId(this, "subnet5s", "subnet-08a1a7e857a96af6a"),
        ec2.Subnet.fromSubnetId(this, "subnet6s", "subnet-00aadc11d067e33ac"),
      ]},
      environment: dbEnv,
    });

    // Lambda for projects endpoints
    const projectsLambda = new lambda.Function(this, "ProjectsLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/routes/projects.routes.handler",
      code: lambda.Code.fromAsset("../backend"),
      vpc,
      securityGroups: [lambdaSG],
      vpcSubnets: { subnets: [
        ec2.Subnet.fromSubnetId(this, "subnet1p", "subnet-0b12559a29fa04790"),
        ec2.Subnet.fromSubnetId(this, "subnet2p", "subnet-043f5252ea218d1da"),
        ec2.Subnet.fromSubnetId(this, "subnet3p", "subnet-0ebc8ff15884a84b9"),
        ec2.Subnet.fromSubnetId(this, "subnet4p", "subnet-0f2c9953441f05d8c"),
        ec2.Subnet.fromSubnetId(this, "subnet5p", "subnet-08a1a7e857a96af6a"),
        ec2.Subnet.fromSubnetId(this, "subnet6p", "subnet-00aadc11d067e33ac"),
      ]},
      environment: dbEnv,
    });

    // Lambda for personas endpoints
    const personasLambda = new lambda.Function(this, "PersonasLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/routes/personas.routes.handler",
      code: lambda.Code.fromAsset("../backend"),
      vpc,
      securityGroups: [lambdaSG],
      vpcSubnets: { subnets: [
        ec2.Subnet.fromSubnetId(this, "subnet1n", "subnet-0b12559a29fa04790"),
        ec2.Subnet.fromSubnetId(this, "subnet2n", "subnet-043f5252ea218d1da"),
        ec2.Subnet.fromSubnetId(this, "subnet3n", "subnet-0ebc8ff15884a84b9"),
        ec2.Subnet.fromSubnetId(this, "subnet4n", "subnet-0f2c9953441f05d8c"),
        ec2.Subnet.fromSubnetId(this, "subnet5n", "subnet-08a1a7e857a96af6a"),
        ec2.Subnet.fromSubnetId(this, "subnet6n", "subnet-00aadc11d067e33ac"),
      ]},
      environment: dbEnv,
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
            "application/json": "npm install --save-dev @types/pg{\"status\": \"OK\"}"
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
    // After defining your testDbLambda
    const testDbLambda = new lambda.Function(this, "TestDbLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/test-db.handler",
      code: lambda.Code.fromAsset("../backend"),
      vpc,
      securityGroups: [lambdaSG],
      vpcSubnets: { subnets: [
        ec2.Subnet.fromSubnetId(this, "subnet1test", "subnet-0b12559a29fa04790"),
        ec2.Subnet.fromSubnetId(this, "subnet2test", "subnet-043f5252ea218d1da"),
        ec2.Subnet.fromSubnetId(this, "subnet3test", "subnet-0ebc8ff15884a84b9"),
        ec2.Subnet.fromSubnetId(this, "subnet4test", "subnet-0f2c9953441f05d8c"),
        ec2.Subnet.fromSubnetId(this, "subnet5test", "subnet-08a1a7e857a96af6a"),
        ec2.Subnet.fromSubnetId(this, "subnet6test", "subnet-00aadc11d067e33ac"),
      ]},
      environment: dbEnv,
    });

    const testDb = api.root.addResource("test-db");
    testDb.addMethod("GET", new apigateway.LambdaIntegration(testDbLambda));
  }
}