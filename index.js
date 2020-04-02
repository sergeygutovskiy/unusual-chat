const express    = require('express');
const nodemailer = require('nodemailer');

const app  = express();
const http = require('http').createServer(app);
app.use(express.urlencoded({ extended: true }));

const io = require('socket.io')(http);


const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: "sergey.gutovsk@gmail.com",
		pass: "rbhjdf47rbhjdf47"
	}
});

var messages = [];
var users = [];
var newUserName;


app.get("/", (req, res) => { res.sendFile(__dirname + "/login.html"); });

app.post("/", (req, res) => { 

	if (req.body != null)
	{
		newUserName = req.body.name;
		res.sendFile(__dirname + "/index.html")

	} else {
		res.sendFile(__dirname + "/login.html")
	} 
});


io.on("connection", function(socket){
	console.log(newUserName + " connected");
	users.push({
		id: socket.id,
		name: newUserName
	});

	socket.emit("previous-messages", { messages: messages });
	io.emit("chat-info", { message: newUserName + " connected." });
	io.emit("chat-users", { users: users.map(user => { return user.name; }) });

	socket.on("message-to-server", (data) => {
		
		var author = users.filter(user => { return user.id == socket.id; })[0];
		var message = {
			authorName: author.name,
			body: data.message,
		}
		messages.push(message);

		io.emit("message-to-clients", message);

		var emailRequired = (message.body.slice(message.body.length - 7, message.body.length) == "[email]");
		if (emailRequired) {
			var mailOptions = {
				from: "sergey.gutovsk@gmail.com",
				to: "sergey.gutovsk@gmail.com",
				subject: "[CHAT] Message from " + message.authorName,
				text: message.body.slice(0, message.body.length - 7);
			};

			transporter.sendMail(mailOptions, function(error, info){
				if (error) {
					console.log(error);
				} else {
					console.log('Email sent: ' + info.response);
				}
			});
		}
	});

	socket.on('disconnect', function(){
		var user = users.filter(user => { return user.id == socket.id; })[0];
		users = users.filter(user => { return user.id != socket.id; });

		console.log(user.name + " disconnected");
		io.emit("chat-info", { message: user.name + " disconnected." });
		io.emit("chat-users", { users: users.map(user => { return user.name; }) });
	});
});


http.listen(process.env.PORT || 3000, function(){
	console.log('listening on ' + (process.env.PORT || 3000));
});