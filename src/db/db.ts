import  mongoose from "mongoose";
import config from "./../config/config";
const mongoUri = config.mongodb.uri
const dbName = config.mongodb.dbName || "socialo";

if (config.server.env === "dev") {
  mongoose.set("debug", true);
}


export default async function () {
  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected`);
  } catch (e) {
    console.log("Error connecting to mongoose: ", e);
  }
}