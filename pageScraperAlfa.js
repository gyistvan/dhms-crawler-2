const urls = require('./alfaUrls.json')
const fs = require('fs')

const scraperObjectAlfa = {
  pageCount: urls.length,
	async scraper(browser){
    let time = Date.now()
    for (let i = 0; i < this.pageCount; i++){
      let page = await browser.newPage();
      console.log(`Navigating to ${urls[i]}...`);
      await page.goto(urls[i]);
      // Wait for the required DOM to be rendered
      await page.waitForSelector('.page_content');
      // Get the link to all the required books
      let data = await page.$$eval('.product__inner', productBoxes => {
        let d = productBoxes.map((productBox) => {
          let id = productBox.querySelector('.product__name-link').getAttribute('data-sku')
          let price = Math.floor(productBox.querySelector('[id^="price_net_netto_artlist_"]').textContent.replace(/\s/g, ''))
          return `${id},${price}\n`
        })
        
        return d
      });
      fs.appendFileSync('alfaweldPrices.csv', data.join(''))

      await page.close()
    }
    console.log(`${(Date.now() - time) / 1000 / 60}mins`)
	}
}

module.exports = scraperObjectAlfa;

