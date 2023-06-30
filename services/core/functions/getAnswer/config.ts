import {
  getCdkHandlerPath,
  getEnvVariable,
} from '@swarmion/serverless-helpers';
import { Duration } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import { getAnswerContract } from '@notion-ai-assistant/core-contracts';
import { sharedCdkEsbuildConfig } from '@notion-ai-assistant/serverless-configuration';

type GetAnswerProps = {
  restApi: RestApi;
  openAISecretArn: string;
  supabaseKeyArn: string;
};

export class GetAnswer extends Construct {
  public getAnswer: NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    { restApi, openAISecretArn, supabaseKeyArn }: GetAnswerProps,
  ) {
    super(scope, id);

    this.getAnswer = new NodejsFunction(this, 'Lambda', {
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
      environment: {
        OPENAI_API_KEY_ARN: openAISecretArn,
        SUPABASE_URL: getEnvVariable('SUPABASE_URL'),
        SUPABASE_KEY_ARN: supabaseKeyArn,
      },
    });

    restApi.root
      .resourceForPath(getAnswerContract.path)
      .addMethod(
        getAnswerContract.method,
        new LambdaIntegration(this.getAnswer),
      );
  }
}
