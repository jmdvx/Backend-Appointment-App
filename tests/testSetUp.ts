
import { initDb, closeDb } from '../src/database';

beforeAll(async () => {
  console.log('Running bofore all')
  console.log = () => {};
  await initDb(); // 

});

afterAll(async () => {
  console.log = console.log;
  await closeDb();
});