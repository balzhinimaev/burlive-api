// src/models/Payment.ts
import { Document, ObjectId, Schema, model } from 'mongoose';

export interface Payment extends Document {
    _id: ObjectId;
    id: string; // ID платежа от YooKassa
    status: string;
    amount: {
        value: string;
        currency: string;
    };
    income_amount?: {
        value: string;
        currency: string;
    };
    description: string;
    recipient: {
        account_id: string;
        gateway_id: string;
    };
    confirmation?: {
        type: string;
        confirmation_url: string;
    };
    payment_method?: {
        type: string;
        id: string;
        saved: boolean;
        status: string;
        title: string;
        account_number: string;
    };
    captured_at?: Date;
    refunded_amount?: {
        value: string;
        currency: string;
    };
    test: boolean;
    paid: boolean;
    refundable: boolean;
    metadata: {
        userId: string;
        paymentId: string;
    };
}

const PaymentSchema: Schema<Payment> = new Schema(
    {
        id: { type: String, required: true, unique: true }, // ID от YooKassa
        status: { type: String, required: true },
        amount: {
            value: { type: String, required: true },
            currency: { type: String, required: true },
        },
        income_amount: {
            value: { type: String },
            currency: { type: String },
        },
        description: { type: String, required: true },
        recipient: {
            account_id: { type: String, required: true },
            gateway_id: { type: String, required: true },
        },
        confirmation: {
            type: {
                type: String,
                enum: ['redirect', 'external'],
            },
            confirmation_url: { type: String },
        },
        payment_method: {
            type: {
                type: String,
                enum: ['yoo_money', 'bank_card', 'bank_transfer'],
            },
            id: { type: String },
            saved: { type: Boolean },
            status: { type: String },
            title: { type: String },
            account_number: { type: String },
        },
        captured_at: { type: Date },
        refunded_amount: {
            value: { type: String },
            currency: { type: String },
        },
        test: { type: Boolean, required: true },
        paid: { type: Boolean, required: true },
        refundable: { type: Boolean, required: true },
        metadata: {
            userId: { type: Schema.Types.ObjectId, ref: 'telegram_user', required: true },
            paymentId: { type: String, required: true },
        },
    },
    {
        timestamps: true, // Поля createdAt и updatedAt не нужны, так как есть created_at
    }
);

const PaymentModel = model<Payment>('Payment', PaymentSchema);

export default PaymentModel;
