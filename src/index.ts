import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql"
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { __prod__, COOKIE_NAME } from "./constants";
import cors from "cors";
import { createConnection } from "typeorm";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import path from "path";
import { Updoot } from "./entities/Updoot";

const main = async (): Promise<void> => {
  const conn = await createConnection({
    type: 'postgres',
    database: process.env.DB_NAME,
    username: process.env.USERNAME,
    logging: true,
    synchronize: false,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [User, Post, Updoot]
  }); 
  
  const app = express();
  
  let RedisStore = connectRedis(session);
  let redis = new Redis();

  app.use(
    cors({ 
      origin: "http://localhost:3000",
      credentials: true 
    })
  )
  app.use(
    session({
      name: COOKIE_NAME,
      saveUninitialized: false,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: "lax",
        secure: __prod__
      },
      secret: 'liho834oh8o2',
      resave: false,
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }) => ({ req, res, redis })
  });

  apolloServer.applyMiddleware({ 
    app, 
    cors: false
  });
  app.listen(4000, () => {
    console.log('server started on localhost 4000');
  });
}

main();


