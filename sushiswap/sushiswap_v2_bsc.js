// ethereum, optimism, BSC
// uniswap v2, v3, sushiswap, pancakeswap 

const { request, gql } = require('graphql-request');
const ExcelJS = require('exceljs');

// GraphQL endpoint for Uniswap v3 subgraph
const GRAPHQL_ENDPOINT_BSC = "https://api.thegraph.com/subgraphs/name/sushiswap/bsc-exchange";

// GraphQL query to fetch liquidity pools
const query = gql`
  query GetPools($first: Int!, $skip: Int!) {
    pairs(first: $first, skip: $skip) {
      id
      token0 {
        id
        symbol
      }
      token1 {
        id
        symbol
      }
    }
  }
`;

// Function to fetch liquidity pool data with pagination
async function getLiquidityPools() {
  let batchSize = 100; // Adjust batch size as needed
  let skip = 0;
  let allPools = [];
  const pools_max_page = 2300;

  while (true) {
    try {

      if(skip > pools_max_page) {
        if(batchSize == 100) {
          skip = pools_max_page;
          batchSize = 1000;
        } else {
          break;
        }
      }
      const data = await request(GRAPHQL_ENDPOINT_BSC, query, { first: batchSize, skip });
      const pools = data.pairs;

      console.log(batchSize, skip);
      console.log("Pools length: ", allPools.length);
      
      if (pools.length === 0) {
        break; // No more pools, exit loop
      }
      
      allPools = allPools.concat(pools);
      skip += batchSize;
    } catch (error) {
      console.error('Error fetching liquidity pools:', error);
      throw error;
    }
  }

  return allPools;
}

// Function to save data to Excel sheet
async function saveToExcel(liquidityPools) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Liquidity Pools');

  // Add headers
  worksheet.columns = [
    { header: 'Pool ID', key: 'id' },
    { header: 'Token 0 ID', key: 'token0Id' },
    { header: 'Token 0 Symbol', key: 'token0Symbol' },
    { header: 'Token 1 ID', key: 'token1Id' },
    { header: 'Token 1 Symbol', key: 'token1Symbol' },
  ];

  // Add data rows
  liquidityPools.forEach(pool => {
    worksheet.addRow({
      id: pool.id,
      token0Id: pool.token0.id,
      token0Symbol: pool.token0.symbol,
      token1Id: pool.token1.id,
      token1Symbol: pool.token1.symbol
    });
  });

  // Save workbook
  await workbook.xlsx.writeFile('sushiswap_v2_bsc.xlsx');
}

// Main function
async function main() {
  try {
    // Fetch liquidity pools
    const liquidityPools = await getLiquidityPools();

    // Save to Excel
    await saveToExcel(liquidityPools);

    console.log('Liquidity pool data saved to Excel.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();
