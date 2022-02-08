require("@nomiclabs/hardhat-waffle");
require('solidity-coverage');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const FUJI_PRIVATE_KEY = "ab24df078e882ccb8c0b7dbbaf220daf40ea9dc64756a5c894d4647a9dc0d68f";
const FUJI_PUBLIC_KEY = "0xFDf572Ce0b87f7036f9F528FD55968348Bd86081"

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  networks: {
    fuji: {
        url: `https://api.avax-test.network/ext/bc/C/rpc`,
        accounts: [`${FUJI_PRIVATE_KEY}`]
    }
  },
  plugins: [
    "solidity-coverage"
  ]
};
