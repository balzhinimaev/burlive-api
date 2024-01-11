// testDatabase.ts
import mongoose from 'mongoose';

export const connectTestDatabase = async () => {
  const connection = await mongoose.createConnection('mongodb://localhost:27017/test');
  return connection;
};

export const closeTestDatabase = async (connection: mongoose.Connection) => {
  await connection.close();
};
