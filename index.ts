require('dotenv').config();
import cheerio from "cheerio";
import { launch, Page } from "puppeteer";
import { notify } from "./notifier";
// @ts-ignore
import imgur from "imgur";

let lastAvailable = false;

const isNotUnavailable = (status: string) => status !== 'Currently unavailable.';

const checkAvailable = async (item: string, url: string) => {
    const browser = await launch({ 
        headless: process.env.HEADLESS === 'true' ,
        args: ['--start-maximized'],
        // @ts-ignore
        defaultViewport: null
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const html = await page.evaluate(() => document.body.innerHTML);
    const $ = cheerio.load(html);
    const status = $('#availability > span').text().trim();

    console.log({ time: now(), status });

    if (isNotUnavailable(status) || lastAvailable) {
        lastAvailable = isNotUnavailable(status);
        const title = `${item} - Amazon`;
        const message = `${item} is ${status}`;
        const img_url = await getScreenshotLink(page);
        await notify(title, message, url, img_url);
    }
    await browser.close();
};

const getScreenshotLink = async (page: Page) => {
    const path = './node_modules/ss.png';
    await page.screenshot({ path });
    const json = await imgur.uploadFile(path);
    return json.link as string;
}

const now = () => new Date().toLocaleDateString('en-IN', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'Asia/Kolkata'
});

const main = () => {
    const link = "https://www.amazon.in/Xbox-Series-X/dp/B08J7QX1N1"; // "https://www.amazon.in/Xbox-Wireless-Controller-Phantom-Magenta/dp/B085TRQBWJ";
    const item = "XBox Series X";
    try {
        checkAvailable(item, link);
    }
    catch (err) {
        console.error(err);
        notify('Uncaught exception in amazon stocker!', err?.message || JSON.stringify(err), '');
    }
}

setInterval(main, parseInt(process.env.INTERVAL || '100000'));
main();
