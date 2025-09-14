import Fastify from "fastify";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fastifyStatic from "@fastify/static";

const fastify = Fastify({ logger: true });

const distPath = join(dirname(fileURLToPath(import.meta.url)), "dist");

fastify.register(fastifyStatic, {
	root: distPath,
	prefix: "/",
});

fastify.setNotFoundHandler((req, reply) => {
	reply.sendFile("index.html");
});

const start = async () => {
	try {
		await fastify.listen({ port: 3000, host: "0.0.0.0" });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();