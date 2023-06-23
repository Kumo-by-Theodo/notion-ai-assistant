import { Stack, StackProps } from 'aws-cdk-lib';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

import { GetAnswer, SlackRequest, StoreEmbeddings } from 'functions/config';

interface CoreProps {
  stage: string;
}

export class CoreStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & CoreProps) {
    super(scope, id, props);

    const { stage } = props;

    const coreApi = new RestApi(this, 'CoreApi', {
      // the stage of the API is the same as the stage of the stack
      description: `Core API - ${stage}`,
      deployOptions: {
        stageName: stage,
      },
    });

    const s3Bucket = new Bucket(this, 'NotionBucket');

    const policyStatement = new PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [s3Bucket.arnForObjects('*')],
    });

    const openAISecret = new Secret(this, 'openAISecret', {
      secretName: 'openAISecret',
    });

    const slackTokenSecret = new Secret(this, 'slackTokenSecret', {
      secretName: 'slackTokenSecret',
    });

    const supabaseKeySecret = new Secret(this, 'supabaseKeySecret', {
      secretName: 'supabaseKeySecret',
    });

    const { getAnswer } = new GetAnswer(this, 'GetAnswer', {
      restApi: coreApi,
      openAISecretArn: openAISecret.secretArn,
      supabaseKeyArn: supabaseKeySecret.secretArn,
    });
    openAISecret.grantRead(getAnswer);
    supabaseKeySecret.grantRead(getAnswer);

    const { slackRequest } = new SlackRequest(this, 'SlackRequest', {
      restApi: coreApi,
      openAISecretArn: openAISecret.secretArn,
      supabaseKeyArn: supabaseKeySecret.secretArn,
      slackTokenSecretArn: slackTokenSecret.secretArn,
    });

    openAISecret.grantRead(slackRequest);
    supabaseKeySecret.grantRead(slackRequest);
    slackTokenSecret.grantRead(slackRequest);

    const { storeEmbeddingsFunction } = new StoreEmbeddings(
      this,
      'StoreEmbeddings',
      {
        restApi: coreApi,
        s3BucketName: s3Bucket.bucketName,
        supabaseKeyArn: supabaseKeySecret.secretArn,
        openAISecretArn: openAISecret.secretArn,
      },
    );
    s3Bucket.grantRead(storeEmbeddingsFunction);
    storeEmbeddingsFunction.addToRolePolicy(policyStatement);
    openAISecret.grantRead(storeEmbeddingsFunction);
    supabaseKeySecret.grantRead(storeEmbeddingsFunction);

    s3Bucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(storeEmbeddingsFunction),
    );
  }
}
