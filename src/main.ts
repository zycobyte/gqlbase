import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import Express from 'express';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import dotenv from 'dotenv';

import { UserResolver } from './api/user/user.resolver';
import {TestResolver} from "./api/test/test.resolver";
import {Container} from "typedi";
import {TestService} from "./api/test/test.service";
import {UserService} from "./api/user/user.service";
import {formatError} from "./midware/GenericError";
import {createContext} from "./midware/context";

const { db } = require('./prisma/client')
const logger = require('pino')()

const main = async () => {
    dotenv.config();

    //load services
    Container.set({ id: "_", value: "ree" });
    Container.set({ id: "db", value: db });
    Container.set({ id: "testService", value: TestService });
    Container.set({ id: "userService", value: UserService });

    const schema = await buildSchema({
        resolvers: [
            UserResolver,
            TestResolver,
        ],
        container: Container,
        emitSchemaFile: true,
        validate: false,
    });

    const server = new ApolloServer({
        schema,
        plugins: [ ApolloServerPluginLandingPageGraphQLPlayground ],
        formatError: formatError,
        context: createContext,
    });

    const app = Express();
    const PORT = Number(process.env.PORT);

    await server.start();

    // @ts-ignore
    server.applyMiddleware({ app });

    app.listen({ port: PORT }, () =>
        logger.info(
            `Server ready and listening at http://localhost:${PORT}${server.graphqlPath}`
        )
    );
};

main().catch((error) => {
    logger.error(error, 'error');
});