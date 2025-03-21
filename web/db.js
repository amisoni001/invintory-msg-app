import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',   // your MySQL password
  database: 'inventory app settings',
});
