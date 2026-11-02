import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@cronos/shared';
import { query } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET é obrigatório em produção'); })() : 'cronos_jwt_secret_dev_key_2026');

export interface TokenPayload {
  id: number;
  email: string;
  nome: string;
  role?: UserRole;
  pode_cadastrar_usuarios?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido.',
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Formato de cabeçalho de autenticação inválido. Utilize: Bearer <token>.',
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const result = await query(
      'SELECT id, email, nome, role, pode_cadastrar_usuarios, ativo FROM usuarios WHERE id = $1',
      [decoded.id]
    );
    const user = result.rows[0];
    if (!user || !user.ativo) {
      return res.status(401).json({ success: false, error: 'Conta indisponível. Faça login novamente.' });
    }
    req.user = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      pode_cadastrar_usuarios: user.role === 'admin' || Boolean(user.pode_cadastrar_usuarios),
    };
    return next();
  } catch (err: any) {
    if (!(err instanceof jwt.JsonWebTokenError)) {
      console.error('[Auth] Erro ao verificar sessão:', err);
      return res.status(503).json({ success: false, error: 'Não foi possível verificar sua sessão. Tente novamente.' });
    }
    return res.status(401).json({
      success: false,
      error: 'Sessão expirada ou token inválido. Faça login novamente.',
    });
  }
}

/**
 * Middleware que verifica se o usuário é administrador ou possui permissão explícita para cadastrar/gerenciar usuários
 */
export function canManageUsersMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado.',
    });
  }

  if (req.user.role === 'admin' || req.user.pode_cadastrar_usuarios === true) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Acesso negado. Apenas administradores ou usuários autorizados podem cadastrar e gerenciar usuários.',
  });
}

/**
 * Middleware restrito exclusivamente a administradores
 */
export function adminOnlyMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado.',
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Acesso restrito. Somente administradores do sistema têm permissão para esta ação.',
  });
}
