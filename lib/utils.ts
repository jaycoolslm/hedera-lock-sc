import {
  AccountAllowanceApproveTransaction,
  AccountId,
  Client,
  ContractCreateFlow,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  PrivateKey,
  TokenCreateTransaction,
  TokenId,
} from "@hashgraph/sdk";

const accountId = process.env.OWNER_ID as string;
let privateKey = PrivateKey.fromStringECDSA(process.env.OWNER_KEY as string);
const client = Client.forTestnet().setOperator(accountId, privateKey);

export const deployContract = async (bytecode: string) => {
  const tx = new ContractCreateFlow().setGas(1_000_000).setBytecode(bytecode);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);
  if (!receipt.contractId) {
    throw new Error("Contract creation failed");
  }
  return receipt.contractId.toString();
};

export const executeContractCall = async (
  contractId: string,
  functionName: string,
  functionParams: ContractFunctionParameters,
  payableAmount?: number
) => {
  const tx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(1_000_000)
    .setFunction(functionName, functionParams)
    .setPayableAmount(payableAmount);
  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);
  return receipt.status._code;
};

export const createToken = async () => {
  const transaction = new TokenCreateTransaction()
    .setTokenName("Test Lock")
    .setTokenSymbol("TL")
    .setTreasuryAccountId(accountId)
    .setInitialSupply(10000000)
    .setDecimals(2)
    .setSupplyKey(privateKey.publicKey);
  const submit = await transaction.execute(client);
  const receipt = await submit.getReceipt(client);
  if (!receipt.tokenId) {
    throw new Error("Token creation failed");
  }
  return [receipt.tokenId.toSolidityAddress(), receipt.tokenId.toString()];
};

export const approveAllowance = async (
  contractId: string,
  tokenAddress: string,
  amount: number
) => {
  const tokenId = TokenId.fromSolidityAddress(tokenAddress);
  const tx = new AccountAllowanceApproveTransaction().approveTokenAllowance(
    tokenId,
    process.env.OWNER_ID as string,
    contractId,
    amount
  );
  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);
  return receipt.status._code;
};

export const isValidAddress = (address: string) => {
  return /^(0x)?[0-9a-fA-F]{40}$/.test(address);
};

export const capitiliseAddress = (address: string) => {
  const prefix = address.slice(0, 2);
  const mainPart = address.slice(2);
  return prefix + mainPart.toUpperCase();
};

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
