import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const base = process.env.CRONOS_TEST_API || 'http://localhost:3001/api';
async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}
const adminLogin = await request('/auth/login', { method: 'POST', body: {
  email: process.env.CRONOS_TEST_EMAIL || 'admin@cronos.com',
  password: process.env.CRONOS_TEST_PASSWORD || 'admin123',
} });
assert.equal(adminLogin.status, 200, 'Não foi possível autenticar a conta de teste');
const adminToken = adminLogin.body.data.token;
const suffix = randomBytes(6).toString('hex');
const email = `teste-${suffix}@example.com`;
const username = `teste_${suffix}`;
let id;
try {
  const created = await request('/usuarios', { method: 'POST', token: adminToken, body: {
    nome: 'Conta temporária', email, username, password: 'Teste-temporario-123',
    role: 'operador', pode_cadastrar_usuarios: true,
  } });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  id = created.body.data.id;
  let session;
  for (const identifier of [email, username.toUpperCase()]) {
    const login = await request('/auth/login', { method: 'POST', body: { email: identifier, password: 'Teste-temporario-123' } });
    assert.equal(login.status, 200, `Falha no login com ${identifier}`);
    assert.equal(login.body.data.user.username, username);
    session = login.body.data.token;
  }
  const wrongPassword = await request('/auth/login', { method: 'POST', body: { email: username, password: 'incorreta' } });
  assert.equal(wrongPassword.status, 401);
  assert.equal((await request('/auth/me', { token: session })).body.data.username, username);
  const duplicate = await request('/usuarios', { method: 'POST', token: adminToken, body: {
    nome: 'Duplicado', email: `duplicado-${suffix}@example.com`, username: username.toUpperCase(), password: 'Teste-temporario-123',
  } });
  assert.equal(duplicate.status, 409, 'Nome de usuário duplicado deve ser recusado');
  const updatedUsername = `novo_${suffix}`;
  assert.equal((await request(`/usuarios/${id}`, { method: 'PUT', token: adminToken, body: { username: updatedUsername } })).status, 200);
  assert.equal((await request('/auth/me', { token: session })).body.data.username, updatedUsername);
  assert.equal((await request('/auth/login', { method: 'POST', body: { email: username, password: 'Teste-temporario-123' } })).status, 401);
  assert.equal((await request('/auth/login', { method: 'POST', body: { email: updatedUsername, password: 'Teste-temporario-123' } })).status, 200);
  assert.equal((await request('/usuarios', { token: session })).status, 200);
  assert.equal((await request(`/usuarios/${id}`, { method: 'PUT', token: adminToken, body: { pode_cadastrar_usuarios: false } })).status, 200);
  assert.equal((await request('/usuarios', { token: session })).status, 403);
  assert.equal((await request(`/usuarios/${id}`, { method: 'PUT', token: adminToken, body: { ativo: false } })).status, 200);
  assert.equal((await request('/auth/me', { token: session })).status, 401);
  console.log('OK: login, perfil, alteração e duplicidade de usuário, senha incorreta, revogação e desativação.');
} finally {
  if (id) {
    const removed = await request(`/usuarios/${id}`, { method: 'DELETE', token: adminToken });
    assert.equal(removed.status, 200, 'Não foi possível remover a conta temporária');
  }
}
