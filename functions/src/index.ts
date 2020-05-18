import * as functions from 'firebase-functions';
const admin = require('firebase-admin');
admin.initializeApp();
const BusBoy = require('busboy');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();

exports.parseMail = functions.https.onRequest(async (req, res) => {
    const busboy = new BusBoy({ headers: req.headers });
    const fields: any = {};
    busboy.on('field', (fieldname: any, val: any) => {
        fields[fieldname] = val;
    });
    busboy.on('finish', async () => {
        let html = fields['html'].replace(/3D"/gi, '"');
        const frag = JSDOM.fragment(html.replace(/=\n/gi, ''));
        const links = frag.querySelectorAll("a");
        for (const link of links) {
            let isNew = false;
            const date = new Date();
            const url = link.getAttribute('href');
            const parent = link.parentElement.parentElement.parentElement.parentElement; // tbody
            const trs = parent.children;
            if (trs.length == 5) {
                const top = parent.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
                if (top.previousElementSibling.textContent === 'Novedad') isNew = true;
                const ref = await firestore.collection('properties').doc();
                const pat = /((?: *)(\d*)(?: *)(?:m²))?((?: *)(\d*)(?: *)(?:hab.))?((?: *)(\d+)(:?.*)(:?planta)(?: *)(interior|exterior| ))?/;
                let price = 0, meters = 0, rooms = 0, flat = 0, orientation = '';
                const summary = decodeURI(trs[2].textContent.replace(/=/gi, '%'));
                const matches = summary.match(pat);

                if (matches) {
                    if (matches[2]) meters = parseInt(matches[2]);
                    if (matches[4]) rooms = parseInt(matches[4]);
                    if (matches[6]) flat = parseInt(matches[6]);
                    if (matches[9]) orientation = matches[9];
                }
                const pat2 = /\d+/;
                const p = decodeURI(trs[1].textContent.replace(/=/gi, '%'));
                const p2 = p.replace('.', '');
                const matches2 = p2.match(pat2);
                if (matches2) {
                    if (matches2[0]) price = parseInt(matches2[0]);
                }
                ref.set({
                    url: url,
                    date: admin.firestore.Timestamp.fromDate(date),
                    title: decodeURI(trs[0].textContent.replace(/=/gi, '%')),
                    price: price,
                    summary: summary,
                    meters: meters,
                    rooms: rooms,
                    flat: flat,
                    orientation: orientation,
                    isNew: isNew,
                });
            }
        }
    });
    busboy.end(req.rawBody);
    res.status(200).send({result: 'ok'});
})
