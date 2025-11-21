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

    //
    // Parameters (allow deployers to provide DB/connectivity info or secrets)
    //
    const dbHostParam = new cdk.CfnParameter(this, "DBHost", {
      type: "String",
      default: "",
      description: "Optional external DB host (leave empty if DB is managed separately/in another stack)",
    });

    const dbPortParam = new cdk.CfnParameter(this, "DBPort", {
      type: "String",
      default: "5432",
      description: "Database port",
    });

    const dbUserParam = new cdk.CfnParameter(this, "DBUser", {
      type: "String",
      default: "master",
      description: "Database user",
    });

    const dbNameParam = new cdk.CfnParameter(this, "DBName", {
      type: "String",
      default: "postgres",
      description: "Database name",
    });

    const dbSecretNameParam = new cdk.CfnParameter(this, "DBSecretName", {
      type: "String",
      default: "",
      description:
        "If you store DB credentials in Secrets Manager, provide the secret name here (JSON with DB_PASSWORD or whatever your app expects). Leave empty to rely on DB_* env vars.",
    });

    // OpenAI secret name (keeps previous default but allows override)
    const openAiSecretNameParam = new cdk.CfnParameter(this, "OpenAISecretName", {
      type: "String",
      default: "anotherai/openai-api",
      description: "Secrets Manager secret name that contains OPENAI_API_KEY",
    });

    const openAiRegionParam = new cdk.CfnParameter(this, "OpenAISecretRegion", {
      type: "String",
      default: this.region || "us-east-1",
      description: "Region where the OpenAI secret is stored",
    });

    //
    // VPC and networking - CREATE resources (portable)
    //
    const vpc = new ec2.Vpc(this, "AppVPC", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Security group for Lambdas (all Lambdas that need VPC)
    const lambdaSG = new ec2.SecurityGroup(this, "LambdaSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "Security group for Lambdas",
    });

    // Security group for DB (if external DB in the same VPC or when you create RDS)
    const dbSG = new ec2.SecurityGroup(this, "DatabaseSecurityGroup", {
      vpc,
      allowAllOutbound: false,
      description: "Security group for database (Postgres)",
    });

    // Allow Lambda SG to access DB SG on Postgres port
    dbSG.addIngressRule(lambdaSG, ec2.Port.tcp(5432), "Allow Lambda to connect to Postgres");

    //
    // S3 bucket for /upload demo
    //
    const demoBucket = new s3.Bucket(this, "DemoBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //
    // Build DB environment object without embedding any secret values.
    // Prefer providing credentials via Secrets Manager (DBSecretName) or stable env vars passed at deploy time.
    //
    const dbEnv: { [key: string]: string } = {
      DB_HOST: dbHostParam.valueAsString,
      DB_PORT: dbPortParam.valueAsString,
      DB_USER: dbUserParam.valueAsString,
      DB_NAME: dbNameParam.valueAsString,
      DB_SSL: "true", // keep default as true; override locally via .env if needed
      // If a secrets manager name is provided, Lambdas can read it at runtime (we pass the name + region).
      DB_SECRET_NAME: dbSecretNameParam.valueAsString,
      DB_SECRET_REGION: this.region,
    };

    //
    // OpenAI secret (we only reference by name so providers without the secret still synthesize)
    //
    const openAiSecretName = openAiSecretNameParam.valueAsString;
    const openAiRegion = openAiRegionParam.valueAsString;
    const openAiSecret = secretsmanager.Secret.fromSecretNameV2(this, "OpenAISecret", openAiSecretName);

    //
    // Helper to create a Lambda that needs VPC access
    //
    const createVpcLambda = (id: string, handler: string, env: { [key: string]: string }) =>
      new lambda.Function(this, id, {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler,
        code: lambda.Code.fromAsset("../backend/lambda-package"),
        vpc,
        securityGroups: [lambdaSG],
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        environment: {
          ...env,
        },
      });

    //
    // Hello Lambda (in VPC so it can access RDS)
    //
    const helloLambda = createVpcLambda("HelloLambda", "dist/hello.handler", {
      ...dbEnv,
      BUCKET_NAME: demoBucket.bucketName,
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

    //
    // API Gateway & Routes
    //
    const api = new apigateway.RestApi(this, "BackendApi", {
      restApiName: "Backend Service",
    });

    // /hello endpoint
    const hello = api.root.addResource("hello");
    hello.addMethod("GET", new apigateway.LambdaIntegration(helloLambda));
    hello.addMethod("OPTIONS", new apigateway.MockIntegration({}));

    // /upload endpoint (same lambda)
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
        }),
        {
          methodResponses: [
            {
              statusCode: "200",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Origin": true,
                "method.response.header.Access-Control-Allow-Headers": true,
                "method.response.header.Access-Control-Allow-Methods": true,
              },
            },
          ],
        }
      );
    });

    //
    // Test DB Lambda (in VPC)
    //
    const testDbLambda = createVpcLambda("TestDbLambda", "dist/test-db.handler", {
      ...dbEnv,
    });

    const testDb = api.root.addResource("test-db");
    testDb.addMethod("GET", new apigateway.LambdaIntegration(testDbLambda));

    //
    // Test OpenAI Lambda - NO VPC needed (needs internet access for OpenAI API)
    //
    const testOpenAiLambda = new lambda.Function(this, "TestOpenAiLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "dist/test-openai.handler",
      code: lambda.Code.fromAsset("../backend/lambda-package"),
      // no vpc so it has default internet access
      environment: {
        OPENAI_SECRET_NAME: openAiSecretName,
        OPENAI_REGION: openAiRegion,
        MODEL_NAME: "gpt-4o-mini",
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
    });

    try {
      openAiSecret.grantRead(testOpenAiLambda);
    } catch {
      // best effort
    }

    const testOpenAi = api.root.addResource("test-openai");
    testOpenAi.addMethod("GET", new apigateway.LambdaIntegration(testOpenAiLambda));

    //
    // Outputs to help deployers discover network/secret names
    //
    new cdk.CfnOutput(this, "VpcId", { value: vpc.vpcId });
    new cdk.CfnOutput(this, "LambdaSecurityGroupId", { value: lambdaSG.securityGroupId });
    new cdk.CfnOutput(this, "DatabaseSecurityGroupId", { value: dbSG.securityGroupId });
    new cdk.CfnOutput(this, "DemoBucketName", { value: demoBucket.bucketName });
    new cdk.CfnOutput(this, "ApiEndpoint", { value: api.url });
    new cdk.CfnOutput(this, "OpenAISecretNameParameter", { value: openAiSecretName });
  }
}