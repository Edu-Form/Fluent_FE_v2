// types/global.d.ts
interface GApiAuh2Client {
  init: (params: Object) => Promise<void>;
  isSignedIn: {
    get: () => boolean;
  };
  currentUser: {
    get: () => {
      getAuthResponse: () => { access_token: string };
    };
  };
  grantOfflineAccess: (options?: Object) => Promise<any>;
}

interface GapiClient {
  init: (params: Object) => Promise<any>;
  load: (api: string, version: string) => Promise<any>;
  setToken: (token: { access_token: string }) => void;
  calendar: {
    events: {
      list: (params: Object) => Promise<any>;
      insert: (params: Object) => Promise<any>;
      update: (params: Object) => Promise<any>;
      delete: (params: Object) => Promise<any>;
    };
    // Add other calendar methods if needed
  };
  // Add other services if needed
}

interface GapiGoogleAuth {
  OAuth2: new (clientId: string, scope: string, redirectUri: string) => GApiAuh2Client;
  // Add other auth methods if needed
}

declare global {
  interface Window {
    gapi: {
      load: (libraries: string, callback: () => void) => void;
      client: GapiClient;
      auth2: GapiGoogleAuth;
    };
    google: {
      accounts: {
        id: {
          initialize: (params: Object) => void;
          renderButton: (element: HTMLElement, params: Object) => void;
          prompt: () => void;
        };
        oauth2: {
          initCodeClient: (params: Object) => any;
        };
      };
    };
  }
}