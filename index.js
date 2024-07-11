import 'dotenv/config';
import fs from 'fs';
import readline from 'readline';
import chalk from 'chalk';
import { log } from './utils/logger.js';
import { printName } from './utils/name.js';

// Load network configuration
const networkConfig = JSON.parse(fs.readFileSync('./config/network.json', 'utf-8'));

// Function to select network
function selectNetwork(networkIndex) {
    const networkNames = Object.keys(networkConfig);
    const networkName = networkNames[networkIndex - 1];
    if (!networkName) {
        throw new Error(`Network with index ${networkIndex} not found in configuration`);
    }
    return networkConfig[networkName];
}

// Function to display available networks
function displayNetworks() {
    const networkNames = Object.keys(networkConfig);
    console.log(chalk.blueBright('Available Networks:'));
    networkNames.forEach((name, index) => {
        console.log(`${index + 1}: ${name}`);
    });
}

// Function to prompt user for input
function promptUser(question) {
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

// Function to add a new network
async function addNetwork() {
    const name = await promptUser('Enter Network Name: ');
    const rpcUrl = await promptUser('Enter RPC URL: ');
    const chainId = await promptUser('Enter Chain ID: ');
    const wethAddress = await promptUser('Enter WETH Address (optional): ');

    if (networkConfig[name]) {
        throw new Error(`Network with name ${name} already exists`);
    }

    networkConfig[name] = {
        RPC_URL: rpcUrl,
        CHAIN_ID: chainId,
        WETH_ADDRESS: wethAddress || null
    };

    fs.writeFileSync('./config/network.json', JSON.stringify(networkConfig, null, 2));
    console.log(chalk.greenBright('Network added successfully!'));
}

async function main() {
    printName();

    const action = await promptUser('Add a New Network? (y/n): ');

    if (action.toLowerCase() === 'y') {
        await addNetwork();
    }

    // Display and select network
    displayNetworks();
    const networkIndex = parseInt(await promptUser('Select Network by Number: '), 10);
    const selectedNetwork = selectNetwork(networkIndex);
    const { RPC_URL, CHAIN_ID, WETH_ADDRESS } = selectedNetwork;

    // Ask user to choose which script to run
    const scriptChoice = await promptUser('Choose the script to run ( Menu[1] , Menu[2], Menu[3] ): ');

    if (scriptChoice === '1') {
        import('./script/transfer_eth.js').then(({ default: transferEth }) => transferEth(RPC_URL, CHAIN_ID));
    } else if (scriptChoice === '2') {
        import('./script/intract_weth.js').then(({ default: interactWeth }) => interactWeth(RPC_URL, CHAIN_ID, selectedNetwork.WETH_ADDRESS, Object.keys(networkConfig)[networkIndex - 1]));
    } else if (scriptChoice === '3') {
        import('./script/deploy_sc.js').then(({ default: deploySC }) => deploySC(RPC_URL, CHAIN_ID));
    } else {
        console.log(chalk.red('Invalid choice. Please restart and choose 1, 2, or 3.'));
    }
}

main().catch(console.error);
