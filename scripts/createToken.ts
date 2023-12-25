import { Client, PrivateKey, TokenCreateTransaction } from "@hashgraph/sdk";
import { approveAllowance } from "../lib/utils";

const client = Client.forTestnet();

const accountId = process.env.OWNER_ID as string;
let privateKey = PrivateKey.fromStringECDSA(process.env.OWNER_KEY as string);
client.setOperator(accountId, privateKey);

async function createFt() {
  await approveAllowance(
    "0xF85560fE277f569f559385c986d3D26Bd1D3eB99",
    "0x000000000000000000000000000000000068077b",
    10000
  );

  // const transaction = new TokenCreateTransaction()
  //   .setTokenName("Test Lock")
  //   .setTokenSymbol("TL")
  //   .setTreasuryAccountId(accountId)
  //   .setInitialSupply(10000000)
  //   .setDecimals(2)
  //   .setSupplyKey(privateKey.publicKey);

  // const submit = await transaction.execute(client);

  // const receipt = await submit.getReceipt(client);

  // console.log("Token ID (fungible):" + receipt.tokenId);
}

createFt()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
