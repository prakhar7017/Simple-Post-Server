import cors from "cors";
import express from "express";
import helmet from "helmet";
import createDebug from "debug";
import http, { Server } from "http";
import createError from "http-errors";
import logger from "morgan";
import config from "./config/config";
import initializeDB from "./db/db";
import errorHandler from "./middlewares/error.middleware";
import userRoutes from "./routes//api/v1/auth";
import postRoutes from "./routes/api/v1/post";
import followRoutes from "./routes/api/v1/follow";

const debug = createDebug("server:server");

class Express {
  public app: express.Application;
  public server: Server;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    initializeDB();
    this.initializeMiddlewares();
  }

  private initializeMiddlewares() {
    this.app.disable("x-powered-by");
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors(config.cors));
    this.app.set("trust proxy", 1);
    this.app.use(logger("dev"));
    this.app.use(helmet());
    this.app.use(userRoutes);
    this.app.use(postRoutes);
    this.app.use(followRoutes);

    // catch 404 and forward to error handler
    this.app.use(function (req, res, next) {
      next(createError(404));
    });

    // error handler
    this.app.use(errorHandler);
  }

  public onError() {
    this.server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.syscall !== "listen") {
        throw error;
      }

      const bind =
        typeof config.server.port === "string"
          ? "Pipe " + config.server.port
          : "Port " + config.server.port;

      // handle specific listen errors with friendly messages
      switch (error.code) {
        case "EACCES":
          console.error(bind + " requires elevated privileges");
          process.exit(1);
        case "EADDRINUSE":
          console.error(bind + " is already in use");
          process.exit(1);
        default:
          throw error;
      }
    });
  }

  public onListening() {
    this.server.on("listening", () => {
      const addr = this.server.address();
      const bind =
        typeof addr === "string" ? "pipe " + addr : "port " + addr.port;

      debug("Listening on " + bind);
    });
  }

  public listen() {
    this.server.listen(config.server.port, () => {
      console.log(`# Application is listening on port ${config.server.port} #`);
    });
  }
}

export default Express;