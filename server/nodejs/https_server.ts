#!/usr/bin/env node

import { ExpressionStatement } from "typescript";

import express from 'express';
import fs from 'fs';
import { Stream } from "stream";
const path = require('path');
const {exec} = require('child_process');
const app: express.Express = express();
//https settings
const rootDir: string = path.resolve(__dirname, '../../');
const https = require('https');
const privateKey = fs.readFileSync(path.resolve(rootDir, 'server/nodejs/privkey.pem'), 'utf8');
const certificate = fs.readFileSync(path.resolve(rootDir, 'server/nodejs/fullchain.pem'), 'utf8');
const credentials = {key: privateKey, cert: certificate};
//http to https auto redirection
const http = require('http');
http.createServer((express()).all("*", function (request, response) {
  response.redirect(`https://${request.hostname}${request.url}`);
})).listen(80);
const httpsServer = https.createServer(credentials, app);
const io = require('socket.io')(httpsServer);
const port : number = 443;
//database (mongoose)
const User = require('./database');
import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost:27017/compilerserver', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.Promise = global.Promise;
//passport
// const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;

// passport.use(new LocalStrategy(
//   function
// ));

const accountsDir: string = '/media/usb/compilerserver/accounts/';
const rootdirectory: string = path.resolve(rootDir, 'client');

//request時に実行するmiddleware function
function everyRequest(req: express.Request, res: express.Response, next: express.NextFunction)
{
    console.log('Request URL: ', req.originalUrl);
    next();
}

app.use(express.static(rootdirectory));
app.use(everyRequest);
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req: express.Request, res: express.Response) => {
    res.sendFile('index.html', {root: rootdirectory});
})

app.get('/login', (req: express.Request, res: express.Response) => {
    res.sendFile('login.html', {root: rootdirectory});
})

app.post('/login', (req: express.Request, res: express.Response) => {
  console.log(req.body);
})

app.get('/editor', (req: express.Request, res: express.Response) => {
    res.sendFile('editor.html', {root: rootdirectory});
})

app.get('/docs', (req: express.Request, res: express.Response) => {
    res.sendFile('docs.html', {root: rootdirectory});
})

app.get('/admin', (req: express.Request, res: express.Response) => {
    res.sendFile('admin.html', {root: rootdirectory});
})

app.get('/register', (req: express.Request, res: express.Response) => {
  res.sendFile('register.html', {root: rootdirectory});
})

app.post('/register', (req: express.Request, res: express.Response) => {
  console.log(req.body);
})

app.get('/pass_reset', (req: express.Request, res: express.Response) => {
  res.sendFile('pass_reset.html', {root: rootdirectory});
})

app.get('/register_check', (req: express.Request, res: express.Response) => {
  console.log(req.originalUrl);
  res.send('error');
})

let users: Map<string, string> = new Map();
let usersDirectory: Map<string, string> = new Map();

//ディレクトリー読むための再帰関数
async function readDirectory(path: string, socket: any, result: dirObject, callback: Function)
{
  return new Promise((resolve, reject) => {
    fs.readdir(path, {withFileTypes: true},async (err: NodeJS.ErrnoException | null, content: fs.Dirent[])=>{
      if(err)
      {
        console.log('couldnt load project', 24);
        socket.emit('loadedProject', {
          value: 'Could not load folder ' + path,
          style: err
        });
      }
      else
      {
        let files: Map<string, dirObject> = new Map();
        let folders: Map<string, dirObject> = new Map();
        let fn = function processContent(element: fs.Dirent) {
          if(element.isFile())
          {
            files.set(element.name, {type: 'file', name : element.name});
            return {type: 'file', name : element.name};
          }
          else if(element.isDirectory())
          {
            return readDirectory(path + '/' + element.name, socket, {type: 'folder', name: element.name, value: []}, (val: dirObject) => {
              folders.set(element.name, val);
             return val;
            });
          }
        }
        
        let temp = await Promise.all(content.map(fn));
        let tempfolders: Map<string, dirObject> = new Map([...folders].sort((a, b) => Number(a[0] > b[0])));
        tempfolders.forEach(folder => {
          if(result.value)
            result.value.push(folder);
        })
        let tempfiles: Map<string, dirObject> = new Map([...files].sort((a, b) => Number(a[0] > b[0])));
        tempfiles.forEach(file => {
          if(result.value)
            result.value.push(file);
        }); 
      }
      resolve(result);
      return callback(result);
    });
  })
}

