require('dotenv').config();
const { ethers } = require("ethers");

// Load environment variables
const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = 'https://testnet-rpc.monad.xyz';

// Initialize provider and wallet
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// Define the router contract
const routerAddress = "0xCa810D095e90Daae6e867c19DF6D9A8C56db2c89";
const routerAbi = [
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
];

const usdtAddress = "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea";
const wethAddress = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
const router = new ethers.Contract(routerAddress, routerAbi, wallet);

async function logBalance() {
    const ethBalance = await provider.getBalance(wallet.address);
    const formattedEth = ethers.utils.formatEther(ethBalance);
    console.log(`ETH Balance\t: ${formattedEth} ETH`);

    const usdtContract = new ethers.Contract(usdtAddress, [
        "function balanceOf(address owner) external view returns (uint256)"
    ], wallet);
    const usdtBalance = await usdtContract.balanceOf(wallet.address);
    const formattedUsdt = ethers.utils.formatUnits(usdtBalance, 6);
    console.log(`USDT Balance\t: ${formattedUsdt} USDT`);
}

async function swapETHToUSDT() {
    await logBalance();
    const ethBalance = await provider.getBalance(wallet.address);
    const ethAmount = ethBalance.mul(5).div(10000); // 0.05% dari saldo ETH
    const path = [wethAddress, usdtAddress];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 menit dari sekarang
    
    const amountsOut = await router.getAmountsOut(ethAmount, path);
    const amountOutMin = amountsOut[1].mul(97).div(100); // Slippage 5%

    const tx = await router.swapExactETHForTokens(
        amountOutMin,
        path,
        wallet.address,
        deadline,
        { value: ethAmount, gasLimit: 300000 }
    );
    await tx.wait();
    console.log(`Sukses\t\t: ${tx.hash.slice(0, 10)}...`);
    await logBalance();
}

async function swapUSDTToETH() {
    await logBalance();
    const usdtContract = new ethers.Contract(usdtAddress, [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address owner) external view returns (uint256)",
        "function allowance(address owner, address spender) external view returns (uint256)"
    ], wallet);
    
    const usdtBalance = await usdtContract.balanceOf(wallet.address);
    if (usdtBalance.eq(0)) {
        console.log("Tidak ada USDT!");
        return;
    }

    const allowance = await usdtContract.allowance(wallet.address, routerAddress);
    if (allowance.lt(usdtBalance)) {
        console.log("Approval Token..");
        const approveTx = await usdtContract.approve(routerAddress, ethers.constants.MaxUint256);
        await approveTx.wait();
        console.log(`Approvall Tx hash\t: ${approveTx.hash.slice(0, 10)}...`);
    } else { 
        console.log("Skip Approval..");
    } 
 
    const path = [usdtAddress, wethAddress ];
    const deadline = Math.floor(Date.now()  / 1000) + 60 * 10;
    const amountsOut = await router.getAmountsOut(usdtBalance, path);
    const amountOutMin = amountsOut[1].mul (97).div(100); // Slippage 5%
 
    const tx = await router.swapExactTokensForETH(
        usdtBalance,
        amountOutMin,
        path,
        wallet.address,
        deadline,
        { gasLimit: 300000 }
    );
    await tx.wait();
    console.log(`Sukses\t\t: ${tx.hash.slice(0, 10)}...`);
    await logBalance();
}

async function main() {
    while (true) {
        console.log("Processing..");
        await swapETHToUSDT();
        await swapUSDTToETH();
        console.log("\nMelakukan swap kembali..");
        await new Promise(res => setTimeout(res, 3000)); // 1 menit delay
    }
}

main().catch(console.error);
