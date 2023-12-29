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
  executeContractQuery,
} from "../lib/utils";
import { ContractFunctionParameters } from "@hashgraph/sdk";
import tokenLocker from "../artifacts/contracts/TokenLocker.sol/TokenLocker.json";

let ownerAddress: string;
let tokenId: string;
let tokenAddress: string;
let contractId: string;

// CONSTANTS
const PAYMENT = "10";
const AMOUNT_TO_LOCK = 10;

describe("TokenLocker", function () {
  describe("Deployment", function () {
    it("Should deploy TokenLocker", async function () {
      this.timeout(60000);
      contractId = await deployContract(tokenLocker.bytecode);
      console.log("Contract ID:", contractId);
    });
  });

  describe("Pre-Lock", function () {
    it("Should create fungible token that will be locked ", async function () {
      [tokenAddress, tokenId] = await createToken();
      expect(isValidAddress(tokenAddress)).to.be.true;
    });

    // it("Should associate token with locker contract", async function () {
    //   console.log("contractId", contractId);
    //   console.log("tokenId", tokenId);
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
      const timeInS = 15;
      expect(
        await executeContractCall(
          contractId,
          "lockToken",
          new ContractFunctionParameters()
            .addAddress(tokenAddress)
            .addInt64(AMOUNT_TO_LOCK)
            .addUint256(timeInS)
            .addBool(true),
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

    it("Should get locked token details", async function () {
      const query = await executeContractQuery(
        contractId,
        "getLockedDetails",
        new ContractFunctionParameters().addAddress(tokenAddress)
      );
      const lockedAmount = query.getInt64(0).toString();
      const remainingLockDuration = query.getUint256(0).toString();
      console.log("lockedAmount", lockedAmount);
      console.log("remainingLockDuration", remainingLockDuration);
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
