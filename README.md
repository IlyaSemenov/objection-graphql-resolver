# objection-fetch-graphql

A helper library to resolve GraphQL queries directly with objection.js models/relations.

- Effective: selects only requested fields and relations
- Unlimited nested resolvers (traversing `relationMappings`)
- Dynamic filters like `{ date: "2020-10-01", category__in: ["News", "Politics"] }`
- Per-model security modifiers

## Install

```
yarn add objection-fetch-graphql
```

## Use

Create GraphQL schema:

```graphql
type Post {
	id: ID
	title: String
	text: String
}

type Query {
	posts: [Post!]!
}
```

Create objection.js model:

```ts
import { Model } from "objection"

export class PostModel extends Model {
	static tableName = "posts"
}
```

Import `objection-fetch-graphql` somewhere in entry point:

```ts
// Somewhere in entry point: it monkey-patches objection.js
import "objection-fetch-graphql"
```

Define resolver:

```ts
export const resolvers = {
	Query: {
		posts: (parent, args, ctx, info) => {
			return PostModel.query().fetchGraphQL(info)
		},
	},
}
```

Run GraphQL server:

```ts
new ApolloServer({ typeDefs, resolvers }).listen({ port: 4000 })
```

Define GraphQL query:

```graphql
query get_all_posts {
	posts {
		id
		title
		# text is not requested, and will not be selected from DB
	}
}
```

Execute it:

```ts
// Using @graphql-codegen/typescript-graphql-request
const sdk = getSdk(new GraphQLClient("http://127.0.0.1:4000"))
await sdk.get_all_posts()
```

### Relations

Relations will be fetched automatically using `withGraphFetched()` for the nested fields.

Consider schema:

```graphql
type Post {
	id: ID
	text: String
	author: User
}
```

Model:

```ts
export class PostModel extends Model {
	static tableName = "posts"
	static get relationMappings() {
		return {
			author: {
				relation: Model.BelongsToOneRelation,
				modelClass: UserModel,
				join: { from: "posts.author_id", to: "users.id" },
			},
		}
	}
}
```

Query:

```graphql
query posts_with_author {
	posts {
		id
		text
		author {
			name
		}
	}
}
```

Resolver:

```ts
// for the query above, will pull posts with related author object
PostModel.query().fetchGraphQL(info)
```

### Filters

Queries can be filtered like this:

```ts
PostModel.query().fetchGraphQL(info, {
	filter: {
		date: "2020-10-01",
		// Only pull posts where author_id is 123 or 456.
		author_id__in: [123, 456],
	},
})
```

which adds `WHERE date='2020-10-01' AND author.id IN (123, 456)`.

The suggested workflow is using a dedicated untyped GraphQL query arg to pass filters:

```graphql
scalar Filter

type Query {
	posts(filter: Filter): [Post!]!
}
```

and then in resolver:

```ts
export const resolvers = {
	Query: {
		posts: (parent, { filter }, ctx, info) => {
			return PostModel.query().fetchGraphQL(info, { filter })
		},
	},
}
```

Supported operators:

- `exact`
- `in`
- TODO: `lt`, `gt`, `lte`, `gte`, `like`, `ilike`, `contains`, `icontains`

#### Filtering nested relations

You can filter nested relations with a nested filter:

```ts
UserModel.query().fetchGraphQL(info, {
	filter: {
		id: 123,
		posts: {
			date: "2020-10-01",
		},
	},
})
```

Note that it only works reasonably for one-to-many relations, as in the example above.

For instance, filtering posts with `{ author: { name: "John" } }` will not work as expected.

### Modifiers

Nested models can be automatically filtered with:

```ts
PostModel.query().fetchGraphQL(info, {
	modifiers: {
		User: (query) => query.where("active", true),
	},
})
```