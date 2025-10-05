import express from 'express';
import { createUser, getUserProfile } from '../controllers/user.controllers';

const router = express.Router();

router.post('/', createUser);
router.get('/:authId', getUserProfile);

export default router;
