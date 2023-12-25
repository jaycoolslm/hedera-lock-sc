import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenLocker } from "../typechain-types";
import {
  approveAllowance,
  capitiliseAddress,
  createToken,
  isValidAddress,
  delay,
  executeContractCall,
  deployContract,
} from "../lib/utils";
import { ContractFunctionParameters } from "@hashgraph/sdk";
import tokenLocker from "../artifacts/contracts/TokenLocker.sol/TokenLocker.json";

let ownerAddress: string;
let capitilisedOwnerAddress: string;
let tokenId: string;
let tokenAddress: string;
let capitilisedTokenAddress: string;
let contractId: string;

// CONSTANTS
const PAYMENT = "10";
const AMOUNT_TO_LOCK = 10;

describe("TokenLocker", function () {
  describe("Deployment", function () {
    it("Should deploy TokenLocker", async function () {
      this.timeout(60000);
      contractId = await deployContract(tokenLocker.bytecode);
    });
  });

  describe("Pre-Lock", function () {
    it("Should create fungible token that will be locked ", async function () {
      [tokenAddress, tokenId] = await createToken();
      expect(isValidAddress(tokenAddress)).to.be.true;
    });

    // it("Should associate token with locker contract", async function () {
    //   expect(
    //     await executeContractCall(
    //       contractId,
    //       "associateToken",
    //       new ContractFunctionParameters().addAddress(tokenAddress)
    //     )
    //   ).to.equal(22); // Check if 'TokenAssociated' event is emitted
    // });
  });

  describe("Lock", async function () {
    it("Should approve allowance for token locker", async function () {
      const allowanceToApprove = 1000000;

      const approveAllowanceStatus = await approveAllowance(
        contractId,
        tokenAddress,
        allowanceToApprove
      );
      expect(approveAllowanceStatus).to.equal(22);
    });

    it("Should lock tokens", async function () {
      const [owner] = await ethers.getSigners();
      ownerAddress = owner.address;
      capitilisedOwnerAddress = capitiliseAddress(ownerAddress);
      const timeInS = 15;
      expect(
        await executeContractCall(
          contractId,
          "lockToken",
          new ContractFunctionParameters()
            .addAddress(tokenAddress)
            .addInt64(AMOUNT_TO_LOCK)
            .addUint256(timeInS),
          Number(PAYMENT)
        )
      ).to.equal(22);
    });
  });

  describe("Withdrawals", function () {
    it("Should revert because lock duration not over", async function () {
      let errorCount = 0;
      try {
        await executeContractCall(
          contractId,
          "withdrawToken",
          new ContractFunctionParameters().addAddress(tokenAddress),
          Number(PAYMENT)
        );
      } catch (err) {
        errorCount++;
      }
      expect(errorCount).to.equal(1);
    });

    it("Should successfully withdraw tokens", async function () {
      await delay(15000);
      expect(
        await executeContractCall(
          contractId,
          "withdrawToken",
          new ContractFunctionParameters().addAddress(tokenAddress),
          Number(PAYMENT)
        )
      ).to.equal(22);
    });
  });
});
