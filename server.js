const http = require("http");
const fs = require("fs");
const { EventEmitter } = require("events");
const path = require("path");
const logger = require("./logger");

const Newsletter = new EventEmitter();

const signupHandler = (contact) => {
  const { name, email } = contact;
  fs.appendFile("./contacts.csv", `${name}, ${email}` + "\n", (error) => {
    if (error) throw error;
    console.log(`Added [${name}, ${email}] to contacts.csv.`);
  });
};

Newsletter.on("signup", signupHandler);

http
  .createServer((req, res) => {
    const chunks = [];
    const { method, url } = req;
    req
      .on("error", (error) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        logger(500, method, url);
        res.end(JSON.stringify(error));
      })
      .on("data", (chunk) => chunks.push(chunk))
      .on("end", () => {
        if (url === "/newsletter_signup" && method === "POST") {
          logger(200, method, url);
          const data = JSON.parse(Buffer.concat(chunks).toString());
          Newsletter.emit("signup", data);
          res.end(JSON.stringify(data));
        } else if (url === "/newsletter_signup" && method === "GET") {
          res.writeHead(200, { "Content-Type": "text/html" });
          logger(200, method, url);
          fs.readFile(
            path.join(__dirname, "./static/newsletter_signup.html"),
            (err, data) => {
              err && console.log(err);
              res.writeHead(200, { "Content-Type": "text/html" });
              res.end(data);
            }
          );
        } else {
          logger(200, method, url);
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "I'm sorry, the only usable endpoint is <a href='/newsletter_signup'>/newsletter_signup</a>"
          );
        }
      });
  })
  .listen(3000, () => console.log("Server started at localhost:3000"));
