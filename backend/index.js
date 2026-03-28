const express = require("express");
const dotenv = require("dotenv");
const cores = require("cors"); // this is for security purpose to allow only specific frontend to access backend
const mongoose = require("mongoose");
const bodyParser = require("body-parser"); // to parse the incoming request body
const http = require("http");

const { Server } = require("socket.io");

const mainRouter = require("./routes/main.router");
// app.use(cores());

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

// controllers
const { initRepo } = require("./controllers/init");
const { addRepo } = require("./controllers/add");
const { commitRepo } = require("./controllers/commit");
const { pushRepo } = require("./controllers/push");
const { pullRepo } = require("./controllers/pull");
const { revertRepo } = require("./controllers/revert");
const { loadConfig, saveConfig, CONFIG_PATH } = require("./cli/config");
const { login, createPat } = require("./cli/auth");
const { pushApi } = require("./cli/pushApi");
const { pullApi } = require("./cli/pullApi");
const { revertApi } = require("./cli/revertApi");

// load environment variables to current file
dotenv.config();

yargs(hideBin(process.argv))
  .command("start", "starts the new server", {}, startServer)
  .command("init", "Initialize the new repo", {}, initRepo)
  .command(
    "add <file>",
    "Add a file to the repo",
    (yargs) => {
      yargs.positional("file", {
        describe: "Add file to staging area",
        type: "string",
      });
    },
    (argv) => {
      addRepo(argv.file);
    }
  )
  .command(
    "commit <message>",
    "Commit the changes",
    (yargs) => {
      yargs.positional("message", {
        describe: "Commit message",
        type: "string",
      });
    },
    (argv) => {
      commitRepo(argv.message);
    }
  )

  .command("push", "Push the changes to remote repository", () => {}, pushRepo)
  .command(
    "login",
    "Login and save token for CLI",
    (y) =>
      y
        .option("backend", {
          type: "string",
          describe: "Backend base URL (e.g. https://api.example.com)",
        })
        .option("email", { type: "string", demandOption: true })
        .option("password", { type: "string", demandOption: true }),
    async (argv) => {
      const cfg = loadConfig();
      const backendUrl =
        argv.backend || cfg.backendUrl || "http://localhost:3002";
      const data = await login({
        backendUrl,
        email: argv.email,
        password: argv.password,
      });
      if (!data?.success && !data?.token) {
        console.error("Login failed:", data?.message || "unknown error");
        return;
      }
      saveConfig({
        ...cfg,
        backendUrl,
        token: data.token,
        userId: data.userId,
      });
      console.log("Logged in. Saved token to", CONFIG_PATH);
    },
  )
  .command(
    "pat:create",
    "Create a Personal Access Token (PAT) for CLI pushing",
    (y) =>
      y
        .option("backend", { type: "string" })
        .option("jwt", {
          type: "string",
          describe: "JWT token (or use saved config token)",
        })
        .option("name", { type: "string", demandOption: true }),
    async (argv) => {
      const cfg = loadConfig();
      const backendUrl =
        argv.backend || cfg.backendUrl || "http://localhost:3002";
      const jwtToken = argv.jwt || cfg.token;
      if (!jwtToken) {
        console.error("No JWT provided. Run `node index.js login` first.");
        return;
      }
      const data = await createPat({ backendUrl, jwtToken, name: argv.name });
      if (!data?.success) {
        console.error("PAT creation failed:", data?.message || "unknown error");
        return;
      }
      console.log("PAT:", data.token);
      console.log(
        "Use it with: node index.js push-api --repo <repoId> --token <PAT>",
      );
    },
  )
  .command(
    "push-api",
    "Push current folder to a repository (API-based, shows in frontend)",
    (y) =>
      y
        .option("backend", { type: "string" })
        .option("repo", { type: "string", demandOption: true })
        .option("token", {
          type: "string",
          describe: "JWT or PAT (or use saved config token)",
        })
        .option("message", { type: "string" })
        .option("path", { type: "string", default: "." }),
    async (argv) => {
      const cfg = loadConfig();
      const backendUrl =
        argv.backend || cfg.backendUrl || "http://localhost:3002";
      const token = argv.token || cfg.token;
      const { err } = require("./cli/gitStyle");
      if (!token) {
        err("No token provided. Use --token or run `node index.js login`.");
        return;
      }
      try {
        const data = await pushApi({
          backendUrl,
          repoId: argv.repo,
          token,
          message: argv.message,
          rootPath: argv.path,
        });
        if (!data?.success) {
          err(data?.message || "Push failed");
        }
      } catch (e) {
        err(
          e.response?.data?.message || e.message || "Push failed",
        );
      }
    },
  )
  .command(
    "pull-api",
    "Fetch latest snapshot from a repository (Git-like pull)",
    (y) =>
      y
        .option("backend", { type: "string" })
        .option("repo", { type: "string", demandOption: true })
        .option("token", {
          type: "string",
          describe: "JWT or PAT (required for private repositories)",
        })
        .option("path", { type: "string", default: "." }),
    async (argv) => {
      const cfg = loadConfig();
      const backendUrl =
        argv.backend || cfg.backendUrl || "http://localhost:3002";
      const token = argv.token || cfg.token;
      const { err } = require("./cli/gitStyle");
      try {
        await pullApi({
          backendUrl,
          repoId: argv.repo,
          token,
          destPath: argv.path,
        });
      } catch (e) {
        err(e.response?.data?.message || e.message || "pull-api failed");
      }
    },
  )
  .command(
    "revert-api",
    "Revert repository server state to a specific commit snapshot",
    (y) =>
      y
        .option("backend", { type: "string" })
        .option("repo", { type: "string", demandOption: true })
        .option("token", {
          type: "string",
          describe: "JWT or PAT (required for private repositories)",
        })
        .option("commit", { 
          type: "string", 
          demandOption: true, 
          describe: "The commit ID to revert the codebase back to" 
        }),
    async (argv) => {
      const cfg = loadConfig();
      const backendUrl = argv.backend || cfg.backendUrl || "http://localhost:3002";
      const token = argv.token || cfg.token;
      const { err } = require("./cli/gitStyle");
      try {
        await revertApi({
          backendUrl,
          repoId: argv.repo,
          token,
          commitId: argv.commit,
        });
      } catch (e) {
        err(e.response?.data?.message || e.message || "revert-api failed");
      }
    },
  )
  .command(
    "pull",
    "Pull the changes from remote repository",
    () => {},
    pullRepo
  )
  .command(
    "revert <commitId>",
    "Revert to a specific commit",
    (yargs) => {
      yargs.positional("commitId", {
        describe: "Commit ID to revert to",
        type: "string",
      });
    },
    (argv) => {
      revertRepo(argv.commitId);
    }
  )

  .demandCommand(1, "You need at least one command before moving on")
  .help().argv;


function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3002;

  app.set("trust proxy", 1);

  app.use(bodyParser.json());
  app.use(express.json());

  app.use(cores({ origin: "*" }));
  
  // connect to mongodb
  const mongoURI = process.env.MONGODB_URI;
  mongoose
    .connect(mongoURI)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
    });

  
  app.use("/", mainRouter);

  // now Using cores to use socke.io this will allow frontend to access backend
  app.use(cores( {origin: "*"} )); // allow all origins for testing purpose
  app.get("/", (req, res) => {
    res.send("Server is running");
  });

  let user = "TestUser";
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // allow all kind of requests for testing purpose
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  // socket.io connection handler 
  io.on("connection", (socket) => {
    socket.on("New User Joined", (UserId) => {
      user = UserId;
      console.log("======");
      console.log(`User connected: ${user}`);
      console.log("======");
      socket.join(user);

    });
  });

  const db = mongoose.connection;
  db.once("open", async() => {
    console.log("CURD Operations will be handled here");
    
  });

  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
