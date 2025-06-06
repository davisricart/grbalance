export interface ClientConfig {
  name: string;
  title: string;
  logo: string;
  theme: {
    primary: string;
    secondary: string;
  };
}

const clientConfig: ClientConfig = {
  name: 'gr-balance',
  title: 'Beauty and Grace',
  logo: '/images/gr-logo.png',
  theme: {
    primary: 'emerald',
    secondary: 'gray'
  }
};

export default clientConfig;