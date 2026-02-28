import axios, { AxiosInstance } from 'axios';

export class AdjutorClient {
  private readonly http: AxiosInstance;

  constructor(baseURL: string, apiKey: string) {
    this.http = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    });
  }

  async get<T>(path: string): Promise<T> {
    const response = await this.http.get<T>(path);
    return response.data;
  }
}
