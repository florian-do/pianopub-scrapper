// express server
const express = require("express");
const app = express();
const http = require('http');
const axios = require('axios');

const cheerio = require("cheerio");
const pretty = require("pretty");

const hostname = 'lapusheen.chat';
const port = process.env.PORT || 3000;


app.get("/search", async (req, response) => {
    const res = await axios.get('https://pianos.pub/search?q=Toronto&lat=&lon=');
    res.headers['content-type'] = 'text/html; charset=utf-8'
    console.log(req.query.q)
    console.log(req.query.lat)
    console.log(req.query.lon)
    const articles = getArticles(res.data);
    response.set("Content-Type", "text/json").status(200).send(articles);
    // response.status(200).send("<html style=\" background: black; \">ok</html>");
});

var listener = app.listen(port, function () {
  console.log("Your app is listening on port " + listener.address().port);
});

function getArticles(rootHtml) {
  const $ = cheerio.load(rootHtml)
  const articlesElement = $('article')
  const script = $('script');
  const articles = [];
  var scriptMapObject = null;

  script.each((idx, el) => {
    const prefixe = "var mapData = ";
    const position = $(el).html().search(prefixe);
    if (position != -1) {
      const content = $(el).html();
      const end = content.search("];");
      var jsonString = content.substring(position + prefixe.length, end).trim();
      jsonString = jsonString.substring(0, jsonString.length - 1)+"]";
      const objKeysRegex = /({|,)(?:\s*)(?:')?([A-Za-z_$\.][A-Za-z0-9_ \-\.$]*)(?:')?(?:\s*):/g;// look for object names
      const newQuotedKeysString = jsonString.replace(objKeysRegex, "$1\"$2\":");// all object names should be double quoted
      scriptMapObject = JSON.parse(newQuotedKeysString);
    }
  });

  articlesElement.each((idx, el) => {
    if (el != null) {
      const article = {
        id: "",
        name: "", 
        src: "", 
        description: "",
        availability: "",
        lat: "",
        lon: ""
      };

      // subString(4) to remove the cell prefixe
      article.id = $(el).attr('id').substring(4);
      article.name = $(el).children("div").children('a').text();
      article.description = $(el).children("div").children('p').text();
      article.availability = $(el).children("div.pb2.pt0.ph3.bb.b--black-90.bg-black-30.f5.b.white").text();
      article.src = $(el).children("div").children('div').children('a').children('img').attr('src');
      const scriptMap = scriptMapObject.filter(it => it.id === article.id);
      article.lat = scriptMap[0].lat;
      article.lon = scriptMap[0].lon;
      articles.push(article)
    }
  })

  return articles;
}
