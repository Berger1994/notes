const express = require('express')
const path = require('path');
const fileUpload = require('express-fileupload');
const url = require('url');
const fs = require("fs");

const { PdfDocument } = require("@ironsoftware/ironpdf");

const app = express()
const port = 3000


const pdfsDir = __dirname + '/pdfs/';
if (!fs.existsSync(pdfsDir)) fs.mkdirSync(pdfsDir);

app.use(fileUpload());
const router = express.Router();

router.post('/upload', (req, res) => {
    const file = req.files.file;
    const id = new Date().getTime();
    const dir = `${pdfsDir}${id}/`;
    const path = dir + "content.pdf";

    if (fs.existsSync(dir)) {
        res.status(500).send("hast du schon hochgeladen!");
        return;
    }
    fs.mkdirSync(dir);

    fs.writeFileSync(dir + "name", file.name);
    file.mv(path, async (err) => {
        if (err) return res.status(500).send(err);

        await PdfDocument.fromFile(path).then(async (pdf) => {
            const pages = await pdf.getPageCount();
            for (let i = 0; i < pages; i++) {
                await pdf.rasterizeToImageFiles(dir + `image-${i}.png`, { fromPages: [i] });
            }

            res.redirect(`/notes/show.html?id=${id}`);
        });


    })
});

router.get("/pdfs", (req, res) => {
    const pdfs = fs.readdirSync(pdfsDir);

    res.send(pdfs.map(pdf => {
        const dir = `${pdfsDir}${pdf}`;
        const name = fs.readFileSync(dir + "/name", { encoding: 'utf8', flag: 'r' });
        const images = fs.readdirSync(dir);
        return {
            id: pdf,
            name,
            images: images.filter(i => i.startsWith("image-")),
        };
    }))
});
router.get("/pdfs/:id", (req, res) => {
    const { id } = req.params;
    const dir = `${pdfsDir}${id}`;
    const name = fs.readFileSync(dir + "/name", { encoding: 'utf8', flag: 'r' });
    const images = fs.readdirSync(dir);
    res.send({
        id: id,
        name,
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