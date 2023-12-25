import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenLocker } from "../typechain-types";
import {
  approveAllowance,
  capitiliseAddress,
  createToken,
  isValidAddress,
  delay,
} from "../lib/utils";

let ownerAddress: string;
let capitilisedOwnerAddress: string;
let tokenAddress: string;
let capitilisedTokenAddress: string;
let tokenLocker: TokenLocker;

// CONSTANTS
const PAYMENT = "10";
const AMOUNT_TO_LOCK = 10;

describe("Utils", function () {
  it("Should capitilise address", async function () {
    const address = "0x6243452Be124044f759a1130CccABa32205EE2B0";
    const capitilisedAddress = capitiliseAddress(address);
    expect(capitilisedAddress).to.equal(
      "0x6243452BE124044F759A1130CCCABA32205EE2B0"
    );
  });
});

describe("TokenLocker", function () {
  describe("Deployment", function () {
    it("Should deploy TokenLocker", async function () {
      this.timeout(60000);
      const TokenLocker = await ethers.getContractFactory("TokenLocker");
      tokenLocker = await TokenLocker.deploy();
      await tokenLocker.waitForDeployment();
      console.log(
        `View on HashScan: https://hashscan.io/testnet/contract/${tokenLocker.target}`
      );
      expect(isValidAddress(tokenLocker.target as string)).to.be.true;
    });

    // it("Should top up contract with HBAR", async function () {
    //   const topUpAmount = ethers.parseEther("100");
    //   const [owner] = await ethers.getSigners();
    //   await owner.sendTransaction({
    //     to: tokenLocker.target,
    //     value: topUpAmount,
    //   });
    //   // expect(await tokenLocker.getBalance()).to.equal(topUpAmount);
    // });
  });

  describe("Pre-Lock", function () {
    it("Should create fungible token that will be locked ", async function () {
      tokenAddress = "0x" + (await createToken())[0];
      capitilisedTokenAddress = capitiliseAddress(tokenAddress);
      expect(isValidAddress(tokenAddress)).to.be.true;
      // expectit tokenLocker.getBalance()).to.equal(ethers.parseEther("1.0"));
    });

    it("Should associate token with locker contract", async function () {
      await expect(
        tokenLocker.associateToken(tokenAddress, { gasLimit: 1_000_000 })
      ).to.emit(tokenLocker, "TokenAssociated"); // Check if 'TokenAssociated' event is emitted
    });
  });

  describe("Lock", async function () {
    it("Should approve allowance for token locker", async function () {
      const allowanceToApprove = 1000000;
      // await expect(
      //   tokenLocker.approveAllowance(tokenAddress, allowanceToApprove, {
      //     gasLimit: 1_000_000,
      //   })
      // )
      //   .to.emit(tokenLocker, "TokenAllowanceApproved")
      //   .withArgs(tokenAddress, allowanceToApprove);

      const res = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/contracts/${tokenLocker.target}`
      );
      const { contract_id } = await res.json();

      const approveAllowanceStatus = await approveAllowance(
        contract_id,
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
      await expect(
        tokenLocker.lockToken(tokenAddress, AMOUNT_TO_LOCK, timeInS, {
          value: ethers.parseEther(PAYMENT),
          gasLimit: 500_000,
        })
      ).to.emit(tokenLocker, "TokenLocked");
    });
  });

  describe("Withdrawals", function () {
    it("Should revert because lock duration not over", async function () {
      await expect(
        (
          await tokenLocker.withdrawToken(tokenAddress, {
            value: ethers.parseEther(PAYMENT),
            gasLimit: 1_000_000,
          })
        ).wait()
      ).to.be.revertedWith("Lock duration is not over");
    });

    it("Should successfully withdraw tokens", async function () {
      await delay(15000);
      await expect(
        tokenLocker.withdrawToken(tokenAddress, {
          value: ethers.parseEther(PAYMENT),
          gasLimit: 1_000_000,
        })
      ).to.emit(tokenLocker, "TokenWithdrawn");
    });
  });
});
