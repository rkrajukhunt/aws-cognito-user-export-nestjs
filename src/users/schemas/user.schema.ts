import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  _id: String,
  name: String,
  email: String,
  customerId: String,
  memberId: String,
  status: String,
  createDate: Date,
});
