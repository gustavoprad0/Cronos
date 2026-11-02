import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { authMiddleware, canManageUsersMiddleware, AuthenticatedRequest } from '../middlewares/auth';
import type { ApiResponse, AuthResponseData, Usuario, UserRole } from '@cronos/shared';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET é obrigatório em produção'); })() : 'cronos_jwt_secret_dev_key_2026');
const JWT_EXPIRES_IN: jwt.SignOptions['expiresIn'] = '7d';


function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/register - Cadastro de novo usuário (RESTRITO a administradores ou autorizados)
router.post('/register', authMiddleware, canManageUsersMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, nome, role = 'operador', pode_cadastrar_usuarios = false } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'O e-mail é obrigatório.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Formato de e-mail inválido.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'A senha deve conter no mínimo 6 caracteres.',
      });
    }

    // Verifica se já existe um usuário com este e-mail
    const existingUser = await query('SELECT id FROM usuarios WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Este e-mail já está cadastrado no sistema.',
      });
    }

    // Validação de role
    const assignedRole: UserRole = role === 'admin' ? 'admin' : 'operador';
    const canManage = assignedRole === 'admin' ? true : Boolean(pode_cadastrar_usuarios);

    // Nome padrão baseado no e-mail se não fornecido
    const displayName =
      nome && typeof nome === 'string' && nome.trim().length > 0
        ? nome.trim()
        : normalizedEmail.split('@')[0];

    // Criptografa a senha com bcrypt
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(password, salt);

    // Insere o novo usuário no PostgreSQL
    const insertResult = await query<Usuario>(
      `INSERT INTO usuarios (nome, email, senha_hash, role, pode_cadastrar_usuarios, ativo)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, nome, email, role, pode_cadastrar_usuarios, ativo, data_criacao, data_atualizacao`,
      [displayName, normalizedEmail, senhaHash, assignedRole, canManage]
    );

    const newUser = insertResult.rows[0];

    const response: ApiResponse<Usuario> = {
      success: true,
      data: newUser,
    };

    return res.status(201).json(response);
  } catch (error: any) {
    console.error('[Auth] Erro no registro de usuário:', error);
    return res.status(500).json({
      success: false,
      error: `Erro interno ao cadastrar usuário: ${error.message}`,
    });
  }
});

// POST /api/auth/login - Login de usuário
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Informe seu e-mail ou usuário e sua senha.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Busca usuário no banco com perfil e permissões
    const userResult = await query(
      `SELECT id, nome, email, username, senha_hash, role, pode_cadastrar_usuarios, ativo, ultimo_login
       FROM usuarios
       WHERE lower(email) = $1 OR lower(username) = $1`,
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'E-mail, usuário ou senha incorretos.',
      });
    }

    const user = userResult.rows[0];

    if (!user.ativo) {
      return res.status(403).json({
        success: false,
        error: 'Esta conta de usuário está desativada. Entre em contato com um administrador.',
      });
    }

    // Compara senha usando bcrypt
    const passwordMatch = await bcrypt.compare(String(password), user.senha_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'E-mail, usuário ou senha incorretos.',
      });
    }

    // Atualiza data do último login
    await query('UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const userRole: UserRole = user.role === 'admin' ? 'admin' : 'operador';
    const canManageUsers = userRole === 'admin' || Boolean(user.pode_cadastrar_usuarios);

    // Gera token JWT incluindo role e permissão
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: userRole,
        pode_cadastrar_usuarios: canManageUsers,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const responseData: AuthResponseData = {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        username: user.username,
        role: userRole,
        pode_cadastrar_usuarios: canManageUsers,
        ativo: user.ativo,
      },
      token,
    };

    return res.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error('[Auth] Erro no login:', error);
    return res.status(500).json({
      success: false,
      error: `Erro interno ao autenticar: ${error.message}`,
    });
  }
});

// GET /api/auth/me - Dados do usuário atualmente logado
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const userResult = await query<Usuario>(
      `SELECT id, nome, email, username, role, pode_cadastrar_usuarios, ativo, ultimo_login, data_criacao, data_atualizacao
       FROM usuarios
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado.',
      });
    }

    const user = userResult.rows[0];

    if (!user.ativo) {
      return res.status(403).json({
        success: false,
        error: 'Esta conta está inativa.',
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('[Auth] Erro ao carregar perfil:', error);
    return res.status(500).json({
      success: false,
      error: `Erro ao obter dados da sessão: ${error.message}`,
    });
  }
});

// POST /api/auth/reset-password - Redefinição de senha
router.post('/reset-password', (_req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    error: 'Recuperação automática indisponível. Solicite a redefinição a um administrador.',
  });
});

export default router;
