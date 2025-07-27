export interface HerokuApp {
  id: string;
  name: string;
  web_url: string;
  created_at: string;
  updated_at: string;
  stack: {
    id: string;
    name: string;
  };
  region: {
    id: string;
    name: string;
  };
}

export interface HerokuDyno {
  id: string;
  name: string;
  type: string;
  size: string;
  state: 'up' | 'down' | 'crashed' | 'idle';
  command: string;
  created_at: string;
  updated_at: string;
}

export interface HerokuFormation {
  id: string;
  app: {
    id: string;
    name: string;
  };
  type: string;
  quantity: number;
  size: string;
  command: string;
  created_at: string;
  updated_at: string;
}

export interface AppConfig {
  name: string;
  scheduleOn?: string;
  scheduleOff?: string;
  timezone?: string;
}
