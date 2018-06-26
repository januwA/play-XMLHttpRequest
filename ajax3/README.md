```
let http = ajanuw.create({
      uri: 'http://localhost:1995/api',
      timeout: 3000
    });

    http.request('get', '/get', {
      body: {
        body: 'body'
      },
      query: {
        query: 'query',
      },
      set: {

      },
      timeout: '2000',
      resType: 'json'
    }
```