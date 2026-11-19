import { getDatabase } from './connection';
import { seedDatabase } from './seed';

const db = getDatabase();
seedDatabase(db, true);
console.log('Database reset and re-seeded successfully.');
