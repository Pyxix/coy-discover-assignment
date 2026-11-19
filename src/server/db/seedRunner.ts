import { getDatabase } from './connection';
import { seedDatabase } from './seed';

const db = getDatabase();
seedDatabase(db, false);
console.log('Database seeded successfully.');
