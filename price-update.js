const { getIweldPriceList } = require("./get-iweld-price-list")
const { createIweldExcelObj } = require('./createIweldExcelObj')
const https = require('https');

const getPrices = async () => {
  const time = Date.now()
  const secretKey = "c85a2278-bb51-11ed-afa1-0242ac120002"
  await getIweldPriceList() 

  const pricesObj = await createIweldExcelObj()
  const postBody = JSON.stringify({productData: pricesObj, secretKey})
  const options = { 
    hostname: 'eweld.hu',
    port: 443, 
    path: '/priceupdateiweld/',
    method: 'POST', 
    headers: {   
      'Content-Type': 'application/json',
      'Content-Length': postBody.length + 2
    }  
  };
  
  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    }); 

    res.on('end', () => {  
      console.log( {
        body
      })
      console.log(`Finished in: ${(Date.now() - time) / 1000}secs`)
    });        
  });        
       
  req.on('error', (error) => {
    console.error(error);
  });
  
  req.write(postBody);
  req.end();
  
}  
      
getPrices()
module.exports =  {
  getPrices 
}
 