const http = require('http')


const people = [
  {
    "name": "Matt Zabriskie",
    "github": "mzabriskie",
    "twitter": "mzabriskie",
    "avatar": "199035"
  },
  {
    "name": "Ryan Florence",
    "github": "rpflorence",
    "twitter": "ryanflorence",
    "avatar": "100200"
  },
  {
    "name": "Kent C. Dodds",
    "github": "kentcdodds",
    "twitter": "kentcdodds",
    "avatar": "1500684"
  },
  {
    "name": "Chris Esplin",
    "github": "deltaepsilon",
    "twitter": "chrisesplin",
    "avatar": "878947"
  }
];

const server = http.createServer((req, res) => {

  res.setHeader(
    'Access-Control-Allow-Origin', '*'
  )
  res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.writeHead(200, {
    'Content-Type': 'text/json'
  });
  
  if (req.url === '/get') {

    res.write(JSON.stringify(people));
  }
  if (['/post', '/upload'].includes(req.url)) {
    let data = '';
  
    req.on('data', function (chunk) {
      data += chunk;
    });

    return req.on('end', function () {
      console.log('POST data received');
      res.write(JSON.stringify(data));
      res.end();
    });
  }
  res.end();
})
server.listen(4000, () => {
  console.log('server started at http://localhost:4000  ......')
})
