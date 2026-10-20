/**
 * Creates indexes, the first admin user (from ADMIN_EMAIL / ADMIN_PASSWORD)
 * and the default departments. Safe to run more than once.
 *
 *   npm run seed
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  // Imported after dotenv so MONGODB_URI is set when the module loads.
  const { getDb, closeDb } = await import("../src/lib/mongodb");
  const { COLLECTIONS } = await import("../src/lib/types");
  const { upsertAdmin } = await import("../src/lib/users");
  const { ensureDefaultDepartments, listDepartments } = await import("../src/lib/departments");

  const db = await getDb();

  await db.collection(COLLECTIONS.users).createIndex({ email: 1 }, { unique: true });
  await db.collection(COLLECTIONS.departments).createIndex({ slug: 1 }, { unique: true });
  await db.collection(COLLECTIONS.qa).createIndex({ department: 1, updatedAt: -1 });
  await db.collection(COLLECTIONS.questions).createIndex({ qaId: 1 });
  await db.collection(COLLECTIONS.questions).createIndex({ department: 1 });
  console.log("Indexes ensured.");

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    await upsertAdmin(email, password);
    console.log(`Admin user ready: ${email}`);
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin user.");
  }

  await ensureDefaultDepartments();
  const departments = await listDepartments();
  console.log(`Departments: ${departments.map((d) => d.slug).join(", ")}`);

  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
