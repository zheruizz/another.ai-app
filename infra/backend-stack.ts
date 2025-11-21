import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC, Subnets, Security Group for Lambda <-> RDS
    const vpc = ec2.Vpc.fromVpcAttributes(this, "AppVPC", {
      vpcId: "vpc-004303f540511f4e6",
      availabilityZones: ["us-east-1d"],
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
      DB_PASSWORD: "OniiohnVY^8134#$45naf^3e",
      DB_NAME: "postgres",
      DB_SSL: "true",
    };

    // OpenAI secret + env config
    const openAiSecretName = "anotherai/openai-api";
    const openAiRegion = "us-east-1";
    const openAiSecret = secretsmanager.Secret.fromSecretNameV2(this, "OpenAISecret", openAiSecretName);

    // Lambda for /hello and /upload
    const helloLambda = new lambda.Function(this, "HelloLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/hello.handler",
      code: lambda.Code.fromAsset("../backend/lambda-package"),
      vpc,
      securityGroups: [lambdaSG],
      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetId(this, "subnet1", "subnet-0b12559a29fa04790"),
          ec2.Subnet.fromSubnetId(this, "subnet2", "subnet-043f5252ea218d1da"),
          ec2.Subnet.fromSubnetId(this, "subnet3", "subnet-0ebc8ff15884a84b9"),
          ec2.Subnet.fromSubnetId(this, "subnet4", "subnet-0f2c9953441f05d8c"),
          ec2.Subnet.fromSubnetId(this, "subnet5", "subnet-08a1a7e857a96af6a"),
          ec2.Subnet.fromSubnetId(this, "subnet6", "subnet-00aadc11d067e33ac"),
        ],
      },
      environment: {
        ...dbEnv,
        BUCKET_NAME: demoBucket.bucketName,
      },
    });

    // Lambda for agent-tests endpoints
    const agentTestsLambda = new lambda.Function(this, "AgentTestsLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/routes/agent-tests/routes.handler",
      code: lambda.Code.fromAsset("../backend/lambda-package"),
      // No VPC needed initially (will need internet access for Playwright later)
      environment: {
        ...dbEnv, // Add database connection for agent-tests
      },
      timeout: cdk.Duration.seconds(300),
      memorySize: 1024,
    });

    demoBucket.grantReadWrite(helloLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, "BackendApi", {
      restApiName: "Backend Service"
    });

    // /hello endpoint
    const hello = api.root.addResource("hello");
    hello.addMethod("GET", new apigateway.LambdaIntegration(helloLambda));
    hello.addMethod("OPTIONS", new apigateway.MockIntegration({}));

    // /upload endpoint
    const upload = api.root.addResource("upload");
    upload.addMethod("POST", new apigateway.LambdaIntegration(helloLambda));
    upload.addMethod("OPTIONS", new apigateway.MockIntegration({}));

    // /api root
    const apiRoot = api.root.addResource("api");

    // /api/agent-tests endpoints
    const agentTests = apiRoot.addResource("agent-tests");
    const agentTestsSuggest = agentTests.addResource("suggest-tasks");
    agentTestsSuggest.addMethod("POST", new apigateway.LambdaIntegration(agentTestsLambda));
    const agentTestsRun = agentTests.addResource("run");
    agentTestsRun.addMethod("POST", new apigateway.LambdaIntegration(agentTestsLambda));

    // Add CORS OPTIONS for agent-tests endpoints
    [
      agentTests, agentTestsSuggest, agentTestsRun
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

    // Test DB Lambda
    const testDbLambda = new lambda.Function(this, "TestDbLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/test-db.handler",
      code: lambda.Code.fromAsset("../backend/lambda-package"),
      vpc,
      securityGroups: [lambdaSG],
      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetId(this, "subnet1test", "subnet-0b12559a29fa04790"),
          ec2.Subnet.fromSubnetId(this, "subnet2test", "subnet-043f5252ea218d1da"),
          ec2.Subnet.fromSubnetId(this, "subnet3test", "subnet-0ebc8ff15884a84b9"),
          ec2.Subnet.fromSubnetId(this, "subnet4test", "subnet-0f2c9953441f05d8c"),
          ec2.Subnet.fromSubnetId(this, "subnet5test", "subnet-08a1a7e857a96af6a"),
          ec2.Subnet.fromSubnetId(this, "subnet6test", "subnet-00aadc11d067e33ac"),
        ],
      },
      environment: dbEnv,
    });

    const testDb = api.root.addResource("test-db");
    testDb.addMethod("GET", new apigateway.LambdaIntegration(testDbLambda));

    // Test OpenAI Lambda - NO VPC needed (needs internet access for OpenAI API)
    const testOpenAiLambda = new lambda.Function(this, "TestOpenAiLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/test-openai.handler",
      code: lambda.Code.fromAsset("../backend/lambda-package"),
      // Removed VPC config to allow internet access for OpenAI API
      environment: {
        OPENAI_SECRET_NAME: openAiSecretName,
        OPENAI_REGION: openAiRegion,
        MODEL_NAME: "gpt-4o-mini",
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
    });

    openAiSecret.grantRead(testOpenAiLambda);

    const testOpenAi = api.root.addResource("test-openai");
    testOpenAi.addMethod("GET", new apigateway.LambdaIntegration(testOpenAiLambda));
  }
}