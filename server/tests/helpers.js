const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const migrate = require('../src/db/migrate');

async function setupDb() {
  await migrate();
}

async function resetDb() {
  await pool.query('TRUNCATE users, readings RESTART IDENTITY CASCADE');
}

async function registerUser(email = 'alan@test.com') {
  const res = await request(app)
    .post('/auth/register')
    .send({ name: 'Alan', email, password: 'password123' });
  return res.body.token;
}

const addReading = (token, body) =>
  request(app).post('/readings').set('Authorization', `Bearer ${token}`).send(body);

const getReport = (token, type, date) =>
  request(app).get(`/reports/${type}`).query({ date }).set('Authorization', `Bearer ${token}`);

module.exports = { app, pool, setupDb, resetDb, registerUser, addReading, getReport };