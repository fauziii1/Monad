require('dotenv').config();
const { ethers } = require("ethers");

// === KONFIGURASI ===
const RPC_URL = "https://testnet-rpc.monad.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WALLET_ADDRESS = "0x3764FF18540030cE69fF217D34F1d1E90d3f830C";
const UNISWAP_ROUTER = "0x6e4B7be5Ef7F8950C76BAa0bd90125BC9b33c8db";
const WMON = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
const DAK = "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714";

// === INISIALISASI PROVIDER & WALLET ===
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const router = new ethers.Contract(UNISWAP_ROUTER, [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)"
], wallet);

const tokenAbi = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];

const wmonContract = new ethers.Contract(WMON, tokenAbi, wallet);
const dakContract = new ethers.Contract(DAK, tokenAbi, wallet);

// === FUNGSI CEK SALDO ===
async function logBalance() {
    const wmonBalance = await wmonContract.balanceOf(WALLET_ADDRESS);
    const dakBalance = await dakContract.balanceOf(WALLET_ADDRESS);
    console.log(`Saldo WMON : ${ethers.utils.formatUnits(wmonBalance, 18)} WMON`);
    console.log(`Saldo DAK  : ${ethers.utils.formatUnits(dakBalance, 18)} DAK`);
}

// === FUNGSI SWAP ===
async function swapWMONtoDAK() {
    await logBalance();

    // Cek saldo WMON
    const wmonBalance = await wmonContract.balanceOf(WALLET_ADDRESS);
    if (wmonBalance.eq(0)) {
        console.log("Tidak ada saldo WMON untuk swap!");
        return;
    }

    // Cek apakah perlu approve token
    const allowance = await wmonContract.allowance(WALLET_ADDRESS, UNISWAP_ROUTER);
    if (allowance.lt(wmonBalance)) {
        console.log("Melakukan Approve WMON...");
        const approveTx = await wmonContract.approve(UNISWAP_ROUTER, ethers.constants.MaxUint256);
        await approveTx.wait();
        console.log(`Approve sukses: ${approveTx.hash}`);
    } else {
        console.log("Skip approval, sudah diapprove sebelumnya.");
    }

    // Siapkan path & deadline
    const path = [WMON, DAK];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 menit dari sekarang

    // Swap token
    console.log("Melakukan swap WMON → DAK...");
    const tx = await router.swapExactTokensForTokens(
        wmonBalance,
        0, // Min. DAK diterima (disarankan gunakan fungsi getAmountsOut)
        path,
        WALLET_ADDRESS,
        deadline,
        { gasLimit: 500000 }
    );
    await tx.wait();
    console.log(`Swap sukses! TX Hash: ${tx.hash}`);

    // Cek saldo setelah swap
    await logBalance();
}

// === JALANKAN SWAP ===
swapWMONtoDAK().catch(console.error);
