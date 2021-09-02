const express = require("express");
const app = express();
const os = require("os");
const bodyParser = require("body-parser");
const cors = require("cors");


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.use("/user", require("./controller/user.controller"))




let server = app.listen(6000, function(){
	console.log('Server listen on port: 6000');
})