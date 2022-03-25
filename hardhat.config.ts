import "@nomiclabs/hardhat-waffle";
import type {HardhatUserConfig, HardhatRuntimeEnvironment} from "hardhat/types";
import { subtask, task } from "hardhat/config";
import { TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT, TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS } from "hardhat/builtin-tasks/task-names";
import { access, readFile } from "fs/promises";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (hre: HardhatRuntimeEnvironment) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

subtask(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT)
  .setAction(
    //@ts-ignore
    async (taskArgs, hre, runSuper) => {
      const input = await runSuper();
      const config = taskArgs.compilationJob.getSolcConfig();
      if(config?.settings?.language !== undefined) {
        input.language = config.settings.language;
        delete config.settings.language;
      }
      return input;
    }
  );

subtask(TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS)
  .setAction(
    //@ts-ignore
    async (taskArgs, hre, runSuper) => {
      for(const sourceName in taskArgs.output.contracts) {
        for(const contractName in taskArgs.output.contracts[sourceName]) {
          const config = taskArgs.output.contracts[sourceName][contractName];
          if(config.abi === undefined) {
            const abiFilename = `${sourceName.split('.').slice(0, -1).join('.')}:${contractName}.abi.json`;
            try {
              await access(abiFilename);
              const abi = await readFile(abiFilename, 'utf-8')
              config.abi = JSON.parse(abi);
            } catch { }
          }
        }
      }
      return await runSuper();
    }
  );



const userConfig: HardhatUserConfig = {
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 2000000,
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
  },
  solidity: {
    compilers: [
      {
        version: '0.8.11',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
    overrides: {
      "contracts/Executor.sol": {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100000,
          },
          language: "Yul"
        }
      }
    }
  }
};
export default userConfig