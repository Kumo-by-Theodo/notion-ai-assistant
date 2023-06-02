import { App } from 'aws-cdk-lib';
import dotenv from 'dotenv';

import {
  defaultEnvironment,
  projectName,
  region,
  sharedParams,
} from '@notion-ai-assistant/serverless-configuration';

import { CoreStack } from './stack';

// Load environment variables from .env file
dotenv.config();

const app = new App();

const stage =
  (app.node.tryGetContext('stage') as keyof typeof sharedParams | undefined) ??
  defaultEnvironment;

new CoreStack(app, `${projectName}-core-${stage}`, {
  stage,
  env: { region },
});
