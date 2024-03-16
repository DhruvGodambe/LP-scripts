const { ethers } = require('ethers');
const ExcelJS = require('exceljs');
const factoryABI = require("./pancakeswap_factory_abi.json");
const pairABI = require("./pancakeswap_pair_abi.json");

// Initialize provider for Binance Smart Chain (BSC)
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org');

// PancakeSwap factory contract address on BSC
const factoryAddress = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';

// Initialize PancakeSwap factory contract instance
const factoryContract = new ethers.Contract(factoryAddress, factoryABI.abi, provider);

// Function to fetch pair information and save to Excel
async function fetchPairsAndSaveToExcel() {
  try {
    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PancakeSwap Pools');

    // Add headers to the worksheet
    worksheet.columns = [
      { header: 'Pair Address', key: 'pairAddress' },
      { header: 'Token 0', key: 'token0' },
      { header: 'Token 1', key: 'token1' },
      { header: 'Liquidity', key: 'liquidity' }
    ];

    // Get the total number of pairs
    const pairCount = await factoryContract.allPairsLength();
    const startPair = 0;
    const endPair = 10;

    // Loop through each pair
    for (let i = startPair; i < endPair; i++) {
      console.log(`Fetching pair ${i + 1}/${pairCount}`);
      const pairAddress = await factoryContract.allPairs(i);
      const pairContract = new ethers.Contract(pairAddress, pairABI.abi, provider);
      const [token0, token1, liquidity] = await Promise.all([
        pairContract.token0(),
        pairContract.token1(),
        pairContract.getReserves()
      ]);
      // Add the pair data to the worksheet
      console.log({ pairAddress, token0, token1, liquidity: liquidity.toString() })
      worksheet.addRow({ pairAddress, token0, token1, liquidity: liquidity[2].toString() });
    }

    // Save the workbook to an Excel file
    await workbook.xlsx.writeFile('pancakeswap_v2_bsc.xlsx');
    console.log('Pairs data saved to pancakeswap_v2_bsc.xlsx');
  } catch (error) {
    console.error('Error fetching and saving pairs:', error);
  }
}

// Call the function to fetch pairs information and save to Excel
fetchPairsAndSaveToExcel();
