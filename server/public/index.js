$('#get-data').click(() => {
  fetch('/api/all', {
    responseType: 'arraybuffer'
  })
    .then(res => res.arrayBuffer())
    .then(buf => {
      buf = new Uint8Array(buf);
      protobuf.load('/proto/message.proto', (err, root) => {
        const AllMessages = root.lookupType('movies.AllMessages');
        const decodedPayload = AllMessages.decode(buf);
        console.log(decodedPayload);
        const list = $('#list');
        list.empty();
        decodedPayload.messages.forEach(el => {
          list.append(`<li>${el.movie}, ${el.rating}/10</li>`);
        });
      });
    });
});

$('#submit').click(() => {
  const movie = $('#movie-input').val();
  const rating = parseInt($('#rating-input').val());

  protobuf.load('/proto/message.proto', (err, root) => {
    const Message = root.lookupType('movies.Message');
    const payload = { movie, rating };
    err = Message.verify(payload);
    if (err) {
      throw err;
    }

    const message = Message.create(payload);
    const buffer = Message.encode(message).finish();

    fetch('/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: buffer
    }).then(res => console.log(res));
  });
});
