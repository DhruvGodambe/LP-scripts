const { request, gql } = require("graphql-request");
const ExcelJS = require("exceljs");

// GraphQL endpoint for Uniswap V3 Optimism subgraph
const GRAPHQL_ENDPOINT =
  "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-optimism";

// GraphQL query to fetch liquidity pools with pagination
const query = gql`
    query GetPools($first: Int!, $skip: Int!) {
        liquidityPools(first: $first, skip: $skip) {
            id
            totalLiquidity
            fees {
                feeType
                feePercentage
            }
            inputTokens {
                name
                symbol
                id
            }
        }
    }
`;

// Function to fetch liquidity pools with pagination
async function getLiquidityPools() {
  const batchSize = 100; // Adjust batch size as needed
  let skip = 0;
  let allPools = [];

  while (true) {
    try {
      const data = await request(GRAPHQL_ENDPOINT, query, {
        first: batchSize,
        skip,
      });
      const pools = data.liquidityPools;
      console.log(skip, pools.length);

      if (pools.length === 0) {
        console.log("No more pools. Total pools: ", skip);
        break; // No more pools, exit loop
      }

      allPools = allPools.concat(pools);
      skip += batchSize;
    } catch (error) {
      console.error("Error fetching liquidity pools:", error.response.error);
      console.log("error");
    }
  }

  return allPools;
}

// Function to save data to Excel sheet
async function saveToExcel(liquidityPools) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("liquidity_pool_optimism");

  // Add headers
  worksheet.columns = [
    { header: "Pool ID", key: "id" },
    { header: "Total Liquidity", key: "totalLiquidity" },
    { header: "Fee Type", key: "feeType" },
    { header: "Fee Percentage", key: "feePercentage" },
    { header: "Token 0", key: "token0" },
    { header: "Token 0 Symbol", key: "tokenSymbol0" },
    { header: "Token 0 ID", key: "tokenId0" },
    { header: "Token 1", key: "token1" },
    { header: "Token 1 Symbol", key: "tokenSymbol1" },
    { header: "Token 1 ID", key: "tokenId1" },
  ];

  // Add data rows
  liquidityPools.forEach((pool) => {
    pool.fees.forEach((fee, index) => {
      if (fee.feeType == "FIXED_LP_FEE") {
        worksheet.addRow({
          id: pool.id,
          totalLiquidity: pool.totalLiquidity,
          feeType: fee.feeType,
          feePercentage: fee.feePercentage,
          token0: pool.inputTokens[0].name,
          tokenSymbol0: pool.inputTokens[0].symbol,
          tokenId0: pool.inputTokens[0].id,
          token1: pool.inputTokens[1].name,
          tokenSymbol1: pool.inputTokens[1].symbol,
          tokenId1: pool.inputTokens[1].id,
        });
      }
    });
  });

  // Save workbook
  await workbook.xlsx.writeFile("uniswap_v3_optimism.xlsx");
  console.log("Liquidity pool data saved to Excel.");
}

// Main function
async function main() {
  try {
    // Fetch liquidity pools
    const liquidityPools = await getLiquidityPools();

    console.log("Total pools: ", liquidityPools.length);
    // Save to Excel
    await saveToExcel(liquidityPools);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the main function
main();
