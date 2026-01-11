import express from 'express';
import { register, login, me, logout, changePassword } from '../controllers/authController.js';
import { autenticar } from '../middleware/auth.js';
import { registerValidator } from '../validators/auth/registerValidator.js';
import { loginValidator } from '../validators/auth/loginValidator.js';
import { changePasswordValidator } from '../validators/auth/changePasswordValidator.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Cadastrar novo usuário
 * @access Public
 */
router.post('/register', registerValidator, register);

/**
 * @route POST /api/auth/login
 * @desc Login de usuário
 * @access Public
 */
router.post('/login', loginLimiter, loginValidator, login);

/**
 * @route GET /api/auth/me
 * @desc Obter dados do usuário autenticado
 * @access Private
 */
router.get('/me', autenticar, me);

/**
 * @route POST /api/auth/logout
 * @desc Logout de usuário
 * @access Private
 */
router.post('/logout', autenticar, logout);

/**
 * @route POST /api/auth/change-password
 * @desc Alterar senha do usuário autenticado
 * @access Private
 */
router.post('/change-password', autenticar, changePasswordValidator, changePassword);

export default router;

