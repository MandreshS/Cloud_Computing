const express= require('express');
const app=express();
const superagent= require('superagent');
const https = require("https");

var port = process.env.PORT || 8080; // important for deployment later
const server = require('http').createServer(app);
const io = require('socket.io')(server);
server.listen(port); //changed from app.listen(port)
app.use(express.static('static'));
app.use(express.urlencoded({extended: false}));
console.log("WebChat server is running on port " + port);
app.get("/", (req,res)=>{
    res.sendFile(__dirname + '/static/chatclient.html')
})

function BroadcastAuthenticatedClients(event,message){
        console.log(message);
    var sockets = io.sockets.sockets;
    for (var id in sockets){
        const socketclient = sockets[id];
        if(socketclient && socketclient.authenticated){
            socketclient.emit(event,message);
}
}}

//login API
function login(username,password,callback){
    //http.get(`https://cca-sundararajanm1-
    //webc.herokuapp.com/login/`+username+`/`+password+``)
    superagent.get(`https://cca-sundararajanm1-webc.herokuapp.com/login/${username}/${password}`)
    .end((err, res) => {
        if (res.body.success){
            //const result = JSON.parse(data);
            return callback(true,res.body.message,null);
            }else
                callback(false,res.body.message,null);
            
    })}

//Register API
function register(account,callback){
const {fullname,username,email,password} = account;
   // let microservice ='https://cca-sundararajanm1-webc.herokuapp.com/'
    superagent.get(`https://cca-sundararajanm1-webc.herokuapp.com/createuser/${fullname}/${username}/${email}/${password}`)
    .end((err, res) => {
        if (res.body.success){
            //data = JSON.parse(data);
            return callback(true,res.body.message,null);//data.respomse
            }else
            callback(false,res.body.message,null);//data.message
            
    })}
        //https.get(microservice,(response)=>{
        //let data='';
 
//events: online and responses
io.on('connection', (socketclient) =>{
console.log('A new Client is connected!');
var onlineClients= Object.keys(io.sockets.sockets).length;
var welcomemessage =`A new user is connected! Number of Connected Clients: ${onlineClients}`;
console.log(welcomemessage);
io.emit("online",welcomemessage);
socketclient.on("message",(data) =>{
   // console.log(`Data from a ${socketclient.username} `+ data);
   BroadcastAuthenticatedClients("message",`${socketclient.username} says: ${data}`);
});
socketclient.on("typing",() =>{
    //console.log(`${socketclient.username} is Typing ...`);
    BroadcastAuthenticatedClients("typing",`${socketclient.username} is typing ...`);
});
socketclient.on('disconnect',() =>{
    var onlineClients=Object.keys(io.sockets.sockets).length;
    var byemessage=`${socketclient.username} is disconnected! Number of Connected Clients: ${onlineClients}`;
    //console.log(byemessage);
    BroadcastAuthenticatedClients("online",byemessage);
});

socketclient.on("logout", (username) => { 
console.log("user logged out",username);
  BroadcastAuthenticatedClients("logout",`${socketclient.username} has logged out.`);
});


//login event
socketclient.on("login",(username,password,account) => {
        login(username,password,(authenticated,message) => {
           if(authenticated){
               socketclient.authenticated=true;
               socketclient.username=username;
               socketclient.account=account;
               socketclient.emit("authenticated",message);
               console.log(`${username} is authenticated`);

                var onlineClients = Object.keys(io.sockets.sockets).length;
                var welcomemessage = `${username} is connected! Number of connected clients: ${onlineClients}`;
                BroadcastAuthenticatedClients("online", welcomemessage);             //console.log(welcomemessage);
               console.log(`${username} is authenticated`);
            }else{

             socketclient.emit("loginfailed",message);
               console.log(`Login failed:${username} Try again`);
           }
       });
   });

//Register event
socketclient.on("register", (account) => {
//console.log(`Login data: ${account}`);
register(account,(authenticated,message,account)=>{
if (authenticated){
socketclient.authenticated=true;
socketclient.emit("registered", message);
//console.log("Registered Sucessfully" +message);
}else{
socketclient.emit("notregistered",message);
//console.log("Login failed: "+ message);
}
})
});
});