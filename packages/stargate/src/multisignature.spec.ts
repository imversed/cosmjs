import {
  createMultisigThresholdPubkey,
  encodeSecp256k1Pubkey,
  makeCosmoshubPath,
  pubkeyToAddress,
  Secp256k1HdWallet,
} from "@imversed/amino";
import { HdPath, Slip10RawIndex } from "@imversed/crypto";
import { coins, DirectSecp256k1HdWallet } from "@imversed/proto-signing";
import { assert } from "@imversed/utils";
import * as console from "console";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";

import { MsgSendEncodeObject } from "./modules";
import { makeCompactBitArray, makeMultisignedTx } from "./multisignature";
import { SignerData, SigningStargateClient } from "./signingstargateclient";
import { assertIsDeliverTxSuccess, StargateClient } from "./stargateclient";
import { faucet, pendingWithoutSimapp, simapp } from "./testutils.spec";

describe("multisignature", () => {
  // describe("makeCompactBitArray", () => {
  //   it("works for 0 bits of different lengths", () => {
  //     expect(makeCompactBitArray([])).toEqual({ elems: new Uint8Array([]), extraBitsStored: 0 });
  //     expect(makeCompactBitArray([false])).toEqual({
  //       elems: new Uint8Array([0b00000000]),
  //       extraBitsStored: 1,
  //     });
  //     expect(makeCompactBitArray([false, false])).toEqual({
  //       elems: new Uint8Array([0b00000000]),
  //       extraBitsStored: 2,
  //     });
  //     expect(makeCompactBitArray([false, false, false])).toEqual({
  //       elems: new Uint8Array([0b00000000]),
  //       extraBitsStored: 3,
  //     });
  //     expect(makeCompactBitArray([false, false, false, false])).toEqual({
  //       elems: new Uint8Array([0b00000000]),
  //       extraBitsStored: 4,
  //     });
  //     expect(makeCompactBitArray([false, false, false, false, false])).toEqual({
  //       elems: new Uint8Array([0b00000000]),
  //       extraBitsStored: 5,
  //     });
  //     expect(makeCompactBitArray([false, false, false, false, false, false])).toEqual({
  //       elems: new Uint8Array([0b00000000]),
  //       extraBitsStored: 6,
  //     });
  //     expect(makeCompactBitArray([false, false, false, false, false, false, false])).toEqual({
  //       elems: new Uint8Array([0b00000000]),
  //       extraBitsStored: 7,
  //     });
  //     expect(makeCompactBitArray([false, false, false, false, false, false, false, false])).toEqual({
  //       elems: new Uint8Array([0b00000000]),
  //       extraBitsStored: 0,
  //     });
  //     expect(makeCompactBitArray([false, false, false, false, false, false, false, false, false])).toEqual({
  //       elems: new Uint8Array([0b00000000, 0b00000000]),
  //       extraBitsStored: 1,
  //     });
  //     expect(
  //       makeCompactBitArray([false, false, false, false, false, false, false, false, false, false]),
  //     ).toEqual({ elems: new Uint8Array([0b00000000, 0b00000000]), extraBitsStored: 2 });
  //   });
  //
  //   it("works for 1 bits of different lengths", () => {
  //     expect(makeCompactBitArray([])).toEqual({ elems: new Uint8Array([]), extraBitsStored: 0 });
  //     expect(makeCompactBitArray([true])).toEqual({
  //       elems: new Uint8Array([0b10000000]),
  //       extraBitsStored: 1,
  //     });
  //     expect(makeCompactBitArray([true, true])).toEqual({
  //       elems: new Uint8Array([0b11000000]),
  //       extraBitsStored: 2,
  //     });
  //     expect(makeCompactBitArray([true, true, true])).toEqual({
  //       elems: new Uint8Array([0b11100000]),
  //       extraBitsStored: 3,
  //     });
  //     expect(makeCompactBitArray([true, true, true, true])).toEqual({
  //       elems: new Uint8Array([0b11110000]),
  //       extraBitsStored: 4,
  //     });
  //     expect(makeCompactBitArray([true, true, true, true, true])).toEqual({
  //       elems: new Uint8Array([0b11111000]),
  //       extraBitsStored: 5,
  //     });
  //     expect(makeCompactBitArray([true, true, true, true, true, true])).toEqual({
  //       elems: new Uint8Array([0b11111100]),
  //       extraBitsStored: 6,
  //     });
  //     expect(makeCompactBitArray([true, true, true, true, true, true, true])).toEqual({
  //       elems: new Uint8Array([0b11111110]),
  //       extraBitsStored: 7,
  //     });
  //     expect(makeCompactBitArray([true, true, true, true, true, true, true, true])).toEqual({
  //       elems: new Uint8Array([0b11111111]),
  //       extraBitsStored: 0,
  //     });
  //     expect(makeCompactBitArray([true, true, true, true, true, true, true, true, true])).toEqual({
  //       elems: new Uint8Array([0b11111111, 0b10000000]),
  //       extraBitsStored: 1,
  //     });
  //     expect(makeCompactBitArray([true, true, true, true, true, true, true, true, true, true])).toEqual({
  //       elems: new Uint8Array([0b11111111, 0b11000000]),
  //       extraBitsStored: 2,
  //     });
  //   });
  //
  //   it("works for 1 bit in different places", () => {
  //     expect(
  //       makeCompactBitArray([true, false, false, false, false, false, false, false, false, false]),
  //     ).toEqual({
  //       elems: new Uint8Array([0b10000000, 0b00000000]),
  //       extraBitsStored: 2,
  //     });
  //     expect(
  //       makeCompactBitArray([false, true, false, false, false, false, false, false, false, false]),
  //     ).toEqual({
  //       elems: new Uint8Array([0b01000000, 0b00000000]),
  //       extraBitsStored: 2,
  //     });
  //     expect(
  //       makeCompactBitArray([false, false, true, false, false, false, false, false, false, false]),
  //     ).toEqual({
  //       elems: new Uint8Array([0b00100000, 0b00000000]),
  //       extraBitsStored: 2,
  //     });
  //     expect(
  //       makeCompactBitArray([false, false, false, true, false, false, false, false, false, false]),
  //     ).toEqual({
  //       elems: new Uint8Array([0b00010000, 0b00000000]),
  //       extraBitsStored: 2,
  //     });
  //     expect(
  //       makeCompactBitArray([false, false, false, false, true, false, false, false, false, false]),
  //     ).toEqual({
  //       elems: new Uint8Array([0b00001000, 0b00000000]),
  //       extraBitsStored: 2,
  //     });
  //     expect(
  //       makeCompactBitArray([false, false, false, false, false, true, false, false, false, false]),
  //     ).toEqual({
  //       elems: new Uint8Array([0b00000100, 0b00000000]),
  //       extraBitsStored: 2,
  //     });
  //     expect(
  //       makeCompactBitArray([false, false, false, false, false, false, true, false, false, false]),
  //     ).toEqual({
  //       elems: new Uint8Array([0b00000010, 0b00000000]),
  //       extraBitsStored: 2,
  //     });
  //     expect(
  //       makeCompactBitArray([false, false, false, false, false, false, false, true, false, false]),
  //     ).toEqual({
  //       elems: new Uint8Array([0b00000001, 0b00000000]),
  //       extraBitsStored: 2,
  //     });
  //     expect(
  //       makeCompactBitArray([false, false, false, false, false, false, false, false, true, false]),
  //     ).toEqual({
  //       elems: new Uint8Array([0b00000000, 0b10000000]),
  //       extraBitsStored: 2,
  //     });
  //     expect(
  //       makeCompactBitArray([false, false, false, false, false, false, false, false, false, true]),
  //     ).toEqual({
  //       elems: new Uint8Array([0b00000000, 0b01000000]),
  //       extraBitsStored: 2,
  //     });
  //   });
  // });

  describe("makeMultisignedTx", () => {
    it("works", async () => {
      // const multisigAccountAddress = "imv1lcy3fhm3kx52n6fr49sjtr56f9u4azpvwy5rre";
      const account = "imv1qyfqye65gful3m3ch072kjv48d7hfkj94z6qlr";
      const tendermintUrl = "tcp://localhost:26657";

      // On the composer's machine signing instructions are created.
      // The composer does not need to be one of the signers.
      const signingInstruction = await (async () => {
        const client = await StargateClient.connect(tendermintUrl);
        const accountOnChain = await client.getAccount(account);
        assert(accountOnChain, "Account does not exist on chain");
        const msg: any = {
          typeUrl: "/imversed.xverse.MsgAddAssetToVerse",
          value: {
            sender: "imv1qyfqye65gful3m3ch072kjv48d7hfkj94z6qlr",
            verseName: "52fdfc07-2182-454f-963f-5f0f9a621d72",
            assetType: "contract",
            assetId: "0x1F9DC2e245081DeA326ab7E1793Ad909251044bd",
            assetCreator: "0xadce8D6f528f796BbD450737fa89674A5615360c",
            verseCreator: "imv1qyfqye65gful3m3ch072kjv48d7hfkj94z6qlr",
          },
        };
        const gasLimit = 200000;
        const fee = {
          amount: coins(150000000, "aimv"),
          gas: gasLimit.toString(),
        };

        return {
          accountNumber: accountOnChain.accountNumber,
          sequence: accountOnChain.sequence,
          chainId: await client.getChainId(),
          msgs: [msg],
          fee: fee,
          memo: "Use your tokens wisely",
        };
      })();

      const [
        [pubkey0, signature0, bodyBytes],
        // [pubkey1, signature1],
        // [pubkey2, signature2],
        // [pubkey3, signature3],
        // [pubkey4, signature4],
      ] = await Promise.all(
        [0, 1].map(async (i) => {
          // [0, 1, 2, 3, 4].map(async (i) => {
          const hdPath: HdPath = [
            Slip10RawIndex.hardened(44),
            Slip10RawIndex.hardened(60),
            Slip10RawIndex.hardened(0),
            Slip10RawIndex.normal(0),
            Slip10RawIndex.normal(0),
          ];
          const mnemonic =
            "imitate great income duck device whale pyramid pulse detail profit okay kitten uncle frozen maximum there arrive age leopard normal proof syrup honey two";
          // Signing environment
          const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
            hdPaths: [hdPath],
            prefix: "imv",
          });

          // encode returns wrong type
          // const pubkey = encodeSecp256k1Pubkey((await wallet.getAccounts())[0].pubkey);
          const pubkey = {
            type: "/ethermint.crypto.v1.ethsecp256k1.PubKey",
            value: "At/Ddi0uBK2aLeGEzFn1jZoiIwb8dwWPBQUec/QEX3NJ",
          };
          // console.log("pubkey", pubkey)
          const address = (await wallet.getAccounts())[0].address;
          const signingClient = await SigningStargateClient.connectWithSigner(tendermintUrl, wallet);
          const signerData: SignerData = {
            accountNumber: signingInstruction.accountNumber,
            sequence: signingInstruction.sequence,
            chainId: signingInstruction.chainId,
          };

          const { bodyBytes: bb, signatures } = await signingClient.sign(
            address,
            signingInstruction.msgs,
            signingInstruction.fee,
            signingInstruction.memo,
            signerData,
          );

          return [pubkey, signatures[0], bb] as const;
        }),
      );

      // From here on, no private keys are required anymore. Any anonymous entity
      // can collect, assemble and broadcast.
      {
        // const multisigPubkey = createMultisigThresholdPubkey(
        //   // [pubkey0, pubkey1, pubkey2, pubkey3, pubkey4],
        //   [pubkey0, pubkey1],
        //   1,
        //   true,
        // );
        // console.log("pubkey result", pubkey0.value);
        // expect(pubkeyToAddress(pubkey0, "imv")).toEqual(account);
        //
        // const address0 = pubkeyToAddress(pubkey0, "imv");
        // const address1 = pubkeyToAddress(pubkey1, "imv");
        // const address2 = pubkeyToAddress(pubkey2, "imv");
        // const address3 = pubkeyToAddress(pubkey3, "imv");
        // const address4 = pubkeyToAddress(pubkey4, "imv");
        // const broadcaster = await StargateClient.connect(tendermintUrl);
        // const signedTx = makeMultisignedTx(
        //   multisigPubkey,
        //   signingInstruction.sequence,
        //   signingInstruction.fee,
        //   bodyBytes,
        //   new Map<string, Uint8Array>([
        //     [address0, signature0],
        //     [address1, signature1],
        //     // [address2, signature2],
        //     // [address3, signature3],
        //     // [address4, signature4],
        //   ]),
        // );
        // ensure signature is valid
        // const result = await broadcaster.broadcastTx(Uint8Array.from(TxRaw.encode(signedTx).finish()));
        // assertIsDeliverTxSuccess(result);
      }
    });
  });
});
