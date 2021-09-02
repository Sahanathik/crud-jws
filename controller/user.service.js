const moment = require("moment");
const bcrypt = require("bcrypt")
const database = require('../helper/db.js');
const jwt = require("jsonwebtoken");

const user = database.users;
const product = database.product;


module.exports = {
	addUserDetails,
	getTheUserDetails,
	getIndiDetails,
	updateTheUserDetails,
	deleteTheUserDetails,
	addProductByUsers,
	getTheProductDetails,
	getTheProductAndUserDetails,
	emailIDAvailability,
	mobile_Availability,
	register,
	login,
	forgetPassword,
	resetPassword,
	logout
}


// add the user details;
async function addUserDetails(req,callback) {
	let user_detail = new user(req);
	await user_detail.save().then((data)=>{
		callback(data);
	})
};

async function getTheUserDetails(req,callback) {
	await user.find().exec().then((data)=>{
		callback(data);
	})
}

async function getIndiDetails(req,callback) {
	await user.findOne({"_id": req._id}).exec().then((data)=>{
		callback(data);
	})
};

// update the user details
async function updateTheUserDetails(req,callback) {
	let condition = req._id;
	let update = req.updateObj;
	let option = {new : true}
	await user.findOneAndUpdate(condition, update, option).exec().then((data)=>{
		callback(data);
	})
}

async function deleteTheUserDetails(req,callback){
	await user.findByIdAndRemove(req).exec().then((data)=>{
		callback(data);
	})
};

// add the product by users;
async function addProductByUsers(req,callback) {
	let products = new product(req);
	await products.save().then((data)=>{
		callback(data);
	})
};

//get the user added details;
async function getTheProductDetails(req,callback) {
	await product.find(req).exec().then((data)=>{
		callback(data);
	})
}

// get the product and user details
async function getTheProductAndUserDetails(req,callback) {
	await user.aggregate([
		{
			$lookup:{
				from:"products",
				localField: "uuid",
				foreignField: "user_id",
				as:"products_details"
			}
		}
	]).exec().then((data)=>{
		callback(data);
	});
};

// email id availability;
async function emailIDAvailability(req,callback) {	
	let email = req.email
	const email_detail = await user.find({"email": email}).exec();
	if(email_detail.length > 0){
		callback("email already exits")
	}else{
		callback("Success")
	}
};

async function mobile_Availability(req,res,next) {
	let mobile = req.query.mobile;
	const mobile_Availab = await user.find({"mobile": mobile}).exec();
	if(mobile_Availab.length > 0){
		res.json({"status": "Failed", "message": "Mobile already exists"});
	}else{
		res.json({"status": "Success", "message": ""});
	}
};

async function register(req,res,next) {
	let email = req.body.email;
	let mobile = req.body.mobile;
	let password = req.body.password;
	const email_detail = await user.find({"email": email}).exec();
	if(email_detail.length>0){
		throw res.json({"status": "Failed", "message": "email already exists"});
	}
	const mobile_Availab = await user.find({"mobile": mobile}).exec()
	if(mobile_Availab.length>0){
		throw res.json({"status": "Failed", "message": "Mobile already exists"});
	}
	let users = new user(req.body);
	if(req.body.password){
		let password = req.body.password;
		let salt = await bcrypt.genSalt(10);
		users.password = bcrypt.hashSync(password, salt);
		users.save();

		res.json({"status": "Success", "message": "Register successfully"});
	}else{
		res.json({"status": "Failed", "message": "Please Provide password"});
	}
}

// login 
async function login(req,res,next) {
	let email = req.query.email;
	let password = req.query.password;
	console.log(password);
	let users = await user.findOne({"email": email}).exec();
	let pass = users.password
	let match = await bcrypt.compare(password, pass);
	let payload = {users:{id: users.uuid}}
	let signature = "randomString";
	let token = jwt.sign(payload, signature, {expiresIn: 10000});

	let data = await user.findOneAndUpdate({email: email}, {login_status: true, verify_token: token}, {new: true}).exec();

	if(match){
		res.json({"status": "Success", "message": "Login successfully", "data": data});
	}else{
		res.json({"status": "Failed", "message": "Username or password wrong"});
	}
}

// forgetpassword;
async function forgetPassword(req,res,next) {
	try{
		let email = req.query.email;
		let NewPassword = req.query.password;
		let users = await user.findOne({"email": email}).exec();
		let salt = await bcrypt.genSalt(10);
		let pass = bcrypt.hashSync(NewPassword, salt);
		const data  = await user.findOneAndUpdate({email: email}, {password: pass}, {new: true}).exec()
		res.json({"status": "Success", "message": "Password changed", "data": data});
	}catch(err){
		res.json({"status": "Failed", "message": err.message});
	}
};

// reset password
async function resetPassword(req,res,next){
	let email = req.query.email;
	let oldpassword = req.query.password;
	let NewPassword = req.query.new_password;
	let users = await user.findOne({"email": email}).exec();
	let pass = users.password;
	let match = await bcrypt.compare(oldpassword, pass);
	if(!match){
		res.json({"status": "Failed", "message": "Please enter the correct password"});
	}else{
		let salt = await bcrypt.genSalt(10);
		let pass = bcrypt.hashSync(NewPassword, salt);
		const data  = await user.findOneAndUpdate({email: email}, {password: pass}, {new: true}).exec()
		res.json({"status": "Success", "message": "Password changed", "data": data});
	}
}

// logout
async function logout(req,res,next) {
	let email = req.query.email;
	await user.findOneAndUpdate({email: email}, {login_status: false, verify_token: ""}, {new: true}).exec();
	res.json({"status": "Success", "message": "logout successfully"});
}

