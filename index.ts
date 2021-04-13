require('dotenv').config();
import axios from "axios";
import cheerio from "cheerio";
import { launch } from "puppeteer";

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

    if (status !== 'Currently unavailable.') {
        const title = `${item} - Amazon`;
        const message = `${item} is ${status}`;
        await sendNotification(title, message, url);
    }
    await browser.close();
};

const sendNotification = async (title: string, message: string, url: string) => {
    if (!process.env.WPUSH_ID) return console.log('No WirePusher ID provided. Couldn\'t notify: ', { title, message, url });

    const id = process.env.WPUSH_ID;
    title = encodeURIComponent(title);
    message = encodeURIComponent(message);
    url = encodeURIComponent(url);

    await axios.get(`https://wirepusher.com/send?id=${id}&title=${title}&message=${message}&type=monitoring&action=${url}`).catch(console.warn);
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
        sendNotification('Uncaught exception in amazon stocker!', err?.message || JSON.stringify(err), '');
    }
}

setInterval(main, parseInt(process.env.INTERVAL || '100000'));
main();
