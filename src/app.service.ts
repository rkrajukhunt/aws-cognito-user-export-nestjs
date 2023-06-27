import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async welcome() {
    return { message: 'welcome to aws cognito exporter' };
  }
}
