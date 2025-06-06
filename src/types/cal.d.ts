declare global {
  interface Window {
    Cal: {
      (action: string, options?: any): void;
      (action: string, namespace: string, options?: any): void;
      ns: {
        [key: string]: {
          (action: string, options: any): void;
        };
      };
    };
  }
}

export {}; 