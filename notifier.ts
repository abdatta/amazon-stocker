import axios from "axios";

export const notify = async (title: string, message: string, url: string, image_url?: string) => {
    console.log('Notifying:', { title, message, url, image_url });

    if (!process.env.WPUSH_ID) {
        return console.warn('No WirePusher ID provided. Couldn\'t notify!');
    }

    const id = process.env.WPUSH_ID;
    title = encodeURIComponent(title);
    message = encodeURIComponent(message);
    url = encodeURIComponent(url);
    image_url = image_url ? `&image_url=${encodeURIComponent(image_url)}` : '';

    const wpush_api = `https://wirepusher.com/send?id=${id}&title=${title}&message=${message}&type=amznstck&action=${url}${image_url}`;
    await axios.get(wpush_api).catch(console.warn);
};
