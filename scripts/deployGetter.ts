import getter from "../artifacts/contracts/Getter.sol/Getter.json";
import { deployContract } from "../lib/utils";

const main = async () => {
  const contractId = await deployContract(getter.bytecode);
  console.log(contractId);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
