import { getDb } from "./mongodb";
import { COLLECTIONS, type DepartmentDoc } from "./types";

export interface Department {
  slug: string;
  name: string;
}

export const DEFAULT_DEPARTMENTS: Department[] = [
  { slug: "sales", name: "Sales" },
  { slug: "support", name: "Customer Support" },
];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listDepartments(): Promise<Department[]> {
  const db = await getDb();
  const docs = await db
    .collection<DepartmentDoc>(COLLECTIONS.departments)
    .find({}, { projection: { slug: 1, name: 1 }, sort: { createdAt: 1 } })
    .toArray();
  return docs.map((d) => ({ slug: d.slug, name: d.name }));
}

export async function createDepartment(name: string): Promise<Department> {
  const slug = slugify(name);
  if (!slug) throw new Error("Department name must contain letters or digits");
  const db = await getDb();
  await db.collection<DepartmentDoc>(COLLECTIONS.departments).insertOne({
    slug,
    name: name.trim(),
    createdAt: new Date(),
  } as DepartmentDoc);
  return { slug, name: name.trim() };
}

export async function renameDepartment(slug: string, name: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<DepartmentDoc>(COLLECTIONS.departments)
    .updateOne({ slug }, { $set: { name: name.trim() } });
}

export async function deleteDepartment(slug: string): Promise<{ deleted: boolean; reason?: string }> {
  const db = await getDb();
  const inUse = await db.collection(COLLECTIONS.qa).countDocuments({ department: slug }, { limit: 1 });
  if (inUse > 0) return { deleted: false, reason: "Department still has questions" };
  const res = await db.collection<DepartmentDoc>(COLLECTIONS.departments).deleteOne({ slug });
  return { deleted: res.deletedCount === 1 };
}

/** Inserts the default departments if the collection is empty. */
export async function ensureDefaultDepartments(): Promise<void> {
  const db = await getDb();
  const col = db.collection<DepartmentDoc>(COLLECTIONS.departments);
  if ((await col.countDocuments({}, { limit: 1 })) > 0) return;
  await col.insertMany(
    DEFAULT_DEPARTMENTS.map((d) => ({ ...d, createdAt: new Date() }) as DepartmentDoc),
  );
}
