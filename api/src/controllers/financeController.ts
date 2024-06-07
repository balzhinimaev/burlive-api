// financeControler.ts
import { Request, Response } from "express";
import logger from "../utils/logger";
import { DialogModel } from "../models/Dialog";
import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import User from "../models/User";
import { ObjectId } from "mongodb";
import { isValidObjectId } from "mongoose";
import isValidObjectIdString from "../utils/isValidObjectIdString";

const financeControler = {
  create: async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(404).json({ message: "Нет параметра userId" });
      }

      if (!isValidObjectId(userId)) {
        // return res.status(400).json({ message: 'Неверные входные данные' });

        if (!isValidObjectIdString(userId)) {
          return res.status(400).json({
            message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId`,
          });
        }
      }

      const user = User.findOne({ _id: userId });

      if (!user) {
        return res.status(404).json({ message: "Пользователь не существует!" });
      }

      // initialize ton rpc client on testnet
      const endpoint = await getHttpEndpoint({ network: "testnet" });
      const client = new TonClient({ endpoint });

      // const client = new TonClient({
      //   endpoint: 'https://toncenter.com/api/v2/jsonRPC',
      // });

      // Generate new key
      let mnemonics = await mnemonicNew();
      let keyPair = await mnemonicToPrivateKey(mnemonics);

      // Create wallet contract
      let workchain = 0; // Usually you need a workchain 0
      let wallet = WalletContractV4.create({
        workchain,
        publicKey: keyPair.publicKey,
      });
      let contract = wallet.address;
      await User.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          $set: {
            ton: {
              walletAddress: wallet.address.toString(),
              walletBalance: 0,
            },
          },
        }
      ).then(() => {
        logger.info("Кошелек создан, для пользователя " + userId);
      });
      return res
        .status(200)
        .json({ address: wallet.address.toString(), mnemonics });
    } catch {
      logger.error("error");
    }
  },
  save: async (req: Request, res: Response) => {
    try {
      console.log(123);
      const dialogs = await DialogModel.find();
      console.log(dialogs);

      return res.status(200);
    } catch (error) {
      logger.error("error");
    }
  },
  userdata: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        if (!isValidObjectIdString(id)) {
          return res.status(400).json({
            message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId`,
          });
        }
      }

      const user = await User.findById(id);
      console.log(user)
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден!' })
      }
      
      const walletData = user.getWalletData()

      return res.status(200).json({ walletData });

    } catch (error) {
      logger.error("Ошибка при получении данных кошелька пользователя");
    }
  },
};

export default financeControler;
