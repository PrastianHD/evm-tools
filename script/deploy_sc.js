// deploy_sc.js
import { ethers } from "ethers";
import { bytecodeERC20 } from '../config/bytecodeERC20.js';
import promptSync from 'prompt-sync';
import fs from 'fs';
import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { printMenu3 } from '../utils/name.js';

const prompt = promptSync();

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function deploySC(RPC_URL) {
    printMenu3();

    const tokenName = prompt("Enter the token name: ");
    const tokenSymbol = prompt("Enter the token symbol: ");
    const mintAmount = prompt("Enter the token supply: ");

    let privateKeys = process.env.PRIVATE_KEY;
    if (!privateKeys) {
        throw new Error('PRIVATE_KEY not set in .env file');
    }

    privateKeys = JSON.parse(privateKeys);

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    for (const privateKey of privateKeys) {
        const wallet = new ethers.Wallet(privateKey, provider);
        try {
            const balance = await provider.getBalance(wallet.address);
            log('DEBUG', `Current ETH balance of ${wallet.address}: ${ethers.formatEther(balance)} ETH`);
            log('INFO', `Starting deploy contract from wallet ${wallet.address}`);
            await delay(1000);

            const amountToMint = BigInt(mintAmount) * 10n ** 18n;

            const abiERC20 = [
                "constructor(string memory name_, string memory symbol_)",
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function totalSupply() view returns (uint256)",
                "function balanceOf(address) view returns (uint)",
                "function transfer(address to, uint256 amount) external returns (bool)",
                "function mint(uint amount) external",
            ];

            const factoryERC20 = new ethers.ContractFactory(abiERC20, bytecodeERC20, wallet);

            async function deployContract() {
                try {
                    log('INFO', 'Processing Deploy the ERC20 token contract');
                    const contractERC20 = await factoryERC20.deploy(tokenName, tokenSymbol);
                    log('SUCCESS', `Contract Address: ${contractERC20.target}`);
                    log('INFO', 'Wait for contract deployment on the blockchain');
                    await contractERC20.waitForDeployment();
                    let tx = await contractERC20.mint(amountToMint);
                    await tx.wait();
                    log('INFO', 'Contract deployed on the blockchain');
                    log('SUCCESS', `Contract Name: ${await contractERC20.name()}`);
                    log('SUCCESS', `Contract Symbol: ${await contractERC20.symbol()}`);
                    log('SUCCESS', `Total token supply: ${await contractERC20.totalSupply()}`);
                    log('DEBUG', `Completed`);
                } catch (error) {
                    log('ERROR', `Deployment failed: ${error.message}`);
                }
            }

            await deployContract();
        } catch (error) {
            log('ERROR', `Error with wallet ${wallet.address}: ${error.message}`);
        }
    }
}
