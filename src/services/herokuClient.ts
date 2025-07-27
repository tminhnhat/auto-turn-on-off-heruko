import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { HerokuApp, HerokuDyno, HerokuFormation } from '../types/heroku';
import { logger } from '../utils/logger';

export class HerokuClient {
  private client: AxiosInstance;
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
    this.client = axios.create({
      baseURL: 'https://api.heroku.com',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/vnd.heroku+json; version=3',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get app information
   */
  async getApp(appName: string): Promise<HerokuApp> {
    try {
      const response: AxiosResponse<HerokuApp> = await this.client.get(`/apps/${appName}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get app ${appName}:`, error.response?.data || error.message);
      throw new Error(`Failed to get app ${appName}: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get app dynos
   */
  async getDynos(appName: string): Promise<HerokuDyno[]> {
    try {
      const response: AxiosResponse<HerokuDyno[]> = await this.client.get(`/apps/${appName}/dynos`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get dynos for ${appName}:`, error.response?.data || error.message);
      throw new Error(`Failed to get dynos for ${appName}: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get app formation (process types and their scale)
   */
  async getFormation(appName: string): Promise<HerokuFormation[]> {
    try {
      const response: AxiosResponse<HerokuFormation[]> = await this.client.get(`/apps/${appName}/formation`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get formation for ${appName}:`, error.response?.data || error.message);
      throw new Error(`Failed to get formation for ${appName}: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Scale app dynos (turn on/off)
   */
  async scaleApp(appName: string, processType: string = 'web', quantity: number): Promise<HerokuFormation> {
    try {
      const response: AxiosResponse<HerokuFormation> = await this.client.patch(
        `/apps/${appName}/formation/${processType}`,
        { quantity }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to scale ${appName}:`, error.response?.data || error.message);
      throw new Error(`Failed to scale ${appName}: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Turn app on (scale to 1)
   */
  async turnOnApp(appName: string, processType: string = 'web'): Promise<void> {
    try {
      logger.info(`Turning on app: ${appName}`);
      await this.scaleApp(appName, processType, 1);
      logger.info(`Successfully turned on app: ${appName}`);
    } catch (error) {
      logger.error(`Failed to turn on app ${appName}:`, error);
      throw error;
    }
  }

  /**
   * Turn app off (scale to 0)
   */
  async turnOffApp(appName: string, processType: string = 'web'): Promise<void> {
    try {
      logger.info(`Turning off app: ${appName}`);
      await this.scaleApp(appName, processType, 0);
      logger.info(`Successfully turned off app: ${appName}`);
    } catch (error) {
      logger.error(`Failed to turn off app ${appName}:`, error);
      throw error;
    }
  }

  /**
   * Get app status
   */
  async getAppStatus(appName: string): Promise<{ isRunning: boolean; dynos: HerokuDyno[] }> {
    try {
      const dynos = await this.getDynos(appName);
      const isRunning = dynos.some(dyno => dyno.state === 'up');
      return { isRunning, dynos };
    } catch (error) {
      logger.error(`Failed to get status for app ${appName}:`, error);
      throw error;
    }
  }

  /**
   * Check if app exists and is accessible
   */
  async validateApp(appName: string): Promise<boolean> {
    try {
      await this.getApp(appName);
      return true;
    } catch (error) {
      return false;
    }
  }
}
