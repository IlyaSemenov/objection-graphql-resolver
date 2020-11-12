/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`src/tests/main.test.ts TAP Main > Posts where author_id=2 1`] = `
Object {
  "posts": Array [
    Object {
      "author": Object {
        "name": "Mary",
      },
      "id": "3",
      "title": "Foo",
    },
    Object {
      "author": Object {
        "name": "Mary",
      },
      "id": "4",
      "title": "Bar",
    },
  ],
}
`

exports[`src/tests/main.test.ts TAP Main > Posts where title is Hello or Foo 1`] = `
Object {
  "posts": Array [
    Object {
      "id": "1",
      "title": "Hello",
    },
    Object {
      "id": "3",
      "title": "Foo",
    },
  ],
}
`

exports[`src/tests/main.test.ts TAP Main > Posts with both author and section (multiple relations) 1`] = `
Object {
  "posts": Array [
    Object {
      "author": Object {
        "name": "John",
      },
      "id": "1",
      "section": Object {
        "slug": "test",
      },
      "title": "Hello",
    },
    Object {
      "author": Object {
        "name": "Mary",
      },
      "id": "4",
      "section": Object {
        "slug": "test",
      },
      "title": "Bar",
    },
  ],
}
`

exports[`src/tests/main.test.ts TAP Main > Posts with url and section without slug (test nested fields dependency) 1`] = `
Object {
  "posts": Array [
    Object {
      "section": Object {
        "name": "Test",
      },
      "url": "/test/Hello-1",
    },
    Object {
      "section": null,
      "url": "/Bye-2",
    },
    Object {
      "section": null,
      "url": "/Foo-3",
    },
    Object {
      "section": Object {
        "name": "Test",
      },
      "url": "/test/Bar-4",
    },
  ],
}
`

exports[`src/tests/main.test.ts TAP Main > Posts with url only (test fields dependency) 1`] = `
Object {
  "posts": Array [
    Object {
      "url": "/test/Hello-1",
    },
    Object {
      "url": "/Bye-2",
    },
    Object {
      "url": "/Foo-3",
    },
    Object {
      "url": "/test/Bar-4",
    },
  ],
}
`

exports[`src/tests/main.test.ts TAP Main > User with id 1 and his posts 1`] = `
Object {
  "user": Object {
    "id": "1",
    "name": "John",
    "posts": Array [
      Object {
        "id": "1",
        "text": "Hello, world!",
        "title": "Hello",
      },
      Object {
        "id": "2",
        "text": "Bye-bye, cruel world!",
        "title": "Bye",
      },
    ],
  },
}
`