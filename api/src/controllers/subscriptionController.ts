// src/controllers/subscriptionController.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import TelegramUserModel from '../models/TelegramUsers';
import PaymentModel, { Payment } from '../models/Payment';
import mongoose from 'mongoose';

const subscriptionController = {
    // Создание платежа для подписки
    subscribe: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.body;

            if (!userId) {
                res.status(400).json({ message: 'userId обязателен' });
                return;
            }

            const user = await TelegramUserModel.findById(userId);

            if (!user) {
                res.status(404).json({ message: 'Пользователь не найден' });
                return;
            }

            if (!user.phone) {
                res.status(404).json({ message: 'Пользователь не предоставил номер телефона' })
            }

            // Определите сумму и валюту подписки
            const amount = '399.00'; // Пример: 1000 RUB
            const currency = 'RUB';

            // Генерация уникального идентификатора платежа
            const paymentId = uuidv4();
            
            // Генерация уникального Idempotence-Key
            const idempotenceKey = uuidv4();

            // Данные для создания платежа
            const paymentData = {
                amount: {
                    value: amount,
                    currency: currency,
                },
                confirmation: {
                    type: 'redirect',
                    return_url: `${process.env.API_BASE_URL_DEV}/backendapi/telegram/payment-callback`,
                },
                receipt: {
                    customer: {
                        telegram_id: userId,
                        phone: user.phone
                    },
                    items: [
                        {
                            description: 'Подписка на месяц',
                            quantity: '1',
                            amount: {
                                value: amount,
                                currency: currency,
                            },
                            vat_code: '1', // Пример: НДС 20% (код зависит от вашей налоговой системы)
                            payment_mode: 'full_prepayment',
                            payment_subject: 'service',
                        },
                    ],
                    // tax_system_code: 1, // Пример: Общая система налогообложения в РФ
                },
                capture: true,
                description: `Подписка для пользователя ${user.username}`,
                metadata: {
                    userId: userId.toString(),
                    paymentId: paymentId,
                },
            };

            // Создание строки авторизации в формате Base64
            let auth
            if (process.env.MODE !== "DEV") {
                auth = Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64');
            } else {
                auth = Buffer.from(`${process.env.YOOKASSA_SHOP_ID_DEV}:${process.env.YOOKASSA_SECRET_KEY_DEV}`).toString('base64');
            }

            // Отправка запроса на создание платежа с использованием fetch
            const response = await fetch('https://api.yookassa.ru/v3/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`,
                    'Idempotence-Key': idempotenceKey, // Добавляем заголовок Idempotence-Key
                },
                body: JSON.stringify(paymentData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Ошибка от YooKassa: ${JSON.stringify(errorData)}`);
            }

            const payment: any = await response.json();

            // Проверка наличия confirmation_url
            if (!payment.confirmation || !payment.confirmation.confirmation_url) {
                throw new Error('Не удалось получить confirmation_url от YooKassa');
            }
            console.log(payment)

            // Сохранение платежа в базе данных
            const newPayment = new PaymentModel({
                id: payment.id,
                status: payment.status,
                amount: payment.amount,
                description: payment.description,
                recipient: payment.recipient,
                confirmation: payment.confirmation,
                test: payment.test,
                paid: payment.paid,
                refundable: payment.refundable,
                metadata: payment.metadata,
            });
            await newPayment.save();

            // Ответ с URL для подтверждения платежа
            res.status(200).json({
                confirmation_url: payment.confirmation.confirmation_url,
                payment_id: payment.id,
            });

        } catch (error) {
            logger.error(`Ошибка в subscribe: ${error}`);
            res.status(500).json({ message: 'Внутренняя ошибка сервера' });
            next(error);
        }
    },

    // Обработка вебхука от YooKassa
    paymentCallback: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logger.info(`Получен платежное уведомление:`)

            const event = req.body.event;
            const object = req.body.object;
            
            
            
            if (!event || !object) {
                res.status(400).json({ message: 'Некорректные данные вебхука' });
                return;
            }

            if (event === 'payment.succeeded') {
                const payment = object; // Объект платежа

                const userId = payment.metadata?.userId;
                const paymentId = payment.metadata?.paymentId;

                if (!userId || !paymentId) {
                    logger.error('Отсутствуют необходимые метаданные в платеже');
                    res.status(400).send('Некорректные метаданные');
                    return;
                }

                if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(paymentId)) {
                    res.status(400).json({ message: 'Неверный формат данных из метаданных' });
                    return
                }

                const paymentDocument: Payment | null = await PaymentModel.findById(paymentId)
                
                if (!paymentDocument) {
                    logger.error(`Документ платежа не найден для paymentId: ${paymentId}`)
                    res.status(404).json({ message: `Документ платежа не найден для paymentId: ${paymentId}` })
                    return
                }
                
                paymentDocument.status = "succeeded"
                await paymentDocument.save()

                // Поиск пользователя
                const user = await TelegramUserModel.findById(userId);

                if (!user) {
                    logger.error(`Пользователь не найден для paymentId: ${paymentId}`);
                    res.status(404).send('Пользователь не найден');
                    return;
                }

                // Обновление статуса подписки
                const now = new Date();
                const oneMonthLater = new Date(now);
                oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

                user.subscription = {
                    type: 'monthly',
                    startDate: now,
                    endDate: oneMonthLater,
                    isActive: true,
                    paymentId
                };

                await user.save();

                logger.info(`Подписка обновлена для пользователя ${userId}`);
                res.status(200).send('OK');
                next() 
            }

            if (event === 'payment.canceled') {
                const payment = object; // Объект платежа

                const userId = payment.metadata?.userId;
                const paymentId = payment.metadata?.paymentId;

                if (!userId || !paymentId) {
                    logger.error('Отсутствуют необходимые метаданные в платеже');
                    res.status(400).send('Некорректные метаданные');
                    return;
                }

                if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(paymentId)) {
                    res.status(400).json({ message: 'Неверный формат данных из метаданных' });
                    return
                }

                const paymentDocument: Payment | null = await PaymentModel.findById(paymentId)
                
                if (!paymentDocument) {
                    logger.error(`Документ платежа не найден для paymentId: ${paymentId}`)
                    res.status(404).json({ message: `Документ платежа не найден для paymentId: ${paymentId}` })
                    return
                }
                
                await PaymentModel.findOneAndDelete(paymentId)

                logger.info(`Платеж отменен для пользователя ${userId}`);
                res.status(200).send('OK');
                next() 
            }

        } catch (error) {
            logger.error(`Ошибка в paymentCallback: ${error}`);
            res.status(500).json({ message: 'Внутренняя ошибка сервера' });
            next(error);
        }
    },

    // Проверка статуса подписки
    checkSubscription: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;

            if (!userId) {
                res.status(400).json({ message: 'userId обязателен' });
                return;
            }

            const user = await TelegramUserModel.findOne({ id: Number(userId) });

            if (!user) {
                res.status(404).json({ message: 'Пользователь не найден' });
                return;
            }

            const now = new Date();
            const isActive = user.subscription.isActive && user.subscription.endDate && user.subscription.endDate > now;

            res.status(200).json({
                isActive,
                subscription: user.subscription,
            });
        } catch (error) {
            logger.error(`Ошибка в checkSubscription: ${error}`);
            res.status(500).json({ message: 'Внутренняя ошибка сервера' });
            next(error);
        }
    },
};

export default subscriptionController;
