import { Document } from 'mongoose';

export interface User extends Document {
  readonly _id: string;
  readonly name: string;
  readonly email: number;
  readonly status: string;
  readonly memberId: string;
  readonly customerId: string;
  readonly createDate: Date;
}
