import { Inject, Injectable } from '@nestjs/common';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { Model } from 'mongoose';
import { User } from './interface/user.interface';
import * as csv from 'fast-csv';
import * as fs from 'fs';

@Injectable()
export class UsersService {
  private readonly cognitoClient: CognitoIdentityServiceProvider;

  constructor(@Inject('USER_MODEL') private readonly userModel: Model<User>) {
    this.cognitoClient = new CognitoIdentityServiceProvider({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    });
  }

  async getUsers(exportAsDb = false, exportAsExport = false): Promise<object> {
    const PAGE_SIZE = 60;
    const USER_POOL_ID = process.env.AWS_USER_POOL_ID;

    let done = false;
    let paginationToken;

    const allUsers = [];
    let existingIds;
    let existingUsernames;

    let csvStream;
    let writableStream;

    if (exportAsDb) {
      existingUsernames = await this.userModel.find({}, { _id: 1 }).lean();
      existingIds = new Set(existingUsernames.map((user) => user._id));
    }

    if (exportAsExport) {
      csvStream = csv.format({ headers: true });
      writableStream = fs.createWriteStream('users.csv');
      csvStream.pipe(writableStream);
    }

    while (!done) {
      const params = {
        UserPoolId: USER_POOL_ID,
        Limit: PAGE_SIZE,
        PaginationToken: paginationToken,
      };

      const response = await this.cognitoClient.listUsers(params).promise();

      // Process users in parallel
      await Promise.all(
        (response.Users || []).map(async (user) => {
          const record = {
            _id: user.Username,
            name: user.Attributes.find((attr) => attr.Name === 'name')?.Value,
            email: user.Attributes.find((attr) => attr.Name === 'email')?.Value,
            customerId: user.Attributes.find(
              (attr) => attr.Name === 'custom:customer_id',
            )?.Value,
            memberId: user.Attributes.find(
              (attr) => attr.Name === 'custom:member_id',
            )?.Value,
            status: user.UserStatus,
            createDate: user.UserCreateDate,
          };

          if (exportAsExport) {
            csvStream.write(record);
          }

          if (exportAsDb) {
            await this.storeIntoDb([record], existingIds);
          }

          allUsers.push({ ...record });
        }),
      );

      if (response.PaginationToken) {
        paginationToken = response.PaginationToken;
      } else {
        done = true;
      }
    }

    if (exportAsExport) {
      csvStream.end();
    }

    return {
      users: allUsers,
      message:
        !exportAsDb && !exportAsExport
          ? allUsers.length
          : 'User list exported successfully.',
    };
  }

  async exportUsersToDb(): Promise<object> {
    return this.getUsers(true, false);
  }

  async exportUsersToExcelSheet(): Promise<object> {
    return this.getUsers(false, true);
  }

  private async storeIntoDb(records, existingIds) {
    const newRecords = records.filter((record) => !existingIds.has(record._id));

    if (newRecords.length > 0) {
      await this.userModel.insertMany(newRecords);
    }
  }
}
