export const getEnvVariable = (name: string): string => {
  if (process.env[name] === undefined) {
    throw Error(`Env variable ${name} does not exist`);
  }

  return process.env[name] as string;
};
