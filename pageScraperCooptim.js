const urlData = require('./cooptimUrls.json')
const fs = require('fs')

const scraperObjectCooptim = {
  pageCount: urlData.length,
	async scraper(browser){
    let time = Date.now()
    for (let i = 0; i < this.pageCount; i++){
      let page = await browser.newPage();
      console.log(`Navigating to ${urlData[i].url}...`);
      await page.goto(urlData[i].url);
      // Wait for the required DOM to be rendered
      await page.waitForSelector('.grid_jobbkozep');
      // Get the link to all the required books
      let data = await page.$$eval('.termeksor', productBoxes => {
        let d = productBoxes.map((productBox) => {
          console.log("fdsafdsa")
          let id = productBox.querySelector('.rightblock').textContent.replace(/^Cikkszám: /, "")
          let discountPrice = productBox.querySelector('.pricewindow_act .action')
          let price
          if (discountPrice){
            price = Math.floor(discountPrice.textContent.replace(/\s/g, '').replace('Ft', ''))
          }
          else {
            price = Math.floor(productBox.querySelector('.rightblock .netto').textContent.replace(/\s/g, '').replace('Ft', ''))
          }
          return `${id},${price},1\n`
        })
        
        return d
      });
      fs.appendFileSync(`allcoopim.csv`, data.join(''))

      await page.close()
    }
    console.log(`${(Date.now() - time) / 1000 / 60}mins`)
	}
}

module.exports = scraperObjectCooptim;

