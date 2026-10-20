/**
 * Starts a throwaway in-memory MongoDB for local development without Atlas.
 * Data is lost when the process stops. Vector search falls back to in-process
 * cosine similarity against this database.
 *
 *   npm run dev-db
 *   # in another terminal:
 *   MONGODB_URI=mongodb://127.0.0.1:27019 npm run seed
 *   MONGODB_URI=mongodb://127.0.0.1:27019 npm run dev
 */
import { MongoMemoryServer } from "mongodb-memory-server";

const PORT = Number(process.env.DEV_DB_PORT ?? "27019");

async function main() {
  const server = await MongoMemoryServer.create({ instance: { port: PORT, ip: "127.0.0.1" } });
  console.log(`In-memory MongoDB running at ${server.getUri()}`);
  console.log("Press Ctrl+C to stop. All data is discarded on exit.");

  const stop = async () => {
    await server.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
