import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function requireAuth(request, response, next) {
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        response.status(401).json({ error: 'Missing authentication token.' });
        return;
    }

    const token = header.slice('Bearer '.length);
    try {
        const payload = jwt.verify(token, config.jwtSecret);
        request.user = payload;
        next();
    } catch {
        response.status(401).json({ error: 'Invalid authentication token.' });
    }
}
