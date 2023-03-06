const urlData = require('./iweldUrls.json')
const readExcel = require('read-excel-file/node')
const fs = require('fs')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { PNG } = require('pngjs');
const { getIweldPriceList } = require("./get-iweld-price-list")
const { createIweldExcelObj } = require('./createIweldExcelObj')
let numOfFiles = 0;


const categoryNames = (key) => ({
  ivhegesztes: "Ívhegesztés",
  "awi-hegesztes": "Awi hegesztés",
  "awi-gepek": "Awi Gépek",
  "acdc-gepek-valtoaramu": "AC-DC, Váltóáramú gépek",
  "dc-gepek-egyenaramu": "DC, Egyenáramú gépek",
  "awi-pisztolyok": "AWI Pisztolyok",
  "gyokfaragas": "Gyökfaragás",
  "migmagfcaw-hegesztes": "MIG-MAG-FCAW Hegesztés",
  "migmagfcaw-hegesztogepek": "MIG-MAG-FCAW Hegesztőgépek",
  "analog-hegesztogepek": "Analóg hegesztőgépek",
  "digitalis-hegesztogepek": "Digitális hegesztőgépek",
  "digitalis-impulzus-hegesztogepek": "Digitális impulzus hegesztőgépek",
  "migmagfcaw-hegesztopisztolyok": "MIG-MAG-FCAW Hegesztőpisztolyok",
  "gazhuteses-migmag-hegesztopisztolyok": "Gázhűtéses MIG-MAG hegesztőpisztolyok",
  "vizhuteses-migmag-hegesztopisztolyok": "Vízhűtéses MIG-MAG hegesztőpisztolyok",
  "mma-hegesztes": "MMA Hegesztés",
  "elektrodas-hegeszto-inverterek": "Elektródás hegesztő inverterek",
  "hegesztogep-kocsik": "Hegesztőgép kocsik",
  "munkavedelem": "Munkavédelem",
  "hegesztopajzsok": "Hegesztőpajzsok",
  "automata-pajzsok": "Automata pajzsok",
  "falcon": "Falcon",
  "fantom": "Fantom",
  "flip-up": "Flip up",
  "nored-eye": "Nored eye",
  "panther": "Panther",
  "robotic": "Robotic",
  "fejpajzsok": "Fejpajzsok",
  "plazmavagas": "Plazmavágás",
  "plazmavago-gepek": "Plazmavágó gépek",
  "plazmavago-pisztolyok": "Plazmavágó pisztolyok"
})[key]

const createCategoriesFromHref = (href) => href.substring(17,).split("/").map((cat) => categoryNames(cat)).join("<")
const getSimpleTextFromPage = async (page, selector) => await page.$$eval(selector, (prodId) => prodId[0].textContent)
const getActiveImgUrl = async (page) => {
  await page.waitForSelector('.fotorama__active')
  return await page.$$eval('.fotorama__active', (imgEl) => imgEl[0].querySelector("img").getAttribute("src"))
}

const createImageUrlString = (prodId, imageUrls) => imageUrls.map((_, index) => `https://eweld.hu/img/upload/${prodId}-${index}.png`).join("<") 

const getImageUrls = async (page) => {
  //let imageUrls = []
  const thumbnails = await page.$('.fotorama__nav__frame--thumb')
  let imageUrls
  if (thumbnails){
    console.log("getImageUrls-multi")
    imageUrls = await page.$$eval('.fotorama__nav__frame--thumb', imageEls => 
      imageEls.map((imageEl) => {
      let img = imageEl.querySelector('img')
      let url = null
      if (img){
        url = imageEl.querySelector('img').getAttribute('src')
      }
            
      return url
      })
      .reduce((prev, curr) => curr ? [...prev, curr] : [...prev] ,[])
    )
  }
  else {
    console.log("getImageUrls-single")
    let imageUrl = await getActiveImgUrl(page)
    imageUrls = [imageUrl]
  }

  return imageUrls 
}

const getNewCsv = (id) => createCsvWriter({
  path: `allIweld-${id}.csv`,
  header: [
    {id: 'prodId', title: 'Cikkszám'},
    {id: 'prodName', title: 'Termék név'},
    {id: 'description', title: 'Leírás (hosszú)'},
    {id: 'categories', title: 'Kategóriák'},
    {id: 'imageUrls', title: 'Kép url(ek)'},
    {id: 'retailPrice', title: 'Nagyker ár'},
    {id: 'netPrice', title: 'Nettó ár'},
    {id: 'manufacturer', title: "Gyártó"},
    {id: 'metaTitle', title: 'Meta cím'},
    {id: 'metaDesc', title: 'Meta Leírás'}
  ],
  fieldDelimiter: ";"
});

