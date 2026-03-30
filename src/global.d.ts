// Google Identity Services (GSI) type declarations
interface GoogleOAuth2CodeClient {
  requestCode(): void;
}

interface GoogleOAuth2 {
  initCodeClient(config: {
    client_id: string;
    scope: string;
    ux_mode: string;
    callback: (response: { code?: string; error?: string }) => void;
  }): GoogleOAuth2CodeClient;
}

interface GoogleAccounts {
  oauth2: GoogleOAuth2;
}

interface GoogleIdentity {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

export {};
