const { ethers } = require('ethers');
const ExcelJS = require('exceljs');

// Initialize Ethereum provider
const provider = new ethers.JsonRpcProvider('https://opt-mainnet.g.alchemy.com/v2/LzDhqsJidA7ZALrhK_AFcsLLcW0-UsGY');

// Uniswap V2 Factory Contract Address
const factoryAddress = '0x0c3c1c532F1e39EdF36BE9Fe0bE1410313E074Bf'; // Example address


// ABI for Uniswap V2 Factory Contract
const factoryABI = [
  'function allPairs(uint256) external view returns (address)',
  'function allPairsLength() external view returns (uint256)'
];

// ABI for Uniswap V2 Pair Contract
const pairABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

// ABI for ERC20 Token Contract
const erc20ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)'
];

// Initialize Excel workbook and worksheet
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('optimism_uniswap_v2.xlsx');

// Function to fetch data for each Uniswap V2 pair
async function fetchPairData(pairAddress, pairIndex) {
  try {
    // Connect to pair contract
    const pairContract = new ethers.Contract(pairAddress, pairABI, provider);

    // Fetch pair data
    const [reserve, token0Address, token1Address] = await Promise.all([
        pairContract.getReserves(),
        pairContract.token0(),
        pairContract.token1()
    ]);

    // Fetch token data
    const [token0Name, token1Name] = await Promise.all([
      fetchTokenData(token0Address),
      fetchTokenData(token1Address)
    ]);
    
    // Write data to Excel worksheet
    worksheet.addRow({
      SrNo: pairIndex + 1,
      PairAddress: pairAddress,
      Token0Name: token0Name,
      Token0Address: token0Address,
      Token1Name: token1Name,
      Token1Address: token1Address,
      Liquidity: reserve[0].toString() + ' ' + token0Name + ' + ' + reserve[1].toString() + ' ' + token1Name
    });
    console.log("Row added")
  } catch (error) {
    console.error('Error fetching pair data:', error);
  }
}

// Function to fetch token data
async function fetchTokenData(tokenAddress) {
  try {
    // Connect to ERC20 token contract
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);

    // Fetch token name and symbol
    const [name, symbol] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol()
    ]);

    return name + ' (' + symbol + ')';
  } catch (error) {
    console.log(tokenAddress);
    console.error('Error fetching token data:', error);
    return 'Unknown';
  }
}

// Function to fetch all Uniswap V2 pairs from factory contract
async function fetchAllPairs() {
  try {
    // Connect to factory contract
    const factoryContract = new ethers.Contract(factoryAddress, factoryABI, provider);

    // Fetch total number of pairs
    const totalPairs = await factoryContract.allPairsLength();
    console.log("Total pairs: ", totalPairs);

    worksheet.columns = [
      { header: 'Sr no.', key: 'SrNo' },
      { header: 'Pair address', key: 'PairAddress' },
      { header: 'Token 0', key: 'Token0Name' },
      { header: 'Token 0 ID', key: 'Token0Address' },
      { header: 'Token 1', key: 'Token1Name' },
      { header: 'Token 1 ID', key: 'Token1Address' },
      { header: 'Liquidity', key: 'Liquidity' }
    ];

    // Fetch data for each pair
    const pairStart = 0;
    const pairEnd = totalPairs;
    for (let i = pairStart; i < pairEnd; i++) {
      const pairAddress = await factoryContract.allPairs(i);
      console.log(`Pair ${i+1}/${pairEnd}, total: ${totalPairs}`);
      await fetchPairData(pairAddress, i);
    }

    // Save Excel workbook
    await workbook.xlsx.writeFile('uniswap_v2_optimism.xlsx');
    console.log('Data saved to uniswap_v2_optimism.xlsx');
  } catch (error) {
    console.error('Error fetching pairs:', error);
  }
}

// Call function to fetch all pairs and save data to Excel
fetchAllPairs();

