const CONSTANTS = {}
const FUNCTIONS = {}
console.log("RUN COMMONS FILE 2")

// ------ CONSTANTS ------
CONSTANTS['LIMIT'] = 100


// ------ FUNCTIONS ------
FUNCTIONS['getRecordWithProxy'] = (url, header, body) => {
  return new Promise(async (resolve, reject) => {
    let proxy = await kintone.proxy(url + encodeURI(` limit ${limit} offset ${offset}`), 'GET', header, body)
    if(JSON.parse(proxy[1]) != 200) return reject({'success': false, 'error': JSON.parse(proxy[0])})
    let record = JSON.parse(proxy[0]).records
    offset += limit
    resolve({'success': true, 'record': record})
  })
}

FUNCTIONS['getRecordsWithProxy'] = (url, header, body) => {
  let offset = 0
  let limit = CONSTANTS.LIMIT
  let records = []
  return new Promise(async (resolve, reject) => {
    let record_result = []
    do{
      let proxy = await kintone.proxy(url + encodeURI(` limit ${limit} offset ${offset}`), 'GET', header, body)
      if(JSON.parse(proxy[1]) != 200) return reject({'success': false, 'error': JSON.parse(proxy[0])})
      record_result = JSON.parse(proxy[0]).records
      records = records.concat(record_result)
      offset += limit
    }while(record_result.length == limit)
    resolve({'success': true, 'records': records})
  })
}


