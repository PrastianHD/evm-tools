import { ethers } from 'ethers';
import readline from 'readline';
import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { printMenu1 } from '../utils/name.js';

// Fungsi untuk meminta input dari pengguna
async function promptUser(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(chalk.blueBright(question), (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// Fungsi untuk menunggu sejumlah milidetik
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fungsi untuk menghasilkan jumlah acak dalam ETH (dalam format wei)
function generateRandomAmount() {
    const amounts = Math.floor(Math.random() * 11) + 10;
    return ethers.parseUnits("0.0000000000000000" + amounts, 'ether');
}

// Fungsi untuk menghasilkan alamat acak EVM
function generateRandomAddress() {
    const randomWallet = ethers.Wallet.createRandom();
    return randomWallet.address;
}

// Fungsi untuk menghasilkan beberapa alamat acak
function generateMultipleRandomAddresses(count) {
    return Array.from({ length: count }, generateRandomAddress);
}

export default async function transferEth(RPC_URL) {
    printMenu1();

    // Meminta jumlah transaksi dari pengguna
    const addressCount = parseInt(await promptUser('How many transactions, for example 100: '), 10);

    // Memuat kunci pribadi dari variabel lingkungan
    let privateKeys = process.env.PRIVATE_KEY;
    if (!privateKeys) {
        throw new Error('PRIVATE_KEY not set in .env file');
    }

    // Mengurai kunci pribadi sebagai array
    privateKeys = JSON.parse(privateKeys);

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    for (const privateKey of privateKeys) {
        const wallet = new ethers.Wallet(privateKey, provider);
        const balance = await provider.getBalance(wallet.address);
        log('DEBUG', `Current ETH balance of ${wallet.address}: ${ethers.formatEther(balance)} ETH`);

        const randomAddresses = generateMultipleRandomAddresses(addressCount);
        log('INFO', `Starting ETH transfers from wallet ${wallet.address}...`);
        await delay(1000);

        // Mendapatkan nonce awal
        let nonce = await provider.getTransactionCount(wallet.address);

        // Fungsi untuk mengirim transaksi dengan retries
        async function sendTransactions() {
            let successCount = 0;

            for (const recipient of randomAddresses) {
                let retryCount = 0;
                const maxRetries = 3;

                while (retryCount < maxRetries) {
                    try {
                        const tx = {
                            to: recipient,
                            value: generateRandomAmount(),
                            nonce: nonce
                        };

                        const gasLimit = await wallet.estimateGas(tx);
                        tx.gasLimit = gasLimit;

                        const gasData = await provider.getFeeData();
                        tx.gasPrice = gasData.gasPrice;

                        const txResponse = await wallet.sendTransaction(tx);

                        successCount++;
                        log('SUCCESS', `Transaction ${successCount} with hash: ${txResponse.hash}`);
                        nonce++;
                        break;
                    } catch (error) {
                        retryCount++;
                        let errorMessage = error.message;
                        if (error.code === 'INSUFFICIENT_FUNDS') {
                            errorMessage = 'INSUFFICIENT_FUNDS';
                        }
                        if (error.code === 'SERVER_ERROR') {
                            errorMessage = 'Service Temporarily Unavailable';
                        }
                        log('ERROR', `Error sending transaction to ${recipient}: ${errorMessage}`);
                        await delay(500);
                    }
                }

                await delay(10);
            }
        }

        await sendTransactions();
    }
}
