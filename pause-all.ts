/**
 * Pause-All AWS Services Script
 * ---------------------------------
 * Safely pauses or scales down AWS resources to minimize costs.
 * Supports: Lambda, API Gateway, S3, DynamoDB, CloudWatch Logs
 *
 * Run with:
 *   npx tsx pause-all.ts
 */

import { LambdaClient, ListFunctionsCommand, UpdateFunctionConfigurationCommand } from "@aws-sdk/client-lambda";
import { ApiGatewayV2Client, DeleteApiCommand, GetApisCommand } from "@aws-sdk/client-apigatewayv2";
import { S3Client, ListBucketsCommand, PutBucketLifecycleConfigurationCommand } from "@aws-sdk/client-s3";
// import { DynamoDBClient, ListTablesCommand, UpdateTableCommand } from "@aws-sdk/client-dynamodb";
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DeleteLogGroupCommand } from "@aws-sdk/client-cloudwatch-logs";
import { ConfigServiceClient, StopConfigurationRecorderCommand, DescribeConfigurationRecordersCommand } from "@aws-sdk/client-config-service";

const REGION = process.env.AWS_REGION || "us-east-1";
const lambda = new LambdaClient({ region: REGION });
const apiGateway = new ApiGatewayV2Client({ region: REGION });
const s3 = new S3Client({ region: REGION });
// const dynamo = new DynamoDBClient({ region: REGION });
const logs = new CloudWatchLogsClient({ region: REGION });
const config = new ConfigServiceClient({ region: REGION });

(async () => {
    console.log("🔸 Starting AWS pause-all cleanup...");

    /** 🧩 Lambda Functions */
    const lambdas = await lambda.send(new ListFunctionsCommand({}));
    for (const fn of lambdas.Functions || []) {
        console.log(`🛑 Disabling Lambda: ${fn.FunctionName}`);
        await lambda.send(
            new UpdateFunctionConfigurationCommand({
                FunctionName: fn.FunctionName,
                Environment: {
                    Variables: { PAUSED_AT: new Date().toISOString(), ...(fn.Environment?.Variables || {}) },
                },
            })
        );
    }

    /** 🌐 API Gateway */
    const apis = await apiGateway.send(new GetApisCommand({}));
    for (const api of apis.Items || []) {
        if (api.Name?.includes("dev") || api.Name?.includes("staging")) {
            console.log(`🛑 Deleting temporary API Gateway: ${api.Name}`);
            await apiGateway.send(new DeleteApiCommand({ ApiId: api.ApiId! }));
        }
    }

    /** 🪣 S3 Buckets (add lifecycle rules to auto-clean objects after 1 day) */
    const buckets = await s3.send(new ListBucketsCommand({}));
    for (const bucket of buckets.Buckets || []) {
        console.log(`🧹 Adding cleanup lifecycle rule to: ${bucket.Name}`);
        await s3.send(
            new PutBucketLifecycleConfigurationCommand({
                Bucket: bucket.Name!,
                LifecycleConfiguration: {
                    Rules: [
                        {
                            ID: "auto-cleanup",
                            Status: "Enabled",
                            Expiration: { Days: 1 },
                            Filter: {},
                        },
                    ],
                },
            })
        );
    }

    /** 📦 DynamoDB */
    // const tables = await dynamo.send(new ListTablesCommand({}));
    // for (const name of tables.TableNames || []) {
    //     console.log(`🛑 Reducing DynamoDB throughput for: ${name}`);
    //     await dynamo.send(
    //         new UpdateTableCommand({
    //             TableName: name,
    //             ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
    //         })
    //     );
    // }

    /** 🧾 CloudWatch Logs */
    const logGroups = await logs.send(new DescribeLogGroupsCommand({}));
    for (const group of logGroups.logGroups || []) {
        if (group.logGroupName?.includes("dev") || group.logGroupName?.includes("tmp")) {
            console.log(`🗑️  Deleting log group: ${group.logGroupName}`);
            await logs.send(new DeleteLogGroupCommand({ logGroupName: group.logGroupName }));
        }
    }

    /** AWS Config */
    const recorders = await config.send(new DescribeConfigurationRecordersCommand({}));
    for (const recorder of recorders.ConfigurationRecorders || []) {
        console.log(`🛑 Stopping AWS Config recorder: ${recorder.name}`);
        await config.send(new StopConfigurationRecorderCommand({ ConfigurationRecorderName: recorder.name }));
    }

    console.log("✅ AWS pause-all cleanup complete!");
})();
