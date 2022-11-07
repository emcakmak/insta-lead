const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')
const axios = require("axios")
require('dotenv').config()


exports.handler = async function (event, context) {
    const URL = event.queryStringParameters.url
    let status, browser
    console.log("Visiting " + URL)

    const endpoint = process.env.ensol_list_id + "/task";
    const clickUp_URL = `https://api.clickup.com/api/v2/list/${endpoint}`;

    try {
        let bio
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath,
            headless: true
        })
        let page = await browser.newPage();
        await page.goto(URL);
        let button = await page.waitForSelector('._a9--')
        await button.click()
        await page.waitForSelector('._aa_c')
        let element = await page.$('._aa_c')
        bio = await page.evaluate(el => el.textContent, element)
        const username = URL.split(".com")[1].replaceAll("/", "");
        await axios({
            method: "POST",
            url: clickUp_URL,
            headers: {
                authorization: process.env.API_KEY,
            },
            data: {
                name: `${username}`,
                markdown_description: ` * __Instagram:__${URL} \n* __Numéro:__ \n* __Adresse:__ \n* __Email:__ \n* __Besoin:__ \n* __Détails:__${bio} \n* __Lien Drive:__ \n* __Website:__`,
                assignees: [`${parseInt(process.env.ASSIGNEE_NO)}`],
                tags: ["instagram"],
                status: "qualified lead",
                priority: 3,
                due_date: +Date.now() + 86400000,
                due_date_time: false,
                time_estimate: 0,
                start_date_time: false,
                notify_all: true,
                parent: null,
                links_to: null,
                custom_fields: [{}],
            }
        }).then(resp => {
            if (resp.status == 200) {
                console.log("Script ran successfully");
                status = "Script ran successfully, lead created"
            } else {
                console.log("Something went wrong, please try again");
                status = "something went wrong"
            }
        }).catch(err => console.log(err))
    } catch (err) {
        console.error(err)
        return null;
    }

    await browser.close();

    return {
        statusCode: 200,
        body: JSON.stringify({
            status: status
        })
    }
}