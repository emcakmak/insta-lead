require('dotenv').config()
const cors = require("cors")
const app = express();
const axios = require("axios")
const serverless = require('serverless-http')
const express = require("express");
const router = express.Router()


const port = process.env.PORT || 8000;
let chrome = {}
let puppeteer
const endpoint = process.env.ensol_list_id + "/task";
const clickUp_URL = `https://api.clickup.com/api/v2/list/${endpoint}`;
if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    chrome = require("chrome-aws-lambda");
    puppeteer = require("puppeteer-core");
} else {
    puppeteer = require("puppeteer");
}
app.use(cors());
router.get("/", (req, res) => {
    res.send("Server running");
});
router.get("/create", async (req, res) => {
    let options = {}
    if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
        options = {
            args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
            defaultViewport: chrome.defaultViewport,
            executablePath: await chrome.executablePath,
            headless: true,
            ignoreHTTPSErrors: true,
        };
    }
    try {
        let bio
        let browser = await puppeteer.launch(options);
        let page = await browser.newPage();
        await page.goto(req.query.url);
        let button = await page.waitForSelector('._a9--')
        await button.click()
        await page.waitForSelector('._aa_c')
        let element = await page.$('._aa_c')
        bio = await page.evaluate(el => el.textContent, element)
        const username = req.query.url.split(".com")[1].replaceAll("/", "");
        await axios({
            method: "POST",
            url: clickUp_URL,
            headers: {
                authorization: process.env.API_KEY,
            },
            data: {
                name: `${username}`,
                markdown_description: ` * __Instagram:__${req.query.url} \n* __Numéro:__ \n* __Adresse:__ \n* __Email:__ \n* __Besoin:__ \n* __Détails:__${bio} \n* __Lien Drive:__ \n* __Website:__`,
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
                console.log("Script ran successfully has passed");
                res.status(resp.status)
                res.send(resp.data)
            } else {
                console.log("Something went wrong, please try again");
            }
        }).catch(err => console.log(err))
    } catch (err) {
        console.error(err)
        return null;
    }
})
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

app.use('./netlify/functions/api', router)

module.exports.handler = serverless(app)