//const pageScraper = require('./pageScraperAlfa');
//const pageScraper = require('./pageScraperCooptim');
const pageScraper = require(`./${process.env.scraper}`)

async function scrapeAll(browserInstance){
	let browser;
  try{
    browser = await browserInstance;
    await pageScraper.scraper(browser);    
  }
  catch(err){
    console.log("Could not resolve the browser instance => ", err);
  }
  
}

module.exports = (browserInstance) => scrapeAll(browserInstance)
