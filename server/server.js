const path = require('path');
const express = require('express');
const app = express();

const ProtoBuf = require('protobufjs');

const PORT = 3000;

app.use('/js', express.static(path.resolve(__dirname, './public')));
app.use('/proto', express.static(path.resolve(__dirname, './protobufs')));

// dataArray to simulate a database
let dataArray = [{ movie: 'inception', rating: 7 }];

// create api endpoint to send information to client
app.get('/api/all', (req, res) => {
  ProtoBuf.load(
    path.resolve(__dirname, './protobufs/message.proto'),
    (err, root) => {
      if (err) throw err;

      const AllMessages = root.lookupType('movies.AllMessages');

      const payload = { messages: [] };

      dataArray.forEach(data => {
        payload.messages.push(data);
      });

      const errMsg = AllMessages.verify(payload);
      if (errMsg) throw errMsg;

      const payloadMsg = AllMessages.create(payload);

      const buffer = AllMessages.encode(payloadMsg).finish();

      res.send(buffer);

      // const decoded = AllMessages.decode(buffer);

      // console.log(decoded);
    }
  );
});

// write middleware to parse octet-stream
app.use((req, res, next) => {
  if (!req.is('application/octet-stream')) {
    console.log('not octet stream');
    return next();
  }

  let data = [];
  req.on('data', chunk => data.push(chunk));

  req.on('end', () => {
    if (data.length <= 0) return next();

    data = Buffer.concat(data);
    res.locals = { buffer: data };
    next();
  });
});

app.post('/post', (req, res) => {
  ProtoBuf.load(
    path.resolve(__dirname, './protobufs/message.proto'),
    (err, root) => {
      //
      const Message = root.lookupType('movies.Message');
      const { buffer } = res.locals;
      var decoded = Message.decode(buffer);
      console.log(decoded);
      dataArray.push(decoded);
    }
  );
  //
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, './public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
