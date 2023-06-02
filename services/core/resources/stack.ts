import { Stack, StackProps } from 'aws-cdk-lib';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

import { GetAnswer, StoreEmbeddings } from 'functions/config';

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

    const openAISecret = new secretsmanager.Secret(this, 'openAISecret', {
      secretName: 'openAISecret',
    });

    const supabaseKeySecret = new secretsmanager.Secret(
      this,
      'supabaseKeySecret',
      {
        secretName: 'supabaseKeySecret',
      },
    );

    const { getAnswerFunction } = new GetAnswer(this, 'GetAnswer', {
      restApi: coreApi,
      openAISecretArn: openAISecret.secretArn,
      supabaseKeyArn: supabaseKeySecret.secretArn,
    });
    openAISecret.grantRead(getAnswerFunction);
    supabaseKeySecret.grantRead(getAnswerFunction);

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
    storeEmbeddingsFunction.addToRolePolicy(policyStatement);
    openAISecret.grantRead(storeEmbeddingsFunction);
    supabaseKeySecret.grantRead(storeEmbeddingsFunction);
  }
}
