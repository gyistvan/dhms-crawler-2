const fs = require('fs')

const getIweldPriceList = async () => {
  const { default: fetch } = await import('node-fetch');
  const response = await fetch('https://iweld.hu/excel/ArlistaExcel/Arlista?szurtlista=0')
  const buffer = await response.buffer();
  
  fs.writeFileSync('priceListIweld.xlsx', buffer)
}

module.exports = {
  getIweldPriceList
}
