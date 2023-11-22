const express = require('express')
const path = require('path');
const fileUpload = require('express-fileupload');
const url = require('url');
const fs = require("fs");

const app = express()
const port = 3000

const { PdfDocument } = require("@ironsoftware/ironpdf");
// Convert PDF File to a PNG File
/*await PdfDocument.fromFile("./sample-pdf-file.pdf").then((resolve) => {
    resolve.rasterizeToImageFiles("./images/sample-pdf-file.png");
    return resolve;
});*/

const pdfsDir = __dirname + '/pdfs/';

app.use(fileUpload());
const router = express.Router();

router.post('/upload', (req, res) => {
    const file = req.files.file;
    const dir = `${pdfsDir}${file.name}`;
    const path = dir + "/content.pdf";

    if (fs.existsSync(dir)) {
        res.status(500).send("hast du schon hochgeladen!");
        return;
    }
    fs.mkdirSync(dir);

    file.mv(path, async (err) => {
        if (err) return res.status(500).send(err);

        await PdfDocument.fromFile(path).then(async (pdf) => {
            const pages = await pdf.getPageCount();
            for (let i = 0; i < pages; i++) {
                await pdf.rasterizeToImageFiles(dir + `image-${i}.png`, { fromPages: [i] });
            }

            res.send('File uploaded!');
        });
    })
});

router.get("/pdfs", (req, res) => {
    const pdfs = fs.readdirSync(pdfsDir);

    res.send(pdfs.map(pdf => {
        const images = fs.readdirSync(`${pdfsDir}${pdf}`);
        return {
            name: pdf,
            images: images.filter(i => i.startsWith("image-")),
        };
    }))
});
router.get("/pdfs/:name", (req, res) => {
    const { name } = req.params;
    const images = fs.readdirSync(`${pdfsDir}${name}`);
    res.send({
        name: name,
        images: images.filter(i => i.startsWith("image-")),
    });
});

router.get("/pdfs/:name/:image", (req, res) => {
    const { name, image } = req.params;
    res.sendFile(`${pdfsDir}${name}/${image}`);
});


router.get('/*', (req, res) => {
    let x = req.originalUrl;
    if (x.includes("?")) x = x.substring(0, x.indexOf("?"));
    if (x.startsWith("/notes")) x = x.substring("6");
    console.log(x);
    res.sendFile(path.join(__dirname + (x === "/" ? "/index.html" : x)))
});


app.use("/notes", router)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})