const readExcel = require('read-excel-file/node')

const createIweldExcelObj = async () => {
  const excelObj = {}
  const rawData = await readExcel("./priceListIweld.xlsx")
  rawData.forEach(([prodId, _,netRetailPrice]) => {
    excelObj[prodId] = netRetailPrice.replace(/\s/g, '').replace('Ft', '')
  })

  return excelObj
}

module.exports = {
  createIweldExcelObj
}
