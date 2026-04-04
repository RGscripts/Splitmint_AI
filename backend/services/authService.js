const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');

const SALT_ROUNDS = 10;

function deriveDisplayName(email, name) {
  if (name && String(name).trim()) return String(name).trim();
  const handle = String(email || '').split('@')[0]?.trim();
  return handle || 'You';
}

async function register(name, email, password) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already in use'), { status: 409 });

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: deriveDisplayName(email, name), email, password: hashed },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return { user, token };
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

  const displayName = deriveDisplayName(user.email, user.name);

  const token = jwt.sign({ userId: user.id, email: user.email, name: displayName }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return {
    user: { id: user.id, name: displayName, email: user.email, createdAt: user.createdAt },
    token,
  };
}

module.exports = { register, login };
