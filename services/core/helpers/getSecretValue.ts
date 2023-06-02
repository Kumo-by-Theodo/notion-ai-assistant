import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

export const getSecretValue = async (secretArn: string): Promise<string> => {
  const client = new SecretsManagerClient({});

  const params = {
    SecretId: secretArn,
  };

  try {
    const command = new GetSecretValueCommand(params);
    const response = await client.send(command);

    const secret = response.SecretString;
    if (secret === undefined) {
      throw Error('Missing secret');
    }

    return secret;
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw error;
  }
};
