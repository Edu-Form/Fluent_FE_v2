// global.d.ts
declare global {
    const _mongoClientPromise: Promise<any> | undefined;
  }
  
export {};  // This ensures the file is treated as a module.
  