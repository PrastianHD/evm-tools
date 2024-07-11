import { ethers } from "ethers";
import readline from 'readline';
import chalk from 'chalk';
import fs from 'fs';
import { log } from '../utils/logger.js';
import { printMenu2 } from '../utils/name.js';

// Fungsi untuk meminta input dari pengguna
async function promptUser(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
    }));
}

// Fungsi untuk menunggu sejumlah milidetik
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay() { //delay dalam miliDetik
    const minDelay = 10; // Minimum delay in miliseconds
    const maxDelay = 60; // Maximum delay in miliseconds
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay); // Convert to milliseconds
    return delay;
}

// Fungsi untuk menghasilkan jumlah acak dalam ETH (dalam format wei)
function generateRandomAmount() {
    const amounts = Math.floor(Math.random() * 90) + 10; // Menghasilkan angka acak antara 10 dan 100
    const amountInETH = "0.0000000" + amounts.toString().padStart(2, '0'); // Memastikan dua angka desimal
    return ethers.parseUnits(amountInETH, 'ether'); // Konversi ke wei
}

function generateRandomAmountString() {
    const amounts = Math.floor(Math.random() * 90) + 10;
    const amountInETH = "0.0000000" + amounts.toString().padStart(2, '0');
    return amountInETH;
}

// Fungsi untuk meminta jumlah transaksi dari pengguna
async function getTransactionCount() {
    const count = await promptUser(chalk.blue('How many transactions, for example 100: '));
    const transactionCount = parseInt(count, 10);
    if (isNaN(transactionCount) || transactionCount <= 0) {
        console.log(chalk.red('Jumlah transaksi tidak valid, menggunakan nilai default 10.'));
        return 10;
    } else {
        return transactionCount;
    }
}

// Fungsi untuk melakukan transaksi deposit dan withdraw
async function executeTransactions(contractWETH, transactionCount, log) {
    let successCount = 0;
    let totalAttempts = 0;

    while (successCount < transactionCount) {
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                if (totalAttempts % 2 === 0) {
                    const deposit = await contractWETH.deposit({ value: generateRandomAmount() });
                    successCount++;
                    log('SUCCESS', `Transaction ${successCount} with hash: ${deposit.hash}`);
                    await delay(randomDelay());
                } else {
                    const withdraw = await contractWETH.withdraw(ethers.parseEther(generateRandomAmountString()));
                    successCount++;
                    log('SUCCESS', `Transaction ${successCount} with hash: ${withdraw.hash}`);
                    await delay(randomDelay());
                }
                break;
            } catch (error) {
                retryCount++;
                log('ERROR', `Error sending transaction, retry ${retryCount}: ${error.message}`);
                await delay(100); // Tunggu sebelum mencoba lagi
            }
        }
        totalAttempts++;
        await delay(100); // Mengurangi waktu tunda antar transaksi
    }
}

// Fungsi untuk menambahkan alamat WETH ke network.json
async function addWethAddressToNetwork(networkName) {
    const networkConfig = JSON.parse(fs.readFileSync('./config/network.json', 'utf-8'));
    const wethAddress = await promptUser('Enter WETH Address: ');

    if (!networkConfig[networkName]) {
        throw new Error(`Network with name ${networkName} not found in configuration`);
    }

    networkConfig[networkName].WETH_ADDRESS = wethAddress;

    fs.writeFileSync('./config/network.json', JSON.stringify(networkConfig, null, 2));
    console.log(chalk.greenBright('WETH address added successfully!'));
}

export default async function interactWeth(RPC_URL, CHAIN_ID, WETH_ADDRESS, networkName) {
    printMenu2();

    // Memuat kunci pribadi dari variabel lingkungan
    let privateKeys = process.env.PRIVATE_KEY;
    if (!privateKeys) {
        throw new Error('PRIVATE_KEY not set in .env file');
    }

    // Mengurai kunci pribadi sebagai array
    privateKeys = JSON.parse(privateKeys);

    const transactionCount = await getTransactionCount();
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    for (const privateKey of privateKeys) {
        const wallet = new ethers.Wallet(privateKey, provider, CHAIN_ID);

        const balance = await provider.getBalance(wallet.address);
        log('INFO', `Check ETH balance of ${wallet.address}`);
        await delay(2000);
        log('DEBUG', `ETH Balance: ${ethers.formatEther(balance)} ETH`);
        await delay(3000);

        // WETH ABI
        const abiWETH = [
            "function balanceOf(address) public view returns(uint)",
            "function deposit() public payable",
            "function transfer(address, uint) public returns (bool)",
            "function withdraw(uint) public",
            "function approve(address, uint) public returns (bool)",
        ];

        // Alamat kontrak WETH
        let contractWETH;
        if (!WETH_ADDRESS) {
            await addWethAddressToNetwork(networkName);
            const networkConfig = JSON.parse(fs.readFileSync('./config/network.json', 'utf-8'));
            contractWETH = new ethers.Contract(networkConfig[networkName].WETH_ADDRESS, abiWETH, wallet);
        } else {
            contractWETH = new ethers.Contract(WETH_ADDRESS, abiWETH, wallet);
        }

        log('INFO', `Starting transactions from wallet ${wallet.address}`);
        await executeTransactions(contractWETH, transactionCount, log);
    }
}