const scraperObjectIweld = {
  pageCount: urlData.length,
  productUrls: [],
  
	async scraper(browser){
    //fs.writeFileSync(`alliweld.csv`, `cikkszam|termeknev|leiras|kategoriak|kep(ek)|beszerzesi_ar|netto_eladasi|\n`)
    getIweldPriceList()
    let time = Date.now()
    for (let i = 0; i < this.pageCount; i++){
      let page = await browser.newPage();
      console.log(`Navigating to ${urlData[i]}...`);
      await page.goto(urlData[i], {"waitUntil": "networkidle2"});
      // Wait for the required DOM to be rendered
      await page.waitForSelector('.productlist-container');
      // Get the link to all the required books
      let prodUrls = await page.$$eval('.productTemplate3', productBoxes => 
              productBoxes.map((productBox) => {
                let url = productBox.querySelector('.product_content [itemprop="name"] a').getAttribute('href')
           
                return {url: "https://iweld.hu" + url}
              })
            )
      prodUrls = prodUrls.map((prodUrl) => ({...prodUrl, categories: createCategoriesFromHref(urlData[i])}))
      this.productUrls = [...this.productUrls, ...prodUrls]

      await page.close()
    }
    let csvWriter = getNewCsv(numOfFiles)
    let excelObj = await createIweldExcelObj()
    for (let i = 0; i < this.productUrls.length; i++){
      let time = Date.now()
      let page = await browser.newPage()
      
      if (i !== 0 && i % 50 === 0){
        numOfFiles++;
        csvWriter = getNewCsv(numOfFiles)
      }
      await page.goto(this.productUrls[i].url)
      
      await page.waitForSelector('.product-details', { encoding: "utf8" });

      const prodId = await getSimpleTextFromPage(page, '.details-row.cikkszam .details-value')
      console.log({ currentProdId: prodId })
      const prodName = await getSimpleTextFromPage(page, '.details-main-container .product-name[itemprop="name"]')
      const description = await getSimpleTextFromPage(page, '.details-main-container .product-description')
      const categories = this.productUrls[i].categories
      const imageUrls = await getImageUrls(page)
      const retailPrice = excelObj[prodId]
      const netPrice = Math.ceil(retailPrice * 1.25)
      console.log({prodId, prodName, description, categories,imageUrls, retailPrice, netPrice})
      let sanitizedImgUrls = []
      let imgNum = 0;

      
      for (let i = 0; i < imageUrls.length; i++){

        
        console.log(imageUrls[i])
        await page.goto(imageUrls[i])
        const screenshot = await page.screenshot({
          encoding: 'binary'
        });
      
        const whitePixel = [255, 255, 255, 255];
       
        img1 = PNG.sync.read(screenshot);
        
        const whitePixels = img1.data.filter((val, index) => val === whitePixel[index % 4])
        const notWhitePixels = img1.data.filter((val, index) => val !== whitePixel[index % 4])
        
        const isNotWhiteImg = (notWhitePixels.length / whitePixels.length) > 0.05
        console.log({
          whitePixels: whitePixels.length,
          notWhitePixels:notWhitePixels.length,
          arany: notWhitePixels.length / whitePixels.length,
          isNotWhiteImg })

        if (isNotWhiteImg) {
          fs.writeFileSync(`img/${prodId}-${imgNum}.png`, screenshot, 'binary');
          sanitizedImgUrls.push(imageUrls[i])
          imgNum++
        }
      }
    
    
      const record = { 
        prodId, 
        prodName, 
        description, 
        categories,
        imageUrls: createImageUrlString(prodId, sanitizedImgUrls), 
        retailPrice, 
        netPrice, 
        manufacturer: "iweld" ,
        metaTitle: prodName.substring(0,69),
        metaDesc: description.substring(0,159)
      };
      await csvWriter.writeRecords([record])
     
      console.log(`Current product took: ${(Date.now() - time) / 1000 } seconds`)
      await page.close()
    }
    
    console.log(`Finished in: ${(Date.now() - time) / 1000 / 60}mins`)
	}
}

module.exports = scraperObjectIweld;
