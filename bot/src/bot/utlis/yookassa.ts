import rlhubContext from "../models/rlhubContext";

const shopId = process.env.shopId;
const secretKey = process.env.yookassa_secret_key;

const createPayment = async (ctx: rlhubContext,amount: string, description: string, returnUrl: string) => {
  const idempotenceKey = new Date().getTime().toString();
  const response = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64"),
      "Idempotence-Key": idempotenceKey,
    },
    body: JSON.stringify({
      amount: {
        value: amount,
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        return_url: returnUrl,
      },
      capture: true,
      description: description,
      receipt: {
        customer: {
          telegram_user_id: ctx.from.id,
          firstName: ctx.from.first_name,
          phone: ctx.from.id
        },
        items: [
          {
            description: description,
            quantity: "1.00",
            amount: {
              value: amount,
              currency: "RUB",
            },
            vat_code: "1",
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    console.log(await response.json())
    throw new Error(`Error: ${response.statusText}`);
  }

  return response.json();
};

export default createPayment
