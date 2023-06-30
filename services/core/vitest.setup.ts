vitest.mock('@swarmion/serverless-helpers', async () => {
  const actualImport = await vitest.importActual<
    typeof import('@swarmion/serverless-helpers')
  >('@swarmion/serverless-helpers');

  afterEach(() => {
    vi.resetAllMocks();
  });

  return {
    ...actualImport,
    getEnvVariable: () => '""',
  };
});
