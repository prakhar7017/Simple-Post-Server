
import mongoose from "mongoose";
import path from "path";

const env = process.env.NODE_ENV || "dev";

if (env === "dev") {
  require("dotenv").config({
    path: path.join(__dirname, "../../.env.dev"),
  });
}

export default {
  server: {
    env,
    port: process.env.PORT || 9000,
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME,
  },
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
    preflightContinue: true,
  },
};