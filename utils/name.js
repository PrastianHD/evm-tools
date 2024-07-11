// name.js
import chalk from 'chalk';

export function printName() {
    console.log(chalk.blueBright(`
    +=================================================+                                 
    =           ${chalk.yellowBright('------- EVM TOOLS -------')}             =
    =   ${chalk.greenBright('Feature: ')}                                     =
    =   ${chalk.greenBright('Support All EVM Network')}                       =
    =   ${chalk.greenBright('Support Multiple Wallet')}                       =     
    =   ${chalk.greenBright('Menu[1] Tools Send ETH To Random Address')}      =
    =   ${chalk.greenBright('Menu[2] Tools Intract Contract WETH ')}          =
    =   ${chalk.magentaBright('Author: Prastian Hidayat')}                      =
    =   ${chalk.magentaBright('Github: https://github.com/PrastianHD')}         =
    +=================================================+
    `));
}

export function printMenu1() {
    console.log(chalk.blueBright(`
    +=================================================+                                 
    =   ${chalk.yellowBright('----- Tools Send ETH To Random Address -----')}  =
    =   ${chalk.greenBright('Function: ')}                                    =
    =   ${chalk.greenBright('Send ETH random amount to random address')}      =
    =   ${chalk.greenBright('Modify the number of transactions as needed')}   =
    +=================================================+
    `));
}

export function printMenu2() {
    console.log(chalk.blueBright(`
    +=================================================+                                 
    =    ${chalk.yellowBright('----- Tools Intract Contract WETH -----')}      =
    =   ${chalk.greenBright('Feature: ')}                                     =
    =   ${chalk.greenBright('Support All EVM Network')}                       =   
    =   ${chalk.greenBright('Deposit = Convert ETH to WETH ')}                =   
    =   ${chalk.greenBright('Withdraw = Convert WETH to ETH ')}               =  
    =   ${chalk.greenBright('Modify the number of transactions as needed')}   =    
    +=================================================+
    `));
}

export function printMenu3() {
    console.log(chalk.blueBright(`
    +=================================================+                                 
    =    ${chalk.yellowBright('----- Tools Deploy Smart Contract -----')}      =
    =   ${chalk.greenBright('Feature: ')}                                     =
    =   ${chalk.greenBright('Support All EVM Network')}                       =     
    +=================================================+
    `));
}