io.sockets.on('connection', (socket:any) => {
    var address = socket.handshake.address;
    console.log('New connection from ' + JSON.stringify(address) + socket.id);
    //defaultはguestとして入る
    users.set(socket.id, "guest");
    fs.mkdir(accountsDir + 'guest/' + socket.id, (err) => {
      if(err)
      {
        console.log('could not create ' + accountsDir + 'guest/' + socket.id);
      }
    });
    usersDirectory.set(socket.id, accountsDir + 'guest/' + socket.id);
    socket.on('compile', async (input: compileData) => {
      // コンパイル
      exec('echo \"' + input.value + '\" > ' + usersDirectory.get(socket.id) + '/' + input.filename, (err: NodeJS.ErrnoException| null, stdout: Stream, stderr: Stream) => {
        if(err)
        {
          socket.emit('output', {
            value: stderr,
            style: 'err'
          })
        }
        exec('./compiler ' + input.filename + ' ' + usersDirectory.get(socket.id) + '/', (err: NodeJS.ErrnoException| null, stdout: Stream, stderr: Stream) =>
        {
          // 出力
          console.log(err, stdout, stderr);
          if(err) {
            socket.emit('output', {
              value: stderr,
              style: 'err'
            });
            exec('sudo rm -f ' + input.filename + ' .' + input.filename);
          }else {
            socket.emit('output', {
              value: stdout,
              style: 'log'
            });
            exec('sudo rm -f ' + input.filename + ' .' + input.filename);
          }
          return;
        });
      });
      
  
    })
    socket.on('save', async (input: saveData) => {
      //ファイルにセーブ
      if(users.get(socket.id) == 'guest')
      {
        socket.emit('saved', {
          value: 'If you want to save a file, please create an account.',
          style: 'err',
          success: false
        })
      }
      else{
        exec('echo \"' + input.value + '\" > ' + usersDirectory.get(socket.id) + '/' + input.projectName + '/' + input.filename, 
        (err: NodeJS.ErrnoException| null, stdout: Stream, stderr: Stream) => {
          if(err) {
            socket.emit('saved', {
              value: stderr + ' : Save not complete.',
              style : 'err',
              success: false
            })
          }
          else
          {
            socket.emit('saved', {
              value: 'Save complete.',
              style: 'info',
              success: true
            })
          }
          return;
        });
      };
    });
    //loginシステム
    socket.on('login', async input => 
    {
      //usersのvalueをアカウント名にする
      users.set(socket.id, input.accountName);
      usersDirectory.set(socket.id, accountsDir + input.accountName);
    });
    
    //すでに作られたProjectをロードする
    socket.on('loadProject', async (input: loadProjectData) => 
    {
      let result: dirObject = {type: 'folder', name: input.projectName, value: []};
      // console.log(readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result));
      readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result, () => {}).then((val) => {
        socket.emit('loadedProject', {
          value: val,
          style: 'log'
        });
      });
    });
    //Projectを作る
    socket.on('createProject', async (input: createProjectData) => {
      fs.mkdir(usersDirectory.get(socket.id) + '/' + input.projectName, (err) => {
        if(err)
        {
          socket.emit('createdProject', {
            value: 'Could not create project '+ input.projectName,
            style: 'err'
          })
        }
        else
        {
          socket.emit('createdProject', {
            value: 'Created project ' + input.projectName,
            style: 'log'
          })
        }
      });
    })
    //disconnectしたとき
    socket.on('disconnect', () => {
      console.log("a");
      if(users.get(socket.id) == 'guest')
      {
        if(usersDirectory.get(socket.id))
        {
          fs.rmdir((usersDirectory.get(socket.id)), (err: NodeJS.ErrnoException | null) => {
            console.log(usersDirectory.get(socket.id));
          });        
        }
      }
    })
  });
  
  httpsServer.listen(port, () => {
    console.log('Server at https://rootlang.ddns.net');
  })