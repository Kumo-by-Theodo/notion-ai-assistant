import { getCdkHandlerPath } from '@swarmion/serverless-helpers';
import { Duration } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import { sharedCdkEsbuildConfig } from '@notion-ai-assistant/serverless-configuration';

type StoreEmbeddingsProps = { restApi: RestApi; s3BucketName: string };

export class StoreEmbeddings extends Construct {
  public storeEmbeddingsFunction: NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    { restApi, s3BucketName }: StoreEmbeddingsProps,
  ) {
    super(scope, id);

    this.storeEmbeddingsFunction = new NodejsFunction(this, 'Lambda', {
      entry: getCdkHandlerPath(__dirname),
      handler: 'main',
      //Langchain OpenAIEmbeddings function is falling under node18
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      awsSdkConnectionReuse: true,
      bundling: sharedCdkEsbuildConfig,
      //TODO: embedding can take more times than API GATEWAY timeout.
      // We have to find another way to do this process and reduce back this lambda timeout
      timeout: Duration.minutes(3),
      environment: { S3_BUCKET_NAME: s3BucketName },
    });

    restApi.root
      .resourceForPath('/store-embeddings')
      .addMethod('POST', new LambdaIntegration(this.storeEmbeddingsFunction));
  }
}
