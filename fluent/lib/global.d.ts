declare global {
  const _mongoClientPromise: Promise<any> | undefined;
}

// ✅ ADD THIS
declare module "*.css";

export {};