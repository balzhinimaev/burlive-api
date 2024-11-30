// src/utils/verifyWebhookSignature.ts
import crypto from 'crypto';

/**
 * Проверяет подпись вебхука от YooKassa.
 * @param body Сырые данные тела запроса.
 * @param signature Подпись из заголовка 'X-Api-Signature-256'.
 * @param secretKey Секретный ключ YooKassa.
 * @returns true, если подпись валидна, иначе false.
 */
const verifyWebhookSignature = (body: Buffer, signature: string, secretKey: string): boolean => {
    const hash = crypto.createHmac('sha256', secretKey).update(body).digest('hex');
    return hash === signature;
};

export default verifyWebhookSignature;
