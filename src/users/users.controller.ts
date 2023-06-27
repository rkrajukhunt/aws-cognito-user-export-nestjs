import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  @Get('export-as-excel')
  async exportUsers(): Promise<object> {
    return this.usersService.exportUsersToExcelSheet();
  }

  @Get('export-to-db')
  async exportUsersToDB(): Promise<object> {
    return this.usersService.exportUsersToDb();
  }
}
