const request = require('request-promise');
const cheerio = require('cheerio');
const ObjectsToCsv = require('objects-to-csv');

const url = "https://sfbay.craigslist.org/d/software-qa-dba-etc/search/sof";

const scrapeResult = {
  title: 'EAH IS HIRING FOR A BUSINESS SYSTEMS IMPLEMENTATION ANALYST',
  description: 'Position is for a full-time Systems Implementation Analyst to work in the EAH Corporate office located in San Rafael.',
  datePosted: new Date('2020-06-13'),
  url: 'https://sfbay.craigslist.org/nby/sof/d/san-quentin-eah-is-hiring-for-business/7159011735.html',
  hood: '(san rafael)',
  address: '22 Pelican Way',
  compensation: 'Salary commensurate to experience.'
}

const scrapeResults = []

async function scrapeJobHeader() {
  try {
    const htmlResult = await request.get(url);
    const $ = await cheerio.load(htmlResult);

    $('.result-info').each((index, element) => { 
      const resultTitle = $(element).children(".result-title");
      const resultDate = $(element).children(".result-date");
      const title = resultTitle.text();
      const url = resultTitle.attr("href");
      const datePosted = resultDate.attr("datetime");
      const hood = $(element).find(".result-hood").text();
      const scrapeResult = { title, url, datePosted, hood };
      scrapeResults.push(scrapeResult)
    })
    return scrapeResults;

  } catch (err) {
    console.log(err);
  }
}
async function scrapeDescription(jobsWithHeaders) {
  return await Promise.all(jobsWithHeaders.map(async (job) => {
    try {
      const htmlResult = await request.get(job.url);
      const $ = await cheerio.load(htmlResult);
      $(".print-qrcode-container").remove();
      job.description = $("#postingbody").text();
      job.address = $("div.mapaddress").text();
      const compensationText = $(".attrgroup").children().first().text();
      job.compensation = compensationText.replace("compensation: ", "");
      return job;
    } catch(err) {
      console.log(err);
    }
  }))
}

async function createCsvFile(data) {
  const csv = new ObjectsToCsv(data);
 
  // Save to file:
  await csv.toDisk('./test.csv');
 
  // Return the CSV file as string:
  // console.log(await csv.toString());

}

async function scrapeCraigslist() {
  const jobsWithHeaders = await scrapeJobHeader();
  const jobsFullData = await scrapeDescription(jobsWithHeaders);
  await createCsvFile(jobsFullData);
  // console.log(jobsFullData);
  // console.log(jobsWithHeaders.length);
}

scrapeCraigslist();